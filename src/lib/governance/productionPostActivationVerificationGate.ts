import {
  PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
  evaluateProductionActivationCeremonyGate,
} from "@/lib/governance/productionActivationCeremonyGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Post-Activation Verification Gate
 *
 * Master Volume Governance:
 * - Vol 0: keeps post-activation verification as a governed platform surface
 *   after activation ceremony evidence and before production reliance.
 * - Vol I: keeps verification authority subordinate to constitutional
 *   governance, qualified human ownership, dual control, and recorded review.
 * - Vol II: prevents verification evidence from becoming legal advice,
 *   official reports, notices, payment capture, public verification,
 *   commitments, production reliance, or official reliance.
 * - Vol III: assembles replay-safe verification evidence across health checks,
 *   public surfaces, audit, replay, monitoring, rollback, support, incident,
 *   communications, privacy, redaction, claims, and data rights.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without starting or completing post-activation verification.
 * - Vol IV: supports verification runbook review, watch-window ownership,
 *   rollback readiness, incident readiness, support readiness, and evidence
 *   preservation.
 * - Vol V: preserves content claims, controlled disclosure, replayability,
 *   explainability, portability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   public production exposure blocked until separately approved.
 */

export const PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION =
  "production-post-activation-verification-gate-v0.1.0";

export type ProductionPostActivationVerificationStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionPostActivationVerificationItem = {
  id: string;
  label: string;
  status: ProductionPostActivationVerificationStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionPostActivationVerificationReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_POST_ACTIVATION_VERIFICATION_BLOCKED";
  productionBlocked: true;
  postActivationVerificationApprovalGranted: false;
  postActivationVerificationStarted: false;
  postActivationVerificationCompleted: false;
  postActivationVerificationPassed: false;
  productionHealthCertified: false;
  activationCeremonyApprovalGranted: false;
  activationCeremonyExecuted: false;
  productionActivationExecuted: false;
  finalAuthorityApprovalGranted: false;
  goLiveApproved: false;
  productionLaunchAuthorized: false;
  launchHoldReleased: false;
  deploymentHoldReleased: false;
  freezeHoldReleased: false;
  deploymentExecuted: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  databaseMigrationAllowed: false;
  publicProductionApiExposureAllowed: false;
  productionPortalLaunchExecuted: false;
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  customerCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  rollbackAuthorized: false;
  emergencyRollbackExecuted: false;
  emergencyHoldReleased: false;
  killSwitchActivated: false;
  activationCeremonyVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  activationCeremonyReviewCount: number;
  verificationItems: ProductionPostActivationVerificationItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionPostActivationVerificationSummary = {
  totalReviews: number;
  totalVerificationItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  postActivationVerificationApprovalGranted: number;
  postActivationVerificationStarted: number;
  postActivationVerificationCompleted: number;
  postActivationVerificationPassed: number;
  productionHealthCertified: number;
  activationCeremonyApprovalGranted: number;
  activationCeremonyExecuted: number;
  productionActivationExecuted: number;
  finalAuthorityApprovalGranted: number;
  goLiveApproved: number;
  productionLaunchAuthorized: number;
  launchHoldReleased: number;
  deploymentHoldReleased: number;
  freezeHoldReleased: number;
  deploymentExecuted: number;
  productionSecretsActivated: number;
  publicDnsCutoverAllowed: number;
  databaseMigrationAllowed: number;
  publicProductionApiExposureAllowed: number;
  productionPortalLaunchExecuted: number;
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
  customerCommunicationsReleased: number;
  publicStatusPageEnabled: number;
  rollbackAuthorized: number;
  emergencyRollbackExecuted: number;
  emergencyHoldReleased: number;
  killSwitchActivated: number;
};

export type ProductionPostActivationVerificationInput = {
  verificationScope?: string | null;
};

export type ProductionPostActivationVerificationResult = {
  version: string;
  activationCeremonyVersion: string;
  productionPostActivationVerificationReviews: ProductionPostActivationVerificationReview[];
  summary: ProductionPostActivationVerificationSummary;
  disclosures: string[];
  verificationPosture: "POST_ACTIVATION_VERIFICATION_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionPostActivationVerificationStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionPostActivationVerificationItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function activationCeremonyBlocksPreserved(
  activationCeremony: ReturnType<typeof evaluateProductionActivationCeremonyGate>
): boolean {
  return (
    activationCeremony.summary.activationCeremonyApprovalGranted === 0 &&
    activationCeremony.summary.activationCeremonyExecuted === 0 &&
    activationCeremony.summary.productionActivationExecuted === 0 &&
    activationCeremony.summary.postActivationVerificationStarted === 0 &&
    activationCeremony.summary.postActivationVerificationCompleted === 0 &&
    activationCeremony.summary.finalAuthorityApprovalGranted === 0 &&
    activationCeremony.summary.goLiveApproved === 0 &&
    activationCeremony.summary.productionLaunchAuthorized === 0 &&
    activationCeremony.summary.launchHoldReleased === 0 &&
    activationCeremony.summary.deploymentHoldReleased === 0 &&
    activationCeremony.summary.freezeHoldReleased === 0 &&
    activationCeremony.summary.deploymentExecuted === 0 &&
    activationCeremony.summary.productionSecretsActivated === 0 &&
    activationCeremony.summary.publicDnsCutoverAllowed === 0 &&
    activationCeremony.summary.databaseMigrationAllowed === 0 &&
    activationCeremony.summary.publicProductionApiExposureAllowed === 0 &&
    activationCeremony.summary.productionPortalLaunchExecuted === 0 &&
    activationCeremony.summary.liveExternalActionsAllowed === 0 &&
    activationCeremony.summary.liveExternalActionsPerformed === 0 &&
    activationCeremony.summary.paymentCaptureAllowed === 0 &&
    activationCeremony.summary.borrowerNoticeSendsAllowed === 0 &&
    activationCeremony.summary.officialReportsAllowed === 0 &&
    activationCeremony.summary.publicVerificationAllowed === 0 &&
    activationCeremony.summary.legalAdviceProvided === 0 &&
    activationCeremony.summary.officialRelianceAllowed === 0
  );
}

function buildVerificationItems(
  activationCeremony: ReturnType<typeof evaluateProductionActivationCeremonyGate>
): ProductionPostActivationVerificationItem[] {
  const activationCeremonyPreserved =
    activationCeremonyBlocksPreserved(activationCeremony);
  const activationCeremonyAttached =
    activationCeremony.productionActivationCeremonyReviews.length > 0 &&
    activationCeremonyPreserved;

  return [
    item(
      "master-volume-post-activation-controls-attached",
      "Master Volume post-activation verification controls attached",
      "PASS",
      "Master Volume Series / post-activation verification, monitoring, rollback, support, audit, replay, public exposure, and live-action controls",
      "governance",
      null
    ),
    item(
      "production-activation-ceremony-evidence-attached",
      "Production activation ceremony evidence attached",
      activationCeremonyAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION}:${activationCeremony.ceremonyPosture}`,
      "governance",
      activationCeremonyAttached
        ? null
        : "Post-activation verification review requires blocked activation ceremony evidence with zero production activation."
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
      "verification-runbook-review",
      "Post-activation verification runbook review",
      "REVIEW_REQUIRED",
      "verification runbook watch window owners stop-action packet and pass-fail criteria",
      "operations",
      "Verification runbook, owners, watch window, pass/fail criteria, and stop-action authority must be reviewed before any separate verification start."
    ),
    item(
      "synthetic-health-check-review",
      "Synthetic health check review",
      "REVIEW_REQUIRED",
      "synthetic checks uptime latency error budget API route and portal route packet",
      "platform",
      "Synthetic checks, uptime, latency, route health, error budgets, and public surface checks must be reviewed without certifying production health."
    ),
    item(
      "audit-replay-export-review",
      "Audit and replay export verification review",
      "REVIEW_REQUIRED",
      "audit export replay verification observability retention and evidence packet",
      "governance",
      "Audit export, replay verification, observability, retention, and evidence preservation must be reviewed."
    ),
    item(
      "rollback-kill-switch-watch-review",
      "Rollback, emergency hold, and kill-switch watch review",
      "REVIEW_REQUIRED",
      "rollback emergency hold kill-switch watch escalation and recovery packet",
      "operations",
      "Rollback, emergency hold, kill-switch watch, escalation, and recovery controls must be reviewed."
    ),
    item(
      "support-communications-watch-review",
      "Support and communications watch review",
      "REVIEW_REQUIRED",
      "support queue public status customer-safe communications and issue triage packet",
      "support",
      "Support queue routing, public status posture, customer-safe communications, and issue triage must be reviewed before any separate release."
    ),
    item(
      "privacy-redaction-data-rights-review",
      "Privacy, redaction, and data-rights verification review",
      "REVIEW_REQUIRED",
      "privacy redaction data rights access log and public DTO verification packet",
      "governance",
      "Privacy, redaction, data rights, record access, and public DTO boundaries must be reviewed."
    ),
    item(
      "source-and-live-action-boundary-review",
      "Source and live-action boundary review",
      "REVIEW_REQUIRED",
      "source intelligence live adapter payment notice report public verification and legal reliance boundary packet",
      "governance",
      "Source intelligence, live adapters, payment, notices, official reports, public verification, legal advice, and official reliance boundaries must remain blocked."
    ),
    item(
      "post-activation-verification-approval",
      "Post-activation verification approval",
      "BLOCKED",
      "post-activation verification approval record",
      "release",
      "Post-activation verification approval has not been granted."
    ),
    item(
      "post-activation-verification-start",
      "Post-activation verification start",
      "BLOCKED",
      "post-activation verification start record",
      "operations",
      "Post-activation verification has not been approved or started."
    ),
    item(
      "post-activation-verification-completion",
      "Post-activation verification completion",
      "BLOCKED",
      "post-activation verification completion record",
      "operations",
      "Post-activation verification has not been completed or passed."
    ),
    item(
      "production-health-certification",
      "Production health certification",
      "BLOCKED",
      "production health certification record",
      "platform",
      "Production health has not been certified."
    ),
    item(
      "regulated-live-actions",
      "Regulated live actions remain disabled",
      "BLOCKED",
      "payment notice official report public verification live external action legal advice and official reliance records",
      "governance",
      "Payment capture, borrower notice sends, official reports, public verification, live external actions, legal advice, and official reliance remain blocked."
    ),
  ];
}

export function evaluateProductionPostActivationVerificationGate(
  input: ProductionPostActivationVerificationInput = {}
): ProductionPostActivationVerificationResult {
  const activationCeremony = evaluateProductionActivationCeremonyGate();
  const verificationItems = buildVerificationItems(activationCeremony);
  const blockingReasons = verificationItems
    .filter((verificationItem) => verificationItem.status !== "PASS")
    .map((verificationItem) => verificationItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No post-activation verification approval has been granted.",
    "No post-activation verification has been started.",
    "No post-activation verification has been completed.",
    "No post-activation verification has passed.",
    "No production health has been certified.",
    "No activation ceremony approval has been granted.",
    "No activation ceremony has been executed.",
    "No production activation has been executed.",
    "No final production authority approval has been granted.",
    "No go-live approval has been granted.",
    "No production launch authorization has been granted.",
    "No launch hold has been released.",
    "No deployment hold has been released.",
    "No release-candidate freeze hold has been released.",
    "No deployment has been executed.",
    "No production secret has been activated.",
    "No public DNS cutover has been approved.",
    "No production database migration has been approved.",
    "No public production API exposure has been approved.",
    "No production portal launch has been executed.",
    "No customer communication has been released.",
    "No public status page has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "No public verification authority has been granted.",
    "No legal advice has been provided.",
    "No official reliance has been created.",
    "No rollback authorization has been granted.",
    "No emergency rollback has been executed.",
    "No emergency hold has been released.",
    "No kill-switch activation has been executed.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "This gate is post-activation verification readiness review evidence only.",
  ];
  const review: ProductionPostActivationVerificationReview = {
    reviewId: `production-post-activation-verification:${
      input.verificationScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_POST_ACTIVATION_VERIFICATION_BLOCKED",
    productionBlocked: true,
    postActivationVerificationApprovalGranted: false,
    postActivationVerificationStarted: false,
    postActivationVerificationCompleted: false,
    postActivationVerificationPassed: false,
    productionHealthCertified: false,
    activationCeremonyApprovalGranted: false,
    activationCeremonyExecuted: false,
    productionActivationExecuted: false,
    finalAuthorityApprovalGranted: false,
    goLiveApproved: false,
    productionLaunchAuthorized: false,
    launchHoldReleased: false,
    deploymentHoldReleased: false,
    freezeHoldReleased: false,
    deploymentExecuted: false,
    productionSecretsActivated: false,
    publicDnsCutoverAllowed: false,
    databaseMigrationAllowed: false,
    publicProductionApiExposureAllowed: false,
    productionPortalLaunchExecuted: false,
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    customerCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    rollbackAuthorized: false,
    emergencyRollbackExecuted: false,
    emergencyHoldReleased: false,
    killSwitchActivated: false,
    activationCeremonyVersion: PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    activationCeremonyReviewCount:
      activationCeremony.productionActivationCeremonyReviews.length,
    verificationItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
    activationCeremonyVersion: PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
    productionPostActivationVerificationReviews: [review],
    summary: {
      totalReviews: 1,
      totalVerificationItems: verificationItems.length,
      pass: verificationItems.filter(
        (verificationItem) => verificationItem.status === "PASS"
      ).length,
      reviewRequired: verificationItems.filter(
        (verificationItem) => verificationItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: verificationItems.filter(
        (verificationItem) => verificationItem.status === "BLOCKED"
      ).length,
      postActivationVerificationApprovalGranted: 0,
      postActivationVerificationStarted: 0,
      postActivationVerificationCompleted: 0,
      postActivationVerificationPassed: 0,
      productionHealthCertified: 0,
      activationCeremonyApprovalGranted: 0,
      activationCeremonyExecuted: 0,
      productionActivationExecuted: 0,
      finalAuthorityApprovalGranted: 0,
      goLiveApproved: 0,
      productionLaunchAuthorized: 0,
      launchHoldReleased: 0,
      deploymentHoldReleased: 0,
      freezeHoldReleased: 0,
      deploymentExecuted: 0,
      productionSecretsActivated: 0,
      publicDnsCutoverAllowed: 0,
      databaseMigrationAllowed: 0,
      publicProductionApiExposureAllowed: 0,
      productionPortalLaunchExecuted: 0,
      liveExternalActionsAllowed: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
      customerCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
      rollbackAuthorized: 0,
      emergencyRollbackExecuted: 0,
      emergencyHoldReleased: 0,
      killSwitchActivated: 0,
    },
    disclosures,
    verificationPosture:
      "POST_ACTIVATION_VERIFICATION_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
