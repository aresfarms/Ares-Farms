import { and, desc, eq } from "drizzle-orm";

import {
  applications,
  liveActionReadinessReviews,
  properties,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Live Action Readiness Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for live-action promotion reads.
 * - Vol II: Protects borrower, tenant, source, notice, and payment execution
 *   readiness evidence before any live external action is promoted.
 * - Vol III: Provides deterministic, record-scoped readiness reads for
 *   replay-safe dashboards and operational review.
 * - Vol IV: Supports runbook, rollback, monitoring, incident response,
 *   dry-run, human approval, and audit-evidence review.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, consent, isolation, controlled disclosure, and evidence doctrine.
 */

export type ListLiveActionReadinessAdminRecordsInput = {
  reviewId?: string | null;
  actionType?: string | null;
  readinessStatus?: string | null;
  targetExecutionId?: string | null;
  targetAdapterId?: string | null;
  targetProviderId?: string | null;
  targetSourceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  readyForLiveAction?: boolean | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type LiveActionReadinessAdminRecord = {
  review: typeof liveActionReadinessReviews.$inferSelect;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type LiveActionReadinessAdminScopeRecord = {
  reviewId?: string | null;
  actionType?: string | null;
  targetExecutionId?: string | null;
  targetAdapterId?: string | null;
  targetProviderId?: string | null;
  targetSourceId?: string | null;
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
  review: typeof liveActionReadinessReviews.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !review.targetApplicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, review.targetApplicationId))
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

export async function getLiveActionReadinessAdminScopeRecord(input: {
  reviewId?: string | null;
  targetExecutionId?: string | null;
  applicationId?: string | null;
}): Promise<LiveActionReadinessAdminScopeRecord | null> {
  const filters = [
    normalizeText(input.reviewId)
      ? eq(liveActionReadinessReviews.id, normalizeText(input.reviewId) ?? "")
      : undefined,
    normalizeText(input.targetExecutionId)
      ? eq(
          liveActionReadinessReviews.targetExecutionId,
          normalizeText(input.targetExecutionId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          liveActionReadinessReviews.targetApplicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  if (filters.length === 0) {
    return null;
  }

  const rows = await db
    .select()
    .from(liveActionReadinessReviews)
    .where(and(...filters))
    .limit(1);
  const review = rows[0] ?? null;

  if (!review) {
    return null;
  }

  return {
    reviewId: review.id,
    actionType: review.actionType,
    targetExecutionId: review.targetExecutionId,
    targetAdapterId: review.targetAdapterId,
    targetProviderId: review.targetProviderId,
    targetSourceId: review.targetSourceId,
    applicationId: review.targetApplicationId,
    borrowerId: review.targetBorrowerId,
    tenantId: review.targetTenantId,
  };
}

export async function listLiveActionReadinessAdminRecords(
  input: ListLiveActionReadinessAdminRecordsInput
): Promise<LiveActionReadinessAdminRecord[]> {
  const filters = [
    normalizeText(input.reviewId)
      ? eq(liveActionReadinessReviews.id, normalizeText(input.reviewId) ?? "")
      : undefined,
    normalizeStatus(input.actionType)
      ? eq(
          liveActionReadinessReviews.actionType,
          normalizeStatus(input.actionType) ?? ""
        )
      : undefined,
    normalizeStatus(input.readinessStatus)
      ? eq(
          liveActionReadinessReviews.readinessStatus,
          normalizeStatus(input.readinessStatus) ?? ""
        )
      : undefined,
    normalizeText(input.targetExecutionId)
      ? eq(
          liveActionReadinessReviews.targetExecutionId,
          normalizeText(input.targetExecutionId) ?? ""
        )
      : undefined,
    normalizeText(input.targetAdapterId)
      ? eq(
          liveActionReadinessReviews.targetAdapterId,
          normalizeText(input.targetAdapterId) ?? ""
        )
      : undefined,
    normalizeText(input.targetProviderId)
      ? eq(
          liveActionReadinessReviews.targetProviderId,
          normalizeText(input.targetProviderId) ?? ""
        )
      : undefined,
    normalizeText(input.targetSourceId)
      ? eq(
          liveActionReadinessReviews.targetSourceId,
          normalizeText(input.targetSourceId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          liveActionReadinessReviews.targetApplicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(
          liveActionReadinessReviews.targetBorrowerId,
          normalizeText(input.borrowerId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(
          liveActionReadinessReviews.targetTenantId,
          normalizeText(input.tenantId) ?? ""
        )
      : undefined,
    typeof input.readyForLiveAction === "boolean"
      ? eq(
          liveActionReadinessReviews.readyForLiveAction,
          input.readyForLiveAction
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(liveActionReadinessReviews)
        .where(whereClause)
        .orderBy(desc(liveActionReadinessReviews.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(liveActionReadinessReviews)
        .orderBy(desc(liveActionReadinessReviews.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: LiveActionReadinessAdminRecord[] = [];

  for (const review of rows) {
    const application = await loadApplication(
      review,
      input.includeApplication !== false
    );

    records.push({
      review,
      application,
      property: await loadProperty(
        application,
        input.includeProperty !== false
      ),
    });
  }

  return records;
}
