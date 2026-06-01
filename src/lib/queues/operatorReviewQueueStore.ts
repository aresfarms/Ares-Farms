import { and, desc, eq } from "drizzle-orm";

import { applications, operatorReviewQueueItems } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Operator Review Queue Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable operational review authority.
 * - Vol II: Keeps regulated borrower/application workflows human-reviewable
 *   before borrower, lender, sponsor, or agency-facing reliance.
 * - Vol III: Provides deterministic durable queue state.
 * - Vol IV: Supports assignment, escalation, backlog review, recovery,
 *   and audit preparation.
 * - Vol V: Enforces classification, replay, observability, source authority,
 *   controlled disclosure, and version lineage.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const QUEUE_SOURCE = "operator-review-queue-runtime";

export type PersistOperatorReviewQueueInput = {
  traceId: string;
  queueType?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceTraceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  status?: string | null;
  priority?: string | null;
  escalationStatus?: string | null;
  reviewReason?: string | null;
  requiredRole?: string | null;
  assignedTo?: string | null;
  dueAt?: string | Date | null;
  metadata?: Record<string, unknown>;
};

export type ListOperatorReviewQueueInput = {
  tenantId?: string | null;
  status?: string | null;
  queueType?: string | null;
  limit?: number | null;
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

function normalizeQueueType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "APPLICATION_REVIEW",
    "DOCUMENT_REVIEW",
    "CONNECTOR_REVIEW",
    "RULE_REVIEW",
    "HUMAN_REVIEW",
    "ADVERSE_ACTION_REVIEW",
    "NOTICE_DELIVERY_REVIEW",
    "EVIDENCE_FOLLOW_UP",
    "ESCALATION_REVIEW",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "APPLICATION_REVIEW";
}

function normalizeStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "ESCALATED",
    "COMPLETED",
    "CANCELLED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "OPEN";
}

function normalizePriority(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);

  return normalized && allowed.has(normalized) ? normalized : "NORMAL";
}

function normalizeEscalationStatus(value: unknown, priority: string): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "NOT_ESCALATED",
    "ESCALATION_REVIEW_REQUIRED",
    "ESCALATED",
  ]);

  if (normalized && allowed.has(normalized)) {
    return normalized;
  }

  return priority === "URGENT" ? "ESCALATION_REVIEW_REQUIRED" : "NOT_ESCALATED";
}

function normalizeDueAt(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

async function loadApplication(applicationId?: string | null) {
  const normalizedApplicationId = normalizeText(applicationId);

  if (!normalizedApplicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, normalizedApplicationId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Application not found for operator review queue item.");
  }

  return rows[0];
}

export async function persistOperatorReviewQueueItem(
  input: PersistOperatorReviewQueueInput
) {
  const queueType = normalizeQueueType(input.queueType);
  const sourceType = normalizeRequiredText(input.sourceType, "sourceType");
  const reviewReason = normalizeRequiredText(input.reviewReason, "reviewReason");
  const application = await loadApplication(input.applicationId);
  const priority = normalizePriority(input.priority);
  const status = normalizeStatus(input.status);
  const now = new Date();
  const inserted = await db
    .insert(operatorReviewQueueItems)
    .values({
      queueType,
      sourceType,
      sourceId: normalizeText(input.sourceId),
      sourceTraceId: normalizeText(input.sourceTraceId),
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId) ?? application?.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application?.tenantId ?? null,
      actorId: normalizeText(input.actorId),
      status,
      priority,
      escalationStatus: normalizeEscalationStatus(
        input.escalationStatus,
        priority
      ),
      reviewReason,
      requiredRole: normalizeText(input.requiredRole) ?? "operator",
      assignedTo: normalizeText(input.assignedTo),
      lockedBy: null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: QUEUE_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        operatorReviewQueueVersion: "operator-review-queue-runtime-v0.1.0",
      },
      dueAt: normalizeDueAt(input.dueAt),
      lockedAt: null,
      completedAt: status === "COMPLETED" ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    application,
    queueItem: inserted[0],
  };
}

export async function listOperatorReviewQueueItems(
  input: ListOperatorReviewQueueInput
) {
  const filters = [
    normalizeText(input.tenantId)
      ? eq(operatorReviewQueueItems.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.status)
      ? eq(operatorReviewQueueItems.status, normalizeStatus(input.status))
      : undefined,
    normalizeText(input.queueType)
      ? eq(operatorReviewQueueItems.queueType, normalizeQueueType(input.queueType))
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  if (whereClause) {
    return db
      .select()
      .from(operatorReviewQueueItems)
      .where(whereClause)
      .orderBy(desc(operatorReviewQueueItems.createdAt))
      .limit(normalizeLimit(input.limit));
  }

  return db
    .select()
    .from(operatorReviewQueueItems)
    .orderBy(desc(operatorReviewQueueItems.createdAt))
    .limit(normalizeLimit(input.limit));
}
