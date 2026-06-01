import { eq } from "drizzle-orm";

import {
  adverseActionReviews,
  applications,
  humanReviewWorkflows,
  regulatedDecisionNotices,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Regulated Decision and Notice Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional authority for final regulated action.
 * - Vol II: Blocks final credit decisions and adverse-action notices until
 *   borrower explanation, appeal, disclosure, and human-review gates are met.
 * - Vol III: Provides deterministic, replay-safe final-action control state.
 * - Vol IV: Supports escalation, notice preparation, disputes, recovery,
 *   and audit preparation.
 * - Vol V: Enforces explainability, classification, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const DECISION_NOTICE_SOURCE = "regulated-decision-notice-runtime";

export type PersistRegulatedDecisionNoticeInput = {
  traceId: string;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  decisionType?: string | null;
  requestedOutcome?: string | null;
  finalActionRequested?: boolean | null;
  disclosureStatus?: string | null;
  appealRightsIncluded?: boolean | null;
  reasonCodes?: string[];
  explanationSummary?: string | null;
  noticeSummary?: string | null;
  metadata?: Record<string, unknown>;
};

export type DecisionNoticeGateStatus = {
  applicationPresent: boolean;
  humanReviewReferenced: boolean;
  humanReviewApproved: boolean;
  adverseActionRequired: boolean;
  adverseActionReferenced: boolean;
  adverseActionApproved: boolean;
  reasonCodesPresent: boolean;
  explanationPresent: boolean;
  disclosureApproved: boolean;
  appealRightsIncluded: boolean;
  finalActionRequested: boolean;
};

export type RegulatedDecisionNoticeResult = {
  application: typeof applications.$inferSelect;
  humanReview: typeof humanReviewWorkflows.$inferSelect | null;
  adverseActionReview: typeof adverseActionReviews.$inferSelect | null;
  decisionNotice: typeof regulatedDecisionNotices.$inferSelect;
  gates: DecisionNoticeGateStatus;
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

function normalizeDecisionType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "CREDIT_DECISION",
    "ADVERSE_ACTION_NOTICE",
    "CONDITIONAL_DECISION",
    "APPLICATION_STATUS_NOTICE",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "CREDIT_DECISION";
}

function normalizeRequestedOutcome(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "APPROVE",
    "CONDITIONAL_APPROVAL",
    "DENY",
    "WITHDRAW",
    "INCOMPLETE",
    "REVIEW_REQUIRED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "REVIEW_REQUIRED";
}

function normalizeDisclosureStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "DISCLOSURE_REVIEW_REQUIRED",
    "APPROVED_FOR_BORROWER_DISCLOSURE",
    "DISCLOSURE_APPROVED",
    "APPROVED",
    "BLOCKED",
  ]);

  return normalized && allowed.has(normalized)
    ? normalized
    : "DISCLOSURE_REVIEW_REQUIRED";
}

function normalizeReasonCodes(reasonCodes?: string[]): string[] {
  if (!reasonCodes || reasonCodes.length === 0) {
    return [];
  }

  return reasonCodes
    .map((code) => normalizeText(code)?.toUpperCase())
    .filter((code): code is string => Boolean(code));
}

function isAdverseOutcome(input: {
  decisionType: string;
  requestedOutcome: string;
  reasonCodes: string[];
}): boolean {
  return (
    input.decisionType === "ADVERSE_ACTION_NOTICE" ||
    input.requestedOutcome === "DENY" ||
    input.requestedOutcome === "WITHDRAW" ||
    input.requestedOutcome === "INCOMPLETE" ||
    input.reasonCodes.some(
      (code) => code.includes("ADVERSE") || code.includes("DENIAL")
    )
  );
}

function humanReviewApproved(
  humanReview: typeof humanReviewWorkflows.$inferSelect | null
): boolean {
  if (!humanReview) {
    return false;
  }

  const approvedStatuses = new Set([
    "APPROVED",
    "APPROVED_FOR_FINAL_ACTION",
    "COMPLETED_APPROVED",
  ]);

  return (
    approvedStatuses.has(humanReview.status) &&
    humanReview.finalActionAllowed === true &&
    humanReview.humanReviewRequired === false
  );
}

function adverseActionApproved(
  adverseActionReview: typeof adverseActionReviews.$inferSelect | null
): boolean {
  if (!adverseActionReview) {
    return false;
  }

  const approvedStatuses = new Set([
    "APPROVED",
    "APPROVED_FOR_NOTICE",
    "COMPLETED_APPROVED",
  ]);

  return (
    approvedStatuses.has(adverseActionReview.adverseActionStatus) &&
    adverseActionReview.finalActionAllowed === true &&
    adverseActionReview.finalNoticeAllowed === true &&
    adverseActionReview.humanReviewRequired === false
  );
}

function disclosureApproved(disclosureStatus: string): boolean {
  return (
    disclosureStatus === "APPROVED_FOR_BORROWER_DISCLOSURE" ||
    disclosureStatus === "DISCLOSURE_APPROVED" ||
    disclosureStatus === "APPROVED"
  );
}

function finalDecisionStatus(input: {
  finalActionRequested: boolean;
  finalActionAllowed: boolean;
}): string {
  if (!input.finalActionRequested) {
    return "PENDING_FINAL_REVIEW";
  }

  return input.finalActionAllowed
    ? "FINAL_ACTION_APPROVED_FOR_EXECUTION"
    : "FINAL_ACTION_BLOCKED";
}

function noticeStatus(input: {
  adverseActionRequired: boolean;
  finalNoticeAllowed: boolean;
}): string {
  if (!input.adverseActionRequired) {
    return "NO_ADVERSE_NOTICE_REQUIRED";
  }

  return input.finalNoticeAllowed
    ? "FINAL_NOTICE_APPROVED_FOR_ISSUANCE"
    : "FINAL_NOTICE_BLOCKED";
}

async function loadApplication(applicationId: string) {
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  const application = rows[0] ?? null;

  if (!application) {
    throw new Error("Application not found for regulated decision notice.");
  }

  return application;
}

async function loadHumanReview(
  humanReviewWorkflowId?: string | null,
  applicationId?: string | null
) {
  const normalizedId = normalizeText(humanReviewWorkflowId);

  if (!normalizedId) {
    return null;
  }

  const rows = await db
    .select()
    .from(humanReviewWorkflows)
    .where(eq(humanReviewWorkflows.id, normalizedId))
    .limit(1);
  const humanReview = rows[0] ?? null;

  if (!humanReview) {
    throw new Error("Human review workflow not found for final decision control.");
  }

  if (applicationId && humanReview.applicationId !== applicationId) {
    throw new Error("Human review workflow does not match the application.");
  }

  return humanReview;
}

async function loadAdverseActionReview(
  adverseActionReviewId?: string | null,
  humanReviewWorkflowId?: string | null,
  applicationId?: string | null
) {
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
    throw new Error("Adverse-action review not found for final notice control.");
  }

  if (
    humanReviewWorkflowId &&
    String(adverseActionReview.humanReviewWorkflowId) !== humanReviewWorkflowId
  ) {
    throw new Error(
      "Adverse-action review does not match the human review workflow."
    );
  }

  if (applicationId && adverseActionReview.applicationId !== applicationId) {
    throw new Error("Adverse-action review does not match the application.");
  }

  return adverseActionReview;
}

export async function persistRegulatedDecisionNotice(
  input: PersistRegulatedDecisionNoticeInput
): Promise<RegulatedDecisionNoticeResult> {
  const applicationId = normalizeRequiredText(
    input.applicationId,
    "applicationId"
  );
  const application = await loadApplication(applicationId);
  const decisionType = normalizeDecisionType(input.decisionType);
  const requestedOutcome = normalizeRequestedOutcome(input.requestedOutcome);
  const disclosureStatus = normalizeDisclosureStatus(input.disclosureStatus);
  const reasonCodes = normalizeReasonCodes(input.reasonCodes);
  const humanReview = await loadHumanReview(
    input.humanReviewWorkflowId,
    applicationId
  );
  const adverseActionReview = await loadAdverseActionReview(
    input.adverseActionReviewId,
    input.humanReviewWorkflowId,
    applicationId
  );
  const adverseActionRequired = isAdverseOutcome({
    decisionType,
    requestedOutcome,
    reasonCodes,
  });
  const finalActionRequested = input.finalActionRequested ?? true;
  const explanationSummary = normalizeText(input.explanationSummary);
  const gates: DecisionNoticeGateStatus = {
    applicationPresent: true,
    humanReviewReferenced: Boolean(humanReview),
    humanReviewApproved: humanReviewApproved(humanReview),
    adverseActionRequired,
    adverseActionReferenced: Boolean(adverseActionReview),
    adverseActionApproved: adverseActionRequired
      ? adverseActionApproved(adverseActionReview)
      : true,
    reasonCodesPresent: adverseActionRequired ? reasonCodes.length > 0 : true,
    explanationPresent: Boolean(explanationSummary),
    disclosureApproved: disclosureApproved(disclosureStatus),
    appealRightsIncluded:
      adverseActionRequired ? input.appealRightsIncluded === true : true,
    finalActionRequested,
  };
  const finalActionAllowed =
    gates.finalActionRequested &&
    gates.humanReviewReferenced &&
    gates.humanReviewApproved &&
    gates.adverseActionApproved &&
    gates.reasonCodesPresent &&
    gates.explanationPresent &&
    gates.disclosureApproved &&
    gates.appealRightsIncluded;
  const finalNoticeAllowed =
    adverseActionRequired &&
    finalActionAllowed &&
    gates.adverseActionReferenced;
  const borrowerDisclosureAllowed = adverseActionRequired
    ? finalNoticeAllowed
    : finalActionAllowed && gates.disclosureApproved;
  const now = new Date();
  const rows = await db
    .insert(regulatedDecisionNotices)
    .values({
      applicationId,
      borrowerId: normalizeText(input.borrowerId) ?? application.borrowerId,
      tenantId: normalizeText(input.tenantId) ?? application.tenantId,
      actorId: normalizeText(input.actorId),
      humanReviewWorkflowId: normalizeText(input.humanReviewWorkflowId),
      adverseActionReviewId: normalizeText(input.adverseActionReviewId),
      decisionType,
      requestedOutcome,
      finalDecisionStatus: finalDecisionStatus({
        finalActionRequested,
        finalActionAllowed,
      }),
      noticeStatus: noticeStatus({
        adverseActionRequired,
        finalNoticeAllowed,
      }),
      disclosureStatus,
      appealStatus: gates.appealRightsIncluded
        ? "APPEAL_RIGHTS_INCLUDED"
        : "APPEAL_RIGHTS_PENDING",
      reasonCodes,
      explanationSummary,
      noticeSummary: normalizeText(input.noticeSummary),
      finalActionRequested,
      finalActionAllowed,
      finalNoticeAllowed,
      borrowerDisclosureAllowed,
      humanReviewRequired: !gates.humanReviewApproved,
      adverseActionRequired,
      appealRightsIncluded: input.appealRightsIncluded === true,
      effectiveAt: finalActionAllowed ? now : null,
      issuedAt: finalNoticeAllowed ? now : null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: DECISION_NOTICE_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        gates,
        decisionNoticeRuntimeVersion:
          "regulated-decision-notice-runtime-v0.1.0",
        notFinalWhenBlocked: !finalActionAllowed,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    application,
    humanReview,
    adverseActionReview,
    decisionNotice: rows[0],
    gates,
    finalActionAllowed,
    finalNoticeAllowed,
  };
}
