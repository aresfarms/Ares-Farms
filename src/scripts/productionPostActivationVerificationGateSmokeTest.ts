import fs from "fs";
import path from "path";

import { evaluateProductionPostActivationVerificationGate } from "@/lib/governance/productionPostActivationVerificationGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Post-Activation Verification Gate Smoke Test
 *
 * Verifies Module 38 assembles post-activation verification readiness evidence
 * while keeping verification approval, verification start, verification
 * completion, production health certification, ceremony execution, production
 * activation, deployment, public exposure, notices, official reports, public
 * verification, legal advice, official reliance, live external actions, and
 * payment capture blocked.
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
  const result = evaluateProductionPostActivationVerificationGate();
  const review = result.productionPostActivationVerificationReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-post-activation-verification"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 38 manifest is missing.");
  assert(
    manifest?.moduleNumber === 38,
    "Module 38 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-post-activation-verification",
    "Module 38 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 38 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-post-activation-verification"),
    "Module 38 page route file is missing."
  );
  assert(
    apiRouteExists(
      "/api/governance/production-post-activation-verification"
    ),
    "Module 38 production post-activation verification API route is missing."
  );
  assert(
    Boolean(review),
    "Production post-activation verification review is missing."
  );
  assert(
    review?.reviewStatus === "PRODUCTION_POST_ACTIVATION_VERIFICATION_BLOCKED",
    "Production post-activation verification review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production post-activation verification review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalVerificationItems === review?.verificationItems.length,
    "Production post-activation verification summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production post-activation verification must preserve blocked and review-required controls."
  );
  assert(
    result.summary.postActivationVerificationApprovalGranted === 0 &&
      result.summary.postActivationVerificationStarted === 0 &&
      result.summary.postActivationVerificationCompleted === 0 &&
      result.summary.postActivationVerificationPassed === 0 &&
      result.summary.productionHealthCertified === 0,
    "Production post-activation verification must not approve, start, complete, pass, or certify verification."
  );
  assert(
    result.summary.activationCeremonyApprovalGranted === 0 &&
      result.summary.activationCeremonyExecuted === 0 &&
      result.summary.productionActivationExecuted === 0,
    "Production post-activation verification must not approve ceremony, execute ceremony, or execute production activation."
  );
  assert(
    result.summary.finalAuthorityApprovalGranted === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.productionLaunchAuthorized === 0,
    "Production post-activation verification must not approve final authority, go-live, or production launch."
  );
  assert(
    result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0 &&
      result.summary.productionSecretsActivated === 0,
    "Production post-activation verification must not release holds, deploy, or activate secrets."
  );
  assert(
    result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0,
    "Production post-activation verification must not enable DNS, migrations, public APIs, portal launch, live actions, or payment capture."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production post-activation verification must not allow notices, official reports, public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.postActivationVerificationApprovalGranted === false &&
      review?.postActivationVerificationStarted === false &&
      review?.postActivationVerificationCompleted === false &&
      review?.postActivationVerificationPassed === false &&
      review?.productionHealthCertified === false &&
      review?.activationCeremonyExecuted === false &&
      review?.productionActivationExecuted === false &&
      review?.goLiveApproved === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production post-activation verification review must preserve verification, activation, launch, deployment, exposure, and live-action blocks."
  );
  assert(
    review?.verificationItems.some(
      (verificationItem) =>
        verificationItem.id ===
        "production-activation-ceremony-evidence-attached"
    ) &&
      review?.verificationItems.some(
        (verificationItem) =>
          verificationItem.id === "verification-runbook-review"
      ) &&
      review?.verificationItems.some(
        (verificationItem) =>
          verificationItem.id === "synthetic-health-check-review"
      ) &&
      review?.verificationItems.some(
        (verificationItem) =>
          verificationItem.id === "audit-replay-export-review"
      ) &&
      review?.verificationItems.some(
        (verificationItem) =>
          verificationItem.id === "post-activation-verification-approval"
      ) &&
      review?.verificationItems.some(
        (verificationItem) =>
          verificationItem.id === "production-health-certification"
      ),
    "Production post-activation verification must include activation ceremony, runbook, health, audit/replay, approval, and health certification controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No post-activation verification approval has been granted."
      ) &&
      result.disclosures.includes(
        "No post-activation verification has been started."
      ) &&
      result.disclosures.includes(
        "No post-activation verification has been completed."
      ) &&
      result.disclosures.includes("No post-activation verification has passed.") &&
      result.disclosures.includes("No production health has been certified.") &&
      result.disclosures.includes(
        "No activation ceremony has been executed."
      ) &&
      result.disclosures.includes(
        "No production activation has been executed."
      ) &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled."),
    "Production post-activation verification disclosures must include required safe status, verification, activation, deployment, public exposure, and live-action messages."
  );
  assert(
    eventTypes.has("production.post.activation.verification.reviewed"),
    "Missing production.post.activation.verification.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-activation-ceremony" &&
        handoff.toModuleId === "production-post-activation-verification" &&
        handoff.eventType === "production.activation.ceremony.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production activation ceremony to production post-activation verification handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-post-activation-verification" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType ===
          "production.post.activation.verification.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production post-activation verification to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-post-activation-verification" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType ===
          "production.post.activation.verification.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production post-activation verification to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        verificationItemsChecked: result.summary.totalVerificationItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        postActivationVerificationApprovalGranted:
          result.summary.postActivationVerificationApprovalGranted,
        postActivationVerificationStarted:
          result.summary.postActivationVerificationStarted,
        postActivationVerificationCompleted:
          result.summary.postActivationVerificationCompleted,
        productionHealthCertified: result.summary.productionHealthCertified,
        message:
          "Production post-activation verification gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
