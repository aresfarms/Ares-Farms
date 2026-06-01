import { and, desc, eq, inArray } from "drizzle-orm";

import {
  applications,
  overlayDefinitions,
  properties,
  ruleDefinitions,
  ruleEvaluationRuns,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Rule and Overlay Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional rule and overlay authority for reads.
 * - Vol II: Protects regulated eligibility, fair-lending, adverse-action,
 *   source-reliance, and human-review boundaries.
 * - Vol III: Provides deterministic, replay-safe rule evaluation inspection.
 * - Vol IV: Supports operator review, escalation, amendment review,
 *   exception handling, and audit preparation.
 * - Vol V: Enforces rule versioning, overlay precedence, explainability,
 *   classification, replay, observability, and evidence preservation.
 */

export type ListRuleOverlayAdminRecordsInput = {
  evaluationId?: string | null;
  operation?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  subjectId?: string | null;
  actorId?: string | null;
  resultStatus?: string | null;
  finalEffect?: string | null;
  advisoryOnly?: boolean | null;
  humanReviewRequired?: boolean | null;
  limit?: number | null;
  includeRules?: boolean | null;
  includeOverlays?: boolean | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type RuleOverlayAdminRecord = {
  ruleEvaluation: typeof ruleEvaluationRuns.$inferSelect;
  rules: Array<typeof ruleDefinitions.$inferSelect>;
  overlays: Array<typeof overlayDefinitions.$inferSelect>;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type RuleOverlayAdminScopeRecord = {
  evaluationId?: string | null;
  operation?: string | null;
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

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));
}

async function loadRules(
  ruleEvaluation: typeof ruleEvaluationRuns.$inferSelect,
  includeRules: boolean
): Promise<Array<typeof ruleDefinitions.$inferSelect>> {
  const ruleIds = stringList(ruleEvaluation.ruleIds);

  if (!includeRules || ruleIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(ruleDefinitions)
    .where(inArray(ruleDefinitions.id, ruleIds))
    .orderBy(desc(ruleDefinitions.createdAt));
}

async function loadOverlays(
  ruleEvaluation: typeof ruleEvaluationRuns.$inferSelect,
  includeOverlays: boolean
): Promise<Array<typeof overlayDefinitions.$inferSelect>> {
  const overlayIds = stringList(ruleEvaluation.overlayIds);

  if (!includeOverlays || overlayIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(overlayDefinitions)
    .where(inArray(overlayDefinitions.id, overlayIds))
    .orderBy(desc(overlayDefinitions.priority));
}

async function loadApplication(
  ruleEvaluation: typeof ruleEvaluationRuns.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !ruleEvaluation.applicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, ruleEvaluation.applicationId))
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

export async function getRuleOverlayAdminScopeRecord(input: {
  evaluationId?: string | null;
  applicationId?: string | null;
}): Promise<RuleOverlayAdminScopeRecord | null> {
  const filters = [
    normalizeText(input.evaluationId)
      ? eq(ruleEvaluationRuns.id, normalizeText(input.evaluationId) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(ruleEvaluationRuns.applicationId, normalizeText(input.applicationId) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  if (filters.length === 0) {
    return null;
  }

  const rows = await db
    .select()
    .from(ruleEvaluationRuns)
    .where(and(...filters))
    .limit(1);
  const ruleEvaluation = rows[0] ?? null;

  if (!ruleEvaluation) {
    return null;
  }

  return {
    evaluationId: ruleEvaluation.id,
    operation: ruleEvaluation.operation,
    applicationId: ruleEvaluation.applicationId,
    borrowerId: ruleEvaluation.borrowerId,
    tenantId: ruleEvaluation.tenantId,
  };
}

export async function listRuleOverlayAdminRecords(
  input: ListRuleOverlayAdminRecordsInput
): Promise<RuleOverlayAdminRecord[]> {
  const filters = [
    normalizeText(input.evaluationId)
      ? eq(ruleEvaluationRuns.id, normalizeText(input.evaluationId) ?? "")
      : undefined,
    normalizeText(input.operation)
      ? eq(ruleEvaluationRuns.operation, normalizeText(input.operation) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(ruleEvaluationRuns.applicationId, normalizeText(input.applicationId) ?? "")
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(ruleEvaluationRuns.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(ruleEvaluationRuns.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.subjectId)
      ? eq(ruleEvaluationRuns.subjectId, normalizeText(input.subjectId) ?? "")
      : undefined,
    normalizeText(input.actorId)
      ? eq(ruleEvaluationRuns.actorId, normalizeText(input.actorId) ?? "")
      : undefined,
    normalizeStatus(input.resultStatus)
      ? eq(ruleEvaluationRuns.resultStatus, normalizeStatus(input.resultStatus) ?? "")
      : undefined,
    normalizeStatus(input.finalEffect)
      ? eq(ruleEvaluationRuns.finalEffect, normalizeStatus(input.finalEffect) ?? "")
      : undefined,
    typeof input.advisoryOnly === "boolean"
      ? eq(ruleEvaluationRuns.advisoryOnly, input.advisoryOnly)
      : undefined,
    typeof input.humanReviewRequired === "boolean"
      ? eq(ruleEvaluationRuns.humanReviewRequired, input.humanReviewRequired)
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(ruleEvaluationRuns)
        .where(whereClause)
        .orderBy(desc(ruleEvaluationRuns.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(ruleEvaluationRuns)
        .orderBy(desc(ruleEvaluationRuns.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: RuleOverlayAdminRecord[] = [];

  for (const ruleEvaluation of rows) {
    const application = await loadApplication(
      ruleEvaluation,
      input.includeApplication !== false
    );

    records.push({
      ruleEvaluation,
      rules: await loadRules(ruleEvaluation, input.includeRules !== false),
      overlays: await loadOverlays(
        ruleEvaluation,
        input.includeOverlays !== false
      ),
      application,
      property: await loadProperty(
        application,
        input.includeProperty !== false
      ),
    });
  }

  return records;
}
