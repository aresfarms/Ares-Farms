import fs from "fs";
import path from "path";

import { evaluateProductionRegulatoryExaminationGate } from "@/lib/governance/productionRegulatoryExaminationGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Regulatory Examination and Evidence Archive Gate Smoke Test
 *
 * Verifies Module 40 assembles regulatory examination and evidence archive
 * readiness while keeping regulator submission, regulator portal upload,
 * official regulator response, archive certification, retention certification,
 * legal hold release, public verification, official reliance, legal advice,
 * activation, deployment, public exposure, notices, official reports, live
 * external actions, and payment capture blocked.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function routeFileExists(route: string): boolean {
  return fs.existsSync(path.join(repoRoot, `src/app${route}/page.tsx`));
}

function apiRouteExists(route: string): boolean {
  return fs.existsSync(path.join(repoRoot, `src/app${route}/route.ts`));
}

function main() {
  const result = evaluateProductionRegulatoryExaminationGate();
  const review = result.productionRegulatoryExaminationReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-regulatory-examination"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 40 manifest is missing.");
  assert(
    manifest?.moduleNumber === 40,
    "Module 40 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-regulatory-examination",
    "Module 40 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 40 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-regulatory-examination"),
    "Module 40 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-regulatory-examination"),
    "Module 40 production regulatory examination API route is missing."
  );
  assert(Boolean(review), "Production regulatory examination review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_REGULATORY_EXAMINATION_BLOCKED",
    "Production regulatory examination review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production regulatory examination review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalExaminationItems === review?.examinationItems.length,
    "Production regulatory examination summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production regulatory examination must preserve blocked and review-required controls."
  );
  assert(
    result.summary.regulatoryExaminationPackageApproved === 0 &&
      result.summary.regulatoryExaminationPackageSubmitted === 0 &&
      result.summary.regulatorPortalUploadAllowed === 0 &&
      result.summary.regulatoryResponseIssued === 0 &&
      result.summary.examinationArchiveCertified === 0 &&
      result.summary.evidenceRetentionCertified === 0 &&
      result.summary.legalHoldReleased === 0 &&
      result.summary.externalExaminerDisclosureApproved === 0,
    "Production regulatory examination must not approve packages, submit to regulators, upload to portals, issue responses, certify archives, release legal holds, or approve examiner disclosure."
  );
  assert(
    result.summary.productionRelianceApprovalGranted === 0 &&
      result.summary.publicVerificationApprovalGranted === 0 &&
      result.summary.publicVerificationGatewayOperational === 0 &&
      result.summary.publicVerificationArtifactPublished === 0 &&
      result.summary.regulatoryRelianceAllowed === 0 &&
      result.summary.officialRelianceAllowed === 0 &&
      result.summary.legalAdviceProvided === 0,
    "Production regulatory examination must not approve reliance, public verification, official reliance, regulatory reliance, or legal advice."
  );
  assert(
    result.summary.postActivationVerificationApprovalGranted === 0 &&
      result.summary.productionHealthCertified === 0 &&
      result.summary.productionActivationExecuted === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.productionLaunchAuthorized === 0,
    "Production regulatory examination must not approve verification, health certification, activation, go-live, or launch."
  );
  assert(
    result.summary.deploymentExecuted === 0 &&
      result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0,
    "Production regulatory examination must not deploy, activate secrets, cut over DNS, migrate databases, expose APIs, launch portal, perform live actions, or capture payments."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.customerCommunicationsReleased === 0 &&
      result.summary.publicStatusPageEnabled === 0,
    "Production regulatory examination must not allow notices, official reports, customer communications, or public status."
  );
  assert(
    review?.productionBlocked &&
      review?.regulatoryExaminationPackageApproved === false &&
      review?.regulatoryExaminationPackageSubmitted === false &&
      review?.regulatorPortalUploadAllowed === false &&
      review?.regulatoryResponseIssued === false &&
      review?.examinationArchiveCertified === false &&
      review?.evidenceRetentionCertified === false &&
      review?.legalHoldReleased === false &&
      review?.publicVerificationApprovalGranted === false &&
      review?.officialRelianceAllowed === false &&
      review?.legalAdviceProvided === false &&
      review?.productionHealthCertified === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production regulatory examination review must preserve examination, archive, reliance, production, exposure, and live-action blocks."
  );
  assert(
    review?.examinationItems.some(
      (examinationItem) =>
        examinationItem.id === "production-reliance-boundary-evidence-attached"
    ) &&
      review?.examinationItems.some(
        (examinationItem) => examinationItem.id === "examination-scope-review"
      ) &&
      review?.examinationItems.some(
        (examinationItem) =>
          examinationItem.id === "evidence-archive-completeness-review"
      ) &&
      review?.examinationItems.some(
        (examinationItem) =>
          examinationItem.id === "audit-replay-export-review"
      ) &&
      review?.examinationItems.some(
        (examinationItem) =>
          examinationItem.id === "regulatory-examination-package-approval"
      ) &&
      review?.examinationItems.some(
        (examinationItem) => examinationItem.id === "regulator-submission"
      ) &&
      review?.examinationItems.some(
        (examinationItem) =>
          examinationItem.id === "evidence-archive-certification"
      ),
    "Production regulatory examination must include reliance, scope, archive, audit/replay, package approval, submission, and certification controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No regulatory examination package has been approved."
      ) &&
      result.disclosures.includes(
        "No regulatory examination package has been submitted."
      ) &&
      result.disclosures.includes(
        "No regulator portal upload has been approved."
      ) &&
      result.disclosures.includes(
        "No official regulator response has been issued."
      ) &&
      result.disclosures.includes("No evidence archive has been certified.") &&
      result.disclosures.includes(
        "No evidence retention certification has been granted."
      ) &&
      result.disclosures.includes("No legal hold has been released.") &&
      result.disclosures.includes(
        "No external examiner disclosure has been approved."
      ) &&
      result.disclosures.includes(
        "No public verification authority has been granted."
      ) &&
      result.disclosures.includes("No official reliance has been created.") &&
      result.disclosures.includes("No legal advice has been provided.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled."),
    "Production regulatory examination disclosures must include required safe status, examination, archive, reliance, production, and live-action messages."
  );
  assert(
    eventTypes.has("production.regulatory.examination.reviewed"),
    "Missing production.regulatory.examination.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-reliance-verification" &&
        handoff.toModuleId === "production-regulatory-examination" &&
        handoff.eventType === "production.reliance.verification.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production reliance verification to production regulatory examination handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-regulatory-examination" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.regulatory.examination.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production regulatory examination to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-regulatory-examination" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.regulatory.examination.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production regulatory examination to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        examinationItemsChecked: result.summary.totalExaminationItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        regulatoryExaminationPackageApproved:
          result.summary.regulatoryExaminationPackageApproved,
        regulatoryExaminationPackageSubmitted:
          result.summary.regulatoryExaminationPackageSubmitted,
        examinationArchiveCertified:
          result.summary.examinationArchiveCertified,
        officialRelianceAllowed: result.summary.officialRelianceAllowed,
        legalAdviceProvided: result.summary.legalAdviceProvided,
        message:
          "Production regulatory examination and evidence archive gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
