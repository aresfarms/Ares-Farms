import fs from "fs";
import path from "path";

import { evaluateProductionRegulatoryResponseGate } from "@/lib/governance/productionRegulatoryResponseGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Regulatory Response and Corrective Action Gate Smoke Test
 *
 * Verifies Module 41 assembles regulatory response and corrective-action
 * review evidence while keeping official regulator response, corrective-action
 * approval, corrective-action commitment, corrective-action execution,
 * remediation approval, remediation execution, examiner finding closure,
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
  const result = evaluateProductionRegulatoryResponseGate();
  const review = result.productionRegulatoryResponseReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-regulatory-response"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 41 manifest is missing.");
  assert(
    manifest?.moduleNumber === 41,
    "Module 41 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-regulatory-response",
    "Module 41 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 41 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-regulatory-response"),
    "Module 41 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-regulatory-response"),
    "Module 41 production regulatory response API route is missing."
  );
  assert(Boolean(review), "Production regulatory response review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_REGULATORY_RESPONSE_BLOCKED",
    "Production regulatory response review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production regulatory response review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalResponseItems === review?.responseItems.length,
    "Production regulatory response summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production regulatory response must preserve blocked and review-required controls."
  );
  assert(
    result.summary.regulatoryResponsePackageApproved === 0 &&
      result.summary.officialRegulatorResponseIssued === 0 &&
      result.summary.correctiveActionPlanApproved === 0 &&
      result.summary.correctiveActionCommitted === 0 &&
      result.summary.correctiveActionExecuted === 0 &&
      result.summary.remediationPlanApproved === 0 &&
      result.summary.remediationExecuted === 0 &&
      result.summary.examinerFindingClosed === 0 &&
      result.summary.legalHoldReleased === 0 &&
      result.summary.externalExaminerDisclosureApproved === 0,
    "Production regulatory response must not approve response packages, issue official responses, approve or execute corrective action, execute remediation, close findings, release legal holds, or approve examiner disclosure."
  );
  assert(
    result.summary.productionRelianceApprovalGranted === 0 &&
      result.summary.publicVerificationApprovalGranted === 0 &&
      result.summary.regulatoryRelianceAllowed === 0 &&
      result.summary.officialRelianceAllowed === 0 &&
      result.summary.legalAdviceProvided === 0,
    "Production regulatory response must not approve reliance, public verification, official reliance, regulatory reliance, or legal advice."
  );
  assert(
    result.summary.regulatoryExaminationPackageSubmitted === 0 &&
      result.summary.examinationArchiveCertified === 0 &&
      result.summary.productionHealthCertified === 0 &&
      result.summary.productionActivationExecuted === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.productionLaunchAuthorized === 0,
    "Production regulatory response must not submit examinations, certify archives, certify health, activate production, approve go-live, or authorize launch."
  );
  assert(
    result.summary.deploymentExecuted === 0 &&
      result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0,
    "Production regulatory response must not deploy, activate secrets, cut over DNS, migrate databases, expose APIs, launch portal, perform live actions, or capture payments."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.customerCommunicationsReleased === 0 &&
      result.summary.publicStatusPageEnabled === 0,
    "Production regulatory response must not allow notices, official reports, customer communications, or public status."
  );
  assert(
    review?.productionBlocked &&
      review?.regulatoryResponsePackageApproved === false &&
      review?.officialRegulatorResponseIssued === false &&
      review?.correctiveActionPlanApproved === false &&
      review?.correctiveActionCommitted === false &&
      review?.correctiveActionExecuted === false &&
      review?.remediationPlanApproved === false &&
      review?.remediationExecuted === false &&
      review?.examinerFindingClosed === false &&
      review?.legalHoldReleased === false &&
      review?.publicVerificationApprovalGranted === false &&
      review?.officialRelianceAllowed === false &&
      review?.legalAdviceProvided === false &&
      review?.productionHealthCertified === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production regulatory response review must preserve response, corrective-action, remediation, reliance, production, exposure, and live-action blocks."
  );
  assert(
    review?.responseItems.some(
      (responseItem) =>
        responseItem.id === "regulatory-examination-evidence-attached"
    ) &&
      review?.responseItems.some(
        (responseItem) =>
          responseItem.id === "examiner-finding-intake-review"
      ) &&
      review?.responseItems.some(
        (responseItem) =>
          responseItem.id === "corrective-action-plan-review"
      ) &&
      review?.responseItems.some(
        (responseItem) => responseItem.id === "remediation-evidence-review"
      ) &&
      review?.responseItems.some(
        (responseItem) =>
          responseItem.id === "regulatory-response-package-approval"
      ) &&
      review?.responseItems.some(
        (responseItem) => responseItem.id === "official-regulator-response"
      ) &&
      review?.responseItems.some(
        (responseItem) =>
          responseItem.id === "corrective-action-commitment-execution"
      ) &&
      review?.responseItems.some(
        (responseItem) =>
          responseItem.id === "remediation-closure-finding-closure"
      ),
    "Production regulatory response must include examination, finding, corrective-action, remediation, package approval, official response, commitment, execution, and closure controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No regulatory response package has been approved."
      ) &&
      result.disclosures.includes(
        "No official regulator response has been issued."
      ) &&
      result.disclosures.includes(
        "No corrective action plan has been approved."
      ) &&
      result.disclosures.includes(
        "No corrective action has been committed."
      ) &&
      result.disclosures.includes(
        "No corrective action has been executed."
      ) &&
      result.disclosures.includes("No remediation plan has been approved.") &&
      result.disclosures.includes("No remediation has been executed.") &&
      result.disclosures.includes("No examiner finding has been closed.") &&
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
    "Production regulatory response disclosures must include required safe status, response, corrective-action, remediation, reliance, production, and live-action messages."
  );
  assert(
    eventTypes.has("production.regulatory.response.reviewed"),
    "Missing production.regulatory.response.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-regulatory-examination" &&
        handoff.toModuleId === "production-regulatory-response" &&
        handoff.eventType === "production.regulatory.examination.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production regulatory examination to production regulatory response handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-regulatory-response" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.regulatory.response.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production regulatory response to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-regulatory-response" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.regulatory.response.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production regulatory response to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        responseItemsChecked: result.summary.totalResponseItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        regulatoryResponsePackageApproved:
          result.summary.regulatoryResponsePackageApproved,
        officialRegulatorResponseIssued:
          result.summary.officialRegulatorResponseIssued,
        correctiveActionCommitted: result.summary.correctiveActionCommitted,
        remediationExecuted: result.summary.remediationExecuted,
        officialRelianceAllowed: result.summary.officialRelianceAllowed,
        legalAdviceProvided: result.summary.legalAdviceProvided,
        message:
          "Production regulatory response and corrective action gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
