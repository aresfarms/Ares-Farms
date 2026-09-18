import { createHash } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { identityVerifications } from "@/db/schema";
import { db } from "@/lib/db";
import { actionForDocumentType } from "@/lib/privacy/actionGate";
import { createDocumentStorageHandoff } from "@/lib/documents/storageHandoffStore";
import { persistDocumentSubmission } from "@/lib/documents/documentStore";
import {
  DOCUMENT_STORAGE_PROVIDER,
  documentStorageBucket,
  initResumableUpload,
} from "@/lib/documents/gcsResumableUpload";
import { verifyUploadLinkToken } from "@/lib/documents/uploadLinkToken";
import { scanVaultDocumentSoon } from "@/lib/documents/malwareScan";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

/**
 * Sovereign Secure Upload API (founder direction 2026-08-05): borrowers
 * upload financial/PII documents through an encrypted, expiring link —
 * never email. PUBLIC route: possession of a valid signed link token is the
 * sole authorization, and it authorizes SUBMISSION ONLY for one deal.
 *
 * Security posture:
 * - No raw file bytes ever enter this API runtime (documentStore doctrine):
 *   the browser PUTs bytes directly to the IAM-private bucket via a
 *   single-object resumable session; this route handles metadata custody.
 * - No document content, PII field values, or read access are ever returned.
 * - Every action lands an observability event with the deal's traceId; the
 *   custody records carry CONFIDENTIAL classification, replay refs, and
 *   human-review-required status via the governed stores.
 * - Environments without the storage provider degrade honestly:
 *   PENDING_PROVIDER_CONFIGURATION, stated to the customer, never a fake
 *   success (Master Volume test-mode doctrine for PII intake).
 */

const ALLOWED_DOCUMENT_TYPES = new Set([
  "bank-statements",
  "tax-returns",
  "personal-financial-statement",
  "debt-schedule",
  "entity-documents",
  "environmental-reports",
  "usda-fsa-records",
  "purchase-agreement",
  "other-supporting",
]);
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB per file — lender-package scale

// In-process rate limiting (SCIF posture 2026-08-05): a public token-gated
// route still gets brute-force and abuse pressure — cap per-IP request rates
// so credential-stuffing a link token is uneconomical. 60 requests/minute
// covers a legitimate multi-file upload session with headroom.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 60;
const rateBuckets = new Map<string, { windowStart: number; count: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart >= RATE_WINDOW_MS) {
    rateBuckets.set(ip, { windowStart: now, count: 1 });
    if (rateBuckets.size > 5_000) rateBuckets.clear(); // memory bound
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  const clientIp = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (rateLimited(clientIp)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests — wait a minute and try again." },
      { status: 429 }
    );
  }
  const parsed = await readJsonBodyWithLimit<{
    action?: unknown;
    token?: unknown;
    fileName?: unknown;
    mimeType?: unknown;
    byteSize?: unknown;
    documentType?: unknown;
    handoffToken?: unknown;
    storageUri?: unknown;
    uploaded?: unknown;
    attestationText?: unknown;
  }>(req, { maxBytes: 16 * 1024 });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.body;
  const action = typeof body.action === "string" ? body.action : "";
  const token = typeof body.token === "string" ? body.token.slice(0, 2048) : "";
  const claims = verifyUploadLinkToken(token);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "This secure upload link is invalid or has expired. Ask your contact to send a fresh link — expired links are part of how the channel stays safe." },
      { status: 401 }
    );
  }
  const traceId = `secure-upload-${claims.applicationId}-${Date.now().toString(36)}`;

  if (action === "exchange") {
    return NextResponse.json({
      ok: true,
      dealRef: claims.dealRef,
      expiresAt: claims.expiresAt,
      providerConfigured: Boolean(documentStorageBucket()),
      documentTypes: [...ALLOWED_DOCUMENT_TYPES],
    });
  }

  /**
   * THE GATE THAT ACTUALLY COUNTS.
   *
   * The upload page renders an identity gate over the four financial slots,
   * but a rendered gate is decoration: anyone can POST to this route directly
   * with documentType="bank-statements" and skip the page entirely. The tier
   * is enforced HERE, server-side, against the database — and the page is
   * merely a courteous explanation of a rule that holds without it.
   *
   * Policy source is actionGate.ts (`upload-financial-document` requires the
   * identity-verified tier); this is its enforcement point for the customer
   * upload channel.
   */
  const subjectRef = claims.applicationId;
  async function identityBlocksFinancialUpload(documentType: string): Promise<boolean> {
    if (actionForDocumentType(documentType) !== "upload-financial-document") return false;
    const [record] = await db
      .select({ verified: identityVerifications.verified })
      .from(identityVerifications)
      .where(eq(identityVerifications.subjectRef, subjectRef))
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1);
    return record?.verified !== true;
  }

  if (action === "begin") {
    const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200).trim() : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.slice(0, 120) : null;
    const byteSize = typeof body.byteSize === "number" && Number.isFinite(body.byteSize) ? Math.floor(body.byteSize) : null;
    const documentType = typeof body.documentType === "string" ? body.documentType : "";
    if (!fileName || !ALLOWED_DOCUMENT_TYPES.has(documentType)) {
      return NextResponse.json({ ok: false, error: "A file name and a valid document type are required." }, { status: 400 });
    }
    if (byteSize != null && byteSize > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: "Files are limited to 50MB each — split larger statements into parts." }, { status: 400 });
    }
    if (await identityBlocksFinancialUpload(documentType)) {
      await createObservabilityEvent({
        eventType: "SOVEREIGN_UPLOAD_IDENTITY_GATE_BLOCKED",
        domain: "security",
        severity: "INFO",
        message: "A financial-document upload was refused: identity is not verified for this deal.",
        traceId,
        replayRef: traceId,
        actorId: "borrower-via-sovereign-link",
        module: "api.public.secure-upload",
        metadata: { applicationId: claims.applicationId, documentType },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "This document type needs a verified identity first. Complete the identity check on the upload page — it takes a couple of minutes and covers every financial document on this deal.",
          identityRequired: true,
        },
        { status: 403 }
      );
    }
    const created = await createDocumentStorageHandoff({
      applicationId: claims.applicationId,
      documentType,
      documentName: `${claims.dealRef} — ${documentType}`,
      fileName,
      mimeType,
      byteSize,
      storageProvider: documentStorageBucket() ? DOCUMENT_STORAGE_PROVIDER : null,
      storageBucket: documentStorageBucket(),
      traceId,
      source: "sovereign-upload-link",
      metadata: { dealRef: claims.dealRef, channel: "sovereign-upload-link" },
    });
    const uploadUrl = await initResumableUpload({
      objectKey: created.handoff.objectKey,
      mimeType,
      originForCors: req.headers.get("origin"),
    });
    await createObservabilityEvent({
      eventType: "SOVEREIGN_UPLOAD_BEGIN",
      domain: "runtime",
      severity: "INFO",
      message: uploadUrl
        ? "Borrower began a governed direct-to-storage upload."
        : "Borrower began a governed upload; storage provider not configured — metadata custody only.",
      traceId,
      replayRef: traceId,
      actorId: "borrower-via-sovereign-link",
      module: "api.public.secure-upload",
      metadata: { applicationId: claims.applicationId, documentType, providerConfigured: Boolean(uploadUrl) },
    });
    return NextResponse.json({
      ok: true,
      uploadUrl,
      storageUri: created.handoff.storageUri,
      providerConfigured: Boolean(uploadUrl),
    });
  }

  if (action === "confirm") {
    const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200).trim() : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.slice(0, 120) : null;
    const byteSize = typeof body.byteSize === "number" && Number.isFinite(body.byteSize) ? Math.floor(body.byteSize) : null;
    const documentType = typeof body.documentType === "string" && ALLOWED_DOCUMENT_TYPES.has(body.documentType) ? body.documentType : "other-supporting";
    const storageUri = typeof body.storageUri === "string" ? body.storageUri.slice(0, 500) : null;
    const uploaded = body.uploaded === true;
    if (!fileName) {
      return NextResponse.json({ ok: false, error: "fileName is required." }, { status: 400 });
    }
    // Also gated here, not only in `begin`: a caller can skip `begin` entirely
    // and post a `confirm` to create a custody record. Every entry point to a
    // financial document must carry the same check.
    if (await identityBlocksFinancialUpload(documentType)) {
      return NextResponse.json(
        { ok: false, error: "This document type needs a verified identity first.", identityRequired: true },
        { status: 403 }
      );
    }
    const persisted = await persistDocumentSubmission({
      traceId,
      source: "sovereign-upload-link",
      applicationId: claims.applicationId,
      documentType,
      documentName: `${claims.dealRef} — ${documentType}`,
      fileName,
      mimeType,
      byteSize,
      storageUri: uploaded ? storageUri : null,
      metadata: {
        dealRef: claims.dealRef,
        channel: "sovereign-upload-link",
        bytesInGovernedStorage: uploaded,
        // Per-file ATTESTATION (founder direction 2026-08-06): the borrower's
        // own statement that THIS file is genuine. Recorded with the exact
        // text and its hash so the custody report can quote what was affirmed.
        attestation: typeof body.attestationText === "string" && body.attestationText.trim()
          ? {
              text: body.attestationText.slice(0, 1000),
              sha256: createHash("sha256").update(body.attestationText.slice(0, 1000), "utf8").digest("hex"),
              affirmedAt: new Date().toISOString(),
            }
          : null,
      },
    });
    await createObservabilityEvent({
      eventType: "SOVEREIGN_UPLOAD_CONFIRMED",
      domain: "runtime",
      severity: "INFO",
      message: uploaded
        ? "Borrower document received into governed storage custody."
        : "Borrower document recorded in metadata custody (provider pending).",
      traceId,
      replayRef: traceId,
      actorId: "borrower-via-sovereign-link",
      module: "api.public.secure-upload",
      metadata: { applicationId: claims.applicationId, documentId: persisted.document.id, documentType, uploaded },
    });
    if (uploaded) scanVaultDocumentSoon(persisted.document.id);
    return NextResponse.json({
      ok: true,
      documentId: persisted.document.id,
      status: persisted.document.status,
      reviewStatus: persisted.document.reviewStatus,
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
