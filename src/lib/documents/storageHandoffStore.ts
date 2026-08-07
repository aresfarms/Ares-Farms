import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import {
  applications,
  documentStorageHandoffs,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Document Storage Handoff Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves governed storage intent authority before raw file movement.
 * - Vol II: Supports regulated borrower document consent, controlled
 *   disclosure, retention, and chain-of-custody boundaries.
 * - Vol III: Provides deterministic replay-safe storage handoff records
 *   without accepting raw binary content into API runtime.
 * - Vol IV: Supports storage provider review, upload recovery, escalation,
 *   and audit preparation.
 * - Vol V: Enforces classification, source authority, replay,
 *   observability, versioning, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const HANDOFF_SOURCE = "document-storage-handoff-runtime";
const DEFAULT_STORAGE_PROVIDER = "controlled-provider-pending";
const DEFAULT_UPLOAD_METHOD = "PUT";
const HANDOFF_TTL_MINUTES = 15;

export type CreateDocumentStorageHandoffInput = {
  traceId: string;
  source: string;
  applicationId: string;
  borrowerId?: string | null;
  tenantId?: string | null;
  documentType: string;
  documentName: string;
  fileName: string;
  mimeType?: string | null;
  byteSize?: number | null;
  checksum?: string | null;
  storageProvider?: string | null;
  storageBucket?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreatedDocumentStorageHandoff = {
  application: typeof applications.$inferSelect;
  handoff: typeof documentStorageHandoffs.$inferSelect;
  handoffToken: string;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: unknown, label: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeByteSize(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error("byteSize must be a non-negative integer when provided.");
  }

  return numeric;
}

function safePathSegment(value: string): string {
  const input = value.trim().toLowerCase().slice(0, 512);
  let output = "";
  for (const character of input) {
    const allowed =
      (character >= "a" && character <= "z") ||
      (character >= "0" && character <= "9") ||
      character === "." || character === "_" || character === "-";
    if (allowed) output += character;
    else if (!output.endsWith("-")) output += "-";
    if (output.length >= 96) break;
  }
  while (output.startsWith("-")) output = output.slice(1);
  while (output.endsWith("-")) output = output.slice(0, -1);
  return output;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createHandoffToken(): string {
  return `handoff_${randomUUID()}_${randomUUID()}`;
}

function createObjectKey(input: {
  tenantId?: string | null;
  applicationId: string;
  documentType: string;
  fileName: string;
}): string {
  const tenantSegment = safePathSegment(input.tenantId ?? "unassigned-tenant");
  const applicationSegment = safePathSegment(input.applicationId);
  const typeSegment = safePathSegment(input.documentType);
  const fileSegment = safePathSegment(input.fileName);

  return [
    "tenants",
    tenantSegment,
    "applications",
    applicationSegment,
    "documents",
    typeSegment,
    `${randomUUID()}-${fileSegment}`,
  ].join("/");
}

function expiresAt(now: Date): Date {
  return new Date(now.getTime() + HANDOFF_TTL_MINUTES * 60 * 1000);
}

async function loadApplication(applicationId: string) {
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Application not found for document storage handoff.");
  }

  return rows[0];
}

export async function createDocumentStorageHandoff(
  input: CreateDocumentStorageHandoffInput
): Promise<CreatedDocumentStorageHandoff> {
  const applicationId = normalizeRequiredText(
    input.applicationId,
    "applicationId"
  );
  const documentType = normalizeRequiredText(
    input.documentType,
    "documentType"
  );
  const documentName = normalizeRequiredText(
    input.documentName,
    "documentName"
  );
  const fileName = normalizeRequiredText(input.fileName, "fileName");
  const application = await loadApplication(applicationId);
  const now = new Date();
  const handoffToken = createHandoffToken();
  const storageProvider =
    normalizeText(input.storageProvider) ?? DEFAULT_STORAGE_PROVIDER;
  const providerConfigured = storageProvider !== DEFAULT_STORAGE_PROVIDER;
  const objectKey = createObjectKey({
    tenantId: normalizeText(input.tenantId) ?? application.tenantId,
    applicationId,
    documentType,
    fileName,
  });
  const storageUri = `governed://document-storage/${objectKey}`;

  const inserted = await db
    .insert(documentStorageHandoffs)
    .values({
      applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? application.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? application.tenantId,
      propertyId: application.propertyId,
      documentType,
      documentName,
      fileName,
      mimeType: normalizeText(input.mimeType),
      byteSize: normalizeByteSize(input.byteSize),
      checksum: normalizeText(input.checksum),
      storageProvider,
      storageBucket: normalizeText(input.storageBucket),
      objectKey,
      storageUri,
      uploadMethod: DEFAULT_UPLOAD_METHOD,
      uploadUrl: null,
      uploadTokenHash: hashToken(handoffToken),
      handoffStatus: providerConfigured
        ? "PENDING_UPLOAD"
        : "PENDING_PROVIDER_CONFIGURATION",
      rawContentAccepted: false,
      providerConfigured,
      humanReviewRequired: true,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: HANDOFF_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        traceId: input.traceId,
        source: input.source,
        documentStorageHandoffVersion:
          "document-storage-handoff-runtime-v0.1.0",
        rawContentAccepted: false,
        providerConfigured,
        handoffTtlMinutes: HANDOFF_TTL_MINUTES,
      },
      expiresAt: expiresAt(now),
      consumedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    application,
    handoff: inserted[0],
    handoffToken,
  };
}
