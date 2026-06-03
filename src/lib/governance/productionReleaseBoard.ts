import {
  PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
  evaluateProductionCutoverHoldGate,
} from "@/lib/governance/productionCutoverHoldGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Release Board Evidence Packet
 *
 * Master Volume Governance:
 * - Vol 0: treats release-board review as a platform-level operator handoff.
 * - Vol I: keeps release authority subordinate to constitutional governance,
 *   qualified release ownership, and accountable human approval.
 * - Vol II: prevents release-board evidence from becoming production approval,
 *   public verification, official reports, notice sends, payment capture, legal
 *   advice, partner commitments, agency commitments, or official reliance.
 * - Vol III: assembles deterministic, replay-safe evidence across cutover hold,
 *   release-candidate freeze, deployment, secrets, migrations, edge controls,
 *   monitoring, backup, rollback, incident, support, and launch holds.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without deploying, activating secrets, or changing infrastructure.
 * - Vol IV: supports release-board packet review, quorum review, rollback
 *   rehearsal, incident bridge readiness, support routing, and communication
 *   freeze.
 * - Vol V: preserves claims, data rights, controlled disclosure, replayability,
 *   explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   production exposure blocked until controlled promotion is complete.
 */

export const PRODUCTION_RELEASE_BOARD_VERSION =
  "production-release-board-v0.1.0";

export type ProductionReleaseBoardStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionReleaseBoardItem = {
  id: string;
  label: string;
  status: ProductionReleaseBoardStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionReleaseBoardReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_RELEASE_BOARD_BLOCKED";
  productionBlocked: true;
  releaseBoardApprovalGranted: false;
  cutoverAuthorityGranted: false;
  productionCutoverApproved: false;
  productionCutoverExecuted: false;
  launchHoldReleased: false;
  deploymentHoldReleased: false;
  freezeHoldReleased: false;
  releaseCandidateFreezeApproved: false;
  releaseCandidateFrozen: false;
  releaseCandidateApproved: false;
  deploymentExecuted: false;
  environmentPromotionAllowed: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  cdnWafTlsEnabled: false;
  databaseMigrationAllowed: false;
  publicProductionApiExposureAllowed: false;
  productionPortalLaunchAllowed: false;
  productionPortalLaunchExecuted: false;
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  qualifiedReleaseManagerRequired: true;
  releaseBoardQuorumRequired: true;
  finalLaunchHoldRequired: true;
  productionCutoverHoldVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  productionCutoverHoldReviewCount: number;
  releaseBoardItems: ProductionReleaseBoardItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionReleaseBoardSummary = {
  totalReviews: number;
  totalReleaseBoardItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  releaseBoardApprovalGranted: number;
  cutoverAuthorityGranted: number;
  productionCutoverApproved: number;
  productionCutoverExecuted: number;
  launchHoldReleased: number;
  deploymentHoldReleased: number;
  freezeHoldReleased: number;
  releaseCandidateFreezeApproved: number;
  releaseCandidateFrozen: number;
  releaseCandidateApproved: number;
  deploymentExecuted: number;
  environmentPromotionAllowed: number;
  productionSecretsActivated: number;
  publicDnsCutoverAllowed: number;
  cdnWafTlsEnabled: number;
  databaseMigrationAllowed: number;
  publicProductionApiExposureAllowed: number;
  productionPortalLaunchAllowed: number;
  productionPortalLaunchExecuted: number;
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
};

export type ProductionReleaseBoardInput = {
  boardScope?: string | null;
};

export type ProductionReleaseBoardResult = {
  version: string;
  productionCutoverHoldVersion: string;
  productionReleaseBoardReviews: ProductionReleaseBoardReview[];
  summary: ProductionReleaseBoardSummary;
  disclosures: string[];
  boardPosture: "RELEASE_BOARD_BLOCKED_PENDING_FINAL_AUTHORITY";
};

function item(
  id: string,
  label: string,
  status: ProductionReleaseBoardStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionReleaseBoardItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function cutoverHoldBlocksPreserved(
  cutoverHold: ReturnType<typeof evaluateProductionCutoverHoldGate>
): boolean {
  return (
    cutoverHold.summary.productionCutoverApproved === 0 &&
    cutoverHold.summary.productionCutoverExecuted === 0 &&
    cutoverHold.summary.releaseCandidateFreezeApproved === 0 &&
    cutoverHold.summary.releaseCandidateFrozen === 0 &&
    cutoverHold.summary.releaseCandidateApproved === 0 &&
    cutoverHold.summary.freezeHoldReleased === 0 &&
    cutoverHold.summary.deploymentHoldReleased === 0 &&
    cutoverHold.summary.finalGoLiveHoldReleased === 0 &&
    cutoverHold.summary.deploymentExecuted === 0 &&
    cutoverHold.summary.environmentPromotionAllowed === 0 &&
    cutoverHold.summary.productionSecretsActivated === 0 &&
    cutoverHold.summary.publicDnsCutoverAllowed === 0 &&
    cutoverHold.summary.cdnWafTlsEnabled === 0 &&
    cutoverHold.summary.databaseMigrationAllowed === 0 &&
    cutoverHold.summary.publicProductionApiExposureAllowed === 0 &&
    cutoverHold.summary.productionPortalLaunchAllowed === 0 &&
    cutoverHold.summary.productionPortalLaunchExecuted === 0 &&
    cutoverHold.summary.liveExternalActionsAllowed === 0 &&
    cutoverHold.summary.liveExternalActionsPerformed === 0 &&
    cutoverHold.summary.paymentCaptureAllowed === 0 &&
    cutoverHold.summary.borrowerNoticeSendsAllowed === 0 &&
    cutoverHold.summary.officialReportsAllowed === 0 &&
    cutoverHold.summary.publicVerificationAllowed === 0 &&
    cutoverHold.summary.legalAdviceProvided === 0 &&
    cutoverHold.summary.officialRelianceAllowed === 0
  );
}

function buildReleaseBoardItems(
  cutoverHold: ReturnType<typeof evaluateProductionCutoverHoldGate>
): ProductionReleaseBoardItem[] {
  const cutoverHoldPreserved = cutoverHoldBlocksPreserved(cutoverHold);
  const cutoverHoldAttached =
    cutoverHold.productionCutoverHoldReviews.length > 0 &&
    cutoverHoldPreserved;

  return [
    item(
      "master-volume-release-board-controls-attached",
      "Master Volume release-board controls attached",
      "PASS",
      "Master Volume Series / release board and cutover authority controls",
      "governance",
      null
    ),
    item(
      "production-cutover-hold-attached",
      "Production cutover hold attached",
      cutoverHoldAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_CUTOVER_HOLD_GATE_VERSION}:${cutoverHold.cutoverPosture}`,
      "governance",
      cutoverHoldAttached
        ? null
        : "Release-board evidence requires a blocked production cutover hold with zero production action authority."
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
      "release-board-agenda-packet-review",
      "Release board agenda packet review",
      "REVIEW_REQUIRED",
      "release board agenda and evidence packet",
      "governance",
      "The release board agenda, attendee list, decision boundary, and evidence packet must be reviewed by qualified owners."
    ),
    item(
      "qualified-release-manager-attestation",
      "Qualified release manager attestation",
      "REVIEW_REQUIRED",
      "qualified release manager attestation",
      "governance",
      "A qualified release manager must review the packet without granting cutover authority in this evidence surface."
    ),
    item(
      "security-compliance-operations-support-quorum",
      "Security, compliance, operations, and support quorum review",
      "REVIEW_REQUIRED",
      "release board quorum record",
      "governance",
      "Security, compliance, operations, and support owners must review quorum posture before any separate cutover authority can be considered."
    ),
    item(
      "incident-rollback-support-communications-review",
      "Incident, rollback, support, and communications review",
      "REVIEW_REQUIRED",
      "incident bridge, rollback drill, support roster, and communications freeze",
      "operations",
      "Incident bridge, rollback procedure, support routing, and communication templates must be reviewed before any separate production release decision."
    ),
    item(
      "public-copy-content-claims-final-review",
      "Public copy and content-claims final review",
      "REVIEW_REQUIRED",
      "public copy freeze and content-claims evidence",
      "governance",
      "Public copy and claims posture must be reviewed again before external exposure is separately authorized."
    ),
    item(
      "legal-regulatory-disclaimer-review",
      "Legal and regulatory disclaimer review",
      "REVIEW_REQUIRED",
      "disclosure and disclaimer packet",
      "governance",
      "Disclaimers and regulatory boundary language require qualified review; this packet does not provide legal advice."
    ),
    item(
      "release-board-approval",
      "Production release board approval",
      "BLOCKED",
      "release board approval record",
      "governance",
      "Production release board approval has not been granted."
    ),
    item(
      "cutover-authority-grant",
      "Production cutover authority grant",
      "BLOCKED",
      "cutover authority record",
      "governance",
      "Production cutover authority has not been granted."
    ),
    item(
      "final-launch-hold-release",
      "Final launch hold release",
      "BLOCKED",
      "final launch hold",
      "governance",
      "The final launch hold has not been released."
    ),
    item(
      "deployment-hold-release",
      "Deployment hold release",
      "BLOCKED",
      "deployment hold",
      "governance",
      "The deployment hold has not been released."
    ),
    item(
      "freeze-hold-release",
      "Release-candidate freeze hold release",
      "BLOCKED",
      "release-candidate freeze hold",
      "governance",
      "The release-candidate freeze hold has not been released."
    ),
    item(
      "production-deployment-execution",
      "Production deployment execution",
      "BLOCKED",
      "deployment execution record",
      "platform",
      "Production deployment has not been approved or executed."
    ),
    item(
      "production-secret-activation",
      "Production secret activation",
      "BLOCKED",
      "production secret activation record",
      "security",
      "Production secrets, API keys, webhook secrets, and database credentials have not been activated."
    ),
    item(
      "public-dns-cdn-tls-waf-cutover",
      "Public DNS, CDN, TLS, and WAF cutover",
      "BLOCKED",
      "edge cutover record",
      "security",
      "Public DNS cutover, CDN, TLS, and WAF changes have not been approved or executed."
    ),
    item(
      "production-database-migration-execution",
      "Production database migration execution",
      "BLOCKED",
      "production database migration execution record",
      "platform",
      "Production database migrations have not been approved or executed."
    ),
    item(
      "public-production-api-exposure",
      "Public production API exposure",
      "BLOCKED",
      "public production API exposure record",
      "security",
      "Public production API exposure has not been approved or enabled."
    ),
    item(
      "production-portal-launch",
      "Production portal launch",
      "BLOCKED",
      "production portal launch record",
      "platform",
      "The production portal has not been launched."
    ),
    item(
      "payment-notice-report-verification-enablements",
      "Payments, notices, official reports, and public verification remain disabled",
      "BLOCKED",
      "payment, notice, official report, and public verification enablement records",
      "governance",
      "Payment capture, borrower notice sends, official report publication, and public verification have not been approved or enabled."
    ),
    item(
      "live-actions-and-official-reliance-freeze-preserved",
      "Live actions, legal advice, official reliance, and production exposure remain frozen",
      cutoverHoldPreserved ? "PASS" : "BLOCKED",
      "production cutover hold",
      "governance",
      cutoverHoldPreserved
        ? null
        : "Live actions, public production exposure, payment capture, notice sends, official reports, public verification, legal advice, and official reliance must remain frozen."
    ),
  ];
}

export function evaluateProductionReleaseBoard(
  input: ProductionReleaseBoardInput = {}
): ProductionReleaseBoardResult {
  const cutoverHold = evaluateProductionCutoverHoldGate();
  const releaseBoardItems = buildReleaseBoardItems(cutoverHold);
  const blockingReasons = releaseBoardItems
    .filter((releaseBoardItem) => releaseBoardItem.status !== "PASS")
    .map((releaseBoardItem) => releaseBoardItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production release board approval has been granted.",
    "No production cutover authority has been granted.",
    "No production cutover has been approved or executed.",
    "No launch hold has been released.",
    "No deployment hold has been released.",
    "No release-candidate freeze hold has been released.",
    "No release candidate has been frozen or approved.",
    "No deployment has been executed.",
    "No production secret has been activated.",
    "No public DNS cutover has been approved.",
    "No production database migration has been approved.",
    "No production portal launch has been executed.",
    "No public production API exposure has been approved.",
    "No public verification authority has been granted.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "This packet is production release board review evidence only.",
  ];
  const review: ProductionReleaseBoardReview = {
    reviewId: `production-release-board:${input.boardScope ?? "platform"}`,
    reviewStatus: "PRODUCTION_RELEASE_BOARD_BLOCKED",
    productionBlocked: true,
    releaseBoardApprovalGranted: false,
    cutoverAuthorityGranted: false,
    productionCutoverApproved: false,
    productionCutoverExecuted: false,
    launchHoldReleased: false,
    deploymentHoldReleased: false,
    freezeHoldReleased: false,
    releaseCandidateFreezeApproved: false,
    releaseCandidateFrozen: false,
    releaseCandidateApproved: false,
    deploymentExecuted: false,
    environmentPromotionAllowed: false,
    productionSecretsActivated: false,
    publicDnsCutoverAllowed: false,
    cdnWafTlsEnabled: false,
    databaseMigrationAllowed: false,
    publicProductionApiExposureAllowed: false,
    productionPortalLaunchAllowed: false,
    productionPortalLaunchExecuted: false,
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    qualifiedReleaseManagerRequired: true,
    releaseBoardQuorumRequired: true,
    finalLaunchHoldRequired: true,
    productionCutoverHoldVersion: PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    productionCutoverHoldReviewCount:
      cutoverHold.productionCutoverHoldReviews.length,
    releaseBoardItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_RELEASE_BOARD_VERSION,
    productionCutoverHoldVersion: PRODUCTION_CUTOVER_HOLD_GATE_VERSION,
    productionReleaseBoardReviews: [review],
    summary: {
      totalReviews: 1,
      totalReleaseBoardItems: releaseBoardItems.length,
      pass: releaseBoardItems.filter(
        (releaseBoardItem) => releaseBoardItem.status === "PASS"
      ).length,
      reviewRequired: releaseBoardItems.filter(
        (releaseBoardItem) => releaseBoardItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: releaseBoardItems.filter(
        (releaseBoardItem) => releaseBoardItem.status === "BLOCKED"
      ).length,
      releaseBoardApprovalGranted: 0,
      cutoverAuthorityGranted: 0,
      productionCutoverApproved: 0,
      productionCutoverExecuted: 0,
      launchHoldReleased: 0,
      deploymentHoldReleased: 0,
      freezeHoldReleased: 0,
      releaseCandidateFreezeApproved: 0,
      releaseCandidateFrozen: 0,
      releaseCandidateApproved: 0,
      deploymentExecuted: 0,
      environmentPromotionAllowed: 0,
      productionSecretsActivated: 0,
      publicDnsCutoverAllowed: 0,
      cdnWafTlsEnabled: 0,
      databaseMigrationAllowed: 0,
      publicProductionApiExposureAllowed: 0,
      productionPortalLaunchAllowed: 0,
      productionPortalLaunchExecuted: 0,
      liveExternalActionsAllowed: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
    },
    disclosures,
    boardPosture: "RELEASE_BOARD_BLOCKED_PENDING_FINAL_AUTHORITY",
  };
}
