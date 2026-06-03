import { and, desc, eq } from "drizzle-orm";

import {
  adverseActionReviews,
  applications,
  humanReviewWorkflows,
  properties,
  reviewTransitionControls,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Review Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for review record reads.
 * - Vol II: Protects human-review, adverse-action, appeal, explanation,
 *   disclosure, and final-action posture from uncontrolled exposure.
 * - Vol III: Provides deterministic record-scoped review reads before
 *   dashboards or institutional workflows consume review records.
 * - Vol IV: Supports review monitoring, escalation, recovery, audit
 *   preparation, and evidence review.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

export type ListReviewAdminRecordsInput = {
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  transitionId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  status?: string | null;
  adverseActionStatus?: string | null;
  transitionStatus?: string | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
  includeAdverseActionReviews?: boolean | null;
  includeTransitions?: boolean | null;
};

export type ReviewAdminRecord = {
  humanReview: typeof humanReviewWorkflows.$inferSelect;
  adverseActionReviews: Array<typeof adverseActionReviews.$inferSelect>;
  transitions: Array<typeof reviewTransitionControls.$inferSelect>;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type ReviewAdminScopeRecord = {
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  humanReviewWorkflowId?: string | null;
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

async function loadAdverseActionReview(
  adverseActionReviewId?: string | null
): Promise<typeof adverseActionReviews.$inferSelect | null> {
  const normalizedId = normalizeText(adverseActionReviewId);

  if (!normalizedId) {
    return null;
  }

  const rows = await db
    .select()
    .from(adverseActionReviews)
    .where(eq(adverseActionReviews.id, normalizedId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadTransition(
  transitionId?: string | null
): Promise<typeof reviewTransitionControls.$inferSelect | null> {
  const normalizedId = normalizeText(transitionId);

  if (!normalizedId) {
    return null;
  }

  const rows = await db
    .select()
    .from(reviewTransitionControls)
    .where(eq(reviewTransitionControls.id, normalizedId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadApplication(
  humanReview: typeof humanReviewWorkflows.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !humanReview.applicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, humanReview.applicationId))
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

async function loadAdverseActionReviewsForHumanReview(
  humanReviewWorkflowId: string,
  includeAdverseActionReviews: boolean,
  adverseActionReviewId?: string | null,
  adverseActionStatus?: string | null
): Promise<Array<typeof adverseActionReviews.$inferSelect>> {
  if (!includeAdverseActionReviews) {
    return [];
  }

  const filters = [
    eq(adverseActionReviews.humanReviewWorkflowId, humanReviewWorkflowId),
    normalizeText(adverseActionReviewId)
      ? eq(adverseActionReviews.id, normalizeText(adverseActionReviewId) ?? "")
      : undefined,
    normalizeStatus(adverseActionStatus)
      ? eq(
          adverseActionReviews.adverseActionStatus,
          normalizeStatus(adverseActionStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return db
    .select()
    .from(adverseActionReviews)
    .where(and(...filters))
    .orderBy(desc(adverseActionReviews.createdAt));
}

async function loadTransitionsForHumanReview(
  humanReviewWorkflowId: string,
  includeTransitions: boolean,
  transitionId?: string | null,
  transitionStatus?: string | null
): Promise<Array<typeof reviewTransitionControls.$inferSelect>> {
  if (!includeTransitions) {
    return [];
  }

  const filters = [
    eq(reviewTransitionControls.humanReviewWorkflowId, humanReviewWorkflowId),
    normalizeText(transitionId)
      ? eq(reviewTransitionControls.id, normalizeText(transitionId) ?? "")
      : undefined,
    normalizeStatus(transitionStatus)
      ? eq(
          reviewTransitionControls.transitionStatus,
          normalizeStatus(transitionStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return db
    .select()
    .from(reviewTransitionControls)
    .where(and(...filters))
    .orderBy(desc(reviewTransitionControls.createdAt));
}

export async function getReviewAdminScopeRecord(input: {
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  transitionId?: string | null;
  applicationId?: string | null;
}): Promise<ReviewAdminScopeRecord | null> {
  const normalizedHumanReviewWorkflowId = normalizeText(
    input.humanReviewWorkflowId
  );

  if (normalizedHumanReviewWorkflowId) {
    const rows = await db
      .select()
      .from(humanReviewWorkflows)
      .where(eq(humanReviewWorkflows.id, normalizedHumanReviewWorkflowId))
      .limit(1);
    const humanReview = rows[0] ?? null;

    if (humanReview) {
      return {
        applicationId: humanReview.applicationId,
        borrowerId: humanReview.borrowerId,
        tenantId: humanReview.tenantId,
        humanReviewWorkflowId: humanReview.id,
      };
    }
  }

  const adverseActionReview = await loadAdverseActionReview(
    input.adverseActionReviewId
  );

  if (adverseActionReview) {
    return {
      applicationId: adverseActionReview.applicationId,
      borrowerId: adverseActionReview.borrowerId,
      tenantId: adverseActionReview.tenantId,
      humanReviewWorkflowId: String(adverseActionReview.humanReviewWorkflowId),
    };
  }

  const transition = await loadTransition(input.transitionId);

  if (transition) {
    return {
      applicationId: transition.applicationId,
      borrowerId: transition.borrowerId,
      tenantId: transition.tenantId,
      humanReviewWorkflowId: String(transition.humanReviewWorkflowId),
    };
  }

  const normalizedApplicationId = normalizeText(input.applicationId);

  if (normalizedApplicationId) {
    return {
      applicationId: normalizedApplicationId,
      borrowerId: null,
      tenantId: null,
      humanReviewWorkflowId: null,
    };
  }

  return null;
}

export async function listReviewAdminRecords(
  input: ListReviewAdminRecordsInput
): Promise<ReviewAdminRecord[]> {
  const adverseActionReview = await loadAdverseActionReview(
    input.adverseActionReviewId
  );
  const transition = await loadTransition(input.transitionId);
  const humanReviewWorkflowId =
    normalizeText(input.humanReviewWorkflowId) ??
    (adverseActionReview
      ? String(adverseActionReview.humanReviewWorkflowId)
      : null) ??
    (transition ? String(transition.humanReviewWorkflowId) : null);
  const filters = [
    humanReviewWorkflowId
      ? eq(humanReviewWorkflows.id, humanReviewWorkflowId)
      : undefined,
    normalizeText(input.applicationId)
      ? eq(humanReviewWorkflows.applicationId, normalizeText(input.applicationId) ?? "")
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(humanReviewWorkflows.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(humanReviewWorkflows.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeStatus(input.status)
      ? eq(humanReviewWorkflows.status, normalizeStatus(input.status) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const humanReviews = whereClause
    ? await db
        .select()
        .from(humanReviewWorkflows)
        .where(whereClause)
        .orderBy(desc(humanReviewWorkflows.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(humanReviewWorkflows)
        .orderBy(desc(humanReviewWorkflows.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: ReviewAdminRecord[] = [];

  for (const humanReview of humanReviews) {
    const application = await loadApplication(
      humanReview,
      input.includeApplication !== false
    );
    const relatedAdverseActionReviews =
      await loadAdverseActionReviewsForHumanReview(
        String(humanReview.id),
        input.includeAdverseActionReviews !== false,
        input.adverseActionReviewId,
        input.adverseActionStatus
      );
    const relatedTransitions = await loadTransitionsForHumanReview(
      String(humanReview.id),
      input.includeTransitions !== false,
      input.transitionId,
      input.transitionStatus
    );

    if (
      (normalizeText(input.adverseActionReviewId) ||
        normalizeStatus(input.adverseActionStatus)) &&
      relatedAdverseActionReviews.length === 0
    ) {
      continue;
    }

    if (
      (normalizeText(input.transitionId) ||
        normalizeStatus(input.transitionStatus)) &&
      relatedTransitions.length === 0
    ) {
      continue;
    }

    records.push({
      humanReview,
      adverseActionReviews: relatedAdverseActionReviews,
      transitions: relatedTransitions,
      application,
      property: await loadProperty(application, input.includeProperty !== false),
    });
  }

  return records;
}
