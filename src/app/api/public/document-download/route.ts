import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { applicationDocuments } from "@/db/schema";
import { db } from "@/lib/db";
import { verifyCustomerDownloadToken } from "@/lib/documents/customerDownloadToken";
import {
  fetchObjectStream,
  objectKeyFromStorageUri,
} from "@/lib/documents/gcsResumableUpload";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";

/**
 * Customer Document Download (public, token-gated) — the return leg of the
 * sovereign loop: the customer retrieves a document their licensed lender
 * addressed to them (approval letter, term sheet, disclosure).
 *
 * Authorization = possession of a signed short-lived token minted by the
 * status lookup (which itself requires reference + matching email). The
 * token names ONE document; this route additionally enforces that the
 * document is lender-provided and belongs to the token's deal — a token can
 * never reach borrower-uploaded PII documents or another deal's files.
 * Bytes stream through the runtime (no shareable storage URL ever exists),
 * and every download lands a durable audit record.
 *
 * Master Volume Governance: Vol II controlled disclosure; Vol III
 * deterministic token verification; Vol V observability + evidence on every
 * read of a governed document.
 */

const MODULE = "api.public.document-download";
// Broker-addressed documents + the customer's own signature certificates.
const CUSTOMER_DOWNLOADABLE_TYPES = new Set(["lender-provided", "signature-certificate"]);

export async function GET(req: NextRequest) {
  const traceId = `customer-doc-download-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const claims = verifyCustomerDownloadToken(token);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "This download link is invalid or has expired — refresh your status page for a fresh one." },
      { status: 401 }
    );
  }

  const rows = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.id, claims.documentId))
    .limit(1);
  const doc = rows[0];
  const expectedApplicationId = `finintake-${claims.dealRef}`;
  if (
    !doc ||
    !CUSTOMER_DOWNLOADABLE_TYPES.has(doc.documentType) ||
    doc.applicationId !== expectedApplicationId
  ) {
    createObservabilityEvent({
      eventType: "CUSTOMER_DOC_DOWNLOAD_DENIED",
      domain: "security",
      severity: "WARN",
      message: "A customer download token did not match a lender-provided document for its deal.",
      traceId,
      replayRef: traceId,
      module: MODULE,
      metadata: { documentId: claims.documentId, dealRef: claims.dealRef, found: Boolean(doc) },
    });
    return NextResponse.json(
      { ok: false, error: "This document is not available for download." },
      { status: 404 }
    );
  }

  const observability = createObservabilityEvent({
    eventType: "CUSTOMER_DOC_DOWNLOADED",
    domain: "security",
    severity: "INFO",
    message: "A lender-provided document was streamed to the customer via a signed status-page link.",
    traceId,
    replayRef: traceId,
    actorId: `customer-via-status-link:${claims.dealRef}`,
    module: MODULE,
    metadata: { documentId: doc.id, dealRef: claims.dealRef, fileName: doc.fileName },
  });
  await persistGovernanceEvidence({
    traceId,
    replayRef: traceId,
    observability,
    metadata: { route: "/api/public/document-download", documentId: doc.id, dealRef: claims.dealRef },
  });

  const objectKey = objectKeyFromStorageUri(doc.storageUri);
  if (!objectKey) {
    return NextResponse.json(
      { ok: false, error: "This document has no stored file in this environment." },
      { status: 409 }
    );
  }
  const object = await fetchObjectStream(objectKey);
  if (!object) {
    return NextResponse.json(
      { ok: false, error: "Secure storage is not reachable from this environment." },
      { status: 503 }
    );
  }
  const fileName = (doc.fileName ?? `document-${doc.id}`).replace(/[^\w.\- ]+/g, "_");
  // Readable types open IN the browser (founder 2026-08-06: "open a window so
  // you can read the document"); everything else downloads. HTML/unknown
  // types must never render inline from our origin (script execution).
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
