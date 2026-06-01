import fs from "fs";
import path from "path";

import { evaluateProductionReleaseBoard } from "@/lib/governance/productionReleaseBoard";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Release Board Evidence Packet Smoke Test
 *
 * Verifies Module 32 assembles release-board evidence while keeping board
 * approval, cutover authority, production cutover, launch hold release,
 * deployment, secret activation, DNS cutover, production database migrations,
 * public production API exposure, portal launch, live external actions,
 * payment capture, borrower notice sends, official report publication, public
 * verification, legal advice, and official reliance blocked.
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
  const result = evaluateProductionReleaseBoard();
  const review = result.productionReleaseBoardReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-release-board"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 32 manifest is missing.");
  assert(
    manifest?.moduleNumber === 32,
    "Module 32 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-release-board",
    "Module 32 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 32 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-release-board"),
    "Module 32 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-release-board"),
    "Module 32 production release board API route is missing."
  );
  assert(Boolean(review), "Production release board review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_RELEASE_BOARD_BLOCKED",
    "Production release board review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production release board review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalReleaseBoardItems === review?.releaseBoardItems.length,
    "Production release board summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production release board must preserve blocked and review-required controls."
  );
  assert(
    result.summary.releaseBoardApprovalGranted === 0 &&
      result.summary.cutoverAuthorityGranted === 0 &&
      result.summary.productionCutoverApproved === 0 &&
      result.summary.productionCutoverExecuted === 0 &&
      result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0,
    "Production release board must not approve board action, cutover authority, cutover, launch hold release, deployment hold release, freeze hold release, or deployment."
  );
  assert(
    result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0,
    "Production release board must not activate secrets, DNS, migrations, public APIs, or portal launch."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Production release board must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production release board must not grant public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.releaseBoardApprovalGranted === false &&
      review?.cutoverAuthorityGranted === false &&
      review?.productionCutoverApproved === false &&
      review?.productionCutoverExecuted === false &&
      review?.launchHoldReleased === false &&
      review?.deploymentHoldReleased === false &&
      review?.freezeHoldReleased === false &&
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
    "Production release board review must preserve board, cutover, launch, deployment, and live-action blocks."
  );
  assert(
    review?.releaseBoardItems.some(
      (releaseBoardItem) =>
        releaseBoardItem.id === "production-cutover-hold-attached"
    ) &&
      review?.releaseBoardItems.some(
        (releaseBoardItem) => releaseBoardItem.id === "release-board-approval"
      ) &&
      review?.releaseBoardItems.some(
        (releaseBoardItem) => releaseBoardItem.id === "cutover-authority-grant"
      ) &&
      review?.releaseBoardItems.some(
        (releaseBoardItem) => releaseBoardItem.id === "final-launch-hold-release"
      ) &&
      review?.releaseBoardItems.some(
        (releaseBoardItem) =>
          releaseBoardItem.id === "public-production-api-exposure"
      ),
    "Production release board must include cutover hold, release board approval, cutover authority, launch hold, and public API controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No production release board approval has been granted."
      ) &&
      result.disclosures.includes(
        "No production cutover authority has been granted."
      ) &&
      result.disclosures.includes(
        "No production cutover has been approved or executed."
      ) &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes(
        "No public verification authority has been granted."
      ) &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published."),
    "Production release board disclosures must include required safe status, authority, launch, and public exposure messages."
  );
  assert(
    eventTypes.has("production.release.board.reviewed"),
    "Missing production.release.board.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-cutover-hold" &&
        handoff.toModuleId === "production-release-board" &&
        handoff.eventType === "production.cutover.hold.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production cutover hold to production release board handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-release-board" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.release.board.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production release board to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-release-board" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.release.board.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production release board to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        releaseBoardItemsChecked: result.summary.totalReleaseBoardItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        releaseBoardApprovalGranted:
          result.summary.releaseBoardApprovalGranted,
        cutoverAuthorityGranted: result.summary.cutoverAuthorityGranted,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        message: "Production release board smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
