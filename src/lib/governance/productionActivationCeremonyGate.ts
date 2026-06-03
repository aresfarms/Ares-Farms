import {
  PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
  evaluateProductionFinalAuthorityGate,
} from "@/lib/governance/productionFinalAuthorityGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Activation Ceremony Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives the platform one activation ceremony readiness surface after
 *   final authority evidence and before any launch-time production action.
 * - Vol I: keeps activation ceremony authority subordinate to constitutional
 *   governance, qualified human ownership, dual control, and recorded review.
 * - Vol II: prevents ceremony evidence from becoming legal advice, official
 *   reports, notices, payment capture, public verification, partner
 *   commitments, agency commitments, production reliance, or official reliance.
 * - Vol III: assembles deterministic, replay-safe activation ceremony evidence
 *   across final authority, launch holds, credentials, deployment sequence,
 *   monitoring, rollback, incident, support, communications, audit, privacy,
 *   redaction, claims, and post-activation verification.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without executing the ceremony or activating production systems.
 * - Vol IV: supports activation ceremony review, release ownership, dual
 *   control, war-room posture, rollback readiness, and evidence preservation.
 * - Vol V: preserves content claims, controlled disclosure, replayability,
 *   explainability, portability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   public production exposure blocked until a separate approved activation.
 */

export const PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION =
  "production-activation-ceremony-gate-v0.1.0";

export type ProductionActivationCeremonyStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionActivationCeremonyItem = {
  id: string;
  label: string;
  status: ProductionActivationCeremonyStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionActivationCeremonyReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_ACTIVATION_CEREMONY_BLOCKED";
  productionBlocked: true;
  activationCeremonyApprovalGranted: false;
  activationCeremonyExecuted: false;
  productionActivationExecuted: false;
  postActivationVerificationStarted: false;
  postActivationVerificationCompleted: false;
  finalAuthorityApprovalGranted: false;
  goLiveApproved: false;
  productionLaunchAuthorized: false;
  constitutionalOfficerAttestationReceived: false;
  qualifiedReleaseManagerApprovalGranted: false;
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
  supportCommunicationsApprovalGranted: false;
  supportOperationsActivated: false;
  customerCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  incidentResponseActivated: false;
  incidentBridgeActivated: false;
  rollbackAuthorized: false;
  emergencyRollbackExecuted: false;
  emergencyHoldReleased: false;
  killSwitchActivated: false;
  finalAuthorityVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  finalAuthorityReviewCount: number;
  ceremonyItems: ProductionActivationCeremonyItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionActivationCeremonySummary = {
  totalReviews: number;
  totalCeremonyItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  activationCeremonyApprovalGranted: number;
  activationCeremonyExecuted: number;
  productionActivationExecuted: number;
  postActivationVerificationStarted: number;
  postActivationVerificationCompleted: number;
  finalAuthorityApprovalGranted: number;
  goLiveApproved: number;
  productionLaunchAuthorized: number;
  constitutionalOfficerAttestationReceived: number;
  qualifiedReleaseManagerApprovalGranted: number;
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
  supportCommunicationsApprovalGranted: number;
  supportOperationsActivated: number;
  customerCommunicationsReleased: number;
  publicStatusPageEnabled: number;
  incidentResponseActivated: number;
  incidentBridgeActivated: number;
  rollbackAuthorized: number;
  emergencyRollbackExecuted: number;
  emergencyHoldReleased: number;
  killSwitchActivated: number;
};

export type ProductionActivationCeremonyInput = {
  ceremonyScope?: string | null;
};

export type ProductionActivationCeremonyResult = {
  version: string;
  finalAuthorityVersion: string;
  productionActivationCeremonyReviews: ProductionActivationCeremonyReview[];
  summary: ProductionActivationCeremonySummary;
  disclosures: string[];
  ceremonyPosture: "ACTIVATION_CEREMONY_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionActivationCeremonyStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionActivationCeremonyItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function finalAuthorityBlocksPreserved(
  finalAuthority: ReturnType<typeof evaluateProductionFinalAuthorityGate>
): boolean {
  return (
    finalAuthority.summary.finalAuthorityApprovalGranted === 0 &&
    finalAuthority.summary.goLiveApproved === 0 &&
    finalAuthority.summary.productionLaunchAuthorized === 0 &&
    finalAuthority.summary.constitutionalOfficerAttestationReceived === 0 &&
    finalAuthority.summary.qualifiedReleaseManagerApprovalGranted === 0 &&
    finalAuthority.summary.launchHoldReleased === 0 &&
    finalAuthority.summary.deploymentHoldReleased === 0 &&
    finalAuthority.summary.freezeHoldReleased === 0 &&
    finalAuthority.summary.deploymentExecuted === 0 &&
    finalAuthority.summary.productionSecretsActivated === 0 &&
    finalAuthority.summary.publicDnsCutoverAllowed === 0 &&
    finalAuthority.summary.databaseMigrationAllowed === 0 &&
    finalAuthority.summary.publicProductionApiExposureAllowed === 0 &&
    finalAuthority.summary.productionPortalLaunchExecuted === 0 &&
    finalAuthority.summary.liveExternalActionsAllowed === 0 &&
    finalAuthority.summary.liveExternalActionsPerformed === 0 &&
    finalAuthority.summary.paymentCaptureAllowed === 0 &&
    finalAuthority.summary.borrowerNoticeSendsAllowed === 0 &&
    finalAuthority.summary.officialReportsAllowed === 0 &&
    finalAuthority.summary.publicVerificationAllowed === 0 &&
    finalAuthority.summary.legalAdviceProvided === 0 &&
    finalAuthority.summary.officialRelianceAllowed === 0
  );
}

function buildCeremonyItems(
  finalAuthority: ReturnType<typeof evaluateProductionFinalAuthorityGate>
): ProductionActivationCeremonyItem[] {
  const finalAuthorityPreserved =
    finalAuthorityBlocksPreserved(finalAuthority);
  const finalAuthorityAttached =
    finalAuthority.productionFinalAuthorityReviews.length > 0 &&
    finalAuthorityPreserved;

  return [
    item(
      "master-volume-activation-ceremony-controls-attached",
      "Master Volume activation ceremony controls attached",
      "PASS",
      "Master Volume Series / activation ceremony, final authority, launch hold, production exposure, rollback, and live-action controls",
      "governance",
      null
    ),
    item(
      "production-final-authority-attached",
      "Production final authority evidence attached",
      finalAuthorityAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_FINAL_AUTHORITY_GATE_VERSION}:${finalAuthority.authorityPosture}`,
      "governance",
      finalAuthorityAttached
        ? null
        : "Activation ceremony review requires blocked final authority evidence with zero production authority."
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
      "ceremony-agenda-review",
      "Activation ceremony agenda review",
      "REVIEW_REQUIRED",
      "activation ceremony agenda timing owners and stop-action packet",
      "release",
      "Activation ceremony timing, responsible owners, stop-action authority, and step sequence must be reviewed before any separate activation."
    ),
    item(
      "dual-control-quorum-review",
      "Dual-control quorum review",
      "REVIEW_REQUIRED",
      "constitutional release security operations support compliance quorum packet",
      "governance",
      "Constitutional, release, security, operations, support, and compliance quorum must be reviewed without granting approval in this surface."
    ),
    item(
      "credential-vault-release-review",
      "Credential vault and secret release review",
      "REVIEW_REQUIRED",
      "credential vault production secret release and redaction packet",
      "security",
      "Production credentials, secrets, webhook secrets, and database credentials must remain blocked until a separate qualified release."
    ),
    item(
      "deployment-sequence-review",
      "Deployment and migration sequence review",
      "REVIEW_REQUIRED",
      "deployment migration DNS CDN TLS WAF and rollback sequence packet",
      "platform",
      "Deployment, migration, DNS, CDN, TLS, WAF, and rollback sequence evidence must be reviewed before any separate execution."
    ),
    item(
      "monitoring-post-activation-review",
      "Monitoring and post-activation verification review",
      "REVIEW_REQUIRED",
      "monitoring alerting SLO synthetic check public surface and post-activation verification packet",
      "operations",
      "Monitoring, alerting, SLOs, synthetic checks, public surface checks, and post-activation verification must be reviewed."
    ),
    item(
      "rollback-emergency-hold-review",
      "Rollback, emergency hold, and kill-switch review",
      "REVIEW_REQUIRED",
      "rollback emergency hold kill-switch and recovery owner packet",
      "operations",
      "Rollback, emergency hold, kill-switch, recovery owner, and stop-action controls must be reviewed."
    ),
    item(
      "communications-freeze-review",
      "Communications freeze and public-status review",
      "REVIEW_REQUIRED",
      "communications freeze public status support routing and customer-safe language packet",
      "support",
      "Customer communications, regulatory communications, public status page, support routing, and safe language must be reviewed before any separate release."
    ),
    item(
      "audit-replay-evidence-review",
      "Audit, replay, and evidence export review",
      "REVIEW_REQUIRED",
      "activation ceremony audit replay observability evidence export and retention packet",
      "governance",
      "Activation ceremony evidence must remain replay-safe, observable, classified, retained, and exportable for audit review."
    ),
    item(
      "activation-ceremony-approval",
      "Activation ceremony approval",
      "BLOCKED",
      "activation ceremony approval record",
      "release",
      "Activation ceremony approval has not been granted."
    ),
    item(
      "activation-ceremony-execution",
      "Activation ceremony execution",
      "BLOCKED",
      "activation ceremony execution record",
      "release",
      "Activation ceremony execution has not been approved or performed."
    ),
    item(
      "production-activation-execution",
      "Production activation execution",
      "BLOCKED",
      "production launch deployment secret DNS migration public API and portal activation records",
      "platform",
      "Production activation, deployment, secrets, DNS cutover, database migration, public API exposure, and production portal launch remain blocked."
    ),
    item(
      "regulated-live-actions",
      "Regulated live actions remain disabled",
      "BLOCKED",
      "payment notice official report public verification and live external action records",
      "governance",
      "Payment capture, borrower notice sends, official reports, public verification, live external actions, legal advice, and official reliance remain blocked."
    ),
  ];
}

export function evaluateProductionActivationCeremonyGate(
  input: ProductionActivationCeremonyInput = {}
): ProductionActivationCeremonyResult {
  const finalAuthority = evaluateProductionFinalAuthorityGate();
  const ceremonyItems = buildCeremonyItems(finalAuthority);
  const blockingReasons = ceremonyItems
    .filter((ceremonyItem) => ceremonyItem.status !== "PASS")
    .map((ceremonyItem) => ceremonyItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No activation ceremony approval has been granted.",
    "No activation ceremony has been executed.",
    "No production activation has been executed.",
    "No post-activation verification has been started.",
    "No post-activation verification has been completed.",
    "No final production authority approval has been granted.",
    "No go-live approval has been granted.",
    "No production launch authorization has been granted.",
    "No constitutional officer final attestation has been received.",
    "No qualified release manager final approval has been granted.",
    "No production support communications approval has been granted.",
    "No support operations activation has been approved.",
    "No customer communication has been released.",
    "No regulatory communication has been released.",
    "No public status page has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "No public verification authority has been granted.",
    "No legal advice has been provided.",
    "No official reliance has been created.",
    "No incident response activation has been approved.",
    "No incident bridge has been activated for production launch.",
    "No rollback authorization has been granted.",
    "No emergency rollback has been executed.",
    "No emergency hold has been released.",
    "No kill-switch activation has been executed.",
    "No production cutover authority has been granted.",
    "No production cutover has been approved or executed.",
    "No launch hold has been released.",
    "No deployment hold has been released.",
    "No release-candidate freeze hold has been released.",
    "No deployment has been executed.",
    "No production secret has been activated.",
    "No public DNS cutover has been approved.",
    "No production database migration has been approved.",
    "No public production API exposure has been approved.",
    "No production portal launch has been executed.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "This gate is production activation ceremony readiness review evidence only.",
  ];
  const review: ProductionActivationCeremonyReview = {
    reviewId: `production-activation-ceremony:${
      input.ceremonyScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_ACTIVATION_CEREMONY_BLOCKED",
    productionBlocked: true,
    activationCeremonyApprovalGranted: false,
    activationCeremonyExecuted: false,
    productionActivationExecuted: false,
    postActivationVerificationStarted: false,
    postActivationVerificationCompleted: false,
    finalAuthorityApprovalGranted: false,
    goLiveApproved: false,
    productionLaunchAuthorized: false,
    constitutionalOfficerAttestationReceived: false,
    qualifiedReleaseManagerApprovalGranted: false,
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
    supportCommunicationsApprovalGranted: false,
    supportOperationsActivated: false,
    customerCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    incidentResponseActivated: false,
    incidentBridgeActivated: false,
    rollbackAuthorized: false,
    emergencyRollbackExecuted: false,
    emergencyHoldReleased: false,
    killSwitchActivated: false,
    finalAuthorityVersion: PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    finalAuthorityReviewCount:
      finalAuthority.productionFinalAuthorityReviews.length,
    ceremonyItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_ACTIVATION_CEREMONY_GATE_VERSION,
    finalAuthorityVersion: PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
    productionActivationCeremonyReviews: [review],
    summary: {
      totalReviews: 1,
      totalCeremonyItems: ceremonyItems.length,
      pass: ceremonyItems.filter(
        (ceremonyItem) => ceremonyItem.status === "PASS"
      ).length,
      reviewRequired: ceremonyItems.filter(
        (ceremonyItem) => ceremonyItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: ceremonyItems.filter(
        (ceremonyItem) => ceremonyItem.status === "BLOCKED"
      ).length,
      activationCeremonyApprovalGranted: 0,
      activationCeremonyExecuted: 0,
      productionActivationExecuted: 0,
      postActivationVerificationStarted: 0,
      postActivationVerificationCompleted: 0,
      finalAuthorityApprovalGranted: 0,
      goLiveApproved: 0,
      productionLaunchAuthorized: 0,
      constitutionalOfficerAttestationReceived: 0,
      qualifiedReleaseManagerApprovalGranted: 0,
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
      supportCommunicationsApprovalGranted: 0,
      supportOperationsActivated: 0,
      customerCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
      incidentResponseActivated: 0,
      incidentBridgeActivated: 0,
      rollbackAuthorized: 0,
      emergencyRollbackExecuted: 0,
      emergencyHoldReleased: 0,
      killSwitchActivated: 0,
    },
    disclosures,
    ceremonyPosture: "ACTIVATION_CEREMONY_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
