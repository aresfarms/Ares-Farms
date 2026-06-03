import { and, desc, eq } from "drizzle-orm";

import { applications, properties } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Application Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for application record reads.
 * - Vol II: Protects borrower, application, property, and review posture data
 *   from uncontrolled disclosure.
 * - Vol III: Provides deterministic record-scoped application reads before
 *   dashboards or institutional workflows consume the records.
 * - Vol IV: Supports operator/admin monitoring, escalation, recovery,
 *   audit preparation, and evidence review.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

export type ListApplicationAdminRecordsInput = {
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  decisionStatus?: string | null;
  limit?: number | null;
  includeProperty?: boolean | null;
};

export type ApplicationAdminRecord = {
  application: typeof applications.$inferSelect;
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

async function loadProperty(
  application: typeof applications.$inferSelect,
  includeProperty: boolean
): Promise<typeof properties.$inferSelect | null> {
  if (!includeProperty || !application.propertyId) {
    return null;
  }

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.id, application.propertyId))
    .limit(1);

  return rows[0] ?? null;
}

export async function listApplicationAdminRecords(
  input: ListApplicationAdminRecordsInput
): Promise<ApplicationAdminRecord[]> {
  const filters = [
    normalizeText(input.applicationId)
      ? eq(applications.id, normalizeText(input.applicationId) ?? "")
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(applications.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(applications.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.userId)
      ? eq(applications.userId, normalizeText(input.userId) ?? "")
      : undefined,
    normalizeStatus(input.status)
      ? eq(applications.status, normalizeStatus(input.status) ?? "")
      : undefined,
    normalizeStatus(input.reviewStatus)
      ? eq(applications.reviewStatus, normalizeStatus(input.reviewStatus) ?? "")
      : undefined,
    normalizeStatus(input.decisionStatus)
      ? eq(
          applications.decisionStatus,
          normalizeStatus(input.decisionStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(applications)
        .where(whereClause)
        .orderBy(desc(applications.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(applications)
        .orderBy(desc(applications.createdAt))
        .limit(normalizeLimit(input.limit));

  const records: ApplicationAdminRecord[] = [];

  for (const application of rows) {
    records.push({
      application,
      property: await loadProperty(
        application,
        input.includeProperty !== false
      ),
    });
  }

  return records;
}
