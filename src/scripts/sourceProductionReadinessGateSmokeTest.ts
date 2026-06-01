import fs from "fs";
import path from "path";

import { evaluateSourceProductionReadinessGate } from "@/lib/governance/sourceProductionReadinessGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { SOURCE_STACK_REGISTRY } from "@/lib/source-stack/sourceStackRuntime";

/**
 * Source Production Promotion Readiness Gate Smoke Test
 *
 * Verifies Module 25 assembles final source production-readiness evidence while
 * keeping source promotion, live fetch, external action, legal advice, public
 * verification, official reliance, and production activation blocked pending
 * controlled promotion and qualified human approval.
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
  const result = evaluateSourceProductionReadinessGate();
  const manifest = moduleManifests.find(
    (entry) => entry.id === "source-production-readiness"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 25 manifest is missing.");
  assert(
    manifest?.moduleNumber === 25,
    "Module 25 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/source-production-readiness",
    "Module 25 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 25 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/source-production-readiness"),
    "Module 25 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/source-production-readiness"),
    "Module 25 source production readiness API route is missing."
  );
  assert(
    result.summary.totalReviews === SOURCE_STACK_REGISTRY.length,
    "Source production readiness gate must review every source-stack profile."
  );
  assert(
    result.summary.productionReady === 0 &&
      result.summary.promotionAllowed === 0,
    "Local source production readiness gate must not mark sources production-ready."
  );
  assert(
    result.summary.liveFetchEnabled === 0 &&
      result.summary.externalActionsPerformed === 0,
    "Live fetch and external actions must remain disabled for every source production readiness review."
  );
  assert(
    result.summary.legalAdviceProvided === 0 &&
      result.summary.publicVerificationAllowed === 0,
    "Source production readiness must not provide legal advice or public verification authority."
  );
  assert(
    result.sourceProductionReadinessReviews.every(
      (review) => review.productionBlocked && !review.promotionAllowed
    ),
    "Every source production readiness review must remain production-blocked."
  );
  assert(
    result.sourceProductionReadinessReviews.every(
      (review) =>
        review.controlledPromotionRequired &&
        review.humanApprovalRequired &&
        review.legalAdviceProvided === false &&
        review.publicVerificationAllowed === false
    ),
    "Every source production readiness review must require controlled promotion and qualified human approval."
  );
  assert(
    result.sourceProductionReadinessReviews.every((review) =>
      review.checks.some(
        (gate) => gate.id === "source-promotion-packet-attached"
      )
    ),
    "Every source production readiness review must consume source promotion packet evidence."
  );
  assert(
    result.sourceProductionReadinessReviews.every((review) =>
      review.checks.some(
        (gate) => gate.id === "qualified-human-promotion-approval"
      )
    ),
    "Every source production readiness review must require qualified human source-promotion approval."
  );
  assert(
    result.sourceProductionReadinessReviews.every((review) =>
      review.checks.some((gate) => gate.id === "activation-ceremony-checklist")
    ),
    "Every source production readiness review must include activation ceremony control."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes("No source has been promoted to production."),
    "Source production readiness disclosures must include required safe status messages."
  );
  assert(
    eventTypes.has("source.production.readiness.reviewed"),
    "Missing source.production.readiness.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "source-promotion-packets" &&
        handoff.toModuleId === "source-production-readiness" &&
        handoff.eventType === "source.promotion.packet.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing source promotion packet to source production readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "source-production-readiness" &&
        handoff.toModuleId === "promotion" &&
        handoff.eventType === "source.production.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing source production readiness to promotion handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        reviewsChecked: result.summary.totalReviews,
        productionReady: result.summary.productionReady,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        message: "Source production readiness gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
