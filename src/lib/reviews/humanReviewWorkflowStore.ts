import { eq } from "drizzle-orm";

import {
  adverseActionReviews,
  applications,
  humanReviewWorkflows,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Human Review Workflow Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable human review authority before regulated
 *   outcomes become final.
 * - Vol II: Protects borrowers through adverse-action review, explanation,
 *   appeal, and fair-lending boundaries.
 * - Vol III: Records replay-safe workflow state for review and candidate
 *   adverse-action handling.
 * - Vol IV: Supports operator queues, escalation, assignment, recovery,
 *   and audit preparation.
 * - Vol V: Enforces explainability, classification, observability, replay,
 *   source authority, versioning, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const REVIEW_SOURCE = "human-review-workflow-runtime";

export type PersistHumanReviewWorkflowInput = {
  traceId: string;
  reviewType: string;
  sourceType: string;
  sourceId?: string | null;
  sourceTraceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  priority?: string | null;
  requiredReviewerRole?: string | null;
  candidateOutcome?: string | null;
  adverseActionCandidate?: boolean | null;
  reasonCodes?: string[];
  explanationSummary?: string | null;
  metadata?: Record<string, unknown>;
};

export type PersistHumanReviewWorkflowResult = {
  application: typeof applications.$inferSelect | null;
  humanReview: typeof humanReviewWorkflows.$inferSelect;
  adverseActionReview: typeof adverseActionReviews.$inferSelect | null;
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

function normalizePriority(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);

  return normalized && allowed.has(normalized) ? normalized : "NORMAL";
}

function normalizeCandidateOutcome(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "APPROVE_REVIEW",
    "CONDITIONAL_REVIEW",
    "DENIAL_REVIEW",
    "ADVERSE_ACTION_REVIEW",
    "REVIEW_REQUIRED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "REVIEW_REQUIRED";
}

function normalizeReasonCodes(reasonCodes?: string[]): string[] {
  if (!reasonCodes || reasonCodes.length === 0) {
    return ["REVIEW_REQUIRED_NO_FINAL_REASON_CODE"];
  }

  return reasonCodes
    .map((code) => normalizeText(code)?.toUpperCase())
    .filter((code): code is string => Boolean(code));
}

function isAdverseActionCandidate(
  explicit: boolean | null | undefined,
  candidateOutcome: string,
  reasonCodes: string[]
): boolean {
  if (explicit === true) {
    return true;
  }

  return (
    candidateOutcome === "DENIAL_REVIEW" ||
    candidateOutcome === "ADVERSE_ACTION_REVIEW" ||
    reasonCodes.some((code) => code.includes("ADVERSE") || code.includes("DENIAL"))
  );
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
    throw new Error("Application not found for human review workflow.");
  }

  return rows[0];
}

export async function persistHumanReviewWorkflow(
  input: PersistHumanReviewWorkflowInput
): Promise<PersistHumanReviewWorkflowResult> {
  const reviewType = normalizeRequiredText(input.reviewType, "reviewType");
  const sourceType = normalizeRequiredText(input.sourceType, "sourceType");
  const application = await loadApplication(input.applicationId);
  const now = new Date();
  const candidateOutcome = normalizeCandidateOutcome(input.candidateOutcome);
  const reasonCodes = normalizeReasonCodes(input.reasonCodes);
  const adverseActionCandidate = isAdverseActionCandidate(
    input.adverseActionCandidate,
    candidateOutcome,
    reasonCodes
  );

  const humanReviewRows = await db
    .insert(humanReviewWorkflows)
    .values({
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId) ?? application?.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application?.tenantId ?? null,
      actorId: normalizeText(input.actorId),
      reviewType,
      sourceType,
      sourceId: normalizeText(input.sourceId),
      sourceTraceId: normalizeText(input.sourceTraceId),
      status: "QUEUED_FOR_HUMAN_REVIEW",
      priority: normalizePriority(input.priority),
      requiredReviewerRole:
        normalizeText(input.requiredReviewerRole) ?? "authorized-underwriter",
      assignedTo: null,
      escalationStatus: adverseActionCandidate
        ? "ESCALATION_REVIEW_REQUIRED"
        : "NOT_ESCALATED",
      candidateOutcome,
      advisoryOnly: true,
      finalActionAllowed: false,
      adverseActionCandidate,
      humanReviewRequired: true,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: REVIEW_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        reviewWorkflowVersion: "human-review-workflow-runtime-v0.1.0",
        finalActionAllowed: false,
        finalNoticeAllowed: false,
      },
      dueAt: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const humanReview = humanReviewRows[0];

  if (!adverseActionCandidate) {
    return {
      application,
      humanReview,
      adverseActionReview: null,
    };
  }

  const adverseActionRows = await db
    .insert(adverseActionReviews)
    .values({
      humanReviewWorkflowId: humanReview.id,
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId) ?? application?.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application?.tenantId ?? null,
      actorId: normalizeText(input.actorId),
      candidateOutcome,
      adverseActionStatus: "CANDIDATE_REVIEW_PENDING",
      noticeStatus: "NOT_A_NOTICE",
      reasonCodes,
      explanationSummary:
        normalizeText(input.explanationSummary) ??
        "Potential adverse-action context requires human review before any borrower notice or final action.",
      appealStatus: "APPEAL_RIGHTS_PENDING",
      advisoryOnly: true,
      humanReviewRequired: true,
      finalActionAllowed: false,
      finalNoticeAllowed: false,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: REVIEW_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        reviewWorkflowId: humanReview.id,
        adverseActionWorkflowVersion: "adverse-action-review-runtime-v0.1.0",
        notFinalNotice: true,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    application,
    humanReview,
    adverseActionReview: adverseActionRows[0],
  };
}
