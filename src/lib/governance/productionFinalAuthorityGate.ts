import {
  PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
  evaluateProductionSupportCommunicationsReadinessGate,
} from "@/lib/governance/productionSupportCommunicationsReadinessGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Final Authority Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives the platform one final authority review surface before any
 *   production go-live, public exposure, customer communication, or live action.
 * - Vol I: keeps final launch authority subordinate to constitutional
 *   governance, qualified ownership, human review, and documented supremacy.
 * - Vol II: prevents final authority evidence from becoming legal advice,
 *   official reports, adverse-action notice delivery, payment capture, public
 *   verification, partner commitment, agency commitment, or official reliance.
 * - Vol III: assembles deterministic, replay-safe final authority evidence
 *   across launch, deployment, cutover, release board, operations, incident,
 *   support, communications, audit, privacy, redaction, claims, and data rights.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without releasing holds or activating production systems.
 * - Vol IV: supports final go/no-go review, executive escalation, release
 *   ownership, rollback readiness, support readiness, and evidence retention.
 * - Vol V: preserves content claims, controlled disclosure, replayability,
 *   explainability, portability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   public production exposure blocked until a separate approved activation.
 */

export const PRODUCTION_FINAL_AUTHORITY_GATE_VERSION =
  "production-final-authority-gate-v0.1.0";

export type ProductionFinalAuthorityStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionFinalAuthorityItem = {
  id: string;
  label: string;
  status: ProductionFinalAuthorityStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionFinalAuthorityReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_FINAL_AUTHORITY_BLOCKED";
  productionBlocked: true;
  finalAuthorityApprovalGranted: false;
  goLiveApproved: false;
  productionLaunchAuthorized: false;
  constitutionalOfficerAttestationReceived: false;
  qualifiedReleaseManagerApprovalGranted: false;
  supportCommunicationsApprovalGranted: false;
  supportOperationsActivated: false;
  supportEscalationActivated: false;
  customerCommunicationsReleased: false;
  regulatoryCommunicationsReleased: false;
  publicStatusPageEnabled: false;
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
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  publicVerificationAllowed: false;
  legalAdviceProvided: false;
  officialRelianceAllowed: false;
  supportCommunicationsReadinessVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  supportReadinessReviewCount: number;
  authorityItems: ProductionFinalAuthorityItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionFinalAuthoritySummary = {
  totalReviews: number;
  totalAuthorityItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  finalAuthorityApprovalGranted: number;
  goLiveApproved: number;
  productionLaunchAuthorized: number;
  constitutionalOfficerAttestationReceived: number;
  qualifiedReleaseManagerApprovalGranted: number;
  supportCommunicationsApprovalGranted: number;
  supportOperationsActivated: number;
  supportEscalationActivated: number;
  customerCommunicationsReleased: number;
  regulatoryCommunicationsReleased: number;
  publicStatusPageEnabled: number;
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
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  publicVerificationAllowed: number;
  legalAdviceProvided: number;
  officialRelianceAllowed: number;
};

export type ProductionFinalAuthorityInput = {
  authorityScope?: string | null;
};

export type ProductionFinalAuthorityResult = {
  version: string;
  supportCommunicationsReadinessVersion: string;
  productionFinalAuthorityReviews: ProductionFinalAuthorityReview[];
  summary: ProductionFinalAuthoritySummary;
  disclosures: string[];
  authorityPosture: "FINAL_AUTHORITY_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionFinalAuthorityStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionFinalAuthorityItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function supportReadinessBlocksPreserved(
  supportReadiness: ReturnType<
    typeof evaluateProductionSupportCommunicationsReadinessGate
  >
): boolean {
  return (
    supportReadiness.summary.supportCommunicationsApprovalGranted === 0 &&
    supportReadiness.summary.supportOperationsActivated === 0 &&
    supportReadiness.summary.supportEscalationActivated === 0 &&
    supportReadiness.summary.customerCommunicationsReleased === 0 &&
    supportReadiness.summary.regulatoryCommunicationsReleased === 0 &&
    supportReadiness.summary.publicStatusPageEnabled === 0 &&
    supportReadiness.summary.borrowerNoticeSendsAllowed === 0 &&
    supportReadiness.summary.officialReportsAllowed === 0 &&
    supportReadiness.summary.publicVerificationAllowed === 0 &&
    supportReadiness.summary.legalAdviceProvided === 0 &&
    supportReadiness.summary.officialRelianceAllowed === 0 &&
    supportReadiness.summary.incidentResponseActivated === 0 &&
    supportReadiness.summary.incidentBridgeActivated === 0 &&
    supportReadiness.summary.rollbackAuthorized === 0 &&
    supportReadiness.summary.emergencyRollbackExecuted === 0 &&
    supportReadiness.summary.emergencyHoldReleased === 0 &&
    supportReadiness.summary.killSwitchActivated === 0 &&
    supportReadiness.summary.cutoverAuthorityGranted === 0 &&
    supportReadiness.summary.productionCutoverApproved === 0 &&
    supportReadiness.summary.productionCutoverExecuted === 0 &&
    supportReadiness.summary.launchHoldReleased === 0 &&
    supportReadiness.summary.deploymentHoldReleased === 0 &&
    supportReadiness.summary.freezeHoldReleased === 0 &&
    supportReadiness.summary.deploymentExecuted === 0 &&
    supportReadiness.summary.productionSecretsActivated === 0 &&
    supportReadiness.summary.publicDnsCutoverAllowed === 0 &&
    supportReadiness.summary.databaseMigrationAllowed === 0 &&
    supportReadiness.summary.publicProductionApiExposureAllowed === 0 &&
    supportReadiness.summary.productionPortalLaunchExecuted === 0 &&
    supportReadiness.summary.liveExternalActionsAllowed === 0 &&
    supportReadiness.summary.liveExternalActionsPerformed === 0 &&
    supportReadiness.summary.paymentCaptureAllowed === 0
  );
}

function buildAuthorityItems(
  supportReadiness: ReturnType<
    typeof evaluateProductionSupportCommunicationsReadinessGate
  >
): ProductionFinalAuthorityItem[] {
  const supportBlocksPreserved =
    supportReadinessBlocksPreserved(supportReadiness);
  const supportReadinessAttached =
    supportReadiness.productionSupportCommunicationsReadinessReviews.length >
      0 && supportBlocksPreserved;

  return [
    item(
      "master-volume-final-authority-controls-attached",
      "Master Volume final authority controls attached",
      "PASS",
      "Master Volume Series / final authority, production launch, public exposure, claims, and live-action controls",
      "governance",
      null
    ),
    item(
      "production-support-communications-readiness-attached",
      "Production support communications readiness evidence attached",
      supportReadinessAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION}:${supportReadiness.supportPosture}`,
      "support",
      supportReadinessAttached
        ? null
        : "Final authority review requires blocked support communications readiness evidence with zero production authority."
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
      "constitutional-authority-review",
      "Constitutional authority review",
      "REVIEW_REQUIRED",
      "constitutional officer final authority packet",
      "governance",
      "A qualified constitutional authority review must confirm no Master Volume conflict before any separate go-live approval."
    ),
    item(
      "qualified-release-manager-review",
      "Qualified release manager review",
      "REVIEW_REQUIRED",
      "qualified release manager final go/no-go packet",
      "release",
      "A qualified release manager must review the final launch packet without granting authority in this evidence surface."
    ),
    item(
      "legal-regulatory-boundary-review",
      "Legal and regulatory boundary review",
      "REVIEW_REQUIRED",
      "legal regulatory disclosure and official-reliance boundary packet",
      "governance",
      "Final authority evidence must remain separate from legal advice, official reliance, notices, official reports, and partner or agency commitments."
    ),
    item(
      "security-production-exposure-review",
      "Security and production exposure review",
      "REVIEW_REQUIRED",
      "secrets DNS CDN TLS WAF public API and portal exposure packet",
      "security",
      "Secrets, DNS, CDN, TLS, WAF, public API, and portal exposure controls require final review before any separate activation."
    ),
    item(
      "data-rights-privacy-redaction-review",
      "Data rights, privacy, and redaction review",
      "REVIEW_REQUIRED",
      "data rights privacy redaction and retention packet",
      "governance",
      "Data-rights, privacy, redaction, retention, and public DTO boundaries must be reviewed before any production launch."
    ),
    item(
      "public-claims-copy-review",
      "Public claims and launch copy review",
      "REVIEW_REQUIRED",
      "public copy content claims and customer-safe language packet",
      "governance",
      "Public copy, status labels, borrower-safe language, lender-ready language, and sponsor language must be reviewed before external release."
    ),
    item(
      "support-communications-freeze-review",
      "Support and communications freeze review",
      "REVIEW_REQUIRED",
      "support queue routing status page communications freeze and escalation packet",
      "support",
      "Support routing, communications freeze, public status posture, and escalation owners must be reviewed before any launch authority."
    ),
    item(
      "monitoring-incident-rollback-review",
      "Monitoring, incident, rollback, and emergency hold review",
      "REVIEW_REQUIRED",
      "monitoring incident rollback emergency hold and kill-switch packet",
      "operations",
      "Monitoring, incident response, rollback, emergency hold, and kill-switch evidence must be reviewed before launch authority."
    ),
    item(
      "audit-replay-evidence-review",
      "Audit, replay, and evidence retention review",
      "REVIEW_REQUIRED",
      "audit replay observability evidence export and retention packet",
      "governance",
      "Final authority evidence must remain replay-safe, observable, classified, retained, and exportable for audit review."
    ),
    item(
      "final-authority-approval",
      "Final authority approval",
      "BLOCKED",
      "final authority approval record",
      "governance",
      "Final production authority approval has not been granted."
    ),
    item(
      "go-live-authorization",
      "Go-live authorization",
      "BLOCKED",
      "go-live authorization record",
      "release",
      "Go-live approval and production launch authorization have not been granted."
    ),
    item(
      "hold-release-authority",
      "Launch, deployment, and freeze hold release authority",
      "BLOCKED",
      "launch hold deployment hold and freeze hold records",
      "release",
      "Launch hold, deployment hold, and release-candidate freeze hold remain unreleased."
    ),
    item(
      "deployment-and-public-exposure",
      "Deployment and public production exposure",
      "BLOCKED",
      "deployment DNS database public API and production portal launch records",
      "platform",
      "Deployment, secrets, DNS cutover, database migration, public API exposure, and production portal launch remain blocked."
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

export function evaluateProductionFinalAuthorityGate(
  input: ProductionFinalAuthorityInput = {}
): ProductionFinalAuthorityResult {
  const supportReadiness =
    evaluateProductionSupportCommunicationsReadinessGate();
  const authorityItems = buildAuthorityItems(supportReadiness);
  const blockingReasons = authorityItems
    .filter((authorityItem) => authorityItem.status !== "PASS")
    .map((authorityItem) => authorityItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No final production authority approval has been granted.",
    "No go-live approval has been granted.",
    "No production launch authorization has been granted.",
    "No constitutional officer final attestation has been received.",
    "No qualified release manager final approval has been granted.",
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
    "This gate is final production authority review evidence only.",
  ];
  const review: ProductionFinalAuthorityReview = {
    reviewId: `production-final-authority:${input.authorityScope ?? "platform"}`,
    reviewStatus: "PRODUCTION_FINAL_AUTHORITY_BLOCKED",
    productionBlocked: true,
    finalAuthorityApprovalGranted: false,
    goLiveApproved: false,
    productionLaunchAuthorized: false,
    constitutionalOfficerAttestationReceived: false,
    qualifiedReleaseManagerApprovalGranted: false,
    supportCommunicationsApprovalGranted: false,
    supportOperationsActivated: false,
    supportEscalationActivated: false,
    customerCommunicationsReleased: false,
    regulatoryCommunicationsReleased: false,
    publicStatusPageEnabled: false,
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
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    publicVerificationAllowed: false,
    legalAdviceProvided: false,
    officialRelianceAllowed: false,
    supportCommunicationsReadinessVersion:
      PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    supportReadinessReviewCount:
      supportReadiness.productionSupportCommunicationsReadinessReviews.length,
    authorityItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_FINAL_AUTHORITY_GATE_VERSION,
    supportCommunicationsReadinessVersion:
      PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_GATE_VERSION,
    productionFinalAuthorityReviews: [review],
    summary: {
      totalReviews: 1,
      totalAuthorityItems: authorityItems.length,
      pass: authorityItems.filter(
        (authorityItem) => authorityItem.status === "PASS"
      ).length,
      reviewRequired: authorityItems.filter(
        (authorityItem) => authorityItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: authorityItems.filter(
        (authorityItem) => authorityItem.status === "BLOCKED"
      ).length,
      finalAuthorityApprovalGranted: 0,
      goLiveApproved: 0,
      productionLaunchAuthorized: 0,
      constitutionalOfficerAttestationReceived: 0,
      qualifiedReleaseManagerApprovalGranted: 0,
      supportCommunicationsApprovalGranted: 0,
      supportOperationsActivated: 0,
      supportEscalationActivated: 0,
      customerCommunicationsReleased: 0,
      regulatoryCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
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
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      publicVerificationAllowed: 0,
      legalAdviceProvided: 0,
      officialRelianceAllowed: 0,
    },
    disclosures,
    authorityPosture: "FINAL_AUTHORITY_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
