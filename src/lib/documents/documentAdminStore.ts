import { and, desc, eq } from "drizzle-orm";

import { applicationDocuments, applications, properties } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Document Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for application document reads.
 * - Vol II: Protects borrower document metadata, retention posture, and
 *   review status from uncontrolled disclosure.
 * - Vol III: Provides deterministic record-scoped document metadata reads
 *   before dashboards or institutional workflows consume document records.
 * - Vol IV: Supports document review, escalation, recovery, audit
 *   preparation, and evidence review.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

export type ListDocumentAdminRecordsInput = {
  documentId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  documentType?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type DocumentAdminRecord = {
  document: typeof applicationDocuments.$inferSelect;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

function normalizeStatus(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

async function loadApplication(
  document: typeof applicationDocuments.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, document.applicationId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadProperty(
  document: typeof applicationDocuments.$inferSelect,
  application: typeof applications.$inferSelect | null,
  includeProperty: boolean
): Promise<typeof properties.$inferSelect | null> {
  const propertyId = application?.propertyId ?? document.propertyId;

  if (!includeProperty || !propertyId) {
    return null;
  }

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getDocumentAdminRecordById(
  documentId?: string | null
): Promise<DocumentAdminRecord | null> {
  const normalizedDocumentId = normalizeText(documentId);

  if (!normalizedDocumentId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.id, normalizedDocumentId))
    .limit(1);
  const document = rows[0] ?? null;

  if (!document) {
    return null;
  }

  const application = await loadApplication(document, true);

  return {
    document,
    application,
    property: await loadProperty(document, application, true),
  };
}

export async function listDocumentAdminRecords(
  input: ListDocumentAdminRecordsInput
): Promise<DocumentAdminRecord[]> {
  const filters = [
    normalizeText(input.documentId)
      ? eq(applicationDocuments.id, normalizeText(input.documentId) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          applicationDocuments.applicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(applicationDocuments.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(applicationDocuments.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.documentType)
      ? eq(
          applicationDocuments.documentType,
          normalizeText(input.documentType) ?? ""
        )
      : undefined,
    normalizeStatus(input.status)
      ? eq(applicationDocuments.status, normalizeStatus(input.status) ?? "")
      : undefined,
    normalizeStatus(input.reviewStatus)
      ? eq(
          applicationDocuments.reviewStatus,
          normalizeStatus(input.reviewStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const documents = whereClause
    ? await db
        .select()
        .from(applicationDocuments)
        .where(whereClause)
        .orderBy(desc(applicationDocuments.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(applicationDocuments)
        .orderBy(desc(applicationDocuments.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: DocumentAdminRecord[] = [];

  for (const document of documents) {
    const application = await loadApplication(
      document,
      input.includeApplication !== false
    );

    records.push({
      document,
      application,
      property: await loadProperty(
        document,
        application,
        input.includeProperty !== false
      ),
    });
  }

  return records;
}
