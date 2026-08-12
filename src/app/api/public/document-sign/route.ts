import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { applicationDocuments } from "@/db/schema";
import { db } from "@/lib/db";
import { mintCustomerDownloadToken } from "@/lib/documents/customerDownloadToken";
import { createDocumentStorageHandoff } from "@/lib/documents/storageHandoffStore";
import { persistDocumentSubmission } from "@/lib/documents/documentStore";
import { fetchObjectBytes, objectKeyFromStorageUri, uploadObjectBytes } from "@/lib/documents/gcsResumableUpload";
import { verifySigningToken } from "@/lib/documents/signingToken";
import {
  ESIGN_CONSENT_TEXT,
  ESIGN_CONSENT_VERSION,
  ESIGN_INTENT_TEXT,
  buildSignatureCertificatePdf,
  sha256OfVaultObject,
  signatureMode,
} from "@/lib/documents/signatureVault";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { scanStatusOf } from "@/lib/documents/malwareScan";
import { emailConfigured, sendEmail } from "@/lib/notifications/emailProvider";
import { LENDER_EMAIL_SIGNATURE, renderLenderEmailHtml } from "@/lib/notifications/lenderSignature";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { serviceRequests } from "@/db/schema";
import {
  SIGNATURE_EXECUTION_DOCTRINE, analyzeSignaturePdf, captureMockSignature,
  finalizeOfflineExecutedPdf, planSignaturePlacement, validateExecutedPdf,
} from "@/lib/signature-execution";

/**
 * Customer Signing Ceremony API (public, token-gated) — the signature vault's
 * front door. GET returns the ceremony context (document, consent text, view
 * link, mode); POST executes the signature: verifies the token, hashes the
 * exact vault bytes, mints the certificate PDF into the vault, records the
 * durable signature event, and notifies both parties.
 *
 * Scope guard: only documents the LENDER placed for the customer
 * (documentType lender-provided) on the token's own deal are signable —
 * never borrower uploads, never closing documents, never another deal.
 * See signatureVault.ts for the ESIGN/UETA design and the TEST-MODE gate.
 */

const MODULE = "api.public.document-sign";

async function signableDocument(documentId: string, dealRef: string) {
  const rows = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.id, documentId))
    .limit(1);
  const doc = rows[0];
  if (!doc) return null;
  if (doc.documentType !== "lender-provided") return null;
  if (doc.applicationId !== `finintake-${dealRef}`) return null;
  if (!(doc.mimeType === "application/pdf" || doc.fileName?.toLowerCase().endsWith(".pdf"))) return null;
  return doc;
}

export async function GET(req: NextRequest) {
  const claims = verifySigningToken(req.nextUrl.searchParams.get("token") ?? "");
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "This signing link is invalid or has expired — refresh your status page for a fresh one." },
      { status: 401 }
    );
  }
  const doc = await signableDocument(claims.documentId, claims.dealRef);
  if (!doc) {
    return NextResponse.json({ ok: false, error: "This document is not available for signing." }, { status: 404 });
  }
  const metadata = (doc.metadata ?? {}) as Record<string, unknown>;
  const view = mintCustomerDownloadToken({ documentId: doc.id, dealRef: claims.dealRef });
  return NextResponse.json({
    ok: true,
    dealRef: claims.dealRef,
    fileName: doc.fileName,
    alreadySigned: metadata.signatureStatus === "signed" || metadata.signatureStatus === "test-signed",
    viewPath: `/api/public/document-download?token=${encodeURIComponent(view.token)}`,
    consentText: ESIGN_CONSENT_TEXT,
    intentText: ESIGN_INTENT_TEXT,
    consentVersion: ESIGN_CONSENT_VERSION,
    mode: signatureMode(),
    executionPosture: "BLOCKED_PENDING_GOVERNED_EXECUTION",
    canonicalResult: "ONE_EXECUTED_PDF",
  });
}

export async function POST(req: NextRequest) {
  const traceId = `document-sign-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let body: { token?: unknown; typedName?: unknown; consented?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const claims = verifySigningToken(typeof body.token === "string" ? body.token : "");
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "This signing link is invalid or has expired — refresh your status page for a fresh one." },
      { status: 401 }
    );
  }
  // Live legal execution remains promotion-blocked. Staging/test ceremonies are
  // permitted only in explicit TEST mode and are stamped as non-operative.
  const mode = signatureMode();
  if (mode === "live" && SIGNATURE_EXECUTION_DOCTRINE.liveSigningBlocked) {
    return NextResponse.json({
      ok: false, error: "Live electronic execution is not active.",
      blockerCode: "SIG_PROMOTION_INACTIVE", canonicalResult: "ONE_EXECUTED_PDF",
    }, { status: 409 });
  }
  const typedName = typeof body.typedName === "string" ? body.typedName.trim().slice(0, 140) : "";
  if (typedName.length < 3 || body.consented !== true) {
    return NextResponse.json(
      { ok: false, error: "Type your full legal name and confirm the consent statement to sign." },
      { status: 400 }
    );
  }
  const doc = await signableDocument(claims.documentId, claims.dealRef);
  if (!doc) {
    return NextResponse.json({ ok: false, error: "This document is not available for signing." }, { status: 404 });
  }
  const signScanStatus = scanStatusOf(doc.metadata);
  if (signScanStatus !== "clean") {
    return NextResponse.json(
      { ok: false, error: "This document has not passed the vault's safety scan and cannot be signed yet.", scanStatus: signScanStatus },
      { status: 423 }
    );
  }
  const metadata = (doc.metadata ?? {}) as Record<string, unknown>;
  if (metadata.signatureStatus === "signed" || metadata.signatureStatus === "test-signed") {
    return NextResponse.json({ ok: true, alreadySigned: true });
  }

  const signerIp = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const signerUserAgent = (req.headers.get("user-agent") ?? "unknown").slice(0, 300);
  const signedAtIso = new Date().toISOString();
  const objectKey = objectKeyFromStorageUri(doc.storageUri);
  const sourceBytes = objectKey ? await fetchObjectBytes(objectKey) : null;
  if (!sourceBytes) {
    return NextResponse.json({ ok: false, error: "The exact PDF bytes could not be loaded from governed storage." }, { status: 503 });
  }
  const documentSha256 = await sha256OfVaultObject(doc.storageUri);
  const analysis = await analyzeSignaturePdf({ bytes: sourceBytes, malwareStatus: "CLEAN" });
  if (!analysis.safeForOfflinePlanning || analysis.sourceSha256 !== documentSha256) {
    return NextResponse.json({ ok: false, error: "The PDF failed the governed integrity/signature safety gate.", blockerCodes: analysis.blockerCodes }, { status: 422 });
  }
  const plan = planSignaturePlacement({ analysis, profile: "THIRD_PARTY", signerRole: "customer" });
  if (plan.blockerCodes.length > 0 || !plan.collisionFree) {
    return NextResponse.json({ ok: false, error: "The PDF cannot be safely finalized for signature.", blockerCodes: plan.blockerCodes }, { status: 422 });
  }
  const event = {
    dealRef: claims.dealRef,
    documentId: doc.id,
    documentFileName: doc.fileName ?? `document-${doc.id}`,
    documentSha256,
    signerTypedName: typedName,
    signerIp,
    signerUserAgent,
    signedAtIso,
    consentVersion: ESIGN_CONSENT_VERSION,
    mode,
  } as const;

  const executionId = `sigexec-${traceId}`;
  const capture = captureMockSignature({
    executionId, documentSha256: analysis.sourceSha256, signerName: typedName,
    capacity: "Self", authorizedAt: signedAtIso,
  });
  const finalized = await finalizeOfflineExecutedPdf({
    sourceBytes, plan, evidence: {
      executionId, signerName: typedName, capacity: "Self", signedAtIso, timezone: "UTC",
      sourceSha256: analysis.sourceSha256, authorityRef: `signing-token:${claims.dealRef}`,
      consentRef: ESIGN_CONSENT_VERSION, intentRef: ESIGN_INTENT_TEXT,
      reviewRef: `customer-review:${doc.id}:${analysis.sourceSha256}`, captureRef: capture.captureId,
    },
  });
  const validation = await validateExecutedPdf({ sourceBytes, executedBytes: finalized.bytes, plan });
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: "Executed PDF validation failed.", issues: validation.issues }, { status: 500 });
  }
  const executedName = `${(doc.fileName ?? `document-${doc.id}`).replace(/\.pdf$/i, "")}-executed-TEST.pdf`;
  const executedHandoff = await createDocumentStorageHandoff({
    applicationId: doc.applicationId, documentType: "executed-document-test",
    documentName: `${claims.dealRef} — executed document (TEST)`, fileName: executedName,
    mimeType: "application/pdf", byteSize: finalized.bytes.length,
    storageProvider: "gcs-resumable-v1", storageBucket: process.env.DOCUMENT_STORAGE_BUCKET ?? null,
    traceId, source: "signature-execution-engine",
    metadata: { sourceDocumentId: doc.id, sourceSha256: analysis.sourceSha256, executedSha256: validation.executedSha256, executionId },
  });
  const executedStored = await uploadObjectBytes({ objectKey: executedHandoff.handoff.objectKey, bytes: Buffer.from(finalized.bytes), contentType: "application/pdf" });
  const executedDoc = await persistDocumentSubmission({
    traceId, source: "signature-execution-engine", applicationId: doc.applicationId,
    documentType: "executed-document-test", documentName: `${claims.dealRef} — executed document (TEST)`,
    fileName: executedName, mimeType: "application/pdf", byteSize: finalized.bytes.length,
    checksum: validation.executedSha256, storageUri: executedStored ? executedHandoff.handoff.storageUri : null,
    metadata: { dealRef: claims.dealRef, sourceDocumentId: doc.id, sourceSha256: analysis.sourceSha256, executedSha256: validation.executedSha256, executionId, validationReportSha256: validation.reportSha256, canonicalSinglePdf: true, mode },
  });

  // Certificate into the vault (governed object key via the handoff store;
  // the ONE runtime-authored vault write).
  const certPdf = await buildSignatureCertificatePdf(event);
  const certName = `signature-certificate-${claims.dealRef}-${doc.id.slice(0, 8)}.pdf`;
  const handoff = await createDocumentStorageHandoff({
    applicationId: doc.applicationId,
    documentType: "signature-certificate",
    documentName: `${claims.dealRef} — signature certificate`,
    fileName: certName,
    mimeType: "application/pdf",
    byteSize: certPdf.length,
    storageProvider: "gcs-resumable-v1",
    storageBucket: process.env.DOCUMENT_STORAGE_BUCKET ?? null,
    traceId,
    source: "signature-vault",
    metadata: { dealRef: claims.dealRef, signedDocumentId: doc.id },
  });
  const certObjectKey = handoff.handoff.objectKey;
  const certStored = await uploadObjectBytes({
    objectKey: certObjectKey,
    bytes: certPdf,
    contentType: "application/pdf",
  });
  const cert = await persistDocumentSubmission({
    traceId,
    source: "signature-vault",
    applicationId: doc.applicationId,
    documentType: "signature-certificate",
    documentName: `${claims.dealRef} — signature certificate`,
    fileName: certName,
    mimeType: "application/pdf",
    byteSize: certPdf.length,
    storageUri: certStored ? handoff.handoff.storageUri : null,
    metadata: { dealRef: claims.dealRef, signatureEvent: event, bytesInGovernedStorage: certStored, scanStatus: "clean", scanTrusted: "runtime-authored" },
  });

  // Mark the source document signed.
  await db
    .update(applicationDocuments)
    .set({
      metadata: {
        ...metadata,
        signatureStatus: mode === "test" ? "test-signed" : "signed",
        signatureCertificateId: cert.document.id,
        executedDocumentId: executedDoc.document.id,
        sourceSha256: analysis.sourceSha256, executedSha256: validation.executedSha256,
        executionValidationReportSha256: validation.reportSha256,
        signedAt: signedAtIso, signedByTypedName: typedName,
      },
      updatedAt: new Date(),
    })
    .where(eq(applicationDocuments.id, doc.id));

  const observability = createObservabilityEvent({
    eventType: "DOCUMENT_SIGNED",
    domain: "security",
    severity: "INFO",
    message: mode === "test"
      ? "A TEST-MODE electronic signature ceremony completed in the signature vault."
      : "An electronic signature ceremony completed in the signature vault.",
    traceId,
    replayRef: traceId,
    actorId: `customer-signer:${claims.dealRef}`,
    module: MODULE,
    metadata: { ...event, certificateId: cert.document.id, certStored, executedDocumentId: executedDoc.document.id, executedStored, executedSha256: validation.executedSha256, validationReportSha256: validation.reportSha256 },
  });
  await persistGovernanceEvidence({
    traceId,
    replayRef: traceId,
    observability,
    metadata: { route: "/api/public/document-sign", signatureEvent: event, certificateId: cert.document.id, executedDocumentId: executedDoc.document.id, sourceSha256: analysis.sourceSha256, executedSha256: validation.executedSha256, validationReportSha256: validation.reportSha256 },
  });

  // Notify both parties (minimum disclosure — names of things, never contents).
  if (emailConfigured()) {
    const dealRows = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.serviceRequestId, claims.dealRef))
      .limit(1);
    const contactEmail = dealRows[0]?.contactEmail;
    const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
    if (contactEmail) {
      const bodyText =
        `Your electronic signature is recorded for financing request:\n${claims.dealRef}\n\n` +
        `Your signature certificate is available on your status page (enter your reference number and email):\n${base}/status` +
        (mode === "test" ? `\n\nNote: the portal's signing feature is in TEST MODE — this ceremony is a rehearsal, not yet a legally operative signature.` : "");
      await sendEmail({
        to: contactEmail,
        subject: `Signature recorded — financing request ${claims.dealRef}`,
        text: `${bodyText}\n\n${LENDER_EMAIL_SIGNATURE}`,
        html: renderLenderEmailHtml(bodyText),
        inlineBrandLogo: true,
      });
    }
    const brokerEmail = process.env.NOTIFY_LENDER_EMAIL;
    if (brokerEmail?.includes("@")) {
      await sendEmail({
        to: brokerEmail,
        subject: `Customer signed — ${claims.dealRef}`,
        text:
          `The customer completed the signing ceremony on ${event.documentFileName} for ${claims.dealRef}.` +
          ` The certificate is in the deal's vault register.` +
          (mode === "test" ? " (TEST MODE)" : ""),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    signed: true,
    mode,
    certificateStored: certStored, executedDocumentStored: executedStored,
    executedDocumentId: executedDoc.document.id, sourceSha256: analysis.sourceSha256,
    executedSha256: validation.executedSha256, signedAt: signedAtIso,
  });
}
