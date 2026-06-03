import {
  PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
  evaluateProductionRelianceVerificationGate,
} from "@/lib/governance/productionRelianceVerificationGate";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Production Regulatory Examination and Evidence Archive Gate
 *
 * Master Volume Governance:
 * - Vol 0: keeps regulatory examination posture as an institutional evidence
 *   surface after reliance/public-verification boundary review.
 * - Vol I: keeps examination submission authority subordinate to
 *   constitutional governance, qualified legal/compliance ownership, and
 *   recorded human review.
 * - Vol II: prevents examination packets, archive evidence, or regulatory
 *   communication posture from becoming legal advice, official reliance,
 *   public verification, official reports, notices, commitments, or filings.
 * - Vol III: assembles replay-safe evidence across reliance boundaries,
 *   audit exports, replay exports, retention, redaction, source authority,
 *   reports, notices, payments, communications, and live-action limits.
 * - Vol III-B: exposes version, classification, observability, and runtime
 *   posture without submitting anything to a regulator.
 * - Vol IV: supports examination preparation, archive readiness, legal hold,
 *   incident handoff, exception remediation, and evidence preservation.
 * - Vol V: preserves content claims, controlled disclosure, replayability,
 *   explainability, portability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTOs, portable surfaces, and
 *   external-source authority blocked until separately approved.
 */

export const PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION =
  "production-regulatory-examination-gate-v0.1.0";

export type ProductionRegulatoryExaminationStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type ProductionRegulatoryExaminationItem = {
  id: string;
  label: string;
  status: ProductionRegulatoryExaminationStatus;
  evidenceRef: string;
  responsibleOwner: string;
  blockingReason: string | null;
};

export type ProductionRegulatoryExaminationReview = {
  reviewId: string;
  reviewStatus: "PRODUCTION_REGULATORY_EXAMINATION_BLOCKED";
  productionBlocked: true;
  regulatoryExaminationPackageApproved: false;
  regulatoryExaminationPackageSubmitted: false;
  regulatorPortalUploadAllowed: false;
  regulatoryResponseIssued: false;
  examinationArchiveCertified: false;
  evidenceRetentionCertified: false;
  legalHoldReleased: false;
  externalExaminerDisclosureApproved: false;
  productionRelianceApprovalGranted: false;
  publicVerificationApprovalGranted: false;
  publicVerificationGatewayOperational: false;
  publicVerificationArtifactPublished: false;
  regulatoryRelianceAllowed: false;
  officialRelianceAllowed: false;
  legalAdviceProvided: false;
  postActivationVerificationApprovalGranted: false;
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
  liveExternalActionAllowed: false;
  liveExternalActionPerformed: false;
  paymentCaptureAllowed: false;
  borrowerNoticeSendAllowed: false;
  officialReportPublicationAllowed: false;
  customerCommunicationsReleased: false;
  publicStatusPageEnabled: false;
  productionRelianceVersion: string;
  moduleCount: number;
  portableSurfaceCount: number;
  productionRelianceReviewCount: number;
  examinationItems: ProductionRegulatoryExaminationItem[];
  blockingReasons: string[];
  disclosures: string[];
};

export type ProductionRegulatoryExaminationSummary = {
  totalReviews: number;
  totalExaminationItems: number;
  pass: number;
  reviewRequired: number;
  blocked: number;
  regulatoryExaminationPackageApproved: number;
  regulatoryExaminationPackageSubmitted: number;
  regulatorPortalUploadAllowed: number;
  regulatoryResponseIssued: number;
  examinationArchiveCertified: number;
  evidenceRetentionCertified: number;
  legalHoldReleased: number;
  externalExaminerDisclosureApproved: number;
  productionRelianceApprovalGranted: number;
  publicVerificationApprovalGranted: number;
  publicVerificationGatewayOperational: number;
  publicVerificationArtifactPublished: number;
  regulatoryRelianceAllowed: number;
  officialRelianceAllowed: number;
  legalAdviceProvided: number;
  postActivationVerificationApprovalGranted: number;
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
  liveExternalActionsAllowed: number;
  liveExternalActionsPerformed: number;
  paymentCaptureAllowed: number;
  borrowerNoticeSendsAllowed: number;
  officialReportsAllowed: number;
  customerCommunicationsReleased: number;
  publicStatusPageEnabled: number;
};

export type ProductionRegulatoryExaminationInput = {
  examinationScope?: string | null;
};

export type ProductionRegulatoryExaminationResult = {
  version: string;
  productionRelianceVersion: string;
  productionRegulatoryExaminationReviews: ProductionRegulatoryExaminationReview[];
  summary: ProductionRegulatoryExaminationSummary;
  disclosures: string[];
  examinationPosture: "PRODUCTION_REGULATORY_EXAMINATION_BLOCKED_PENDING_QUALIFIED_APPROVAL";
};

function item(
  id: string,
  label: string,
  status: ProductionRegulatoryExaminationStatus,
  evidenceRef: string,
  responsibleOwner: string,
  blockingReason: string | null
): ProductionRegulatoryExaminationItem {
  return {
    id,
    label,
    status,
    evidenceRef,
    responsibleOwner,
    blockingReason,
  };
}

function productionRelianceBlocksPreserved(
  productionReliance: ReturnType<typeof evaluateProductionRelianceVerificationGate>
): boolean {
  return (
    productionReliance.summary.productionRelianceApprovalGranted === 0 &&
    productionReliance.summary.publicVerificationApprovalGranted === 0 &&
    productionReliance.summary.publicVerificationGatewayOperational === 0 &&
    productionReliance.summary.publicVerificationArtifactPublished === 0 &&
    productionReliance.summary.externalRelianceDisclosureApproved === 0 &&
    productionReliance.summary.regulatoryRelianceAllowed === 0 &&
    productionReliance.summary.officialRelianceAllowed === 0 &&
    productionReliance.summary.legalAdviceProvided === 0 &&
    productionReliance.summary.postActivationVerificationApprovalGranted === 0 &&
    productionReliance.summary.productionHealthCertified === 0 &&
    productionReliance.summary.productionActivationExecuted === 0 &&
    productionReliance.summary.goLiveApproved === 0 &&
    productionReliance.summary.productionLaunchAuthorized === 0 &&
    productionReliance.summary.deploymentExecuted === 0 &&
    productionReliance.summary.productionSecretsActivated === 0 &&
    productionReliance.summary.publicDnsCutoverAllowed === 0 &&
    productionReliance.summary.databaseMigrationAllowed === 0 &&
    productionReliance.summary.publicProductionApiExposureAllowed === 0 &&
    productionReliance.summary.productionPortalLaunchExecuted === 0 &&
    productionReliance.summary.liveExternalActionsAllowed === 0 &&
    productionReliance.summary.liveExternalActionsPerformed === 0 &&
    productionReliance.summary.paymentCaptureAllowed === 0 &&
    productionReliance.summary.borrowerNoticeSendsAllowed === 0 &&
    productionReliance.summary.officialReportsAllowed === 0 &&
    productionReliance.summary.customerCommunicationsReleased === 0 &&
    productionReliance.summary.publicStatusPageEnabled === 0
  );
}

function buildExaminationItems(
  productionReliance: ReturnType<typeof evaluateProductionRelianceVerificationGate>
): ProductionRegulatoryExaminationItem[] {
  const reliancePreserved =
    productionRelianceBlocksPreserved(productionReliance);
  const relianceEvidenceAttached =
    productionReliance.productionRelianceVerificationReviews.length > 0 &&
    reliancePreserved;

  return [
    item(
      "master-volume-examination-controls-attached",
      "Master Volume regulatory examination and archive controls attached",
      "PASS",
      "Master Volume Series / examination, retention, legal hold, audit, replay, redaction, claims, source authority, and controlled disclosure boundaries",
      "governance",
      null
    ),
    item(
      "production-reliance-boundary-evidence-attached",
      "Production reliance boundary evidence attached",
      relianceEvidenceAttached ? "PASS" : "BLOCKED",
      `${PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION}:${productionReliance.reliancePosture}`,
      "governance",
      relianceEvidenceAttached
        ? null
        : "Regulatory examination review requires blocked production reliance evidence with zero public verification, zero official reliance, and zero legal advice."
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
      "examination-scope-review",
      "Regulatory examination scope review",
      "REVIEW_REQUIRED",
      "exam scope regulator audience legal/compliance owner and qualified reviewer packet",
      "compliance",
      "Examination scope, regulator audience, legal/compliance owner, and qualified reviewer authority must be reviewed before any separate submission."
    ),
    item(
      "evidence-archive-completeness-review",
      "Evidence archive completeness review",
      "REVIEW_REQUIRED",
      "evidence archive index module coverage route coverage event contract and schema lineage packet",
      "governance",
      "Archive completeness, module coverage, route coverage, event contracts, schema lineage, and evidence preservation must be reviewed."
    ),
    item(
      "retention-and-legal-hold-review",
      "Retention and legal hold review",
      "REVIEW_REQUIRED",
      "retention legal hold deletion suspension and chain-of-custody packet",
      "compliance",
      "Retention, legal hold, deletion suspension, and chain of custody must be reviewed without releasing any legal hold."
    ),
    item(
      "audit-replay-export-review",
      "Audit and replay export examination review",
      "REVIEW_REQUIRED",
      "audit export replay export observability event lineage and reproducibility packet",
      "governance",
      "Audit export, replay export, observability, event lineage, and reproducibility must be reviewed before any examiner disclosure."
    ),
    item(
      "privacy-redaction-public-records-review",
      "Privacy, redaction, and public-records review",
      "REVIEW_REQUIRED",
      "privacy redaction public records FOIA data rights and controlled disclosure packet",
      "governance",
      "Privacy, redaction, public-records, data rights, and controlled disclosure boundaries must be reviewed."
    ),
    item(
      "regulatory-communication-review",
      "Regulatory communication review",
      "REVIEW_REQUIRED",
      "regulatory communication script examiner response routing and escalation packet",
      "compliance",
      "Regulatory communication language, examiner response routing, and escalation must be reviewed without issuing a regulator response."
    ),
    item(
      "source-report-notice-payment-boundary-review",
      "Source, report, notice, payment, and live-action boundary review",
      "REVIEW_REQUIRED",
      "source authority official report notice payment public verification legal reliance and live-action boundary packet",
      "governance",
      "Source authority, official reports, notices, payments, public verification, legal advice, official reliance, and live external actions must remain blocked."
    ),
    item(
      "regulatory-examination-package-approval",
      "Regulatory examination package approval",
      "BLOCKED",
      "regulatory examination package approval record",
      "compliance",
      "Regulatory examination package approval has not been granted."
    ),
    item(
      "regulator-submission",
      "Regulator submission or portal upload",
      "BLOCKED",
      "regulator submission portal upload and examiner disclosure record",
      "compliance",
      "No regulatory examination package has been submitted and no regulator portal upload has been approved."
    ),
    item(
      "official-regulator-response",
      "Official regulator response",
      "BLOCKED",
      "official regulator response record",
      "compliance",
      "No official regulator response has been issued."
    ),
    item(
      "evidence-archive-certification",
      "Evidence archive and retention certification",
      "BLOCKED",
      "archive certification retention certification and legal hold release record",
      "governance",
      "Evidence archive certification, retention certification, and legal hold release have not been granted."
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

export function evaluateProductionRegulatoryExaminationGate(
  input: ProductionRegulatoryExaminationInput = {}
): ProductionRegulatoryExaminationResult {
  const productionReliance = evaluateProductionRelianceVerificationGate();
  const examinationItems = buildExaminationItems(productionReliance);
  const blockingReasons = examinationItems
    .filter((examinationItem) => examinationItem.status !== "PASS")
    .map((examinationItem) => examinationItem.blockingReason)
    .filter((reason): reason is string => Boolean(reason));
  const disclosures = [
    ...portableSurfaceSafeMessages,
    "No regulatory examination package has been approved.",
    "No regulatory examination package has been submitted.",
    "No regulator portal upload has been approved.",
    "No official regulator response has been issued.",
    "No evidence archive has been certified.",
    "No evidence retention certification has been granted.",
    "No legal hold has been released.",
    "No external examiner disclosure has been approved.",
    "No production reliance approval has been granted.",
    "No public verification authority has been granted.",
    "No public verification gateway has been made operational.",
    "No public verification artifact has been published.",
    "No regulatory reliance has been authorized.",
    "No official reliance has been created.",
    "No legal advice has been provided.",
    "No post-activation verification approval has been granted.",
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
    "This gate is regulatory examination and evidence archive readiness review only.",
  ];
  const review: ProductionRegulatoryExaminationReview = {
    reviewId: `production-regulatory-examination:${
      input.examinationScope ?? "platform"
    }`,
    reviewStatus: "PRODUCTION_REGULATORY_EXAMINATION_BLOCKED",
    productionBlocked: true,
    regulatoryExaminationPackageApproved: false,
    regulatoryExaminationPackageSubmitted: false,
    regulatorPortalUploadAllowed: false,
    regulatoryResponseIssued: false,
    examinationArchiveCertified: false,
    evidenceRetentionCertified: false,
    legalHoldReleased: false,
    externalExaminerDisclosureApproved: false,
    productionRelianceApprovalGranted: false,
    publicVerificationApprovalGranted: false,
    publicVerificationGatewayOperational: false,
    publicVerificationArtifactPublished: false,
    regulatoryRelianceAllowed: false,
    officialRelianceAllowed: false,
    legalAdviceProvided: false,
    postActivationVerificationApprovalGranted: false,
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
    liveExternalActionAllowed: false,
    liveExternalActionPerformed: false,
    paymentCaptureAllowed: false,
    borrowerNoticeSendAllowed: false,
    officialReportPublicationAllowed: false,
    customerCommunicationsReleased: false,
    publicStatusPageEnabled: false,
    productionRelianceVersion: PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
    moduleCount: moduleManifests.length,
    portableSurfaceCount: allPortableVerticalSurfaces.length,
    productionRelianceReviewCount:
      productionReliance.productionRelianceVerificationReviews.length,
    examinationItems,
    blockingReasons,
    disclosures,
  };

  return {
    version: PRODUCTION_REGULATORY_EXAMINATION_GATE_VERSION,
    productionRelianceVersion: PRODUCTION_RELIANCE_VERIFICATION_GATE_VERSION,
    productionRegulatoryExaminationReviews: [review],
    summary: {
      totalReviews: 1,
      totalExaminationItems: examinationItems.length,
      pass: examinationItems.filter(
        (examinationItem) => examinationItem.status === "PASS"
      ).length,
      reviewRequired: examinationItems.filter(
        (examinationItem) => examinationItem.status === "REVIEW_REQUIRED"
      ).length,
      blocked: examinationItems.filter(
        (examinationItem) => examinationItem.status === "BLOCKED"
      ).length,
      regulatoryExaminationPackageApproved: 0,
      regulatoryExaminationPackageSubmitted: 0,
      regulatorPortalUploadAllowed: 0,
      regulatoryResponseIssued: 0,
      examinationArchiveCertified: 0,
      evidenceRetentionCertified: 0,
      legalHoldReleased: 0,
      externalExaminerDisclosureApproved: 0,
      productionRelianceApprovalGranted: 0,
      publicVerificationApprovalGranted: 0,
      publicVerificationGatewayOperational: 0,
      publicVerificationArtifactPublished: 0,
      regulatoryRelianceAllowed: 0,
      officialRelianceAllowed: 0,
      legalAdviceProvided: 0,
      postActivationVerificationApprovalGranted: 0,
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
      liveExternalActionsAllowed: 0,
      liveExternalActionsPerformed: 0,
      paymentCaptureAllowed: 0,
      borrowerNoticeSendsAllowed: 0,
      officialReportsAllowed: 0,
      customerCommunicationsReleased: 0,
      publicStatusPageEnabled: 0,
    },
    disclosures,
    examinationPosture:
      "PRODUCTION_REGULATORY_EXAMINATION_BLOCKED_PENDING_QUALIFIED_APPROVAL",
  };
}
