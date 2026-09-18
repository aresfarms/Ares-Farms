import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import {
  applicationDocuments,
  applications,
  syntheticFixtureLineageRecords,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  bindSyntheticFixtureLineage,
  syntheticFixtureContextFromBoundLineage,
} from "@/lib/testing/syntheticFixtureLineage";
import { syntheticFixtureLineageForRecord } from "@/lib/testing/syntheticFixtureLineageStore";

/**
 * Canonical Document Intake Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves governed document submission authority.
 * - Vol II: Supports regulated borrower document handling and retention review.
 * - Vol III: Provides deterministic document metadata persistence.
 * - Vol IV: Supports document review, escalation, recovery, and audit prep.
 * - Vol V: Enforces classification, consent, source authority, replay,
 *   observability, versioning, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";

export type PersistDocumentInput = {
  traceId: string;
  source: string;
  applicationId: string;
  borrowerId?: string | null;
  tenantId?: string | null;
  documentType: string;
  documentName: string;
  fileName?: string | null;
  mimeType?: string | null;
  byteSize?: number | null;
  checksum?: string | null;
  storageUri?: string | null;
  metadata?: Record<string, unknown>;
};

export type PersistedDocumentSubmission = {
  application: typeof applications.$inferSelect;
  document: typeof applicationDocuments.$inferSelect;
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

export function assertNoRawDocumentContent(
  input: Record<string, unknown>,
): void {
  const blockedKeys = [
    "file",
    "fileContent",
    "documentContent",
    "base64",
    "bytes",
    "raw",
  ];

  for (const key of blockedKeys) {
    if (input[key] !== undefined && input[key] !== null) {
      throw new Error(
        "Raw document content is not accepted by this metadata intake route.",
      );
    }
  }
}

export async function persistDocumentSubmission(
  input: PersistDocumentInput,
): Promise<PersistedDocumentSubmission> {
  const applicationId = normalizeRequiredText(
    input.applicationId,
    "applicationId",
  );
  const documentType = normalizeRequiredText(
    input.documentType,
    "documentType",
  );
  const documentName = normalizeRequiredText(
    input.documentName,
    "documentName",
  );

  const existingApplication = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (existingApplication.length === 0) {
    throw new Error("Application not found for document submission.");
  }

  const application = existingApplication[0];
  const applicationLineage = await syntheticFixtureLineageForRecord(
    "application",
    applicationId,
  );
  const fixtureContext = applicationLineage
    ? syntheticFixtureContextFromBoundLineage(applicationLineage.lineagePayload)
    : null;
  const documentId = randomUUID();
  const syntheticFixture = fixtureContext
    ? bindSyntheticFixtureLineage(
        fixtureContext,
        "application_document",
        documentId,
      )
    : null;
  const now = new Date();

  const document = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(applicationDocuments)
      .values({
        id: documentId,
        applicationId,
        borrowerId: normalizeText(input.borrowerId) ?? application.borrowerId,
        tenantId: normalizeText(input.tenantId) ?? application.tenantId,
        propertyId: application.propertyId,
        documentType,
        documentName,
        fileName: normalizeText(input.fileName),
        mimeType: normalizeText(input.mimeType),
        byteSize: normalizeByteSize(input.byteSize),
        checksum: normalizeText(input.checksum),
        storageUri: normalizeText(input.storageUri),
        status: input.storageUri ? "RECEIVED" : "PENDING_SECURE_STORAGE",
        reviewStatus: "REVIEW_REQUIRED",
        retentionStatus: "RETAIN_PER_POLICY",
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: input.traceId,
        source: input.source,
        metadata: {
          ...(input.metadata ?? {}),
          traceId: input.traceId,
          source: input.source,
          documentIntakeVersion: "document-intake-runtime-v0.1.0",
          rawContentAccepted: false,
          syntheticFixture,
        },
        receivedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (syntheticFixture) {
      await tx.insert(syntheticFixtureLineageRecords).values({
        syntheticPersonaId: syntheticFixture.syntheticPersonaId,
        humanVisibleName: syntheticFixture.humanVisibleName,
        testRunId: syntheticFixture.testRunId,
        fixtureVersion: syntheticFixture.fixtureVersion,
        registryVersion: syntheticFixture.registryVersion,
        lineageVersion: syntheticFixture.lineageVersion,
        environment: syntheticFixture.environment,
        operatorIdentity: syntheticFixture.operatorIdentity,
        fixtureCreatedAt: new Date(syntheticFixture.createdAt),
        scenarioId: syntheticFixture.scenarioId,
        providerTargets: [...syntheticFixture.providerTargets],
        recordType: syntheticFixture.recordType,
        recordId: syntheticFixture.recordId,
        lineageSha256: syntheticFixture.lineageSha256,
        lineagePayload: syntheticFixture,
        governanceVersion: GOVERNANCE_VERSION,
        classification: "RESTRICTED",
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "document-intake.synthetic-fixture",
      });
    }
    return inserted;
  });

  return { application, document };
}
