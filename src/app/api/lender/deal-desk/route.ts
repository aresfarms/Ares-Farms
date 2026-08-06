import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { applicationDocuments } from "@/db/schema";
import { evaluateAccess, type AccessRole } from "@/lib/auth/accessControl";
import { operatorByEmail } from "@/lib/auth/operatorRegistry";
import { apiAuthEnforcementRequired } from "@/lib/security/apiSecurityPolicy";
import { db } from "@/lib/db";
import {
  fetchObjectStream,
  objectKeyFromStorageUri,
} from "@/lib/documents/gcsResumableUpload";
import {
  listDealDocuments,
  listLenderDeals,
  runDueReminders,
  sendDocumentReminder,
  updateDealDesk,
} from "@/lib/lender/dealDeskStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { FINANCING_DEAL_STATUSES } from "@/lib/serviceRequests/serviceRequestStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { createDocumentStorageHandoff } from "@/lib/documents/storageHandoffStore";
import { persistDocumentSubmission } from "@/lib/documents/documentStore";
import {
  DOCUMENT_STORAGE_PROVIDER,
  documentStorageBucket,
  initResumableUpload,
} from "@/lib/documents/gcsResumableUpload";
import { emailConfigured, sendEmail } from "@/lib/notifications/emailProvider";
import { LENDER_EMAIL_SIGNATURE, renderLenderEmailHtml } from "@/lib/notifications/lenderSignature";
import { serviceRequests } from "@/db/schema";

/**
 * Lender Deal Desk API — the licensed lender's governed working surface
 * (founder direction 2026-08-05).
 *
 * GET  ?view=deals                          → all financing deals + desk state
 * GET  ?view=documents&applicationId=...    → document register for one deal
 * GET  ?view=download&documentId=...        → stream ONE file through the
 *        runtime (never a shareable URL; every read is access-checked and
 *        audited; the seam where per-deal envelope decryption lands later)
 * POST {action:"update", serviceRequestId, status?, customerNote?, timeline?}
 * POST {action:"remind", serviceRequestId, force?}
 * POST {action:"remind-all"}                → reminders for every deal in
 *        DOCUMENTS_REQUESTED (3-day spacing, cap 3, honest per-deal reasons)
 *
 * Master Volume Governance:
 * - Vol I: accountable authority — role-gated via evaluateAccess (lender/
 *   operator/admin/governance), behind IAP at the platform boundary.
 * - Vol II: regulated borrower-document handling; single-file audited reads;
 *   customer communication is minimum-disclosure (reminder emails carry a
 *   reference + links only, never financial content).
 * - Vol III/III-B: durable desk state in serviceRequests.metadata.dealDesk;
 *   deterministic status vocabulary (FINANCING_DEAL_STATUSES).
 * - Vol IV: reminder cadence + closing-timeline runbook support.
 * - Vol V: observability events on every material action incl. every
 *   document download; audit-safe errors.
 */

const MODULE = "api.lender.deal-desk";
const ALLOWED_ROLES: AccessRole[] = ["lender", "operator", "admin", "governance"];
const VALID_STATUSES = new Set(FINANCING_DEAL_STATUSES.map((s) => s.status));

function traceIdFor(op: string): string {
  return `lender-desk-${op}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function portalBaseUrl(req: NextRequest): string {
  const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "";
  return base ? base.replace(/\/$/, "") : req.nextUrl.origin;
}

/**
 * Actor identity — session-derived, never client-claimed (staging test
 * 2026-08-05 proved query-claimed roles conflict with the session at the
 * API perimeter). Authority resolves in strict order:
 *   1. The operator registry (Module 45 accountable-authority list) looked up
 *      by the proxy-verified session EMAIL — the founder maps to admin, the
 *      finance-licensed operator to lender, other operators to operator.
 *   2. The proxy-verified session role header, if it's already privileged.
 *   3. Dev-only fallback when API auth enforcement is off (local testing;
 *      the perimeter is open there anyway and staging/production set
 *      API_AUTH_ENFORCEMENT=required).
 * Anything else resolves to "user" and is denied by evaluateAccess.
 */
function resolveIdentity(req: NextRequest): { role: string; actorId: string | null } {
  const email = req.headers.get("x-ares-authenticated-email")?.trim() || null;
  const sessionActor =
    req.headers.get("x-ares-authenticated-user-id")?.trim() || email;

  const operator = operatorByEmail(email);
  if (operator) {
    const role =
      operator.role === "founder-operator"
        ? "admin"
        : operator.license?.toLowerCase().includes("finance")
          ? "lender"
          : "operator";
    return { role, actorId: email ?? operator.id };
  }

  const sessionRole = req.headers.get("x-ares-authenticated-role")?.trim();
  if (sessionRole && ALLOWED_ROLES.includes(sessionRole as AccessRole)) {
    return { role: sessionRole, actorId: sessionActor };
  }

  if (!apiAuthEnforcementRequired()) {
    return { role: "lender", actorId: sessionActor ?? "dev-lender-console" };
  }

  return { role: "user", actorId: sessionActor };
}

function authorize(args: {
  role: string;
  actorId: string | null;
  operation: string;
  traceId: string;
}) {
  const runtimeGuard = runRuntimeGuard({
    operation: args.operation,
    module: MODULE,
    traceId: args.traceId,
    schemaVersion: "lender-deal-desk-v0.1.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "RESTRICTED",
    replayRef: args.traceId,
    actorId: args.actorId,
    metadata: { route: "/api/lender/deal-desk" },
  });
  const access = evaluateAccess({
    role: args.role,
    allowedRoles: ALLOWED_ROLES,
    operation: args.operation,
    module: MODULE,
    traceId: args.traceId,
    actorId: args.actorId,
    tenantId: null,
  });
  return { runtimeGuard, access, allowed: runtimeGuard.allowed && access.allowed };
}

function denied(traceId: string, actorId: string | null, operation: string) {
  const observability = createObservabilityEvent({
    eventType: "LENDER_DEAL_DESK_ACCESS_DENIED",
    domain: "security",
    severity: "WARN",
    message: "Lender deal desk access was denied by runtime or role controls.",
    traceId,
    replayRef: traceId,
    actorId,
    module: MODULE,
    metadata: { operation },
  });
  return NextResponse.json(
    {
      ok: false,
      error: "Role is not authorized for the lender deal desk.",
      governance: { traceId, observability },
    },
    { status: 403 }
  );
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const view = params.get("view") ?? "deals";
  const { role, actorId } = resolveIdentity(req);
  const traceId = traceIdFor(`read-${view}`);
  const operation = `lender-desk.read-${view}`;

  try {
    const auth = authorize({ role, actorId, operation, traceId });
    if (!auth.allowed) return denied(traceId, actorId, operation);

    if (view === "deals") {
      const deals = await listLenderDeals();
      createObservabilityEvent({
        eventType: "LENDER_DEAL_DESK_READ",
        domain: "operations",
        severity: "INFO",
        message: "Lender deal desk listed financing deals.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: { view, count: deals.length },
      });
      return NextResponse.json({
        ok: true,
        deals,
        statuses: FINANCING_DEAL_STATUSES,
        bookingUrl: process.env.LENDER_BOOKING_URL?.trim() || null,
        calendarEmbedSrc: process.env.LENDER_CALENDAR_EMBED_SRC?.trim() || null,
        emailConfigured: Boolean(process.env.EMAIL_FROM && process.env.SENDGRID_API_KEY),
        governance: { traceId },
      });
    }

    if (view === "documents") {
      const applicationId = params.get("applicationId")?.trim();
      if (!applicationId) {
        return NextResponse.json(
          { ok: false, error: "applicationId is required.", governance: { traceId } },
          { status: 400 }
        );
      }
      const documents = await listDealDocuments(applicationId);
      createObservabilityEvent({
        eventType: "LENDER_DEAL_DESK_DOCUMENTS_READ",
        domain: "operations",
        severity: "INFO",
        message: "Lender deal desk listed the document register for a deal.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: { applicationId, count: documents.length },
      });
      return NextResponse.json({ ok: true, documents, governance: { traceId } });
    }

    if (view === "download") {
      const documentId = params.get("documentId")?.trim();
      if (!documentId) {
        return NextResponse.json(
          { ok: false, error: "documentId is required.", governance: { traceId } },
          { status: 400 }
        );
      }
      const rows = await db
        .select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.id, documentId))
        .limit(1);
      const doc = rows[0];
      if (!doc) {
        return NextResponse.json(
          { ok: false, error: "Document not found.", governance: { traceId } },
          { status: 404 }
        );
      }
      const objectKey = objectKeyFromStorageUri(doc.storageUri);

      // Every single-file read is audited with durable evidence — this is
      // the access trail a regulator or the founders can replay.
      const observability = createObservabilityEvent({
        eventType: "LENDER_DOCUMENT_DOWNLOAD",
        domain: "security",
        severity: "INFO",
        message: "A governed borrower document was streamed to an authorized lender-desk actor.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: {
          documentId,
          applicationId: doc.applicationId,
          documentType: doc.documentType,
          fileName: doc.fileName,
          storageResolved: Boolean(objectKey),
        },
      });
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/lender/deal-desk",
          operation,
          documentId,
          applicationId: doc.applicationId,
          actorId,
        },
      });

      if (!objectKey) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "This document has no stored bytes yet (upload was recorded before secure storage was configured).",
            governance: { traceId },
          },
          { status: 409 }
        );
      }
      const object = await fetchObjectStream(objectKey);
      if (!object) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Secure storage is not reachable from this environment. In production this streams the file; in local dev it degrades honestly.",
            governance: { traceId },
          },
          { status: 503 }
        );
      }
      const fileName = (doc.fileName ?? `document-${documentId}`).replace(/[^\w.\- ]+/g, "_");
      // Readable types open in the browser; unknown/active types download
      // (inline HTML from our origin = script execution — never).
      const inlineSafe = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"]);
      const disposition = inlineSafe.has(object.contentType) ? "inline" : "attachment";
      // Extensionless uploads (founder test: raw bytes opened as text) get one derived from the real type.
      const EXT_BY_TYPE: Record<string, string> = {
        "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg",
        "image/gif": ".gif", "image/webp": ".webp", "text/plain": ".txt",
      };
      const ext = /\.[A-Za-z0-9]{2,5}$/.test(fileName) ? "" : (EXT_BY_TYPE[object.contentType] ?? "");

      return new NextResponse(object.stream, {
        headers: {
          "Content-Type": object.contentType,
          ...(object.contentLength ? { "Content-Length": object.contentLength } : {}),
          "Content-Disposition": `${disposition}; filename="${fileName}${ext}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store",
          "X-Trace-Id": traceId,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown view "${view}".`, governance: { traceId } },
      { status: 400 }
    );
  } catch (error) {
    createObservabilityEvent({
      eventType: "LENDER_DEAL_DESK_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Lender deal desk read failed.",
      traceId,
      replayRef: traceId,
      actorId,
      module: MODULE,
      metadata: { view, error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json(
      { ok: false, error: "Lender deal desk read failed.", governance: { traceId } },
      { status: 500 }
    );
  }
}

type PostBody = {
  action?: unknown;
  role?: unknown;
  actorId?: unknown;
  serviceRequestId?: unknown;
  documentId?: unknown;
  status?: unknown;
  customerNote?: unknown;
  timeline?: unknown;
  force?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  byteSize?: unknown;
  storageUri?: unknown;
  uploaded?: unknown;
};

const LENDER_PROVIDED_DOCUMENT_TYPE = "lender-provided";
const MAX_LENDER_FILE_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const { role, actorId } = resolveIdentity(req);
  const traceId = traceIdFor(action || "post");
  const operation = `lender-desk.${action || "unknown"}`;

  try {
    const auth = authorize({ role, actorId, operation, traceId });
    if (!auth.allowed) return denied(traceId, actorId, operation);

    if (action === "update") {
      const serviceRequestId =
        typeof body.serviceRequestId === "string" ? body.serviceRequestId.trim() : "";
      if (!serviceRequestId) {
        return NextResponse.json(
          { ok: false, error: "serviceRequestId is required.", governance: { traceId } },
          { status: 400 }
        );
      }
      const status = typeof body.status === "string" ? body.status.trim() : null;
      if (status && !VALID_STATUSES.has(status)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Status must be one of the canonical deal statuses.`,
            statuses: FINANCING_DEAL_STATUSES,
            governance: { traceId },
          },
          { status: 400 }
        );
      }
      const customerNote =
        typeof body.customerNote === "string" ? body.customerNote.slice(0, 2000) : undefined;
      const t = (body.timeline ?? null) as Record<string, unknown> | null;
      const timelineField = (key: string): string | null | undefined => {
        if (!t || !(key in t)) return undefined;
        const v = t[key];
        return typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
      };
      const timeline =
        t === null
          ? undefined
          : {
              ...(timelineField("docsDueAt") !== undefined && { docsDueAt: timelineField("docsDueAt") }),
              ...(timelineField("underwritingEtaAt") !== undefined && {
                underwritingEtaAt: timelineField("underwritingEtaAt"),
              }),
              ...(timelineField("closingTargetAt") !== undefined && {
                closingTargetAt: timelineField("closingTargetAt"),
              }),
              ...(timelineField("lenderBacklogNote") !== undefined && {
                lenderBacklogNote: timelineField("lenderBacklogNote"),
              }),
            };
      const deskState = await updateDealDesk({
        serviceRequestId,
        status,
        customerNote,
        timeline,
        actorId: actorId ?? role,
      });
      if (!deskState) {
        return NextResponse.json(
          { ok: false, error: "Deal not found.", governance: { traceId } },
          { status: 404 }
        );
      }
      const observability = createObservabilityEvent({
        eventType: "LENDER_DEAL_DESK_UPDATED",
        domain: "operations",
        severity: "INFO",
        message: "The lender updated a deal's status, customer note, or closing timeline.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: {
          serviceRequestId,
          statusSet: status ?? null,
          noteChanged: customerNote !== undefined,
          timelineChanged: timeline !== undefined,
        },
      });
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/lender/deal-desk", operation, serviceRequestId },
      });
      return NextResponse.json({ ok: true, deskState, governance: { traceId } });
    }

    if (action === "remind") {
      const serviceRequestId =
        typeof body.serviceRequestId === "string" ? body.serviceRequestId.trim() : "";
      if (!serviceRequestId) {
        return NextResponse.json(
          { ok: false, error: "serviceRequestId is required.", governance: { traceId } },
          { status: 400 }
        );
      }
      const result = await sendDocumentReminder({
        serviceRequestId,
        portalBaseUrl: portalBaseUrl(req),
        force: body.force === true,
      });
      createObservabilityEvent({
        eventType: "LENDER_DOCUMENT_REMINDER",
        domain: "operations",
        severity: result.sent ? "INFO" : "WARN",
        message: result.sent
          ? "A document reminder with a fresh secure upload link was emailed to the customer."
          : "A document reminder was requested but not sent.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: { serviceRequestId, ...result },
      });
      return NextResponse.json({ ok: true, ...result, governance: { traceId } });
    }

    // Lender → customer documents (founder direction 2026-08-05): approval
    // letters, term sheets, disclosures go through the SAME encrypted vault
    // as borrower documents — never email attachments. Same browser→GCS
    // direct-byte pattern; records tagged lender-provided so the customer
    // status page can offer them (and ONLY them) for download.
    if (action === "upload-begin") {
      const serviceRequestId =
        typeof body.serviceRequestId === "string" ? body.serviceRequestId.trim() : "";
      const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200).trim() : "";
      const mimeType = typeof body.mimeType === "string" ? body.mimeType.slice(0, 120) : null;
      const byteSize =
        typeof body.byteSize === "number" && Number.isFinite(body.byteSize)
          ? Math.floor(body.byteSize)
          : null;
      if (!serviceRequestId || !fileName) {
        return NextResponse.json(
          { ok: false, error: "serviceRequestId and fileName are required.", governance: { traceId } },
          { status: 400 }
        );
      }
      if (byteSize != null && byteSize > MAX_LENDER_FILE_BYTES) {
        return NextResponse.json(
          { ok: false, error: "Files are limited to 50MB each.", governance: { traceId } },
          { status: 400 }
        );
      }
      const applicationId = `finintake-${serviceRequestId}`;
      const created = await createDocumentStorageHandoff({
        applicationId,
        documentType: LENDER_PROVIDED_DOCUMENT_TYPE,
        documentName: `${serviceRequestId} — from your lender`,
        fileName,
        mimeType,
        byteSize,
        storageProvider: documentStorageBucket() ? DOCUMENT_STORAGE_PROVIDER : null,
        storageBucket: documentStorageBucket(),
        traceId,
        source: "lender-deal-desk",
        metadata: { dealRef: serviceRequestId, channel: "lender-deal-desk", providedBy: actorId },
      });
      const uploadUrl = await initResumableUpload({
        objectKey: created.handoff.objectKey,
        mimeType,
        originForCors: req.headers.get("origin"),
      });
      createObservabilityEvent({
        eventType: "LENDER_DOC_UPLOAD_BEGIN",
        domain: "runtime",
        severity: "INFO",
        message: "The lender began sending a document to the customer through the vault.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: { serviceRequestId, providerConfigured: Boolean(uploadUrl) },
      });
      return NextResponse.json({
        ok: true,
        uploadUrl,
        storageUri: created.handoff.storageUri,
        providerConfigured: Boolean(uploadUrl),
        governance: { traceId },
      });
    }

    if (action === "upload-confirm") {
      const serviceRequestId =
        typeof body.serviceRequestId === "string" ? body.serviceRequestId.trim() : "";
      const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200).trim() : "";
      const mimeType = typeof body.mimeType === "string" ? body.mimeType.slice(0, 120) : null;
      const byteSize =
        typeof body.byteSize === "number" && Number.isFinite(body.byteSize)
          ? Math.floor(body.byteSize)
          : null;
      const storageUri = typeof body.storageUri === "string" ? body.storageUri.slice(0, 500) : null;
      const uploaded = body.uploaded === true;
      if (!serviceRequestId || !fileName) {
        return NextResponse.json(
          { ok: false, error: "serviceRequestId and fileName are required.", governance: { traceId } },
          { status: 400 }
        );
      }
      const applicationId = `finintake-${serviceRequestId}`;
      const persisted = await persistDocumentSubmission({
        traceId,
        source: "lender-deal-desk",
        applicationId,
        documentType: LENDER_PROVIDED_DOCUMENT_TYPE,
        documentName: `${serviceRequestId} — from your lender`,
        fileName,
        mimeType,
        byteSize,
        storageUri: uploaded ? storageUri : null,
        metadata: {
          dealRef: serviceRequestId,
          channel: "lender-deal-desk",
          providedBy: actorId,
          bytesInGovernedStorage: uploaded,
        },
      });

      // Minimum-disclosure notification: the customer learns a document is
      // waiting and where to get it — never the document itself, never its
      // name, never financial content.
      let customerNotified = false;
      if (uploaded && emailConfigured()) {
        const dealRows = await db
          .select()
          .from(serviceRequests)
          .where(eq(serviceRequests.serviceRequestId, serviceRequestId))
          .limit(1);
        const contactEmail = dealRows[0]?.contactEmail;
        if (contactEmail) {
          const booking = process.env.LENDER_BOOKING_URL?.trim();
          const docBodyText =
            `Your commercial debt broker added a document to your financing request ${serviceRequestId}.\n\n` +
            `View and download it securely on your status page (enter your reference number and email):\n` +
            `${portalBaseUrl(req)}/status\n\n` +
            (booking ? `Schedule a call with your broker:\n${booking}` : "");
          const result = await sendEmail({
            to: contactEmail,
            subject: `Your broker sent you a document — financing request ${serviceRequestId}`,
            text: `${docBodyText}\n\nThis message intentionally contains no document contents — everything sensitive stays inside the portal.\n\n${LENDER_EMAIL_SIGNATURE}`,
            html: renderLenderEmailHtml(docBodyText),
            inlineBrandLogo: true,
          });
          customerNotified = result.sent;
        }
      }

      const observability = createObservabilityEvent({
        eventType: "LENDER_DOC_SENT_TO_CUSTOMER",
        domain: "security",
        severity: "INFO",
        message: uploaded
          ? "The lender placed a document in the vault for the customer."
          : "The lender recorded a document for the customer (storage provider pending).",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: {
          serviceRequestId,
          documentId: persisted.document.id,
          uploaded,
          customerNotified,
        },
      });
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/lender/deal-desk", operation, serviceRequestId, documentId: persisted.document.id },
      });
      return NextResponse.json({
        ok: true,
        documentId: persisted.document.id,
        uploaded,
        customerNotified,
        governance: { traceId },
      });
    }

    // Signature vault (founder-approved 2026-08-06): the broker asks the
    // customer to sign a document he placed in the vault. The ceremony
    // itself is token-gated off the customer's status lookup.
    if (action === "request-signature") {
      const serviceRequestId =
        typeof body.serviceRequestId === "string" ? body.serviceRequestId.trim() : "";
      const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
      if (!serviceRequestId || !documentId) {
        return NextResponse.json(
          { ok: false, error: "serviceRequestId and documentId are required.", governance: { traceId } },
          { status: 400 }
        );
      }
      const rows = await db
        .select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.id, documentId))
        .limit(1);
      const doc = rows[0];
      if (!doc || doc.documentType !== "lender-provided" || doc.applicationId !== `finintake-${serviceRequestId}`) {
        return NextResponse.json(
          { ok: false, error: "Only documents you sent to the customer on this deal can be signed.", governance: { traceId } },
          { status: 400 }
        );
      }
      const docMeta = (doc.metadata ?? {}) as Record<string, unknown>;
      await db
        .update(applicationDocuments)
        .set({
          metadata: { ...docMeta, signatureRequested: true, signatureRequestedAt: new Date().toISOString(), signatureRequestedBy: actorId },
          updatedAt: new Date(),
        })
        .where(eq(applicationDocuments.id, documentId));

      let customerNotified = false;
      if (emailConfigured()) {
        const dealRows = await db
          .select()
          .from(serviceRequests)
          .where(eq(serviceRequests.serviceRequestId, serviceRequestId))
          .limit(1);
        const contactEmail = dealRows[0]?.contactEmail;
        if (contactEmail) {
          const bodyText =
            `Your broker has asked for your electronic signature on a document for financing request ${serviceRequestId}.\n\n` +
            `Review and sign it securely from your status page (enter your reference number and email):\n` +
            `${portalBaseUrl(req)}/status`;
          const result = await sendEmail({
            to: contactEmail,
            subject: `Your signature is requested — financing request ${serviceRequestId}`,
            text: `${bodyText}\n\n${LENDER_EMAIL_SIGNATURE}`,
            html: renderLenderEmailHtml(bodyText),
            inlineBrandLogo: true,
          });
          customerNotified = result.sent;
        }
      }
      const observability = createObservabilityEvent({
        eventType: "SIGNATURE_REQUESTED",
        domain: "security",
        severity: "INFO",
        message: "The broker requested the customer's electronic signature on a vault document.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: { serviceRequestId, documentId, customerNotified },
      });
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/lender/deal-desk", operation, serviceRequestId, documentId },
      });
      return NextResponse.json({ ok: true, customerNotified, governance: { traceId } });
    }

    if (action === "remind-all") {
      const result = await runDueReminders(portalBaseUrl(req));
      createObservabilityEvent({
        eventType: "LENDER_DOCUMENT_REMINDER_SWEEP",
        domain: "operations",
        severity: "INFO",
        message: "Automatic document-reminder sweep ran over deals awaiting documents.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: result,
      });
      return NextResponse.json({ ok: true, ...result, governance: { traceId } });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown action "${action}".`, governance: { traceId } },
      { status: 400 }
    );
  } catch (error) {
    createObservabilityEvent({
      eventType: "LENDER_DEAL_DESK_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Lender deal desk action failed.",
      traceId,
      replayRef: traceId,
      actorId,
      module: MODULE,
      metadata: { action, error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json(
      { ok: false, error: "Lender deal desk action failed.", governance: { traceId } },
      { status: 500 }
    );
  }
}
