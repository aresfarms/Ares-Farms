import { and, desc, eq } from "drizzle-orm";

import {
  applications,
  operatorReviewQueueItems,
  properties,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Operator Queue Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for operator workflow reads.
 * - Vol II: Protects borrower, application, queue, escalation, assignment,
 *   and review posture from uncontrolled disclosure.
 * - Vol III: Provides deterministic record-scoped queue reads before
 *   operator, underwriter, auditor, or admin dashboards consume records.
 * - Vol IV: Supports queue monitoring, escalation, assignment, recovery,
 *   backlog review, and audit preparation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

export type ListOperatorQueueAdminRecordsInput = {
  queueItemId?: string | null;
  queueType?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  status?: string | null;
  priority?: string | null;
  escalationStatus?: string | null;
  requiredRole?: string | null;
  assignedTo?: string | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type OperatorQueueAdminRecord = {
  queueItem: typeof operatorReviewQueueItems.$inferSelect;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type OperatorQueueAdminScopeRecord = {
  queueItemId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
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
  queueItem: typeof operatorReviewQueueItems.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !queueItem.applicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, queueItem.applicationId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadProperty(
  application: typeof applications.$inferSelect | null,
  includeProperty: boolean
): Promise<typeof properties.$inferSelect | null> {
  if (!includeProperty || !application?.propertyId) {
    return null;
  }

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.id, application.propertyId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getOperatorQueueAdminScopeRecord(input: {
  queueItemId?: string | null;
  applicationId?: string | null;
}): Promise<OperatorQueueAdminScopeRecord | null> {
  const normalizedQueueItemId = normalizeText(input.queueItemId);

  if (normalizedQueueItemId) {
    const rows = await db
      .select()
      .from(operatorReviewQueueItems)
      .where(eq(operatorReviewQueueItems.id, normalizedQueueItemId))
      .limit(1);
    const queueItem = rows[0] ?? null;

    if (queueItem) {
      return {
        queueItemId: queueItem.id,
        applicationId: queueItem.applicationId,
        borrowerId: queueItem.borrowerId,
        tenantId: queueItem.tenantId,
      };
    }
  }

  const normalizedApplicationId = normalizeText(input.applicationId);

  if (normalizedApplicationId) {
    return {
      queueItemId: null,
      applicationId: normalizedApplicationId,
      borrowerId: null,
      tenantId: null,
    };
  }

  return null;
}

export async function listOperatorQueueAdminRecords(
  input: ListOperatorQueueAdminRecordsInput
): Promise<OperatorQueueAdminRecord[]> {
  const filters = [
    normalizeText(input.queueItemId)
      ? eq(operatorReviewQueueItems.id, normalizeText(input.queueItemId) ?? "")
      : undefined,
    normalizeStatus(input.queueType)
      ? eq(operatorReviewQueueItems.queueType, normalizeStatus(input.queueType) ?? "")
      : undefined,
    normalizeText(input.sourceType)
      ? eq(operatorReviewQueueItems.sourceType, normalizeText(input.sourceType) ?? "")
      : undefined,
    normalizeText(input.sourceId)
      ? eq(operatorReviewQueueItems.sourceId, normalizeText(input.sourceId) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          operatorReviewQueueItems.applicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(operatorReviewQueueItems.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(operatorReviewQueueItems.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeStatus(input.status)
      ? eq(operatorReviewQueueItems.status, normalizeStatus(input.status) ?? "")
      : undefined,
    normalizeStatus(input.priority)
      ? eq(operatorReviewQueueItems.priority, normalizeStatus(input.priority) ?? "")
      : undefined,
    normalizeStatus(input.escalationStatus)
      ? eq(
          operatorReviewQueueItems.escalationStatus,
          normalizeStatus(input.escalationStatus) ?? ""
        )
      : undefined,
    normalizeText(input.requiredRole)
      ? eq(operatorReviewQueueItems.requiredRole, normalizeText(input.requiredRole) ?? "")
      : undefined,
    normalizeText(input.assignedTo)
      ? eq(operatorReviewQueueItems.assignedTo, normalizeText(input.assignedTo) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const queueItems = whereClause
    ? await db
        .select()
        .from(operatorReviewQueueItems)
        .where(whereClause)
        .orderBy(desc(operatorReviewQueueItems.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(operatorReviewQueueItems)
        .orderBy(desc(operatorReviewQueueItems.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: OperatorQueueAdminRecord[] = [];

  for (const queueItem of queueItems) {
    const application = await loadApplication(
      queueItem,
      input.includeApplication !== false
    );

    records.push({
      queueItem,
      application,
      property: await loadProperty(application, input.includeProperty !== false),
    });
  }

  return records;
}
