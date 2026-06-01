import fs from "fs";
import path from "path";

import { evaluateProductionActivationCeremonyGate } from "@/lib/governance/productionActivationCeremonyGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Activation Ceremony Gate Smoke Test
 *
 * Verifies Module 37 assembles activation ceremony readiness evidence while
 * keeping ceremony approval, ceremony execution, production activation,
 * post-activation verification, deployment, public exposure, notices, official
 * reports, public verification, legal advice, official reliance, live external
 * actions, and payment capture blocked.
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
  const result = evaluateProductionActivationCeremonyGate();
  const review = result.productionActivationCeremonyReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-activation-ceremony"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 37 manifest is missing.");
  assert(
    manifest?.moduleNumber === 37,
    "Module 37 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-activation-ceremony",
    "Module 37 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 37 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-activation-ceremony"),
    "Module 37 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-activation-ceremony"),
    "Module 37 production activation ceremony API route is missing."
  );
  assert(
    Boolean(review),
    "Production activation ceremony review is missing."
  );
  assert(
    review?.reviewStatus === "PRODUCTION_ACTIVATION_CEREMONY_BLOCKED",
    "Production activation ceremony review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production activation ceremony review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalCeremonyItems === review?.ceremonyItems.length,
    "Production activation ceremony summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production activation ceremony must preserve blocked and review-required controls."
  );
  assert(
    result.summary.activationCeremonyApprovalGranted === 0 &&
      result.summary.activationCeremonyExecuted === 0 &&
      result.summary.productionActivationExecuted === 0 &&
      result.summary.postActivationVerificationStarted === 0 &&
      result.summary.postActivationVerificationCompleted === 0,
    "Production activation ceremony must not approve or execute ceremony, production activation, or post-activation verification."
  );
  assert(
    result.summary.finalAuthorityApprovalGranted === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.productionLaunchAuthorized === 0 &&
      result.summary.constitutionalOfficerAttestationReceived === 0 &&
      result.summary.qualifiedReleaseManagerApprovalGranted === 0,
    "Production activation ceremony must not approve final authority, go-live, production launch, constitutional attestation, or release-manager approval."
  );
  assert(
    result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0 &&
      result.summary.productionSecretsActivated === 0,
    "Production activation ceremony must not release launch/deployment/freeze holds, deploy, or activate secrets."
  );
  assert(
    result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0,
    "Production activation ceremony must not enable DNS, migrations, public APIs, portal launch, live actions, or payment capture."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production activation ceremony must not allow notices, official reports, public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.activationCeremonyApprovalGranted === false &&
      review?.activationCeremonyExecuted === false &&
      review?.productionActivationExecuted === false &&
      review?.postActivationVerificationStarted === false &&
      review?.postActivationVerificationCompleted === false &&
      review?.goLiveApproved === false &&
      review?.productionLaunchAuthorized === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production activation ceremony review must preserve activation, launch, deployment, exposure, and live-action blocks."
  );
  assert(
    review?.ceremonyItems.some(
      (ceremonyItem) =>
        ceremonyItem.id === "production-final-authority-attached"
    ) &&
      review?.ceremonyItems.some(
        (ceremonyItem) => ceremonyItem.id === "ceremony-agenda-review"
      ) &&
      review?.ceremonyItems.some(
        (ceremonyItem) => ceremonyItem.id === "dual-control-quorum-review"
      ) &&
      review?.ceremonyItems.some(
        (ceremonyItem) => ceremonyItem.id === "credential-vault-release-review"
      ) &&
      review?.ceremonyItems.some(
        (ceremonyItem) => ceremonyItem.id === "deployment-sequence-review"
      ) &&
      review?.ceremonyItems.some(
        (ceremonyItem) => ceremonyItem.id === "activation-ceremony-approval"
      ),
    "Production activation ceremony must include final authority, ceremony, quorum, credential, deployment, and approval controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No activation ceremony approval has been granted."
      ) &&
      result.disclosures.includes(
        "No activation ceremony has been executed."
      ) &&
      result.disclosures.includes(
        "No production activation has been executed."
      ) &&
      result.disclosures.includes(
        "No post-activation verification has been started."
      ) &&
      result.disclosures.includes("No go-live approval has been granted.") &&
      result.disclosures.includes("No deployment has been executed.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled."),
    "Production activation ceremony disclosures must include required safe status, activation, deployment, public exposure, and live-action messages."
  );
  assert(
    eventTypes.has("production.activation.ceremony.reviewed"),
    "Missing production.activation.ceremony.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-final-authority" &&
        handoff.toModuleId === "production-activation-ceremony" &&
        handoff.eventType === "production.final.authority.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production final authority to production activation ceremony handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-activation-ceremony" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.activation.ceremony.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production activation ceremony to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-activation-ceremony" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.activation.ceremony.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production activation ceremony to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        ceremonyItemsChecked: result.summary.totalCeremonyItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        activationCeremonyApprovalGranted:
          result.summary.activationCeremonyApprovalGranted,
        activationCeremonyExecuted: result.summary.activationCeremonyExecuted,
        productionActivationExecuted:
          result.summary.productionActivationExecuted,
        message: "Production activation ceremony gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
