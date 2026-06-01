import {
  PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
  evaluateProductionRegulatoryExaminationGate,
} from "@/lib/governance/productionRegulatoryExaminationGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Regulatory Response and Corrective Action Gate
 *
 * Master Volume Governance:
 * - Vol 0: keeps regulator response and corrective-action posture as an
 *   institutional evidence surface after examination/archive review.
 * - Vol I: keeps response authority subordinate to constitutional governance,
 *   qualified legal/compliance ownership, and recorded human review.
 * - Vol II: prevents examiner responses, corrective-action language, or
 *   remediation posture from becoming legal advice, official reliance,
 *   public verification, official reports, notices, commitments, or filings.
 * - Vol III: assembles replay-safe evidence across examination findings,
 *   audit/replay records, retention, legal hold, redaction, source authority,
 *   reports, notices, payments, communications, and live-action limits.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without issuing any official regulator response.
 * - Vol IV: supports examiner finding intake, corrective-action tracking,
 *   remediation review, exception handling, incident handoff, and evidence
 *   preservation.
 * - Vol V: preserves content claims, controlled disclosure, replayability,
 *   explainability, portability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   external-source authority blocked until separately approved.
 */

export const PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION =
  "production-regulatory-response-gate-v0.1.0";

export type ProductionRegulatoryResponseStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionRegulatoryResponseItem = {
  id: string;
  label: string;
  status: ProductionRegulatoryResponseStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionRegulatoryResponseReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_REGULATORY_RESPONSE_BLOCKED";
  productionBlocked: true;
  regulatoryResponsePackageApproved: false;
  officialRegulatorResponseIssued: false;
  correctiveActionPlanApproved: false;
  correctiveActionCommitted: false;
  correctiveActionExecuted: false;
  remediationPlanApproved: false;
  remediationExecuted: false;
  examinerFindingClosed: false;
  externalExaminerDisclosureApproved: false;
  legalHoldReleased: false;
  productionRelianceApprovalGranted: false;
  publicVerificationApprovalGranted: false;
  regulatoryRelianceAllowed: false;
  officialRelianceAllowed: false;
  legalAdviceProvided: false;
  regulatoryExaminationPackageSubmitted: false;
  examinationArchiveCertified: false;
  productionHealthCertified: false;
  productionActivationExecuted: false;
  goLiveApproved: false;
  productionLaunchAuthorized: false;
  deploymentExecuted: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  databaseMigrationAllowed: false;
  publicProductionApiExposureAllowed: false;
  productionPortalLaunchExecuted: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  customerCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  productionRegulatoryExaminationVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  regulatoryExaminationReviewCount: number;
  responseItems: ProductionRegulatoryResponseItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionRegulatoryResponseSummary = {
  totalReviews: number;
  totalResponseItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  regulatoryResponsePackageApproved: number;
  officialRegulatorResponseIssued: number;
  correctiveActionPlanApproved: number;
  correctiveActionCommitted: number;
  correctiveActionExecuted: number;
  remediationPlanApproved: number;
  remediationExecuted: number;
  examinerFindingClosed: number;
  externalExaminerDisclosureApproved: number;
  legalHoldReleased: number;
  productionRelianceApprovalGranted: number;
  publicVerificationApprovalGranted: number;
  regulatoryRelianceAllowed: number;
  officialRelianceAllowed: number;
  legalAdviceProvided: number;
  regulatoryExaminationPackageSubmitted: number;
  examinationArchiveCertified: number;
  productionHealthCertified: number;
  productionActivationExecuted: number;
  goLiveApproved: number;
  productionLaunchAuthorized: number;
  deploymentExecuted: number;
  productionSecretsActivated: number;
  publicDnsCutoverAllowed: number;
  databaseMigrationAllowed: number;
  publicProductionApiExposureAllowed: number;
  productionPortalLaunchExecuted: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  customerCommunicationsReleased: number;
  publicStatusPageEnabled: number;
};

export type ProductionRegulatoryResponseInput = {
  responseScope?: string | null;
};

export type ProductionRegulatoryResponseResult = {
  version: string;
  productionRegulatoryExaminationVersion: string;
  productionRegulatoryResponseReviews: ProductionRegulatoryResponseReview[];
  summary: ProductionRegulatoryResponseSummary;
  disclosures: string[];
  responsePosture: "PRODUCTION_REGULATORY_RESPONSE_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionRegulatoryResponseStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionRegulatoryResponseItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function regulatoryExaminationBlocksPreserved(
  regulatoryExamination: ReturnType<
    typeof evaluateProductionRegulatoryExaminationGate
  >
): boolean {
  return (
    regulatoryExamination.summary.regulatoryExaminationPackageApproved === 0 &&
    regulatoryExamination.summary.regulatoryExaminationPackageSubmitted === 0 &&
    regulatoryExamination.summary.regulatorPortalUploadAllowed === 0 &&
    regulatoryExamination.summary.regulatoryResponseIssued === 0 &&
    regulatoryExamination.summary.examinationArchiveCertified === 0 &&
    regulatoryExamination.summary.evidenceRetentionCertified === 0 &&
    regulatoryExamination.summary.legalHoldReleased === 0 &&
    regulatoryExamination.summary.externalExaminerDisclosureApproved === 0 &&
    regulatoryExamination.summary.productionRelianceApprovalGranted === 0 &&
    regulatoryExamination.summary.publicVerificationApprovalGranted === 0 &&
    regulatoryExamination.summary.regulatoryRelianceAllowed === 0 &&
    regulatoryExamination.summary.officialRelianceAllowed === 0 &&
    regulatoryExamination.summary.legalAdviceProvided === 0 &&
    regulatoryExamination.summary.productionHealthCertified === 0 &&
    regulatoryExamination.summary.productionActivationExecuted === 0 &&
    regulatoryExamination.summary.goLiveApproved === 0 &&
    regulatoryExamination.summary.productionLaunchAuthorized === 0 &&
    regulatoryExamination.summary.deploymentExecuted === 0 &&
    regulatoryExamination.summary.publicProductionApiExposureAllowed === 0 &&
    regulatoryExamination.summary.productionPortalLaunchExecuted === 0 &&
    regulatoryExamination.summary.liveExternalActionsPerformed === 0 &&
    regulatoryExamination.summary.paymentCaptureAllowed === 0 &&
    regulatoryExamination.summary.borrowerNoticeSendsAllowed === 0 &&
    regulatoryExamination.summary.officialReportsAllowed === 0 &&
    regulatoryExamination.summary.customerCommunicationsReleased === 0 &&
    regulatoryExamination.summary.publicStatusPageEnabled === 0
  );
}

function buildResponseItems(
  regulatoryExamination: ReturnType<
    typeof evaluateProductionRegulatoryExaminationGate
  >
): ProductionRegulatoryResponseItem[] {
  const examinationPreserved =
    regulatoryExaminationBlocksPreserved(regulatoryExamination);
  const examinationEvidenceAttached =
    regulatoryExamination.productionRegulatoryExaminationReviews.length > 0 &&
    examinationPreserved;

  return [
    item(
      "master-volume-response-controls-attached",
      "Master Volume regulatory response and corrective-action controls attached",
      "PASS",
      "Master Volume Series / regulator response, corrective-action, remediation, legal hold, audit, replay, redaction, claims, source authority, and controlled disclosure boundaries",
      "governance",
      null
    ),
    item(
      "regulatory-examination-evidence-attached",
      "Regulatory examination and archive evidence attached",
      examinationEvidenceAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION}:${regulatoryExamination.examinationPosture}`,
      "governance",
      examinationEvidenceAttached
        ? null
        : "Regulatory response review requires blocked regulatory examination evidence with zero regulator submission, zero official response, zero archive certification, zero public verification, zero official reliance, and zero legal advice."
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
      "examiner-finding-intake-review",
      "Examiner finding intake review",
      "REVIEW_REQUIRED",
      "examiner finding intake issue taxonomy owner assignment response deadline and severity packet",
      "compliance",
      "Examiner findings, issue taxonomy, ownership, deadlines, severity, and response routing must be reviewed before any separate response."
    ),
    item(
      "corrective-action-plan-review",
      "Corrective-action plan review",
      "REVIEW_REQUIRED",
      "corrective action plan scope accountable owner due date risk impact and qualified reviewer packet",
      "compliance",
      "Corrective-action scope, accountable owner, due date, risk impact, and qualified reviewer authority must be reviewed before any commitment."
    ),
    item(
      "remediation-evidence-review",
      "Remediation evidence review",
      "REVIEW_REQUIRED",
      "remediation evidence test proof replay refs validation scope and closure criteria packet",
      "governance",
      "Remediation evidence, test proof, replay references, validation scope, and closure criteria must be reviewed before remediation closure."
    ),
    item(
      "legal-compliance-response-review",
      "Legal and compliance response review",
      "REVIEW_REQUIRED",
      "legal compliance response language authority escalation and non-advice boundary packet",
      "compliance",
      "Legal/compliance response language, authority, escalation, and non-advice boundaries must be reviewed without providing legal advice."
    ),
    item(
      "audit-replay-response-evidence-review",
      "Audit and replay response evidence review",
      "REVIEW_REQUIRED",
      "audit export replay export observability lineage deterministic evidence and reproducibility packet",
      "governance",
      "Audit export, replay export, observability lineage, deterministic evidence, and reproducibility must be reviewed before any response package approval."
    ),
    item(
      "privacy-redaction-public-records-review",
      "Privacy, redaction, and public-records review",
      "REVIEW_REQUIRED",
      "privacy redaction public records FOIA data rights controlled disclosure and examiner disclosure packet",
      "governance",
      "Privacy, redaction, public-records, data rights, controlled disclosure, and examiner disclosure boundaries must be reviewed."
    ),
    item(
      "source-report-notice-payment-live-action-boundary-review",
      "Source, report, notice, payment, and live-action boundary review",
      "REVIEW_REQUIRED",
      "source authority official report notice payment public verification legal reliance and live-action boundary packet",
      "governance",
      "Source authority, official reports, notices, payments, public verification, legal advice, official reliance, and live external actions must remain blocked."
    ),
    item(
      "regulatory-response-package-approval",
      "Regulatory response package approval",
      "BLOCKED",
      "regulatory response package approval record",
      "compliance",
      "Regulatory response package approval has not been granted."
    ),
    item(
      "official-regulator-response",
      "Official regulator response issuance",
      "BLOCKED",
      "official regulator response issuance record",
      "compliance",
      "No official regulator response has been issued."
    ),
    item(
      "corrective-action-commitment-execution",
      "Corrective-action commitment or execution",
      "BLOCKED",
      "corrective action commitment approval execution and external disclosure record",
      "compliance",
      "No corrective action plan has been approved, committed, or executed."
    ),
    item(
      "remediation-closure-finding-closure",
      "Remediation or examiner finding closure",
      "BLOCKED",
      "remediation approval execution closure and examiner finding closure record",
      "governance",
      "No remediation plan has been approved, no remediation has been executed, and no examiner finding has been closed."
    ),
    item(
      "public-verification-official-reliance-legal-advice",
      "Public verification, official reliance, and legal advice remain blocked",
      "BLOCKED",
      "public verification official reliance legal advice report notice payment and live-action records",
      "governance",
      "Public verification, official reliance, legal advice, official reports, notices, payments, and live external actions remain blocked."
    ),
  ];
}

export function evaluateProductionRegulatoryResponseGate(
  input: ProductionRegulatoryResponseInput = {}
): ProductionRegulatoryResponseResult {
  const regulatoryExamination = evaluateProductionRegulatoryExaminationGate();
  const responseItems = buildResponseItems(regulatoryExamination);
  const blockingReasons = responseItems
    .filter((responseItem) => responseItem.status !== "PASS")
    .map((responseItem) => responseItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No regulatory response package has been approved.",
    "No official regulator response has been issued.",
    "No corrective action plan has been approved.",
    "No corrective action has been committed.",
    "No corrective action has been executed.",
    "No remediation plan has been approved.",
    "No remediation has been executed.",
    "No examiner finding has been closed.",
    "No external examiner disclosure has been approved.",
    "No legal hold has been released.",
    "No production reliance approval has been granted.",
    "No public verification authority has been granted.",
    "No regulatory reliance has been authorized.",
    "No official reliance has been created.",
    "No legal advice has been provided.",
    "No regulatory examination package has been submitted.",
    "No evidence archive has been certified.",
    "No production health has been certified.",
    "No production activation has been executed.",
    "No go-live approval has been granted.",
    "No production launch authorization has been granted.",
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
    "This gate is regulatory response and corrective-action review evidence only.",
  ];
  const review: ProductionRegulatoryResponseReview = {
    reviewId: `production-regulatory-response:${
      input.responseScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_REGULATORY_RESPONSE_BLOCKED",
    productionBlocked: true,
    regulatoryResponsePackageApproved: false,
    officialRegulatorResponseIssued: false,
    correctiveActionPlanApproved: false,
    correctiveActionCommitted: false,
    correctiveActionExecuted: false,
    remediationPlanApproved: false,
    remediationExecuted: false,
    examinerFindingClosed: false,
    externalExaminerDisclosureApproved: false,
    legalHoldReleased: false,
    productionRelianceApprovalGranted: false,
    publicVerificationApprovalGranted: false,
    regulatoryRelianceAllowed: false,
    officialRelianceAllowed: false,
    legalAdviceProvided: false,
    regulatoryExaminationPackageSubmitted: false,
    examinationArchiveCertified: false,
    productionHealthCertified: false,
    productionActivationExecuted: false,
    goLiveApproved: false,
    productionLaunchAuthorized: false,
    deploymentExecuted: false,
    productionSecretsActivated: false,
    publicDnsCutoverAllowed: false,
    databaseMigrationAllowed: false,
    publicProductionApiExposureAllowed: false,
    productionPortalLaunchExecuted: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    customerCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    productionRegulatoryExaminationVersion:
      PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    regulatoryExaminationReviewCount:
      regulatoryExamination.productionRegulatoryExaminationReviews.length,
    responseItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_REGULATORY_RESPONSE_GATE_VERSION,
    productionRegulatoryExaminationVersion:
      PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
    productionRegulatoryResponseReviews: [review],
    summary: {
      totalReviews: 1,
      totalResponseItems: responseItems.length,
      pass: responseItems.filter(
        (responseItem) => responseItem.status === "PASS"
      ).length,
      reviewRequired: responseItems.filter(
        (responseItem) => responseItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: responseItems.filter(
        (responseItem) => responseItem.status === "BLOCKED"
      ).length,
      regulatoryResponsePackageApproved: 0,
      officialRegulatorResponseIssued: 0,
      correctiveActionPlanApproved: 0,
      correctiveActionCommitted: 0,
      correctiveActionExecuted: 0,
      remediationPlanApproved: 0,
      remediationExecuted: 0,
      examinerFindingClosed: 0,
      externalExaminerDisclosureApproved: 0,
      legalHoldReleased: 0,
      productionRelianceApprovalGranted: 0,
      publicVerificationApprovalGranted: 0,
      regulatoryRelianceAllowed: 0,
      officialRelianceAllowed: 0,
      legalAdviceProvided: 0,
      regulatoryExaminationPackageSubmitted: 0,
      examinationArchiveCertified: 0,
      productionHealthCertified: 0,
      productionActivationExecuted: 0,
      goLiveApproved: 0,
      productionLaunchAuthorized: 0,
      deploymentExecuted: 0,
      productionSecretsActivated: 0,
      publicDnsCutoverAllowed: 0,
      databaseMigrationAllowed: 0,
      publicProductionApiExposureAllowed: 0,
      productionPortalLaunchExecuted: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      customerCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
    },
    disclosures,
    responsePosture:
      "PRODUCTION_REGULATORY_RESPONSE_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
