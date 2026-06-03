import { eq } from "drizzle-orm";

import {
  adverseActionReviews,
  applications,
  humanReviewWorkflows,
  reviewTransitionControls,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Review Transition Control Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for human-review transitions.
 * - Vol II: Blocks final action unless adverse-action, explanation,
 *   appeal, disclosure, and reviewer authority gates are satisfied.
 * - Vol III: Provides deterministic, replay-safe transition evidence.
 * - Vol IV: Supports escalation, underwriter approval, revision handling,
 *   recovery, and audit preparation.
 * - Vol V: Enforces classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const REVIEW_TRANSITION_SOURCE = "review-transition-control-runtime";

export type PersistReviewTransitionInput = {
  traceId: string;
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  transitionType?: string | null;
  requestedStatus?: string | null;
  reviewOutcome?: string | null;
  reviewerRole?: string | null;
  reviewerAttestationRef?: string | null;
  approvalAuthorityRef?: string | null;
  reasonCodes?: string[];
  explanationSummary?: string | null;
  disclosureReviewCompleted?: boolean | null;
  appealRightsPrepared?: boolean | null;
  metadata?: Record<string, unknown>;
};

export type ReviewTransitionGateStatus = {
  humanReviewFound: boolean;
  applicationMatches: boolean;
  transitionTypeAllowed: boolean;
  reviewEligibleStatus: boolean;
  reviewerRoleMatches: boolean;
  reviewerAttestationPresent: boolean;
  approvalAuthorityPresent: boolean;
  adverseActionRequired: boolean;
  adverseActionReferenced: boolean;
  adverseActionMatches: boolean;
  reasonCodesPresent: boolean;
  explanationPresent: boolean;
  disclosureReviewCompleted: boolean;
  appealRightsPrepared: boolean;
};

export type ReviewTransitionResult = {
  application: typeof applications.$inferSelect | null;
  humanReview: typeof humanReviewWorkflows.$inferSelect;
  adverseActionReview: typeof adverseActionReviews.$inferSelect | null;
  transition: typeof reviewTransitionControls.$inferSelect;
  gates: ReviewTransitionGateStatus;
  transitionAllowed: boolean;
  finalActionAllowed: boolean;
  finalNoticeAllowed: boolean;
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

function normalizeTransitionType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "APPROVE_FOR_FINAL_ACTION",
    "REJECT_FINAL_ACTION",
    "RETURN_FOR_REVISION",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "APPROVE_FOR_FINAL_ACTION";
}

function normalizeRequestedStatus(
  value: unknown,
  transitionType: string
): string {
  const normalized = normalizeText(value)?.toUpperCase();

  if (normalized) {
    return normalized;
  }

  if (transitionType === "REJECT_FINAL_ACTION") {
    return "FINAL_ACTION_REJECTED";
  }

  if (transitionType === "RETURN_FOR_REVISION") {
    return "RETURNED_FOR_REVISION";
  }

  return "APPROVED_FOR_FINAL_ACTION";
}

function normalizeReviewOutcome(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "APPROVE",
    "DENY",
    "CONDITIONAL_APPROVAL",
    "RETURN_FOR_REVISION",
    "REJECT",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "APPROVE";
}

function normalizeRole(value: unknown): string | null {
  return normalizeText(value)?.toLowerCase() ?? null;
}

function normalizeReasonCodes(reasonCodes?: string[]): string[] {
  if (!reasonCodes || reasonCodes.length === 0) {
    return [];
  }

  return reasonCodes
    .map((code) => normalizeText(code)?.toUpperCase())
    .filter((code): code is string => Boolean(code));
}

function metadataObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function reviewEligibleStatus(status: string): boolean {
  return new Set([
    "QUEUED_FOR_HUMAN_REVIEW",
    "IN_REVIEW",
    "ESCALATION_REVIEW_REQUIRED",
    "RETURNED_FOR_REVISION",
  ]).has(status);
}

function adverseActionRequired(
  humanReview: typeof humanReviewWorkflows.$inferSelect,
  adverseActionReview: typeof adverseActionReviews.$inferSelect | null,
  reviewOutcome: string,
  reasonCodes: string[]
): boolean {
  return (
    humanReview.adverseActionCandidate === true ||
    Boolean(adverseActionReview) ||
    reviewOutcome === "DENY" ||
    reasonCodes.some(
      (code) => code.includes("ADVERSE") || code.includes("DENIAL")
    )
  );
}

function gateComplete(gates: ReviewTransitionGateStatus): boolean {
  return (
    gates.humanReviewFound &&
    gates.applicationMatches &&
    gates.transitionTypeAllowed &&
    gates.reviewEligibleStatus &&
    gates.reviewerRoleMatches &&
    gates.reviewerAttestationPresent &&
    gates.approvalAuthorityPresent &&
    gates.adverseActionMatches &&
    gates.reasonCodesPresent &&
    gates.explanationPresent &&
    gates.disclosureReviewCompleted &&
    gates.appealRightsPrepared
  );
}

function transitionStatus(input: {
  transitionType: string;
  transitionAllowed: boolean;
}): string {
  if (!input.transitionAllowed) {
    return "TRANSITION_BLOCKED";
  }

  if (input.transitionType === "RETURN_FOR_REVISION") {
    return "RETURNED_FOR_REVISION";
  }

  if (input.transitionType === "REJECT_FINAL_ACTION") {
    return "FINAL_ACTION_REJECTED";
  }

  return "APPROVED_FOR_FINAL_ACTION";
}

async function loadHumanReview(humanReviewWorkflowId: string) {
  const rows = await db
    .select()
    .from(humanReviewWorkflows)
    .where(eq(humanReviewWorkflows.id, humanReviewWorkflowId))
    .limit(1);
  const humanReview = rows[0] ?? null;

  if (!humanReview) {
    throw new Error("Human review workflow not found for review transition.");
  }

  return humanReview;
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

  return rows[0] ?? null;
}

async function loadAdverseActionReview(adverseActionReviewId?: string | null) {
  const normalizedId = normalizeText(adverseActionReviewId);

  if (!normalizedId) {
    return null;
  }

  const rows = await db
    .select()
    .from(adverseActionReviews)
    .where(eq(adverseActionReviews.id, normalizedId))
    .limit(1);
  const adverseActionReview = rows[0] ?? null;

  if (!adverseActionReview) {
    throw new Error("Adverse-action review not found for review transition.");
  }

  return adverseActionReview;
}

export async function persistReviewTransition(
  input: PersistReviewTransitionInput
): Promise<ReviewTransitionResult> {
  const humanReviewWorkflowId = normalizeRequiredText(
    input.humanReviewWorkflowId,
    "humanReviewWorkflowId"
  );
  const humanReview = await loadHumanReview(humanReviewWorkflowId);
  const applicationId =
    normalizeText(input.applicationId) ?? humanReview.applicationId;
  const application = await loadApplication(applicationId);
  const adverseActionReview = await loadAdverseActionReview(
    input.adverseActionReviewId
  );
  const transitionType = normalizeTransitionType(input.transitionType);
  const requestedStatus = normalizeRequestedStatus(
    input.requestedStatus,
    transitionType
  );
  const reviewOutcome = normalizeReviewOutcome(input.reviewOutcome);
  const reviewerRole = normalizeRole(input.reviewerRole);
  const requiredReviewerRole = normalizeRole(humanReview.requiredReviewerRole);
  const reasonCodes = normalizeReasonCodes(input.reasonCodes);
  const explanationSummary = normalizeText(input.explanationSummary);
  const adverseRequired = adverseActionRequired(
    humanReview,
    adverseActionReview,
    reviewOutcome,
    reasonCodes
  );
  const gates: ReviewTransitionGateStatus = {
    humanReviewFound: true,
    applicationMatches:
      !applicationId || !humanReview.applicationId
        ? true
        : applicationId === humanReview.applicationId,
    transitionTypeAllowed: transitionType === "APPROVE_FOR_FINAL_ACTION",
    reviewEligibleStatus: reviewEligibleStatus(humanReview.status),
    reviewerRoleMatches: Boolean(
      reviewerRole &&
        requiredReviewerRole &&
        (reviewerRole === requiredReviewerRole ||
          (reviewerRole === "underwriter" &&
            requiredReviewerRole === "authorized-underwriter") ||
          (reviewerRole === "operator" &&
            requiredReviewerRole === "authorized-operator"))
    ),
    reviewerAttestationPresent: Boolean(
      normalizeText(input.reviewerAttestationRef)
    ),
    approvalAuthorityPresent: Boolean(normalizeText(input.approvalAuthorityRef)),
    adverseActionRequired: adverseRequired,
    adverseActionReferenced: adverseRequired ? Boolean(adverseActionReview) : true,
    adverseActionMatches: adverseRequired
      ? Boolean(
          adverseActionReview &&
            String(adverseActionReview.humanReviewWorkflowId) ===
              humanReviewWorkflowId &&
            (!applicationId || adverseActionReview.applicationId === applicationId)
        )
      : true,
    reasonCodesPresent: adverseRequired ? reasonCodes.length > 0 : true,
    explanationPresent: Boolean(explanationSummary),
    disclosureReviewCompleted: adverseRequired
      ? input.disclosureReviewCompleted === true
      : true,
    appealRightsPrepared: adverseRequired ? input.appealRightsPrepared === true : true,
  };
  const transitionAllowed = gateComplete(gates);
  const finalActionAllowed =
    transitionAllowed && transitionType === "APPROVE_FOR_FINAL_ACTION";
  const finalNoticeAllowed = finalActionAllowed && adverseRequired;
  const now = new Date();
  const transitionRows = await db
    .insert(reviewTransitionControls)
    .values({
      applicationId,
      borrowerId:
        normalizeText(input.borrowerId) ??
        humanReview.borrowerId ??
        application?.borrowerId ??
        null,
      tenantId:
        normalizeText(input.tenantId) ??
        humanReview.tenantId ??
        application?.tenantId ??
        null,
      actorId: normalizeText(input.actorId),
      humanReviewWorkflowId,
      adverseActionReviewId: normalizeText(input.adverseActionReviewId),
      transitionType,
      requestedStatus,
      transitionStatus: transitionStatus({
        transitionType,
        transitionAllowed,
      }),
      reviewOutcome,
      reviewerRole,
      reviewerAttestationRef: normalizeText(input.reviewerAttestationRef),
      approvalAuthorityRef: normalizeText(input.approvalAuthorityRef),
      reasonCodes,
      explanationSummary,
      transitionGates: gates,
      disclosureReviewCompleted: input.disclosureReviewCompleted === true,
      appealRightsPrepared: input.appealRightsPrepared === true,
      finalActionAllowed,
      finalNoticeAllowed,
      borrowerDisclosureAllowed: false,
      adverseActionRequired: adverseRequired,
      humanReviewRequired: !finalActionAllowed,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: REVIEW_TRANSITION_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        reviewTransitionRuntimeVersion:
          "review-transition-control-runtime-v0.1.0",
        borrowerNoticeDeliveryPerformed: false,
      },
      transitionedAt: transitionAllowed ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const transition = transitionRows[0];
  let updatedHumanReview = humanReview;
  let updatedAdverseActionReview = adverseActionReview;

  if (finalActionAllowed) {
    const updatedRows = await db
      .update(humanReviewWorkflows)
      .set({
        status: "APPROVED_FOR_FINAL_ACTION",
        finalActionAllowed: true,
        humanReviewRequired: false,
        assignedTo: normalizeText(input.actorId) ?? humanReview.assignedTo,
        escalationStatus: "RESOLVED",
        replayRef: input.traceId,
        traceId: input.traceId,
        metadata: {
          ...metadataObject(humanReview.metadata),
          reviewTransitionId: transition.id,
          finalActionAllowed: true,
          transitionApprovedAt: now.toISOString(),
        },
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(humanReviewWorkflows.id, humanReview.id))
      .returning();

    updatedHumanReview = updatedRows[0];
  }

  if (finalNoticeAllowed && adverseActionReview) {
    const updatedRows = await db
      .update(adverseActionReviews)
      .set({
        adverseActionStatus: "APPROVED_FOR_NOTICE",
        noticeStatus: "NOTICE_PREPARATION_APPROVED",
        appealStatus: "APPEAL_RIGHTS_PREPARED",
        finalActionAllowed: true,
        finalNoticeAllowed: true,
        humanReviewRequired: false,
        replayRef: input.traceId,
        traceId: input.traceId,
        metadata: {
          ...metadataObject(adverseActionReview.metadata),
          reviewTransitionId: transition.id,
          finalNoticeAllowed: true,
          borrowerNoticeDeliveryPerformed: false,
          transitionApprovedAt: now.toISOString(),
        },
        updatedAt: now,
      })
      .where(eq(adverseActionReviews.id, adverseActionReview.id))
      .returning();

    updatedAdverseActionReview = updatedRows[0];
  }

  return {
    application,
    humanReview: updatedHumanReview,
    adverseActionReview: updatedAdverseActionReview,
    transition,
    gates,
    transitionAllowed,
    finalActionAllowed,
    finalNoticeAllowed,
  };
}
