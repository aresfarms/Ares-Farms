import {
  SOURCE_STACK_PRODUCTION_RESTRICTIONS,
  SOURCE_STACK_REQUIRED_DISCLOSURES,
  SOURCE_STACK_VERSION,
} from "@/lib/platform/authorities/source";
import {
  SOURCE_PRODUCTION_READINESS_GATE_VERSION,
  evaluateSourceProductionReadinessGate,
} from "@/lib/governance/sourceProductionReadinessGate";
import type { SourceProductionReadinessReview } from "@/lib/governance/sourceProductionReadinessGate";

/**
 * Controlled Promotion Activation Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps production activation subordinate to constitutional
 *   authority, accountable approval, and controlled promotion.
 * - Vol II: prevents activation review from creating legal advice, official
 *   source reliance, underwriting truth, borrower disclosure, public
 *   verification, lender commitment, or agency commitment.
 * - Vol III: assembles deterministic activation-ceremony checks for source
 *   production readiness, change records, approver quorum, environment lock,
 *   credentials, adapter release, schema contracts, replay, provenance,
 *   monitoring, rollback, incident response, audit export, and kill switch
 *   controls without executing live activation.
 * - Vol III-B: exposes runtime, classification, version, observability, and
 *   replay posture for activation review evidence.
 * - Vol IV: supports promotion hold, activation ceremony review, rollback,
 *   emergency stop, degraded-source routing, and operator handoff.
 * - Vol V: preserves source authority, claims governance, DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds canonical source intelligence to controlled promotion review
 *   while live fetch and production activation remain blocked.
 */

export const CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION =
  "controlled-promotion-activation-gate-v0.1.0";

export const CONTROLLED_PROMOTION_ACTIVATION_REQUIRED_CONTROLS = [
  "source production readiness review attached",
  "source production readiness complete",
  "controlled promotion change record approved",
  "qualified approver quorum recorded",
  "activation ceremony window approved",
  "production environment lock confirmed",
  "production credential vault release approved",
  "live adapter release approved",
  "schema contract and DTO boundary release approved",
  "replay certification release approved",
  "provenance envelope release approved",
  "monitoring, alert, and freshness watch approved",
  "rollback runbook and emergency hold approved",
  "incident response bridge approved",
  "audit export and evidence retention approved",
  "claims and public copy freeze approved",
  "kill switch owner confirmed",
  "post-activation verification plan approved",
  "final no-live-action hold confirmed",
] as const;

export type ControlledPromotionActivationCheckStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ControlledPromotionActivationCheck = {
  id: string;
  label: string;
  status: ControlledPromotionActivationCheckStatus;
  evidenceRef: string | null;
  blockingReason: string | null;
};

export type ControlledPromotionActivationReview = {
  activationReviewId: string;
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  sourceAuthorityTier: string;
  jurisdictionScope: string[];
  activationReviewStatus: "CONTROLLED_PROMOTION_ACTIVATION_BLOCKED";
  readinessStatus: "PRODUCTION_PROMOTION_BLOCKED";
  productionBlocked: true;
  activationCeremonyApproved: false;
  activationExecuted: false;
  promotionAllowed: false;
  liveFetchAllowed: false;
  liveFetchPerformed: false;
  externalActionPerformed: false;
  legalAdviceProvided: false;
  publicVerificationAllowed: false;
  officialRelianceAllowed: false;
  controlledPromotionRequired: true;
  humanApprovalRequired: true;
  replayRequired: true;
  requiredControls: string[];
  checks: ControlledPromotionActivationCheck[];
  blockingReasons: string[];
};

export type ControlledPromotionActivationSummary = {
  totalReviews: number;
  productionBlocked: number;
  activationReady: number;
  activationExecuted: number;
  promotionAllowed: number;
  liveFetchEnabled: number;
  externalActionsPerformed: number;
  legalAdviceProvided: number;
  publicVerificationAllowed: number;
  controlledPromotionRequired: number;
  humanApprovalRequired: number;
  requiredControls: string[];
  productionRestrictions: string[];
};

export type ControlledPromotionActivationGateInput = {
  sourceId?: string | null;
};

export type ControlledPromotionActivationGateResult = {
  version: string;
  sourceStackVersion: string;
  sourceProductionReadinessVersion: string;
  summary: ControlledPromotionActivationSummary;
  controlledPromotionActivationReviews: ControlledPromotionActivationReview[];
  disclosures: string[];
  activationPosture: "ALL_CONTROLLED_PROMOTION_ACTIVATION_BLOCKED_PENDING_FINAL_APPROVAL";
};

function check(
  id: string,
  label: string,
  status: ControlledPromotionActivationCheckStatus,
  evidenceRef: string | null,
  blockingReason: string | null
): ControlledPromotionActivationCheck {
  return {
    id,
    label,
    status,
    evidenceRef,
    blockingReason,
  };
}

function readinessEvidence(
  review: SourceProductionReadinessReview,
  checkId: string
): string | null {
  return (
    review.checks.find((candidate) => candidate.id === checkId)?.evidenceRef ??
    null
  );
}

function activationReviewForReadiness(
  review: SourceProductionReadinessReview
): ControlledPromotionActivationReview {
  const checks: ControlledPromotionActivationCheck[] = [
    check(
      "source-production-readiness-attached",
      "Source production readiness review attached",
      "PASS",
      review.readinessId,
      null
    ),
    check(
      "source-production-readiness-complete",
      "Source production readiness complete",
      "BLOCKED",
      review.readinessStatus,
      "Source production readiness remains blocked and cannot authorize activation ceremony execution."
    ),
    check(
      "controlled-promotion-change-record-approved",
      "Controlled promotion change record approved",
      "BLOCKED",
      readinessEvidence(review, "controlled-promotion-change-record"),
      "Controlled promotion change record approval is not recorded."
    ),
    check(
      "qualified-approver-quorum",
      "Qualified approver quorum recorded",
      "BLOCKED",
      readinessEvidence(review, "qualified-human-promotion-approval"),
      "Qualified approver quorum and accountable authority are not recorded."
    ),
    check(
      "activation-ceremony-window",
      "Activation ceremony window approved",
      "BLOCKED",
      readinessEvidence(review, "activation-ceremony-checklist"),
      "Activation ceremony window, operator roster, and approval checklist are not approved."
    ),
    check(
      "production-environment-lock",
      "Production environment lock confirmed",
      "BLOCKED",
      null,
      "Production environment lock, deployment freeze, and change window are not confirmed."
    ),
    check(
      "production-credential-release",
      "Production credential vault release approved",
      "BLOCKED",
      readinessEvidence(review, "production-credential-vault-approved"),
      "Production credential release approval is not recorded."
    ),
    check(
      "live-adapter-release",
      "Live adapter release approved",
      "BLOCKED",
      readinessEvidence(review, "certified-live-adapter-approved"),
      "Live adapter release approval is not recorded."
    ),
    check(
      "schema-dto-release",
      "Schema contract and DTO boundary release approved",
      "BLOCKED",
      readinessEvidence(review, "schema-contract-public-dto-approved"),
      "Schema contract, public DTO boundary, and redaction release approval are not recorded."
    ),
    check(
      "replay-release-approved",
      "Replay certification release approved",
      "REVIEW_REQUIRED",
      readinessEvidence(review, "replay-certification-approved"),
      "Replay evidence exists only as review posture; production release approval is not recorded."
    ),
    check(
      "provenance-release-approved",
      "Provenance envelope release approved",
      "REVIEW_REQUIRED",
      readinessEvidence(review, "provenance-envelope-approved"),
      "Provenance evidence exists only as review posture; production release approval is not recorded."
    ),
    check(
      "monitoring-alert-freshness-watch",
      "Monitoring, alert, and freshness watch approved",
      "BLOCKED",
      readinessEvidence(review, "observability-freshness-monitoring-approved"),
      "Monitoring, alerting, freshness watch, stale-source handling, and owner coverage are not approved."
    ),
    check(
      "rollback-emergency-hold",
      "Rollback runbook and emergency hold approved",
      "BLOCKED",
      readinessEvidence(review, "rollback-incident-runbook-approved"),
      "Rollback runbook, emergency hold, and source-disable procedure are not approved."
    ),
    check(
      "incident-response-bridge",
      "Incident response bridge approved",
      "BLOCKED",
      readinessEvidence(review, "rollback-incident-runbook-approved"),
      "Incident bridge, escalation owner, and severity routing are not approved."
    ),
    check(
      "audit-export-retention",
      "Audit export and evidence retention approved",
      "BLOCKED",
      readinessEvidence(review, "audit-export-retention-approved"),
      "Audit export and evidence retention approval are not recorded."
    ),
    check(
      "claims-public-copy-freeze",
      "Claims and public copy freeze approved",
      "BLOCKED",
      readinessEvidence(review, "claims-public-copy-approved"),
      "Public claims, source certainty language, and customer-facing copy freeze are not approved."
    ),
    check(
      "kill-switch-owner",
      "Kill switch owner confirmed",
      "BLOCKED",
      readinessEvidence(review, "production-kill-switch-hold-authority"),
      "Kill switch owner, deputy owner, and emergency disablement authority are not confirmed."
    ),
    check(
      "post-activation-verification-plan",
      "Post-activation verification plan approved",
      "BLOCKED",
      null,
      "Post-activation replay, monitoring, audit, freshness, and rollback verification plan is not approved."
    ),
    check(
      "final-no-live-action-hold",
      "Final no-live-action hold confirmed",
      review.liveFetchAllowed === false &&
      review.externalActionPerformed === false &&
      review.publicVerificationAllowed === false
        ? "PASS"
        : "BLOCKED",
      "liveFetch:false externalAction:false publicVerification:false",
      review.liveFetchAllowed === false &&
      review.externalActionPerformed === false &&
      review.publicVerificationAllowed === false
        ? null
        : "Live action or public verification was enabled before controlled promotion approval."
    ),
    check(
      "no-legal-advice",
      "No legal advice provided",
      review.legalAdviceProvided === false ? "PASS" : "BLOCKED",
      `legalAdviceProvided:${String(review.legalAdviceProvided)}`,
      review.legalAdviceProvided === false
        ? null
        : "Legal advice was provided by the runtime."
    ),
  ];
  const blockingReasons = checks
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.blockingReason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    activationReviewId: `controlled-promotion-activation:${review.sourceId}`,
    sourceId: review.sourceId,
    sourceName: review.sourceName,
    sourceCategory: review.sourceCategory,
    sourceAuthorityTier: review.sourceAuthorityTier,
    jurisdictionScope: [...review.jurisdictionScope],
    activationReviewStatus: "CONTROLLED_PROMOTION_ACTIVATION_BLOCKED",
    readinessStatus: review.readinessStatus,
    productionBlocked: true,
    activationCeremonyApproved: false,
    activationExecuted: false,
    promotionAllowed: false,
    liveFetchAllowed: false,
    liveFetchPerformed: false,
    externalActionPerformed: false,
    legalAdviceProvided: false,
    publicVerificationAllowed: false,
    officialRelianceAllowed: false,
    controlledPromotionRequired: true,
    humanApprovalRequired: true,
    replayRequired: true,
    requiredControls: [...CONTROLLED_PROMOTION_ACTIVATION_REQUIRED_CONTROLS],
    checks,
    blockingReasons,
  };
}

export function evaluateControlledPromotionActivationGate(
  input: ControlledPromotionActivationGateInput = {}
): ControlledPromotionActivationGateResult {
  const readinessGate = evaluateSourceProductionReadinessGate({
    sourceId: input.sourceId,
  });
  const controlledPromotionActivationReviews =
    readinessGate.sourceProductionReadinessReviews.map(
      activationReviewForReadiness
    );

  return {
    version: CONTROLLED_PROMOTION_ACTIVATION_GATE_VERSION,
    sourceStackVersion: SOURCE_STACK_VERSION,
    sourceProductionReadinessVersion: SOURCE_PRODUCTION_READINESS_GATE_VERSION,
    summary: {
      totalReviews: controlledPromotionActivationReviews.length,
      productionBlocked: controlledPromotionActivationReviews.length,
      activationReady: 0,
      activationExecuted: controlledPromotionActivationReviews.filter(
        (review) => review.activationExecuted
      ).length,
      promotionAllowed: controlledPromotionActivationReviews.filter(
        (review) => review.promotionAllowed
      ).length,
      liveFetchEnabled: controlledPromotionActivationReviews.filter(
        (review) => review.liveFetchAllowed
      ).length,
      externalActionsPerformed: controlledPromotionActivationReviews.filter(
        (review) => review.externalActionPerformed
      ).length,
      legalAdviceProvided: controlledPromotionActivationReviews.filter(
        (review) => review.legalAdviceProvided
      ).length,
      publicVerificationAllowed: controlledPromotionActivationReviews.filter(
        (review) => review.publicVerificationAllowed
      ).length,
      controlledPromotionRequired: controlledPromotionActivationReviews.length,
      humanApprovalRequired: controlledPromotionActivationReviews.length,
      requiredControls: [...CONTROLLED_PROMOTION_ACTIVATION_REQUIRED_CONTROLS],
      productionRestrictions: [...SOURCE_STACK_PRODUCTION_RESTRICTIONS],
    },
    controlledPromotionActivationReviews,
    disclosures: [
      ...SOURCE_STACK_REQUIRED_DISCLOSURES,
      "No legal advice has been provided.",
      "No live external source has been contacted.",
      "No public verification authority has been granted.",
      "No source has been promoted to production.",
      "No activation ceremony has been executed.",
    ],
    activationPosture:
      "ALL_CONTROLLED_PROMOTION_ACTIVATION_BLOCKED_PENDING_FINAL_APPROVAL",
  };
}
