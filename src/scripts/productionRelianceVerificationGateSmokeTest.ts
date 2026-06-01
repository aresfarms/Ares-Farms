import fs from "fs";
import path from "path";

import { evaluateProductionRelianceVerificationGate } from "@/lib/governance/productionRelianceVerificationGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Reliance and Public Verification Boundary Gate Smoke Test
 *
 * Verifies Module 39 assembles reliance and public verification boundary
 * evidence while keeping production reliance, public verification, regulatory
 * reliance, official reliance, legal advice, post-activation verification,
 * production health certification, activation, deployment, public exposure,
 * notices, official reports, live external actions, and payment capture
 * blocked.
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
  const result = evaluateProductionRelianceVerificationGate();
  const review = result.productionRelianceVerificationReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-reliance-verification"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 39 manifest is missing.");
  assert(
    manifest?.moduleNumber === 39,
    "Module 39 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-reliance-verification",
    "Module 39 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 39 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-reliance-verification"),
    "Module 39 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-reliance-verification"),
    "Module 39 production reliance verification API route is missing."
  );
  assert(Boolean(review), "Production reliance verification review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_RELIANCE_VERIFICATION_BLOCKED",
    "Production reliance verification review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production reliance verification review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalRelianceItems === review?.relianceItems.length,
    "Production reliance verification summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production reliance verification must preserve blocked and review-required controls."
  );
  assert(
    result.summary.productionRelianceApprovalGranted === 0 &&
      result.summary.publicVerificationApprovalGranted === 0 &&
      result.summary.publicVerificationGatewayOperational === 0 &&
      result.summary.publicVerificationArtifactPublished === 0 &&
      result.summary.externalRelianceDisclosureApproved === 0 &&
      result.summary.regulatoryRelianceAllowed === 0 &&
      result.summary.officialRelianceAllowed === 0 &&
      result.summary.legalAdviceProvided === 0,
    "Production reliance verification must not approve reliance, public verification, regulatory reliance, official reliance, or legal advice."
  );
  assert(
    result.summary.postActivationVerificationApprovalGranted === 0 &&
      result.summary.postActivationVerificationStarted === 0 &&
      result.summary.postActivationVerificationCompleted === 0 &&
      result.summary.postActivationVerificationPassed === 0 &&
      result.summary.productionHealthCertified === 0,
    "Production reliance verification must not approve, start, complete, pass, or certify post-activation verification."
  );
  assert(
    result.summary.activationCeremonyApprovalGranted === 0 &&
      result.summary.activationCeremonyExecuted === 0 &&
      result.summary.productionActivationExecuted === 0,
    "Production reliance verification must not approve ceremony, execute ceremony, or execute production activation."
  );
  assert(
    result.summary.finalAuthorityApprovalGranted === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.productionLaunchAuthorized === 0,
    "Production reliance verification must not approve final authority, go-live, or production launch."
  );
  assert(
    result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0 &&
      result.summary.productionSecretsActivated === 0,
    "Production reliance verification must not release holds, deploy, or activate secrets."
  );
  assert(
    result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0,
    "Production reliance verification must not enable DNS, migrations, public APIs, portal launch, live actions, or payment capture."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.customerCommunicationsReleased === 0 &&
      result.summary.publicStatusPageEnabled === 0,
    "Production reliance verification must not allow notices, official reports, customer communications, or public status."
  );
  assert(
    review?.productionBlocked &&
      review?.productionRelianceApprovalGranted === false &&
      review?.publicVerificationApprovalGranted === false &&
      review?.publicVerificationGatewayOperational === false &&
      review?.publicVerificationArtifactPublished === false &&
      review?.regulatoryRelianceAllowed === false &&
      review?.officialRelianceAllowed === false &&
      review?.legalAdviceProvided === false &&
      review?.postActivationVerificationApprovalGranted === false &&
      review?.postActivationVerificationPassed === false &&
      review?.productionHealthCertified === false &&
      review?.productionActivationExecuted === false &&
      review?.goLiveApproved === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production reliance verification review must preserve reliance, verification, activation, launch, deployment, exposure, and live-action blocks."
  );
  assert(
    review?.relianceItems.some(
      (relianceItem) =>
        relianceItem.id === "post-activation-verification-evidence-attached"
    ) &&
      review?.relianceItems.some(
        (relianceItem) =>
          relianceItem.id === "production-reliance-boundary-review"
      ) &&
      review?.relianceItems.some(
        (relianceItem) =>
          relianceItem.id === "public-verification-infrastructure-review"
      ) &&
      review?.relianceItems.some(
        (relianceItem) => relianceItem.id === "audit-replay-evidence-review"
      ) &&
      review?.relianceItems.some(
        (relianceItem) => relianceItem.id === "production-reliance-approval"
      ) &&
      review?.relianceItems.some(
        (relianceItem) => relianceItem.id === "public-verification-approval"
      ) &&
      review?.relianceItems.some(
        (relianceItem) =>
          relianceItem.id === "official-reliance-and-legal-advice"
      ),
    "Production reliance verification must include post-activation, reliance, public verification, audit/replay, approval, and official reliance controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No production reliance approval has been granted."
      ) &&
      result.disclosures.includes(
        "No public verification authority has been granted."
      ) &&
      result.disclosures.includes(
        "No public verification gateway has been made operational."
      ) &&
      result.disclosures.includes(
        "No public verification artifact has been published."
      ) &&
      result.disclosures.includes(
        "No external reliance disclosure has been approved."
      ) &&
      result.disclosures.includes(
        "No regulatory reliance has been authorized."
      ) &&
      result.disclosures.includes("No official reliance has been created.") &&
      result.disclosures.includes("No legal advice has been provided.") &&
      result.disclosures.includes(
        "No post-activation verification approval has been granted."
      ) &&
      result.disclosures.includes("No production health has been certified.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled."),
    "Production reliance verification disclosures must include required safe status, reliance, public verification, production, and live-action messages."
  );
  assert(
    eventTypes.has("production.reliance.verification.reviewed"),
    "Missing production.reliance.verification.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-post-activation-verification" &&
        handoff.toModuleId === "production-reliance-verification" &&
        handoff.eventType ===
          "production.post.activation.verification.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production post-activation verification to production reliance verification handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-reliance-verification" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.reliance.verification.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production reliance verification to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-reliance-verification" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.reliance.verification.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production reliance verification to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        relianceItemsChecked: result.summary.totalRelianceItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        productionRelianceApprovalGranted:
          result.summary.productionRelianceApprovalGranted,
        publicVerificationApprovalGranted:
          result.summary.publicVerificationApprovalGranted,
        publicVerificationGatewayOperational:
          result.summary.publicVerificationGatewayOperational,
        officialRelianceAllowed: result.summary.officialRelianceAllowed,
        legalAdviceProvided: result.summary.legalAdviceProvided,
        message:
          "Production reliance and public verification boundary gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
