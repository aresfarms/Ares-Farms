import fs from "fs";
import path from "path";

import { evaluateProductionCutoverHoldGate } from "@/lib/governance/productionCutoverHoldGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Cutover Hold Gate Smoke Test
 *
 * Verifies Module 31 assembles production cutover hold evidence while keeping
 * cutover approval, cutover execution, launch hold release, deployment hold
 * release, freeze hold release, deployment, production secret activation, DNS
 * cutover, production database migrations, public production API exposure,
 * portal launch, live external actions, payment capture, borrower notice
 * sends, official report publication, public verification, legal advice, and
 * official reliance blocked pending qualified release approval.
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
  const result = evaluateProductionCutoverHoldGate();
  const review = result.productionCutoverHoldReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-cutover-hold"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 31 manifest is missing.");
  assert(
    manifest?.moduleNumber === 31,
    "Module 31 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-cutover-hold",
    "Module 31 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 31 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-cutover-hold"),
    "Module 31 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-cutover-hold"),
    "Module 31 production cutover hold API route is missing."
  );
  assert(Boolean(review), "Production cutover hold review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_CUTOVER_HOLD_BLOCKED",
    "Production cutover hold review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production cutover hold review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalCutoverItems === review?.cutoverItems.length,
    "Production cutover hold summary must match review cutover items."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production cutover hold must preserve blocked and review-required controls."
  );
  assert(
    result.summary.productionCutoverApproved === 0 &&
      result.summary.productionCutoverExecuted === 0 &&
      result.summary.releaseCandidateFreezeApproved === 0 &&
      result.summary.releaseCandidateFrozen === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.finalGoLiveHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0,
    "Production cutover hold must not approve cutover, freeze, launch hold release, deployment hold release, or deployment."
  );
  assert(
    result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0,
    "Production cutover hold must not activate secrets, DNS, migrations, public APIs, or portal launch."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Production cutover hold must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production cutover hold must not grant public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.productionCutoverApproved === false &&
      review?.productionCutoverExecuted === false &&
      review?.freezeHoldReleased === false &&
      review?.deploymentHoldReleased === false &&
      review?.finalGoLiveHoldReleased === false &&
      review?.deploymentExecuted === false &&
      review?.productionSecretsActivated === false &&
      review?.publicDnsCutoverAllowed === false &&
      review?.databaseMigrationAllowed === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false &&
      review?.borrowerNoticeSendAllowed === false &&
      review?.officialReportPublicationAllowed === false &&
      review?.publicVerificationAllowed === false,
    "Production cutover hold review must preserve cutover, launch, deployment, and live-action blocks."
  );
  assert(
    review?.cutoverItems.some(
      (cutoverItem) =>
        cutoverItem.id === "release-candidate-freeze-plan-attached"
    ) &&
      review?.cutoverItems.some(
        (cutoverItem) => cutoverItem.id === "launch-hold-release"
      ) &&
      review?.cutoverItems.some(
        (cutoverItem) => cutoverItem.id === "production-deployment-execution"
      ) &&
      review?.cutoverItems.some(
        (cutoverItem) => cutoverItem.id === "public-production-api-exposure"
      ) &&
      review?.cutoverItems.some(
        (cutoverItem) =>
          cutoverItem.id === "final-qualified-release-manager-cutover-signoff"
      ),
    "Production cutover hold must include freeze plan, launch hold, deployment, public API, and release manager controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No production cutover has been approved or executed."
      ) &&
      result.disclosures.includes("No launch hold has been released.") &&
      result.disclosures.includes("No deployment hold has been released.") &&
      result.disclosures.includes(
        "No release-candidate freeze hold has been released."
      ) &&
      result.disclosures.includes("No production secret has been activated.") &&
      result.disclosures.includes("No public DNS cutover has been approved.") &&
      result.disclosures.includes("No production database migration has been approved.") &&
      result.disclosures.includes("No production portal launch has been executed.") &&
      result.disclosures.includes("No public production API exposure has been approved.") &&
      result.disclosures.includes("No public verification authority has been granted.") &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published."),
    "Production cutover hold disclosures must include required safe status and launch-hold messages."
  );
  assert(
    eventTypes.has("production.cutover.hold.reviewed"),
    "Missing production.cutover.hold.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "release-candidate-freeze" &&
        handoff.toModuleId === "production-cutover-hold" &&
        handoff.eventType === "release.candidate.freeze.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing release candidate freeze to production cutover hold handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-cutover-hold" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.cutover.hold.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production cutover hold to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-cutover-hold" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.cutover.hold.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production cutover hold to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        cutoverItemsChecked: result.summary.totalCutoverItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        productionCutoverApproved: result.summary.productionCutoverApproved,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        finalGoLiveHoldReleased: result.summary.finalGoLiveHoldReleased,
        message: "Production cutover hold gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
