import fs from "fs";
import path from "path";

import { evaluateProductionPortalReadinessGate } from "@/lib/governance/productionPortalReadinessGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Portal Readiness Preflight Gate Smoke Test
 *
 * Verifies Module 27 reviews every portable vertical surface while keeping
 * portal launch, public verification, live external actions, payment capture,
 * borrower notice sends, official report publication, legal advice, official
 * reliance, and public production exposure blocked pending final approval.
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
  const result = evaluateProductionPortalReadinessGate();
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-portal-readiness"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 27 manifest is missing.");
  assert(
    manifest?.moduleNumber === 27,
    "Module 27 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-portal-readiness",
    "Module 27 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 27 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-portal-readiness"),
    "Module 27 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-portal-readiness"),
    "Module 27 production portal readiness API route is missing."
  );
  assert(
    result.summary.totalReviews === allPortableVerticalSurfaces.length,
    "Production portal readiness gate must review every portable vertical surface."
  );
  assert(
    result.summary.productionBlocked === result.summary.totalReviews &&
      result.summary.preflightReviewAvailable === result.summary.totalReviews,
    "Every production portal readiness review must be blocked and preflight-visible."
  );
  assert(
    result.summary.launchReady === 0 &&
      result.summary.launchExecuted === 0 &&
      result.summary.publicLaunchAllowed === 0,
    "Local production portal readiness gate must not approve or execute portal launch."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0,
    "Production portal readiness must not allow or perform live external actions."
  );
  assert(
    result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Production portal readiness must not allow payment capture, borrower notice sends, or official report publication."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production portal readiness must not grant public verification, legal advice, or official reliance."
  );
  assert(
    result.productionPortalReadinessReviews.every(
      (review) =>
        review.productionBlocked &&
        review.portalLaunchExecuted === false &&
        review.publicLaunchAllowed === false &&
        review.liveExternalActionPerformed === false &&
        review.paymentCaptureAllowed === false &&
        review.borrowerNoticeSendAllowed === false &&
        review.officialReportPublicationAllowed === false &&
        review.publicVerificationAllowed === false
    ),
    "Every production portal readiness review must preserve final launch and live-action blocks."
  );
  assert(
    result.productionPortalReadinessReviews.every(
      (review) =>
        review.controlledPromotionRequired &&
        review.humanApprovalRequired &&
        review.replayRequired &&
        review.legalAdviceProvided === false &&
        review.officialRelianceAllowed === false
    ),
    "Every production portal readiness review must require controlled promotion, qualified human approval, and replay."
  );
  assert(
    result.productionPortalReadinessReviews.every((review) =>
      [
        "controlled-promotion-activation-evidence",
        "production-auth-activation-gate",
        "security-audit-readiness-gate",
        "production-backend-readiness-gate",
        "final-no-live-action-launch-hold",
      ].every((requiredCheckId) =>
        review.checks.some((gate) => gate.id === requiredCheckId)
      )
    ),
    "Every production portal readiness review must include activation, auth, security, backend, and launch-hold controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes("No production portal launch has been executed.") &&
      result.disclosures.includes("No public verification authority has been granted.") &&
      result.disclosures.includes("No live external source has been contacted.") &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published."),
    "Production portal readiness disclosures must include required safe status and launch-hold messages."
  );
  assert(
    eventTypes.has("production.portal.readiness.reviewed"),
    "Missing production.portal.readiness.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "controlled-promotion-activation" &&
        handoff.toModuleId === "production-portal-readiness" &&
        handoff.eventType === "controlled.promotion.activation.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing controlled promotion activation to production portal readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-portal-readiness" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.portal.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production portal readiness to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-portal-readiness" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.portal.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production portal readiness to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        reviewsChecked: result.summary.totalReviews,
        productionBlocked: result.summary.productionBlocked,
        launchReady: result.summary.launchReady,
        launchExecuted: result.summary.launchExecuted,
        publicLaunchAllowed: result.summary.publicLaunchAllowed,
        message: "Production portal readiness gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
