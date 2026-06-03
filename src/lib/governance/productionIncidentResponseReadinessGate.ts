import {
  PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
  evaluateProductionOperationsMonitoringGate,
} from "@/lib/governance/productionOperationsMonitoringGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Incident Response Readiness Gate
 *
 * Master Volume Governance:
 * - Vol 0: treats incident response readiness as a platform-level operator
 *   review after operations monitoring evidence and before any live incident
 *   bridge, rollback, public communication, or production action.
 * - Vol I: keeps incident authority subordinate to constitutional governance,
 *   qualified human ownership, release ownership, and emergency-hold doctrine.
 * - Vol II: prevents incident evidence from becoming legal advice, public
 *   status publication, borrower notice delivery, payment capture, official
 *   report publication, public verification, or official reliance.
 * - Vol III: assembles deterministic, replay-safe evidence across incident
 *   command, severity, escalation, rollback, communications, support,
 *   audit/replay, data integrity, emergency hold, and kill-switch controls.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without activating incident systems or production infrastructure.
 * - Vol IV: supports incident response runbooks, emergency rollback review,
 *   customer-safe communications, support escalation, and post-incident
 *   evidence preservation.
 * - Vol V: preserves claims, controlled disclosure, replayability,
 *   explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   public production exposure blocked until controlled promotion is complete.
 */

export const PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION =
  "production-incident-response-readiness-gate-v0.1.0";

export type ProductionIncidentResponseReadinessStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionIncidentResponseReadinessItem = {
  id: string;
  label: string;
  status: ProductionIncidentResponseReadinessStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionIncidentResponseReadinessReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_INCIDENT_RESPONSE_READINESS_BLOCKED";
  productionBlocked: true;
  incidentResponseApprovalGranted: false;
  incidentResponseActivated: false;
  incidentBridgeActivated: false;
  onCallActivated: false;
  rollbackAuthorized: false;
  emergencyRollbackExecuted: false;
  emergencyHoldReleased: false;
  killSwitchActivated: false;
  customerCommunicationsReleased: false;
  regulatoryCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  supportEscalationActivated: false;
  operationsMonitoringApprovalGranted: false;
  productionMonitoringActivated: false;
  productionCutoverApproved: false;
  productionCutoverExecuted: false;
  cutoverAuthorityGranted: false;
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
  operationsMonitoringVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  operationsMonitoringReviewCount: number;
  incidentItems: ProductionIncidentResponseReadinessItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionIncidentResponseReadinessSummary = {
  totalReviews: number;
  totalIncidentItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  incidentResponseApprovalGranted: number;
  incidentResponseActivated: number;
  incidentBridgeActivated: number;
  onCallActivated: number;
  rollbackAuthorized: number;
  emergencyRollbackExecuted: number;
  emergencyHoldReleased: number;
  killSwitchActivated: number;
  customerCommunicationsReleased: number;
  regulatoryCommunicationsReleased: number;
  publicStatusPageEnabled: number;
  supportEscalationActivated: number;
  operationsMonitoringApprovalGranted: number;
  productionMonitoringActivated: number;
  productionCutoverApproved: number;
  productionCutoverExecuted: number;
  cutoverAuthorityGranted: number;
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
};

export type ProductionIncidentResponseReadinessInput = {
  incidentScope?: string | null;
};

export type ProductionIncidentResponseReadinessResult = {
  version: string;
  operationsMonitoringVersion: string;
  productionIncidentResponseReadinessReviews: ProductionIncidentResponseReadinessReview[];
  summary: ProductionIncidentResponseReadinessSummary;
  disclosures: string[];
  incidentPosture: "INCIDENT_RESPONSE_READINESS_BLOCKED_PENDING_FINAL_AUTHORITY";
};

function item(
  id: string,
  label: string,
  status: ProductionIncidentResponseReadinessStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionIncidentResponseReadinessItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function operationsMonitoringBlocksPreserved(
  operationsMonitoring: ReturnType<typeof evaluateProductionOperationsMonitoringGate>
): boolean {
  return (
    operationsMonitoring.summary.operationsMonitoringApprovalGranted === 0 &&
    operationsMonitoring.summary.productionMonitoringActivated === 0 &&
    operationsMonitoring.summary.onCallActivated === 0 &&
    operationsMonitoring.summary.incidentBridgeActivated === 0 &&
    operationsMonitoring.summary.rollbackAuthorized === 0 &&
    operationsMonitoring.summary.emergencyHoldReleased === 0 &&
    operationsMonitoring.summary.cutoverAuthorityGranted === 0 &&
    operationsMonitoring.summary.productionCutoverApproved === 0 &&
    operationsMonitoring.summary.productionCutoverExecuted === 0 &&
    operationsMonitoring.summary.deploymentExecuted === 0 &&
    operationsMonitoring.summary.productionSecretsActivated === 0 &&
    operationsMonitoring.summary.publicDnsCutoverAllowed === 0 &&
    operationsMonitoring.summary.databaseMigrationAllowed === 0 &&
    operationsMonitoring.summary.publicProductionApiExposureAllowed === 0 &&
    operationsMonitoring.summary.productionPortalLaunchExecuted === 0 &&
    operationsMonitoring.summary.liveExternalActionsAllowed === 0 &&
    operationsMonitoring.summary.liveExternalActionsPerformed === 0 &&
    operationsMonitoring.summary.paymentCaptureAllowed === 0 &&
    operationsMonitoring.summary.borrowerNoticeSendsAllowed === 0 &&
    operationsMonitoring.summary.officialReportsAllowed === 0 &&
    operationsMonitoring.summary.publicVerificationAllowed === 0 &&
    operationsMonitoring.summary.legalAdviceProvided === 0 &&
    operationsMonitoring.summary.officialRelianceAllowed === 0
  );
}

function buildIncidentItems(
  operationsMonitoring: ReturnType<typeof evaluateProductionOperationsMonitoringGate>
): ProductionIncidentResponseReadinessItem[] {
  const operationsMonitoringPreserved =
    operationsMonitoringBlocksPreserved(operationsMonitoring);
  const operationsMonitoringAttached =
    operationsMonitoring.productionOperationsMonitoringReviews.length > 0 &&
    operationsMonitoringPreserved;

  return [
    item(
      "master-volume-incident-controls-attached",
      "Master Volume incident controls attached",
      "PASS",
      "Master Volume Series / incident, emergency hold, rollback, communications, and evidence controls",
      "governance",
      null
    ),
    item(
      "production-operations-monitoring-attached",
      "Production operations monitoring evidence attached",
      operationsMonitoringAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION}:${operationsMonitoring.operationsPosture}`,
      "operations",
      operationsMonitoringAttached
        ? null
        : "Incident readiness review requires blocked operations monitoring evidence with zero production authority."
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
      "severity-model-review",
      "Severity model and triage review",
      "REVIEW_REQUIRED",
      "severity model and incident triage packet",
      "operations",
      "Severity definitions, incident categories, triage ownership, and borrower-safe impact language must be reviewed."
    ),
    item(
      "incident-command-roles-review",
      "Incident command roles review",
      "REVIEW_REQUIRED",
      "incident command roster and accountable owner packet",
      "operations",
      "Incident commander, communications lead, technical lead, governance owner, and release-manager boundaries must be reviewed."
    ),
    item(
      "on-call-escalation-review",
      "On-call escalation path review",
      "REVIEW_REQUIRED",
      "on-call escalation and paging matrix",
      "operations",
      "On-call routing, escalation timers, backup owners, and executive escalation boundaries must be reviewed."
    ),
    item(
      "incident-bridge-communications-review",
      "Incident bridge and communications review",
      "REVIEW_REQUIRED",
      "incident bridge, support, and communications runbook",
      "support",
      "Incident bridge activation, support queue routing, customer-safe updates, and communications freeze controls must be reviewed."
    ),
    item(
      "rollback-decision-tree-review",
      "Rollback decision tree review",
      "REVIEW_REQUIRED",
      "rollback decision tree and emergency recovery packet",
      "platform",
      "Rollback triggers, approval owner, recovery steps, emergency hold rules, and post-rollback evidence capture must be reviewed."
    ),
    item(
      "data-integrity-replay-review",
      "Data integrity, replay, and audit evidence review",
      "REVIEW_REQUIRED",
      "data integrity replay and audit export packet",
      "governance",
      "Replay references, audit export boundaries, data integrity checks, and evidence retention must be reviewed."
    ),
    item(
      "customer-public-status-review",
      "Customer-safe communication and status review",
      "REVIEW_REQUIRED",
      "customer communication and public status page packet",
      "support",
      "Customer-safe language, public status posture, notice boundaries, and prohibited official-reliance language must be reviewed."
    ),
    item(
      "regulatory-legal-escalation-review",
      "Regulatory and legal escalation review",
      "REVIEW_REQUIRED",
      "regulatory escalation and legal review packet",
      "governance",
      "Regulatory escalation, legal review, adverse-action boundaries, borrower notice boundaries, and official-report boundaries must be reviewed."
    ),
    item(
      "emergency-hold-kill-switch-review",
      "Emergency hold and kill-switch review",
      "REVIEW_REQUIRED",
      "emergency hold and kill-switch review packet",
      "governance",
      "Emergency hold authority, kill-switch scope, stop-action control, and reactivation limits must be reviewed."
    ),
    item(
      "incident-response-approval",
      "Production incident response approval",
      "BLOCKED",
      "incident response approval record",
      "operations",
      "Production incident response approval has not been granted."
    ),
    item(
      "incident-bridge-activation",
      "Incident bridge activation",
      "BLOCKED",
      "incident bridge activation record",
      "operations",
      "Incident bridge activation has not been approved or executed."
    ),
    item(
      "rollback-authorization",
      "Rollback authorization",
      "BLOCKED",
      "rollback authorization record",
      "platform",
      "Rollback authorization and emergency rollback execution have not been approved."
    ),
    item(
      "customer-communications-release",
      "Customer communications release",
      "BLOCKED",
      "customer communications release record",
      "support",
      "Customer communications, public status, and regulatory communications have not been approved or released."
    ),
    item(
      "production-cutover-deployment-live-actions",
      "Production cutover, deployment, and live actions remain disabled",
      "BLOCKED",
      "production cutover deployment and live-action enablement records",
      "governance",
      "Production cutover, deployment, public production exposure, live external actions, payment capture, borrower notice sends, official reports, public verification, legal advice, and official reliance remain blocked."
    ),
  ];
}

export function evaluateProductionIncidentResponseReadinessGate(
  input: ProductionIncidentResponseReadinessInput = {}
): ProductionIncidentResponseReadinessResult {
  const operationsMonitoring = evaluateProductionOperationsMonitoringGate();
  const incidentItems = buildIncidentItems(operationsMonitoring);
  const blockingReasons = incidentItems
    .filter((incidentItem) => incidentItem.status !== "PASS")
    .map((incidentItem) => incidentItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production incident response approval has been granted.",
    "No incident response activation has been approved.",
    "No incident bridge has been activated for production launch.",
    "No on-call activation has been approved.",
    "No rollback authorization has been granted.",
    "No emergency rollback has been executed.",
    "No emergency hold has been released.",
    "No kill-switch activation has been executed.",
    "No customer communication has been released.",
    "No regulatory communication has been released.",
    "No public status page has been enabled.",
    "No support escalation has been activated.",
    "No production operations monitoring approval has been granted.",
    "No production monitoring, paging, or on-call activation has been approved.",
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
    "No public verification authority has been granted.",
    "No live external source has been contacted.",
    "No payment capture has been enabled.",
    "No borrower notice has been sent.",
    "No official report has been published.",
    "This gate is production incident response readiness review evidence only.",
  ];
  const review: ProductionIncidentResponseReadinessReview = {
    reviewId: `production-incident-response-readiness:${
      input.incidentScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_INCIDENT_RESPONSE_READINESS_BLOCKED",
    productionBlocked: true,
    incidentResponseApprovalGranted: false,
    incidentResponseActivated: false,
    incidentBridgeActivated: false,
    onCallActivated: false,
    rollbackAuthorized: false,
    emergencyRollbackExecuted: false,
    emergencyHoldReleased: false,
    killSwitchActivated: false,
    customerCommunicationsReleased: false,
    regulatoryCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    supportEscalationActivated: false,
    operationsMonitoringApprovalGranted: false,
    productionMonitoringActivated: false,
    productionCutoverApproved: false,
    productionCutoverExecuted: false,
    cutoverAuthorityGranted: false,
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
    operationsMonitoringVersion: PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    operationsMonitoringReviewCount:
      operationsMonitoring.productionOperationsMonitoringReviews.length,
    incidentItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
    operationsMonitoringVersion: PRODUCTION_OPERATIONS_MONITORING_GATE_VERSION,
    productionIncidentResponseReadinessReviews: [review],
    summary: {
      totalReviews: 1,
      totalIncidentItems: incidentItems.length,
      pass: incidentItems.filter(
        (incidentItem) => incidentItem.status === "PASS"
      ).length,
      reviewRequired: incidentItems.filter(
        (incidentItem) => incidentItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: incidentItems.filter(
        (incidentItem) => incidentItem.status === "BLOCKED"
      ).length,
      incidentResponseApprovalGranted: 0,
      incidentResponseActivated: 0,
      incidentBridgeActivated: 0,
      onCallActivated: 0,
      rollbackAuthorized: 0,
      emergencyRollbackExecuted: 0,
      emergencyHoldReleased: 0,
      killSwitchActivated: 0,
      customerCommunicationsReleased: 0,
      regulatoryCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
      supportEscalationActivated: 0,
      operationsMonitoringApprovalGranted: 0,
      productionMonitoringActivated: 0,
      productionCutoverApproved: 0,
      productionCutoverExecuted: 0,
      cutoverAuthorityGranted: 0,
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
    },
    disclosures,
    incidentPosture: "INCIDENT_RESPONSE_READINESS_BLOCKED_PENDING_FINAL_AUTHORITY",
  };
}
