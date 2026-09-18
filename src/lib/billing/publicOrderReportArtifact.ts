import { createHash, randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { furlongPublicOrderEvents, furlongPublicOrders } from "@/db/schema";
import { db } from "@/lib/db";
import {
  DOCUMENT_STORAGE_PROVIDER,
  documentStorageBucket,
  fetchObjectBytes,
  initResumableUpload,
} from "@/lib/documents/gcsResumableUpload";
import { scanBytesForMalware } from "@/lib/documents/malwareScan";
import { analyzeSignaturePdf } from "@/lib/signature-execution";

const GOVERNANCE_VERSION = "furlong-public-order-v1.0.0";
const SOURCE = "furlong-public-report-artifact-runtime";
const MAX_REPORT_BYTES = 25 * 1024 * 1024;
const SHA256 = /^[a-f0-9]{64}$/;
export type PublicOrderReportArtifactStatus =
  | "PENDING_UPLOAD"
  | "VERIFIED"
  | "AVAILABLE"
  | "QUARANTINED"
  | "FAILED"
  | "REVOKED";

export type PublicOrderReportArtifact = {
  artifactId: string;
  status: PublicOrderReportArtifactStatus;
  fileName: string;
  mimeType: "application/pdf";
  byteSize: number;
  expectedSha256: string;
  verifiedSha256: string | null;
  objectKey: string;
  storageProvider: string;
  createdAt: string;
  verifiedAt: string | null;
  availableAt: string | null;
  firstDownloadedAt: string | null;
  lastDownloadedAt: string | null;
  downloadCount: number;
  verification: Record<string, unknown> | null;
  sensitivity: Record<string, unknown>;
};
export class PublicReportArtifactConflictError extends Error {
  constructor(
    message: string,
    readonly code = "REPORT_ARTIFACT_CONFLICT",
  ) {
    super(message);
    this.name = "PublicReportArtifactConflictError";
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function iso(value: unknown): string | null {
  const normalized = text(value);
  return normalized && !Number.isNaN(Date.parse(normalized))
    ? normalized
    : null;
}
function safeFileName(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9._ -]+/g, "_")
    .slice(0, 160);
  return normalized.toLowerCase().endsWith(".pdf")
    ? normalized
    : normalized + ".pdf";
}

function sensitivityEnvelope() {
  return {
    classificationLevel: "CONFIDENTIAL",
    sensitivityScope: "public-report-customer",
    jurisdictionScope: ["United States"],
    sharingPermissions: ["purchaser", "authorized-furlong-operator"],
    aiUsagePermissions: ["summarize", "quality-review"],
    retentionRequirements: ["retain-per-public-order-policy"],
    legalHoldStatus: "NONE",
    exportRestrictions: ["order-bound-customer-download"],
    vaultRequirements: ["iam-private-object-storage"],
    redactionRequirements: ["exclude-internal-operator-evidence"],
    disclosureAudience: ["purchaser"],
    consentRequirements: ["accepted-public-order-agreement"],
    replayClassificationContext: "captured-with-artifact-event",
  };
}
export function readPublicOrderReportArtifact(
  metadata: unknown,
): PublicOrderReportArtifact | null {
  const value = record(record(metadata).reportArtifact);
  const artifactId = text(value.artifactId);
  const status = text(value.status) as PublicOrderReportArtifactStatus | null;
  const fileName = text(value.fileName);
  const expectedSha256 = text(value.expectedSha256);
  const objectKey = text(value.objectKey);
  const createdAt = iso(value.createdAt);
  const byteSize = Number(value.byteSize);
  const allowedStatuses = new Set<PublicOrderReportArtifactStatus>([
    "PENDING_UPLOAD",
    "VERIFIED",
    "AVAILABLE",
    "QUARANTINED",
    "FAILED",
    "REVOKED",
  ]);
  if (
    !artifactId ||
    !status ||
    !allowedStatuses.has(status) ||
    !fileName ||
    !expectedSha256 ||
    !SHA256.test(expectedSha256) ||
    !objectKey ||
    !createdAt ||
    !Number.isSafeInteger(byteSize) ||
    byteSize < 1 ||
    byteSize > MAX_REPORT_BYTES
  ) {
    return null;
  }
  const verifiedSha256 = text(value.verifiedSha256);
  return {
    artifactId,
    status,
    fileName,
    mimeType: "application/pdf",
    byteSize,
    expectedSha256,
    verifiedSha256:
      verifiedSha256 && SHA256.test(verifiedSha256) ? verifiedSha256 : null,
    objectKey,
    storageProvider: text(value.storageProvider) ?? "unknown",
    createdAt,
    verifiedAt: iso(value.verifiedAt),
    availableAt: iso(value.availableAt),
    firstDownloadedAt: iso(value.firstDownloadedAt),
    lastDownloadedAt: iso(value.lastDownloadedAt),
    downloadCount: Math.max(0, Math.trunc(Number(value.downloadCount) || 0)),
    verification: Object.keys(record(value.verification)).length
      ? record(value.verification)
      : null,
    sensitivity: record(value.sensitivity),
  };
}

export function publicOrderReportArtifactForCustomer(metadata: unknown) {
  const artifact = readPublicOrderReportArtifact(metadata);
  if (
    !artifact ||
    artifact.status !== "AVAILABLE" ||
    !artifact.verifiedSha256
  ) {
    return null;
  }
  return {
    artifactId: artifact.artifactId,
    fileName: artifact.fileName,
    mimeType: artifact.mimeType,
    byteSize: artifact.byteSize,
    sha256: artifact.verifiedSha256,
    availableAt: artifact.availableAt,
    firstDownloadedAt: artifact.firstDownloadedAt,
    lastDownloadedAt: artifact.lastDownloadedAt,
    downloadCount: artifact.downloadCount,
  };
}

function eventDigest(value: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function loadLockedOrder(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string,
) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${orderId}))`);
  const [order] = await tx
    .select()
    .from(furlongPublicOrders)
    .where(eq(furlongPublicOrders.id, orderId))
    .limit(1);
  if (!order) throw new Error("Public order not found.");
  return order;
}
function assertSupervisedUploadOrder(
  order: typeof furlongPublicOrders.$inferSelect,
) {
  if (
    order.fulfillmentMode !== "SUPERVISED" ||
    order.productCode !== "custom_property_analysis"
  ) {
    throw new PublicReportArtifactConflictError(
      "Only a supervised Property Decision Report accepts this artifact.",
    );
  }
  if (order.status !== "IN_FULFILLMENT") {
    throw new PublicReportArtifactConflictError(
      "Start supervised processing before uploading the final report.",
    );
  }
}

export async function beginPublicOrderReportArtifactUpload(input: {
  orderId: string;
  operatorActorId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  originForCors: string | null;
  traceId: string;
}) {
  const sha256 = input.sha256.trim().toLowerCase();
  if (!SHA256.test(sha256)) {
    throw new Error("A lowercase SHA-256 digest is required.");
  }
  if (
    input.mimeType !== "application/pdf" ||
    !Number.isSafeInteger(input.byteSize) ||
    input.byteSize < 1 ||
    input.byteSize > MAX_REPORT_BYTES
  ) {
    throw new Error("A PDF no larger than 25 MB is required.");
  }
  const artifactId = randomUUID();
  const fileName = safeFileName(input.fileName);
  const objectKey =
    "public-orders/" +
    input.orderId +
    "/reports/" +
    artifactId +
    "-" +
    fileName.replaceAll(" ", "-");
  const now = new Date();
  const artifact: PublicOrderReportArtifact = {
    artifactId,
    status: "PENDING_UPLOAD",
    fileName,
    mimeType: "application/pdf",
    byteSize: input.byteSize,
    expectedSha256: sha256,
    verifiedSha256: null,
    objectKey,
    storageProvider: documentStorageBucket()
      ? DOCUMENT_STORAGE_PROVIDER
      : "controlled-provider-pending",
    createdAt: now.toISOString(),
    verifiedAt: null,
    availableAt: null,
    firstDownloadedAt: null,
    lastDownloadedAt: null,
    downloadCount: 0,
    verification: null,
    sensitivity: sensitivityEnvelope(),
  };
  await db.transaction(async (tx) => {
    const order = await loadLockedOrder(tx, input.orderId);
    assertSupervisedUploadOrder(order);
    const priorMetadata = record(order.metadata);
    const priorArtifact = readPublicOrderReportArtifact(priorMetadata);
    if (
      priorArtifact &&
      ["VERIFIED", "AVAILABLE"].includes(priorArtifact.status)
    ) {
      throw new PublicReportArtifactConflictError(
        "A verified final report is already bound to this order.",
      );
    }
    const payload = {
      orderId: order.id,
      artifactId,
      fileName,
      byteSize: input.byteSize,
      expectedSha256: sha256,
    };
    await tx.insert(furlongPublicOrderEvents).values({
      orderId: order.id,
      provider: "furlong-report-artifact",
      providerEventId: "report-artifact-begin:" + artifactId,
      eventType: "public_order.report_artifact_upload_started",
      eventStatus: "PENDING_UPLOAD",
      payloadDigest: eventDigest(payload),
      amountCents: null,
      currency: null,
      paymentStatus: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: SOURCE,
      metadata: {
        ...payload,
        operatorActorId: input.operatorActorId,
        objectKey,
        sensitivity: artifact.sensitivity,
      },
      occurredAt: now,
    });
    await tx
      .update(furlongPublicOrders)
      .set({
        metadata: { ...priorMetadata, reportArtifact: artifact },
        traceId: input.traceId,
        replayRef: input.traceId,
        updatedAt: now,
      })
      .where(eq(furlongPublicOrders.id, order.id));
  });

  const uploadUrl = await initResumableUpload({
    objectKey,
    mimeType: "application/pdf",
    originForCors: input.originForCors,
  });
  return { artifact, uploadUrl };
}
async function markArtifactFailure(input: {
  orderId: string;
  artifactId: string;
  status: "FAILED" | "QUARANTINED";
  reason: string;
  traceId: string;
}) {
  const now = new Date();
  await db.transaction(async (tx) => {
    const order = await loadLockedOrder(tx, input.orderId);
    const priorMetadata = record(order.metadata);
    const artifact = readPublicOrderReportArtifact(priorMetadata);
    if (!artifact || artifact.artifactId !== input.artifactId) return;
    const failed = {
      ...artifact,
      status: input.status,
      verification: {
        outcome: input.status,
        reason: input.reason,
        checkedAt: now.toISOString(),
      },
    };
    const payload = {
      orderId: order.id,
      artifactId: artifact.artifactId,
      status: input.status,
      reason: input.reason,
    };
    await tx.insert(furlongPublicOrderEvents).values({
      orderId: order.id,
      provider: "furlong-report-artifact",
      providerEventId:
        "report-artifact-failure:" + artifact.artifactId + ":" + randomUUID(),
      eventType: "public_order.report_artifact_verification_failed",
      eventStatus: input.status,
      payloadDigest: eventDigest(payload),
      amountCents: null,
      currency: null,
      paymentStatus: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: SOURCE,
      metadata: payload,
      occurredAt: now,
    });
    await tx
      .update(furlongPublicOrders)
      .set({
        metadata: { ...priorMetadata, reportArtifact: failed },
        traceId: input.traceId,
        replayRef: input.traceId,
        updatedAt: now,
      })
      .where(eq(furlongPublicOrders.id, order.id));
  });
}

export async function verifyPublicOrderReportArtifact(input: {
  orderId: string;
  artifactId: string;
  operatorActorId: string;
  traceId: string;
}) {
  const [order] = await db
    .select()
    .from(furlongPublicOrders)
    .where(eq(furlongPublicOrders.id, input.orderId))
    .limit(1);
  if (!order) throw new Error("Public order not found.");
  assertSupervisedUploadOrder(order);
  const artifact = readPublicOrderReportArtifact(order.metadata);
  if (!artifact || artifact.artifactId !== input.artifactId) {
    throw new PublicReportArtifactConflictError(
      "The report artifact is not bound to this order.",
    );
  }
  if (artifact.status === "VERIFIED") return artifact;
  if (artifact.status !== "PENDING_UPLOAD") {
    throw new PublicReportArtifactConflictError(
      "This report artifact cannot be verified in its current state.",
    );
  }

  const bytes = await fetchObjectBytes(artifact.objectKey, MAX_REPORT_BYTES);
  if (!bytes) {
    throw new PublicReportArtifactConflictError(
      "The uploaded report could not be read from governed storage.",
      "REPORT_STORAGE_UNAVAILABLE",
    );
  }
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (
    bytes.length !== artifact.byteSize ||
    actualSha256 !== artifact.expectedSha256
  ) {
    await markArtifactFailure({
      orderId: order.id,
      artifactId: artifact.artifactId,
      status: "FAILED",
      reason: "REPORT_DIGEST_OR_SIZE_MISMATCH",
      traceId: input.traceId,
    });
    throw new PublicReportArtifactConflictError(
      "The uploaded PDF did not match its declared size and digest.",
    );
  }

  const malware = await scanBytesForMalware(bytes);
  if (malware.status !== "clean") {
    if (malware.status === "infected") {
      await markArtifactFailure({
        orderId: order.id,
        artifactId: artifact.artifactId,
        status: "QUARANTINED",
        reason: malware.signature ?? "MALWARE_DETECTED",
        traceId: input.traceId,
      });
    }
    throw new PublicReportArtifactConflictError(
      malware.status === "infected"
        ? "The uploaded PDF was quarantined."
        : "The malware scanner is unavailable; no report was released.",
      malware.status === "infected"
        ? "REPORT_QUARANTINED"
        : "REPORT_SCANNER_UNAVAILABLE",
    );
  }
  const pdf = await analyzeSignaturePdf({
    bytes,
    malwareStatus: "CLEAN",
  });
  if (!pdf.parseable || !pdf.safeForOfflinePlanning) {
    await markArtifactFailure({
      orderId: order.id,
      artifactId: artifact.artifactId,
      status: "FAILED",
      reason: "UNSAFE_OR_UNPARSEABLE_PDF",
      traceId: input.traceId,
    });
    throw new PublicReportArtifactConflictError(
      "The PDF failed the governed structural-safety check.",
    );
  }

  const now = new Date();
  return db.transaction(async (tx) => {
    const currentOrder = await loadLockedOrder(tx, input.orderId);
    assertSupervisedUploadOrder(currentOrder);
    const priorMetadata = record(currentOrder.metadata);
    const current = readPublicOrderReportArtifact(priorMetadata);
    if (!current || current.artifactId !== input.artifactId) {
      throw new PublicReportArtifactConflictError(
        "The report artifact changed during verification.",
      );
    }
    if (current.status === "VERIFIED") return current;
    if (current.status !== "PENDING_UPLOAD") {
      throw new PublicReportArtifactConflictError(
        "The report artifact is no longer pending verification.",
      );
    }
    const verified: PublicOrderReportArtifact = {
      ...current,
      status: "VERIFIED",
      verifiedSha256: actualSha256,
      verifiedAt: now.toISOString(),
      verification: {
        outcome: "VERIFIED",
        malwareStatus: malware.status,
        parseable: pdf.parseable,
        pageCount: pdf.pageCount,
        encrypted: pdf.encrypted,
        hasEmbeddedFiles: pdf.hasEmbeddedFiles,
        hasJavaScript: pdf.hasJavaScript,
        hasLaunchActions: pdf.hasLaunchActions,
        analyzerVersion: pdf.analyzerVersion,
        checkedAt: now.toISOString(),
      },
    };
    const payload = {
      orderId: currentOrder.id,
      artifactId: current.artifactId,
      sha256: actualSha256,
      byteSize: bytes.length,
      pageCount: pdf.pageCount,
    };
    await tx.insert(furlongPublicOrderEvents).values({
      orderId: currentOrder.id,
      provider: "furlong-report-artifact",
      providerEventId: "report-artifact-verified:" + current.artifactId,
      eventType: "public_order.report_artifact_verified",
      eventStatus: "VERIFIED",
      payloadDigest: eventDigest(payload),
      amountCents: null,
      currency: null,
      paymentStatus: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: SOURCE,
      metadata: { ...payload, operatorActorId: input.operatorActorId },
      occurredAt: now,
    });
    await tx
      .update(furlongPublicOrders)
      .set({
        metadata: { ...priorMetadata, reportArtifact: verified },
        traceId: input.traceId,
        replayRef: input.traceId,
        updatedAt: now,
      })
      .where(eq(furlongPublicOrders.id, currentOrder.id));
    return verified;
  });
}

export async function recordPublicOrderReportDownload(input: {
  orderId: string;
  artifactId: string;
  actorId: string | null;
  traceId: string;
}) {
  const now = new Date();
  return db.transaction(async (tx) => {
    const order = await loadLockedOrder(tx, input.orderId);
    if (
      order.status !== "FULFILLED" ||
      order.amountPaidCents !== order.amountTotalCents ||
      order.amountRefundedCents !== 0 ||
      order.disputedAt
    ) {
      throw new PublicReportArtifactConflictError(
        "Report access is not active for this order.",
      );
    }
    const priorMetadata = record(order.metadata);
    const artifact = readPublicOrderReportArtifact(priorMetadata);
    if (
      !artifact ||
      artifact.artifactId !== input.artifactId ||
      artifact.status !== "AVAILABLE" ||
      !artifact.verifiedSha256
    ) {
      throw new PublicReportArtifactConflictError(
        "The verified report is not available.",
      );
    }
    const updated: PublicOrderReportArtifact = {
      ...artifact,
      firstDownloadedAt: artifact.firstDownloadedAt ?? now.toISOString(),
      lastDownloadedAt: now.toISOString(),
      downloadCount: artifact.downloadCount + 1,
    };
    const payload = {
      orderId: order.id,
      artifactId: artifact.artifactId,
      sha256: artifact.verifiedSha256,
      downloadCount: updated.downloadCount,
    };
    await tx.insert(furlongPublicOrderEvents).values({
      orderId: order.id,
      provider: "furlong-customer-portal",
      providerEventId:
        "report-download:" + artifact.artifactId + ":" + randomUUID(),
      eventType: "public_order.report_downloaded",
      eventStatus: "DOWNLOADED",
      payloadDigest: eventDigest(payload),
      amountCents: null,
      currency: null,
      paymentStatus: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: SOURCE,
      metadata: { ...payload, actorId: input.actorId },
      occurredAt: now,
    });
    await tx
      .update(furlongPublicOrders)
      .set({
        metadata: { ...priorMetadata, reportArtifact: updated },
        traceId: input.traceId,
        replayRef: input.traceId,
        updatedAt: now,
      })
      .where(
        and(
          eq(furlongPublicOrders.id, order.id),
          eq(furlongPublicOrders.status, "FULFILLED"),
        ),
      );
    return updated;
  });
}
