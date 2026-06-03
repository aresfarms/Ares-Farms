import {
  DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
  evaluateDeploymentEnvironmentReadinessGate,
} from "@/lib/governance/deploymentEnvironmentReadinessGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Release Candidate Freeze Plan
 *
 * Master Volume Governance:
 * - Vol 0: treats release-candidate freeze as one platform-level production
 *   readiness posture, not as separate module-level approval.
 * - Vol I: keeps release freeze subordinate to constitutional authority,
 *   accountable release ownership, and qualified human approval.
 * - Vol II: prevents freeze review from becoming production approval, legal
 *   advice, official reports, borrower notice sends, payment capture, public
 *   verification, partner commitments, agency commitments, or official
 *   reliance.
 * - Vol III: assembles deterministic, replay-safe proof across build,
 *   typecheck, smoke, deployment environment, secrets, migrations, edge,
 *   observability, backup, rollback, incident, support, and final signoff.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without deploying, activating secrets, or changing infrastructure.
 * - Vol IV: supports release manager review, change freeze, deployment hold,
 *   rollback planning, support routing, communication freeze, and incident
 *   bridge preparation.
 * - Vol V: preserves claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable vertical
 *   surfaces, and production exposure blocked until controlled promotion is
 *   complete.
 */

export const RELEASE_CANDIDATE_FREEZE_PLAN_VERSION =
  "release-candidate-freeze-plan-v0.1.0";

export type ReleaseCandidateFreezeStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ReleaseCandidateFreezeItem = {
  id: string;
  label: string;
  status: ReleaseCandidateFreezeStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ReleaseCandidateFreezePlan = {
  planId: string;
  planStatus: "RELEASE_CANDIDATE_FREEZE_BLOCKED";
  productionBlocked: true;
  releaseCandidateFreezeApproved: false;
  releaseCandidateFrozen: false;
  releaseCandidateApproved: false;
  deploymentExecuted: false;
  environmentPromotionAllowed: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  cdnWafTlsEnabled: false;
  databaseMigrationAllowed: false;
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  qualifiedReleaseManagerRequired: true;
  finalDeploymentHoldRequired: true;
  finalGoLiveHoldRequired: true;
  deploymentEnvironmentReadinessVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  deploymentEnvironmentReviewCount: number;
  freezeItems: ReleaseCandidateFreezeItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ReleaseCandidateFreezeSummary = {
  totalPlans: number;
  totalFreezeItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  releaseCandidateFreezeApproved: number;
  releaseCandidateFrozen: number;
  releaseCandidateApproved: number;
  deploymentExecuted: number;
  environmentPromotionAllowed: number;
  productionSecretsActivated: number;
  publicDnsCutoverAllowed: number;
  cdnWafTlsEnabled: number;
  databaseMigrationAllowed: number;
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
  finalDeploymentHoldRequired: number;
  finalGoLiveHoldRequired: number;
};

export type ReleaseCandidateFreezePlanInput = {
  releaseScope?: string | null;
};

export type ReleaseCandidateFreezePlanResult = {
  version: string;
  deploymentEnvironmentReadinessVersion: string;
  releaseCandidateFreezePlans: ReleaseCandidateFreezePlan[];
  summary: ReleaseCandidateFreezeSummary;
  disclosures: string[];
  freezePosture: "RELEASE_CANDIDATE_FREEZE_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ReleaseCandidateFreezeStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ReleaseCandidateFreezeItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function deploymentBlocksPreserved(): boolean {
  const deploymentReadiness = evaluateDeploymentEnvironmentReadinessGate();

  return (
    deploymentReadiness.summary.releaseCandidateApproved === 0 &&
    deploymentReadiness.summary.deploymentExecuted === 0 &&
    deploymentReadiness.summary.environmentPromotionAllowed === 0 &&
    deploymentReadiness.summary.productionSecretsActivated === 0 &&
    deploymentReadiness.summary.publicDnsCutoverAllowed === 0 &&
    deploymentReadiness.summary.cdnWafTlsEnabled === 0 &&
    deploymentReadiness.summary.databaseMigrationAllowed === 0 &&
    deploymentReadiness.summary.liveExternalActionsAllowed === 0 &&
    deploymentReadiness.summary.liveExternalActionsPerformed === 0 &&
    deploymentReadiness.summary.paymentCaptureAllowed === 0 &&
    deploymentReadiness.summary.borrowerNoticeSendsAllowed === 0 &&
    deploymentReadiness.summary.officialReportsAllowed === 0 &&
    deploymentReadiness.summary.publicVerificationAllowed === 0 &&
    deploymentReadiness.summary.legalAdviceProvided === 0 &&
    deploymentReadiness.summary.officialRelianceAllowed === 0
  );
}

function buildFreezeItems(): ReleaseCandidateFreezeItem[] {
  const deploymentReadiness = evaluateDeploymentEnvironmentReadinessGate();
  const deploymentReadinessAttached =
    deploymentReadiness.deploymentEnvironmentReviews.length > 0 &&
    deploymentBlocksPreserved();

  return [
    item(
      "master-volume-freeze-controls-attached",
      "Master Volume release freeze controls attached",
      "PASS",
      "Master Volume Series / release-candidate freeze controls",
      "governance",
      null
    ),
    item(
      "deployment-environment-readiness-attached",
      "Deployment environment readiness attached",
      deploymentReadinessAttached ? "PASS" : "BLOCKED",
      `${DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION}:${deploymentReadiness.deploymentPosture}`,
      "governance",
      deploymentReadinessAttached
        ? null
        : "Release-candidate freeze requires blocked deployment environment readiness with zero production action authority."
    ),
    item(
      "module-and-surface-inventory-attached",
      "Module and portable surface inventory attached",
      "PASS",
      `${moduleManifests.length} module manifests / ${allPortableVerticalSurfaces.length} portable surfaces`,
      "platform",
      null
    ),
    item(
      "final-build-artifact-freeze",
      "Final build artifact freeze",
      "REVIEW_REQUIRED",
      "npm run build",
      "platform",
      "The final release candidate build artifact must be rerun, recorded, and frozen by a qualified release owner."
    ),
    item(
      "final-typecheck-freeze",
      "Final TypeScript freeze",
      "REVIEW_REQUIRED",
      "npx tsc --noEmit",
      "platform",
      "The final TypeScript check must be rerun and attached to the release-candidate freeze record."
    ),
    item(
      "final-backend-smoke-freeze",
      "Final backend smoke freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:backend",
      "platform",
      "The full backend smoke suite must be rerun from the final release candidate before any freeze approval."
    ),
    item(
      "final-integration-smoke-freeze",
      "Final integration smoke freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:integration",
      "platform",
      "Cross-module integration smoke evidence must be rerun from the final release candidate before any freeze approval."
    ),
    item(
      "content-claims-and-public-copy-freeze",
      "Content claims and public-copy freeze",
      "REVIEW_REQUIRED",
      "npm run smoke:content-claims",
      "governance",
      "Customer-facing copy, public claims, lender-ready language, AI advisory-only language, and public verification language must be frozen and re-reviewed."
    ),
    item(
      "release-notes-change-log-freeze",
      "Release notes and changelog freeze",
      "REVIEW_REQUIRED",
      "release notes and operator changelog review",
      "operations",
      "Release notes, operator changes, known limitations, and rollback notes must be reviewed before any release-candidate freeze approval."
    ),
    item(
      "privacy-retention-redaction-freeze",
      "Privacy, retention, and redaction freeze",
      "REVIEW_REQUIRED",
      "classification, retention, redaction, and data-rights review",
      "governance",
      "Record access, retention, redaction, borrower data rights, and controlled disclosure posture must be frozen before any release-candidate freeze approval."
    ),
    item(
      "production-env-secret-manifest-lock",
      "Production environment variable and secret manifest lock",
      "BLOCKED",
      "production secret manifest",
      "security",
      "Production secrets, API keys, webhook secrets, database credentials, and vault references have not been approved or activated. Secret values are not collected by this plan."
    ),
    item(
      "production-database-migration-batch-lock",
      "Production database migration batch lock",
      "BLOCKED",
      "production database migration batch",
      "platform",
      "Production migration ordering, backup window, restore evidence, and rollback plan have not been approved."
    ),
    item(
      "dns-cdn-tls-waf-change-set-lock",
      "DNS, CDN, TLS, and WAF change-set lock",
      "BLOCKED",
      "edge infrastructure change set",
      "security",
      "DNS cutover, CDN cache policy, TLS certificate, WAF policy, and rate-limit posture have not been approved."
    ),
    item(
      "monitoring-alerting-oncall-lock",
      "Monitoring, alerting, and on-call lock",
      "BLOCKED",
      "monitoring alerting on-call launch roster",
      "operations",
      "Production uptime checks, metrics, alert routing, on-call owner, and escalation rules have not been approved."
    ),
    item(
      "backup-restore-dr-lock",
      "Backup, restore, and disaster recovery lock",
      "BLOCKED",
      "backup restore disaster recovery evidence",
      "operations",
      "Backup verification, restore test, disaster recovery owner, and retention evidence have not been approved."
    ),
    item(
      "rollback-emergency-hold-lock",
      "Rollback and emergency hold lock",
      "BLOCKED",
      "rollback emergency hold runbook",
      "operations",
      "Rollback triggers, emergency hold authority, kill-switch owner, and rollback execution plan have not been approved."
    ),
    item(
      "incident-support-comms-lock",
      "Incident, support, and communications lock",
      "BLOCKED",
      "incident bridge support roster and communications freeze",
      "operations",
      "Incident bridge, operator support roster, customer support routing, and communication freeze have not been approved."
    ),
    item(
      "final-qualified-release-manager-signoff",
      "Final qualified release manager signoff",
      "BLOCKED",
      "release-candidate freeze hold",
      "governance",
      "A qualified release manager has not approved the release-candidate freeze or released the deployment hold."
    ),
    item(
      "live-actions-payment-notice-report-freeze-preserved",
      "Live actions, payments, notices, reports, public verification, and official reliance remain frozen",
      deploymentBlocksPreserved() ? "PASS" : "BLOCKED",
      "deployment environment readiness review",
      "governance",
      deploymentBlocksPreserved()
        ? null
        : "Live actions, payment capture, notice sends, official reports, public verification, legal advice, and official reliance must remain frozen."
    ),
  ];
}

export function evaluateReleaseCandidateFreezePlan(
  input: ReleaseCandidateFreezePlanInput = {}
): ReleaseCandidateFreezePlanResult {
  const deploymentReadiness = evaluateDeploymentEnvironmentReadinessGate();
  const freezeItems = buildFreezeItems();
  const blockingReasons = freezeItems
    .filter((freezeItem) => freezeItem.status !== "PASS")
    .map((freezeItem) => freezeItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No release candidate has been frozen or approved.",
    "No deployment has been executed.",
    "No production secret has been activated.",
    "No public DNS cutover has been approved.",
    "No production database migration has been approved.",
    "No production portal launch has been executed.",
    "No public verification authority has been granted.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "This plan is release-candidate freeze review evidence only.",
  ];
  const plan: ReleaseCandidateFreezePlan = {
    planId: `release-candidate-freeze:${input.releaseScope ?? "platform"}`,
    planStatus: "RELEASE_CANDIDATE_FREEZE_BLOCKED",
    productionBlocked: true,
    releaseCandidateFreezeApproved: false,
    releaseCandidateFrozen: false,
    releaseCandidateApproved: false,
    deploymentExecuted: false,
    environmentPromotionAllowed: false,
    productionSecretsActivated: false,
    publicDnsCutoverAllowed: false,
    cdnWafTlsEnabled: false,
    databaseMigrationAllowed: false,
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    qualifiedReleaseManagerRequired: true,
    finalDeploymentHoldRequired: true,
    finalGoLiveHoldRequired: true,
    deploymentEnvironmentReadinessVersion:
      DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    deploymentEnvironmentReviewCount:
      deploymentReadiness.deploymentEnvironmentReviews.length,
    freezeItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: RELEASE_CANDIDATE_FREEZE_PLAN_VERSION,
    deploymentEnvironmentReadinessVersion:
      DEPLOYMENT_ENVIRONMENT_READINESS_GATE_VERSION,
    releaseCandidateFreezePlans: [plan],
    summary: {
      totalPlans: 1,
      totalFreezeItems: freezeItems.length,
      pass: freezeItems.filter((freezeItem) => freezeItem.status === "PASS")
        .length,
      reviewRequired: freezeItems.filter(
        (freezeItem) => freezeItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: freezeItems.filter((freezeItem) => freezeItem.status === "BLOCKED")
        .length,
      releaseCandidateFreezeApproved: 0,
      releaseCandidateFrozen: 0,
      releaseCandidateApproved: 0,
      deploymentExecuted: 0,
      environmentPromotionAllowed: 0,
      productionSecretsActivated: 0,
      publicDnsCutoverAllowed: 0,
      cdnWafTlsEnabled: 0,
      databaseMigrationAllowed: 0,
      liveExternalActionsAllowed: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
      finalDeploymentHoldRequired: 1,
      finalGoLiveHoldRequired: 1,
    },
    disclosures,
    freezePosture:
      "RELEASE_CANDIDATE_FREEZE_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
