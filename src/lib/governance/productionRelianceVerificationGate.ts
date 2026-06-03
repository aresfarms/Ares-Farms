import {
  PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
  evaluateProductionPostActivationVerificationGate,
} from "@/lib/governance/productionPostActivationVerificationGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Reliance and Public Verification Boundary Gate
 *
 * Master Volume Governance:
 * - Vol 0: keeps any move from post-activation evidence into customer,
 *   institutional, public, or regulatory reliance in one governed surface.
 * - Vol I: keeps reliance authority subordinate to constitutional governance,
 *   qualified human authority, separation of duties, and recorded review.
 * - Vol II: prevents public verification, official reports, notices, payment
 *   capture, commitments, legal advice, or official reliance from being created
 *   by technical readiness evidence.
 * - Vol III: assembles replay-safe reliance boundary evidence across
 *   post-activation verification, public claims, public DTOs, audit, replay,
 *   data rights, source authority, reports, notices, payments, and live action.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without authorizing public verification or reliance.
 * - Vol IV: supports operator review, release-board handoff, exception
 *   remediation, incident recovery, and evidence preservation.
 * - Vol V: preserves content claims, controlled disclosure, replayability,
 *   explainability, portability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   external source authority blocked until separately approved.
 */

export const PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION =
  "production-reliance-verification-gate-v0.1.0";

export type ProductionRelianceVerificationStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionRelianceVerificationItem = {
  id: string;
  label: string;
  status: ProductionRelianceVerificationStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionRelianceVerificationReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_RELIANCE_VERIFICATION_BLOCKED";
  productionBlocked: true;
  productionRelianceApprovalGranted: false;
  publicVerificationApprovalGranted: false;
  publicVerificationGatewayOperational: false;
  publicVerificationArtifactPublished: false;
  externalRelianceDisclosureApproved: false;
  regulatoryRelianceAllowed: false;
  officialRelianceAllowed: false;
  legalAdviceProvided: false;
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
  customerCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  rollbackAuthorized: false;
  emergencyRollbackExecuted: false;
  emergencyHoldReleased: false;
  killSwitchActivated: false;
  postActivationVerificationVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  postActivationVerificationReviewCount: number;
  relianceItems: ProductionRelianceVerificationItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionRelianceVerificationSummary = {
  totalReviews: number;
  totalRelianceItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  productionRelianceApprovalGranted: number;
  publicVerificationApprovalGranted: number;
  publicVerificationGatewayOperational: number;
  publicVerificationArtifactPublished: number;
  externalRelianceDisclosureApproved: number;
  regulatoryRelianceAllowed: number;
  officialRelianceAllowed: number;
  legalAdviceProvided: number;
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
  customerCommunicationsReleased: number;
  publicStatusPageEnabled: number;
  rollbackAuthorized: number;
  emergencyRollbackExecuted: number;
  emergencyHoldReleased: number;
  killSwitchActivated: number;
};

export type ProductionRelianceVerificationInput = {
  relianceScope?: string | null;
};

export type ProductionRelianceVerificationResult = {
  version: string;
  postActivationVerificationVersion: string;
  productionRelianceVerificationReviews: ProductionRelianceVerificationReview[];
  summary: ProductionRelianceVerificationSummary;
  disclosures: string[];
  reliancePosture: "PRODUCTION_RELIANCE_VERIFICATION_BLOCKED_PENDING_SEPARATE_AUTHORITY";
};

function item(
  id: string,
  label: string,
  status: ProductionRelianceVerificationStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionRelianceVerificationItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function postActivationVerificationBlocksPreserved(
  postActivationVerification: ReturnType<
    typeof evaluateProductionPostActivationVerificationGate
  >
): boolean {
  return (
    postActivationVerification.summary.postActivationVerificationApprovalGranted ===
      0 &&
    postActivationVerification.summary.postActivationVerificationStarted === 0 &&
    postActivationVerification.summary.postActivationVerificationCompleted ===
      0 &&
    postActivationVerification.summary.postActivationVerificationPassed === 0 &&
    postActivationVerification.summary.productionHealthCertified === 0 &&
    postActivationVerification.summary.activationCeremonyApprovalGranted === 0 &&
    postActivationVerification.summary.activationCeremonyExecuted === 0 &&
    postActivationVerification.summary.productionActivationExecuted === 0 &&
    postActivationVerification.summary.finalAuthorityApprovalGranted === 0 &&
    postActivationVerification.summary.goLiveApproved === 0 &&
    postActivationVerification.summary.productionLaunchAuthorized === 0 &&
    postActivationVerification.summary.launchHoldReleased === 0 &&
    postActivationVerification.summary.deploymentHoldReleased === 0 &&
    postActivationVerification.summary.freezeHoldReleased === 0 &&
    postActivationVerification.summary.deploymentExecuted === 0 &&
    postActivationVerification.summary.productionSecretsActivated === 0 &&
    postActivationVerification.summary.publicDnsCutoverAllowed === 0 &&
    postActivationVerification.summary.databaseMigrationAllowed === 0 &&
    postActivationVerification.summary.publicProductionApiExposureAllowed === 0 &&
    postActivationVerification.summary.productionPortalLaunchExecuted === 0 &&
    postActivationVerification.summary.liveExternalActionsAllowed === 0 &&
    postActivationVerification.summary.liveExternalActionsPerformed === 0 &&
    postActivationVerification.summary.paymentCaptureAllowed === 0 &&
    postActivationVerification.summary.borrowerNoticeSendsAllowed === 0 &&
    postActivationVerification.summary.officialReportsAllowed === 0 &&
    postActivationVerification.summary.publicVerificationAllowed === 0 &&
    postActivationVerification.summary.legalAdviceProvided === 0 &&
    postActivationVerification.summary.officialRelianceAllowed === 0
  );
}

function buildRelianceItems(
  postActivationVerification: ReturnType<
    typeof evaluateProductionPostActivationVerificationGate
  >
): ProductionRelianceVerificationItem[] {
  const postActivationVerificationPreserved =
    postActivationVerificationBlocksPreserved(postActivationVerification);
  const postActivationVerificationAttached =
    postActivationVerification.productionPostActivationVerificationReviews
      .length > 0 && postActivationVerificationPreserved;

  return [
    item(
      "master-volume-reliance-controls-attached",
      "Master Volume reliance and public verification controls attached",
      "PASS",
      "Master Volume Series / reliance, public verification, claims, audit, replay, source authority, and controlled disclosure boundaries",
      "governance",
      null
    ),
    item(
      "post-activation-verification-evidence-attached",
      "Production post-activation verification evidence attached",
      postActivationVerificationAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION}:${postActivationVerification.verificationPosture}`,
      "governance",
      postActivationVerificationAttached
        ? null
        : "Reliance review requires blocked post-activation verification evidence with zero verification approval, zero production health certification, and zero production exposure."
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
      "production-reliance-boundary-review",
      "Production reliance boundary review",
      "REVIEW_REQUIRED",
      "production reliance authority matrix qualified approver list separation-of-duties packet",
      "governance",
      "Production reliance authority, qualified approvers, separation of duties, and constitutional override rules must be reviewed before any separate reliance authorization."
    ),
    item(
      "public-verification-infrastructure-review",
      "Public verification infrastructure review",
      "REVIEW_REQUIRED",
      "public verification gateway report hash watermark audit lookup replay and abuse controls packet",
      "platform",
      "Public verification gateway, hash lookup, replay lookup, watermark semantics, abuse prevention, and takedown controls must be reviewed without claiming operational public verification."
    ),
    item(
      "public-claims-copy-review",
      "Public claims and customer copy review",
      "REVIEW_REQUIRED",
      "public claims copy disclosure content claims and customer-safe language packet",
      "governance",
      "Customer-facing language must be reviewed for advisory-only, no official report, no public verification, no legal advice, and no official reliance boundaries."
    ),
    item(
      "external-disclosure-review",
      "External disclosure and reliance recipient review",
      "REVIEW_REQUIRED",
      "borrower lender sponsor regulator partner and public disclosure matrix packet",
      "compliance",
      "External disclosure audiences, reliance recipients, consent, retention, and redaction requirements must be reviewed."
    ),
    item(
      "audit-replay-evidence-review",
      "Audit and replay reliance evidence review",
      "REVIEW_REQUIRED",
      "audit replay export event lineage evidence packet and retention schedule",
      "governance",
      "Audit export, replay certification, event lineage, and retention evidence must be reviewed before any reliance artifact is exposed."
    ),
    item(
      "privacy-redaction-data-rights-review",
      "Privacy, redaction, and data-rights reliance review",
      "REVIEW_REQUIRED",
      "privacy redaction portability record access data rights and public DTO packet",
      "governance",
      "Privacy, redaction, portability, record access, data rights, and public DTO boundaries must be reviewed."
    ),
    item(
      "source-authority-live-action-review",
      "Source authority and live-action reliance review",
      "REVIEW_REQUIRED",
      "source authority live adapter payment notice report agency portal and legal reliance boundary packet",
      "governance",
      "Source authority, live adapters, payment capture, notices, official reports, agency portals, legal advice, and live external actions must remain blocked."
    ),
    item(
      "production-reliance-approval",
      "Production reliance approval",
      "BLOCKED",
      "production reliance approval record",
      "release",
      "Production reliance approval has not been granted."
    ),
    item(
      "public-verification-approval",
      "Public verification approval",
      "BLOCKED",
      "public verification approval record",
      "governance",
      "Public verification authority has not been granted."
    ),
    item(
      "public-verification-artifact-publication",
      "Public verification artifact publication",
      "BLOCKED",
      "public verification artifact publication record",
      "platform",
      "No public verification artifact, public hash lookup, public report verification, or customer-verifiable report claim has been published."
    ),
    item(
      "regulatory-reliance-approval",
      "Regulatory reliance approval",
      "BLOCKED",
      "regulatory reliance approval record",
      "compliance",
      "Regulatory reliance has not been authorized."
    ),
    item(
      "official-reliance-and-legal-advice",
      "Official reliance and legal advice",
      "BLOCKED",
      "official reliance legal advice report notice payment and live-action records",
      "governance",
      "Official reliance, legal advice, official reports, borrower notices, payment capture, and live external actions remain blocked."
    ),
  ];
}

export function evaluateProductionRelianceVerificationGate(
  input: ProductionRelianceVerificationInput = {}
): ProductionRelianceVerificationResult {
  const postActivationVerification =
    evaluateProductionPostActivationVerificationGate();
  const relianceItems = buildRelianceItems(postActivationVerification);
  const blockingReasons = relianceItems
    .filter((relianceItem) => relianceItem.status !== "PASS")
    .map((relianceItem) => relianceItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production reliance approval has been granted.",
    "No public verification authority has been granted.",
    "No public verification gateway has been made operational.",
    "No public verification artifact has been published.",
    "No external reliance disclosure has been approved.",
    "No regulatory reliance has been authorized.",
    "No official reliance has been created.",
    "No legal advice has been provided.",
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
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "This gate is production reliance and public verification boundary review evidence only.",
  ];
  const review: ProductionRelianceVerificationReview = {
    reviewId: `production-reliance-verification:${
      input.relianceScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_RELIANCE_VERIFICATION_BLOCKED",
    productionBlocked: true,
    productionRelianceApprovalGranted: false,
    publicVerificationApprovalGranted: false,
    publicVerificationGatewayOperational: false,
    publicVerificationArtifactPublished: false,
    externalRelianceDisclosureApproved: false,
    regulatoryRelianceAllowed: false,
    officialRelianceAllowed: false,
    legalAdviceProvided: false,
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
    customerCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    rollbackAuthorized: false,
    emergencyRollbackExecuted: false,
    emergencyHoldReleased: false,
    killSwitchActivated: false,
    postActivationVerificationVersion:
      PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    postActivationVerificationReviewCount:
      postActivationVerification.productionPostActivationVerificationReviews
        .length,
    relianceItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
    postActivationVerificationVersion:
      PRODUCTION_POST_ACTIVATION_VERIFICATION_GATE_VERSION,
    productionRelianceVerificationReviews: [review],
    summary: {
      totalReviews: 1,
      totalRelianceItems: relianceItems.length,
      pass: relianceItems.filter(
        (relianceItem) => relianceItem.status === "PASS"
      ).length,
      reviewRequired: relianceItems.filter(
        (relianceItem) => relianceItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: relianceItems.filter(
        (relianceItem) => relianceItem.status === "BLOCKED"
      ).length,
      productionRelianceApprovalGranted: 0,
      publicVerificationApprovalGranted: 0,
      publicVerificationGatewayOperational: 0,
      publicVerificationArtifactPublished: 0,
      externalRelianceDisclosureApproved: 0,
      regulatoryRelianceAllowed: 0,
      officialRelianceAllowed: 0,
      legalAdviceProvided: 0,
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
      customerCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
      rollbackAuthorized: 0,
      emergencyRollbackExecuted: 0,
      emergencyHoldReleased: 0,
      killSwitchActivated: 0,
    },
    disclosures,
    reliancePosture:
      "PRODUCTION_RELIANCE_VERIFICATION_BLOCKED_PENDING_SEPARATE_AUTHORITY",
  };
}
