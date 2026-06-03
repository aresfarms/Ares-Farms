import {
  PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
  evaluateProductionIncidentResponseReadinessGate,
} from "@/lib/governance/productionIncidentResponseReadinessGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Support Communications Readiness Gate
 *
 * Master Volume Governance:
 * - Vol 0: treats support and communications readiness as a platform-level
 *   operator review after incident response readiness and before any public or
 *   customer-facing production communication.
 * - Vol I: keeps support escalation, public status, customer communications,
 *   borrower notices, and production claims subordinate to constitutional
 *   governance and qualified human review.
 * - Vol II: prevents support evidence from becoming legal advice, adverse
 *   action notice delivery, public verification, payment capture, official
 *   report publication, partner commitment, agency commitment, or official
 *   reliance.
 * - Vol III: assembles deterministic, replay-safe evidence across support
 *   queues, communication templates, public status posture, escalation,
 *   accessibility, redaction, translation, audit, replay, and data-rights
 *   handoffs.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without activating support queues or releasing communications.
 * - Vol IV: supports support runbooks, customer-safe language, escalation
 *   routing, communications freeze, public status review, and evidence
 *   preservation.
 * - Vol V: preserves claims, controlled disclosure, portability, redaction,
 *   explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   public production exposure blocked until controlled promotion is complete.
 */

export const PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION =
  "production-support-communications-readiness-gate-v0.1.0";

export type ProductionSupportCommunicationsReadinessStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionSupportCommunicationsReadinessItem = {
  id: string;
  label: string;
  status: ProductionSupportCommunicationsReadinessStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionSupportCommunicationsReadinessReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_BLOCKED";
  productionBlocked: true;
  supportCommunicationsApprovalGranted: false;
  supportOperationsActivated: false;
  supportEscalationActivated: false;
  customerCommunicationsReleased: false;
  regulatoryCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  incidentResponseApprovalGranted: false;
  incidentResponseActivated: false;
  incidentBridgeActivated: false;
  rollbackAuthorized: false;
  emergencyRollbackExecuted: false;
  emergencyHoldReleased: false;
  killSwitchActivated: false;
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
  incidentResponseVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  incidentReadinessReviewCount: number;
  supportItems: ProductionSupportCommunicationsReadinessItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionSupportCommunicationsReadinessSummary = {
  totalReviews: number;
  totalSupportItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  supportCommunicationsApprovalGranted: number;
  supportOperationsActivated: number;
  supportEscalationActivated: number;
  customerCommunicationsReleased: number;
  regulatoryCommunicationsReleased: number;
  publicStatusPageEnabled: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
  incidentResponseApprovalGranted: number;
  incidentResponseActivated: number;
  incidentBridgeActivated: number;
  rollbackAuthorized: number;
  emergencyRollbackExecuted: number;
  emergencyHoldReleased: number;
  killSwitchActivated: number;
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
};

export type ProductionSupportCommunicationsReadinessInput = {
  supportScope?: string | null;
};

export type ProductionSupportCommunicationsReadinessResult = {
  version: string;
  incidentResponseVersion: string;
  productionSupportCommunicationsReadinessReviews: ProductionSupportCommunicationsReadinessReview[];
  summary: ProductionSupportCommunicationsReadinessSummary;
  disclosures: string[];
  supportPosture: "SUPPORT_COMMUNICATIONS_READINESS_BLOCKED_PENDING_FINAL_AUTHORITY";
};

function item(
  id: string,
  label: string,
  status: ProductionSupportCommunicationsReadinessStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionSupportCommunicationsReadinessItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function incidentResponseBlocksPreserved(
  incidentReadiness: ReturnType<typeof evaluateProductionIncidentResponseReadinessGate>
): boolean {
  return (
    incidentReadiness.summary.incidentResponseApprovalGranted === 0 &&
    incidentReadiness.summary.incidentResponseActivated === 0 &&
    incidentReadiness.summary.incidentBridgeActivated === 0 &&
    incidentReadiness.summary.rollbackAuthorized === 0 &&
    incidentReadiness.summary.emergencyRollbackExecuted === 0 &&
    incidentReadiness.summary.emergencyHoldReleased === 0 &&
    incidentReadiness.summary.killSwitchActivated === 0 &&
    incidentReadiness.summary.customerCommunicationsReleased === 0 &&
    incidentReadiness.summary.regulatoryCommunicationsReleased === 0 &&
    incidentReadiness.summary.publicStatusPageEnabled === 0 &&
    incidentReadiness.summary.supportEscalationActivated === 0 &&
    incidentReadiness.summary.cutoverAuthorityGranted === 0 &&
    incidentReadiness.summary.productionCutoverApproved === 0 &&
    incidentReadiness.summary.productionCutoverExecuted === 0 &&
    incidentReadiness.summary.deploymentExecuted === 0 &&
    incidentReadiness.summary.publicProductionApiExposureAllowed === 0 &&
    incidentReadiness.summary.productionPortalLaunchExecuted === 0 &&
    incidentReadiness.summary.liveExternalActionsAllowed === 0 &&
    incidentReadiness.summary.liveExternalActionsPerformed === 0 &&
    incidentReadiness.summary.paymentCaptureAllowed === 0 &&
    incidentReadiness.summary.borrowerNoticeSendsAllowed === 0 &&
    incidentReadiness.summary.officialReportsAllowed === 0 &&
    incidentReadiness.summary.publicVerificationAllowed === 0 &&
    incidentReadiness.summary.legalAdviceProvided === 0 &&
    incidentReadiness.summary.officialRelianceAllowed === 0
  );
}

function buildSupportItems(
  incidentReadiness: ReturnType<typeof evaluateProductionIncidentResponseReadinessGate>
): ProductionSupportCommunicationsReadinessItem[] {
  const incidentReadinessPreserved =
    incidentResponseBlocksPreserved(incidentReadiness);
  const incidentReadinessAttached =
    incidentReadiness.productionIncidentResponseReadinessReviews.length > 0 &&
    incidentReadinessPreserved;

  return [
    item(
      "master-volume-support-controls-attached",
      "Master Volume support and communications controls attached",
      "PASS",
      "Master Volume Series / support, communications, claims, redaction, accessibility, and evidence controls",
      "governance",
      null
    ),
    item(
      "production-incident-response-readiness-attached",
      "Production incident response readiness evidence attached",
      incidentReadinessAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION}:${incidentReadiness.incidentPosture}`,
      "operations",
      incidentReadinessAttached
        ? null
        : "Support communications readiness review requires blocked incident readiness evidence with zero production authority."
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
      "support-queue-routing-review",
      "Support queue routing review",
      "REVIEW_REQUIRED",
      "support queue routing and ownership packet",
      "support",
      "Support queue routing, accountable owners, triage boundaries, and handoff timing must be reviewed."
    ),
    item(
      "customer-safe-language-review",
      "Customer-safe language review",
      "REVIEW_REQUIRED",
      "borrower lender sponsor communication template packet",
      "support",
      "Borrower, lender, sponsor, and public-safe language must be reviewed for claims, reliance, and official-action boundaries."
    ),
    item(
      "public-status-page-review",
      "Public status page posture review",
      "REVIEW_REQUIRED",
      "public status page draft and freeze packet",
      "support",
      "Public status page language, activation authority, outage labels, and operational freeze controls must be reviewed."
    ),
    item(
      "notice-boundary-review",
      "Borrower notice and adverse-action boundary review",
      "REVIEW_REQUIRED",
      "notice boundary and adverse-action separation packet",
      "governance",
      "Support communications must remain separate from regulated notices, adverse action, official decisions, and official reports."
    ),
    item(
      "accessibility-translation-review",
      "Accessibility and translation review",
      "REVIEW_REQUIRED",
      "accessibility translation and plain-language packet",
      "support",
      "Accessibility, plain-language, translation, and channel-specific communication requirements must be reviewed."
    ),
    item(
      "redaction-data-rights-review",
      "Redaction and data-rights handoff review",
      "REVIEW_REQUIRED",
      "redaction data-rights portability and privacy packet",
      "governance",
      "PII redaction, data-rights routing, portability, retention, and privacy boundaries must be reviewed."
    ),
    item(
      "support-escalation-runbook-review",
      "Support escalation runbook review",
      "REVIEW_REQUIRED",
      "support escalation incident handoff and executive escalation packet",
      "support",
      "Support escalation, incident handoff, executive escalation, and emergency communications boundaries must be reviewed."
    ),
    item(
      "audit-replay-evidence-review",
      "Audit, replay, and communications evidence review",
      "REVIEW_REQUIRED",
      "communications audit replay and evidence export packet",
      "governance",
      "Communications evidence, replay references, audit export, retention, and evidence packet boundaries must be reviewed."
    ),
    item(
      "support-communications-approval",
      "Production support communications approval",
      "BLOCKED",
      "support communications approval record",
      "support",
      "Production support communications approval has not been granted."
    ),
    item(
      "support-operations-activation",
      "Support operations activation",
      "BLOCKED",
      "support operations activation record",
      "support",
      "Production support operations and support escalation have not been approved or activated."
    ),
    item(
      "customer-communications-release",
      "Customer communications release",
      "BLOCKED",
      "customer communications release record",
      "support",
      "Customer communications, regulatory communications, and public status page activation have not been approved or released."
    ),
    item(
      "regulated-communications-live-actions",
      "Regulated communications and live actions remain disabled",
      "BLOCKED",
      "notice report payment public verification and live-action records",
      "governance",
      "Borrower notice sends, official reports, public verification, payment capture, legal advice, official reliance, and live external actions remain blocked."
    ),
    item(
      "production-cutover-deployment-public-exposure",
      "Production cutover, deployment, and public exposure remain disabled",
      "BLOCKED",
      "cutover deployment DNS public API and portal launch records",
      "governance",
      "Production cutover, deployment, DNS cutover, public production API exposure, and production portal launch remain blocked."
    ),
  ];
}

export function evaluateProductionSupportCommunicationsReadinessGate(
  input: ProductionSupportCommunicationsReadinessInput = {}
): ProductionSupportCommunicationsReadinessResult {
  const incidentReadiness = evaluateProductionIncidentResponseReadinessGate();
  const supportItems = buildSupportItems(incidentReadiness);
  const blockingReasons = supportItems
    .filter((supportItem) => supportItem.status !== "PASS")
    .map((supportItem) => supportItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No production support communications approval has been granted.",
    "No support operations activation has been approved.",
    "No support escalation has been activated.",
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
    "No production operations monitoring approval has been granted.",
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
    "This gate is production support communications readiness review evidence only.",
  ];
  const review: ProductionSupportCommunicationsReadinessReview = {
    reviewId: `production-support-communications-readiness:${
      input.supportScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_BLOCKED",
    productionBlocked: true,
    supportCommunicationsApprovalGranted: false,
    supportOperationsActivated: false,
    supportEscalationActivated: false,
    customerCommunicationsReleased: false,
    regulatoryCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    incidentResponseApprovalGranted: false,
    incidentResponseActivated: false,
    incidentBridgeActivated: false,
    rollbackAuthorized: false,
    emergencyRollbackExecuted: false,
    emergencyHoldReleased: false,
    killSwitchActivated: false,
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
    incidentResponseVersion:
      PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    incidentReadinessReviewCount:
      incidentReadiness.productionIncidentResponseReadinessReviews.length,
    supportItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
    incidentResponseVersion:
      PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE_VERSION,
    productionSupportCommunicationsReadinessReviews: [review],
    summary: {
      totalReviews: 1,
      totalSupportItems: supportItems.length,
      pass: supportItems.filter(
        (supportItem) => supportItem.status === "PASS"
      ).length,
      reviewRequired: supportItems.filter(
        (supportItem) => supportItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: supportItems.filter(
        (supportItem) => supportItem.status === "BLOCKED"
      ).length,
      supportCommunicationsApprovalGranted: 0,
      supportOperationsActivated: 0,
      supportEscalationActivated: 0,
      customerCommunicationsReleased: 0,
      regulatoryCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
      incidentResponseApprovalGranted: 0,
      incidentResponseActivated: 0,
      incidentBridgeActivated: 0,
      rollbackAuthorized: 0,
      emergencyRollbackExecuted: 0,
      emergencyHoldReleased: 0,
      killSwitchActivated: 0,
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
    },
    disclosures,
    supportPosture:
      "SUPPORT_COMMUNICATIONS_READINESS_BLOCKED_PENDING_FINAL_AUTHORITY",
  };
}
