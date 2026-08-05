import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { applicationDocuments } from "@/db/schema";
import { evaluateAccess, type AccessRole } from "@/lib/auth/accessControl";
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
 * Actor identity: the security proxy verifies the session and injects
 * x-ares-authenticated-* headers; those WIN over anything the client claims.
 * Claimed values are only a fallback for sessions that carry no role/actor
 * (the proxy has already rejected any claim that conflicts with the session).
 */
function resolveIdentity(
  req: NextRequest,
  claimedRole: string,
  claimedActorId: string | null
): { role: string; actorId: string | null } {
  const sessionRole = req.headers.get("x-ares-authenticated-role");
  const sessionActor =
    req.headers.get("x-ares-authenticated-user-id") ??
    req.headers.get("x-ares-authenticated-email");
  return {
    role: sessionRole?.trim() || claimedRole,
    actorId: sessionActor?.trim() || claimedActorId,
  };
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
  const { role, actorId } = resolveIdentity(
    req,
    params.get("role") ?? "user",
    params.get("actorId")
  );
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
      return new NextResponse(object.stream, {
        headers: {
          "Content-Type": object.contentType,
          ...(object.contentLength ? { "Content-Length": object.contentLength } : {}),
          "Content-Disposition": `attachment; filename="${fileName}"`,
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
  status?: unknown;
  customerNote?: unknown;
  timeline?: unknown;
  force?: unknown;
};

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const { role, actorId } = resolveIdentity(
    req,
    typeof body.role === "string" ? body.role : "user",
    typeof body.actorId === "string" ? body.actorId : null
  );
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
