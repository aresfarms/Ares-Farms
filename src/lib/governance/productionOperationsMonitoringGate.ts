import {
  PRODUCTION_RELEASE_BOARD_VERSION,
  evaluateProductionReleaseBoard,
} from "@/lib/governance/productionReleaseBoard";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Operations Monitoring Gate
 *
 * Master Volume Governance:
 * - Vol 0: treats production operations review as one platform-level operator
 *   surface after release-board evidence and before any live production action.
 * - Vol I: keeps operational authority subordinate to constitutional
 *   governance, qualified release ownership, and human approval.
 * - Vol II: prevents monitoring evidence from becoming approval, notice send,
 *   payment capture, official report publication, public verification, legal
 *   advice, or official reliance.
 * - Vol III: assembles deterministic, replay-safe operational evidence across
 *   monitoring, alerting, on-call, incident, rollback, support, audit export,
 *   backup, restore, emergency hold, and communications controls.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without deploying, activating secrets, or changing infrastructure.
 * - Vol IV: supports monitoring/on-call review, incident bridge readiness,
 *   rollback rehearsal, support routing, and emergency hold review.
 * - Vol V: preserves claims, controlled disclosure, replayability,
 *   explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   production exposure blocked until controlled promotion is complete.
 */

export const PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION =
  "production-operations-monitoring-gate-v0.1.0";

export type ProductionOperationsMonitoringStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionOperationsMonitoringItem = {
  id: string;
  label: string;
  status: ProductionOperationsMonitoringStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionOperationsMonitoringReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_OPERATIONS_MONITORING_BLOCKED";
  productionBlocked: true;
  operationsMonitoringApprovalGranted: false;
  productionMonitoringActivated: false;
  onCallActivated: false;
  incidentBridgeActivated: false;
  rollbackAuthorized: false;
  emergencyHoldReleased: false;
  productionCutoverApproved: false;
  productionCutoverExecuted: false;
  releaseBoardApprovalGranted: false;
  cutoverAuthorityGranted: false;
  launchHoldReleased: false;
  deploymentHoldReleased: false;
  freezeHoldReleased: false;
  deploymentExecuted: false;
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
  releaseBoardVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  releaseBoardReviewCount: number;
  operationsItems: ProductionOperationsMonitoringItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionOperationsMonitoringSummary = {
  totalReviews: number;
  totalOperationsItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  operationsMonitoringApprovalGranted: number;
  productionMonitoringActivated: number;
  onCallActivated: number;
  incidentBridgeActivated: number;
  rollbackAuthorized: number;
  emergencyHoldReleased: number;
  productionCutoverApproved: number;
  productionCutoverExecuted: number;
  releaseBoardApprovalGranted: number;
  cutoverAuthorityGranted: number;
  launchHoldReleased: number;
  deploymentHoldReleased: number;
  freezeHoldReleased: number;
  deploymentExecuted: number;
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

export type ProductionOperationsMonitoringInput = {
  operationsScope?: string | null;
};

export type ProductionOperationsMonitoringResult = {
  version: string;
  releaseBoardVersion: string;
  productionOperationsMonitoringReviews: ProductionOperationsMonitoringReview[];
  summary: ProductionOperationsMonitoringSummary;
  disclosures: string[];
  operationsPosture: "OPERATIONS_MONITORING_BLOCKED_PENDING_FINAL_AUTHORITY";
};

function item(
  id: string,
  label: string,
  status: ProductionOperationsMonitoringStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionOperationsMonitoringItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function releaseBoardBlocksPreserved(
  releaseBoard: ReturnType<typeof evaluateProductionReleaseBoard>
): boolean {
  return (
    releaseBoard.summary.releaseBoardApprovalGranted === 0 &&
    releaseBoard.summary.cutoverAuthorityGranted === 0 &&
    releaseBoard.summary.productionCutoverApproved === 0 &&
    releaseBoard.summary.productionCutoverExecuted === 0 &&
    releaseBoard.summary.launchHoldReleased === 0 &&
    releaseBoard.summary.deploymentHoldReleased === 0 &&
    releaseBoard.summary.freezeHoldReleased === 0 &&
    releaseBoard.summary.deploymentExecuted === 0 &&
    releaseBoard.summary.productionSecretsActivated === 0 &&
    releaseBoard.summary.publicDnsCutoverAllowed === 0 &&
    releaseBoard.summary.databaseMigrationAllowed === 0 &&
    releaseBoard.summary.publicProductionApiExposureAllowed === 0 &&
    releaseBoard.summary.productionPortalLaunchExecuted === 0 &&
    releaseBoard.summary.liveExternalActionsAllowed === 0 &&
    releaseBoard.summary.liveExternalActionsPerformed === 0 &&
    releaseBoard.summary.paymentCaptureAllowed === 0 &&
    releaseBoard.summary.borrowerNoticeSendsAllowed === 0 &&
    releaseBoard.summary.officialReportsAllowed === 0 &&
    releaseBoard.summary.publicVerificationAllowed === 0 &&
    releaseBoard.summary.legalAdviceProvided === 0 &&
    releaseBoard.summary.officialRelianceAllowed === 0
  );
}

function buildOperationsItems(
  releaseBoard: ReturnType<typeof evaluateProductionReleaseBoard>
): ProductionOperationsMonitoringItem[] {
  const releaseBoardPreserved = releaseBoardBlocksPreserved(releaseBoard);
  const releaseBoardAttached =
    releaseBoard.productionReleaseBoardReviews.length > 0 &&
    releaseBoardPreserved;

  return [
    item(
      "master-volume-operations-controls-attached",
      "Master Volume operations controls attached",
      "PASS",
      "Master Volume Series / operations, monitoring, incident, rollback, and emergency hold controls",
      "governance",
      null
    ),
    item(
      "production-release-board-attached",
      "Production release board evidence attached",
      releaseBoardAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_RELEASE_BOARD_VERSION}:${releaseBoard.boardPosture}`,
      "governance",
      releaseBoardAttached
        ? null
        : "Operations monitoring review requires blocked production release board evidence with zero production authority."
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
      "monitoring-alerting-slo-review",
      "Monitoring, alerting, and SLO review",
      "REVIEW_REQUIRED",
      "monitoring alerting SLO packet",
      "operations",
      "Monitoring, alert thresholds, SLOs, escalation paths, and evidence export must be reviewed before any separate production activation."
    ),
    item(
      "on-call-roster-review",
      "On-call roster and escalation review",
      "REVIEW_REQUIRED",
      "on-call roster and escalation matrix",
      "operations",
      "Primary, secondary, escalation, and executive owner coverage must be reviewed before any separate production activation."
    ),
    item(
      "incident-bridge-review",
      "Incident bridge and severity model review",
      "REVIEW_REQUIRED",
      "incident bridge runbook and severity matrix",
      "operations",
      "Incident bridge, severity definitions, paging path, and customer-support routing must be reviewed."
    ),
    item(
      "rollback-drill-review",
      "Rollback drill and recovery review",
      "REVIEW_REQUIRED",
      "rollback rehearsal and recovery plan",
      "operations",
      "Rollback procedure, responsible owner, recovery timeline, and emergency communication path must be reviewed."
    ),
    item(
      "backup-restore-dr-review",
      "Backup, restore, and disaster recovery review",
      "REVIEW_REQUIRED",
      "backup restore disaster recovery evidence",
      "platform",
      "Backup cadence, restore proof, disaster recovery ownership, and retention boundaries must be reviewed."
    ),
    item(
      "audit-export-evidence-review",
      "Audit export and replay evidence review",
      "REVIEW_REQUIRED",
      "audit export and replay packet",
      "governance",
      "Audit export, replay references, classified evidence boundaries, and record retention must be reviewed."
    ),
    item(
      "support-communications-review",
      "Support routing and communications review",
      "REVIEW_REQUIRED",
      "support routing and communications freeze packet",
      "support",
      "Support queue routing, customer-safe language, escalation owners, and communications freeze must be reviewed."
    ),
    item(
      "emergency-hold-review",
      "Emergency hold and kill-switch review",
      "REVIEW_REQUIRED",
      "emergency hold and kill-switch authority packet",
      "governance",
      "Emergency hold ownership, stop-action authority, and rollback trigger evidence must be reviewed."
    ),
    item(
      "operations-monitoring-approval",
      "Production operations monitoring approval",
      "BLOCKED",
      "operations monitoring approval record",
      "operations",
      "Production operations monitoring approval has not been granted."
    ),
    item(
      "production-monitoring-activation",
      "Production monitoring activation",
      "BLOCKED",
      "production monitoring activation record",
      "operations",
      "Production monitoring, paging, and on-call activation have not been approved or activated."
    ),
    item(
      "production-cutover-authority",
      "Production cutover authority",
      "BLOCKED",
      "cutover authority record",
      "governance",
      "Production cutover authority has not been granted."
    ),
    item(
      "production-deployment-execution",
      "Production deployment execution",
      "BLOCKED",
      "production deployment record",
      "platform",
      "Production deployment has not been approved or executed."
    ),
    item(
      "public-production-exposure",
      "Public production exposure",
      "BLOCKED",
      "public API, DNS, CDN, TLS, WAF, and portal exposure record",
      "security",
      "Public production API exposure, DNS cutover, and portal launch have not been approved or enabled."
    ),
    item(
      "regulated-live-actions",
      "Payments, notices, official reports, public verification, and live actions remain disabled",
      "BLOCKED",
      "regulated live-action enablement records",
      "governance",
      "Payment capture, borrower notice sends, official reports, public verification, legal advice, official reliance, and live external actions remain blocked."
    ),
  ];
}

export function evaluateProductionOperationsMonitoringGate(
  input: ProductionOperationsMonitoringInput = {}
): ProductionOperationsMonitoringResult {
  const releaseBoard = evaluateProductionReleaseBoard();
  const operationsItems = buildOperationsItems(releaseBoard);
  const blockingReasons = operationsItems
    .filter((operationsItem) => operationsItem.status !== "PASS")
    .map((operationsItem) => operationsItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production operations monitoring approval has been granted.",
    "No production monitoring, paging, or on-call activation has been approved.",
    "No incident bridge has been activated for production launch.",
    "No rollback authorization has been granted.",
    "No emergency hold has been released.",
    "No production release board approval has been granted.",
    "No production cutover authority has been granted.",
    "No production cutover has been approved or executed.",
    "No launch hold has been released.",
    "No deployment hold has been released.",
    "No release-candidate freeze hold has been released.",
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
    "This gate is production operations monitoring review evidence only.",
  ];
  const review: ProductionOperationsMonitoringReview = {
    reviewId: `production-operations-monitoring:${
      input.operationsScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_OPERATIONS_MONITORING_BLOCKED",
    productionBlocked: true,
    operationsMonitoringApprovalGranted: false,
    productionMonitoringActivated: false,
    onCallActivated: false,
    incidentBridgeActivated: false,
    rollbackAuthorized: false,
    emergencyHoldReleased: false,
    productionCutoverApproved: false,
    productionCutoverExecuted: false,
    releaseBoardApprovalGranted: false,
    cutoverAuthorityGranted: false,
    launchHoldReleased: false,
    deploymentHoldReleased: false,
    freezeHoldReleased: false,
    deploymentExecuted: false,
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
    releaseBoardVersion: PRODUCTION_RELEASE_BOARD_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    releaseBoardReviewCount:
      releaseBoard.productionReleaseBoardReviews.length,
    operationsItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
    releaseBoardVersion: PRODUCTION_RELEASE_BOARD_VERSION,
    productionOperationsMonitoringReviews: [review],
    summary: {
      totalReviews: 1,
      totalOperationsItems: operationsItems.length,
      pass: operationsItems.filter(
        (operationsItem) => operationsItem.status === "PASS"
      ).length,
      reviewRequired: operationsItems.filter(
        (operationsItem) => operationsItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: operationsItems.filter(
        (operationsItem) => operationsItem.status === "BLOCKED"
      ).length,
      operationsMonitoringApprovalGranted: 0,
      productionMonitoringActivated: 0,
      onCallActivated: 0,
      incidentBridgeActivated: 0,
      rollbackAuthorized: 0,
      emergencyHoldReleased: 0,
      productionCutoverApproved: 0,
      productionCutoverExecuted: 0,
      releaseBoardApprovalGranted: 0,
      cutoverAuthorityGranted: 0,
      launchHoldReleased: 0,
      deploymentHoldReleased: 0,
      freezeHoldReleased: 0,
      deploymentExecuted: 0,
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
    operationsPosture: "OPERATIONS_MONITORING_BLOCKED_PENDING_FINAL_AUTHORITY",
  };
}
