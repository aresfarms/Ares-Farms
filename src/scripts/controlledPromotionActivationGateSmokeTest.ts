import fs from "fs";
import path from "path";

import { evaluateControlledPromotionActivationGate } from "@/lib/governance/controlledPromotionActivationGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { SOURCE_STACK_REGISTRY } from "@/lib/source-stack/sourceStackRuntime";

/**
 * Controlled Promotion Activation Gate Smoke Test
 *
 * Verifies Module 26 assembles activation ceremony evidence while keeping
 * source promotion, live fetch, external action, activation execution, legal
 * advice, public verification, official reliance, and production activation
 * blocked pending final controlled approval.
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
  const result = evaluateControlledPromotionActivationGate();
  const manifest = moduleManifests.find(
    (entry) => entry.id === "controlled-promotion-activation"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 26 manifest is missing.");
  assert(
    manifest?.moduleNumber === 26,
    "Module 26 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/controlled-promotion-activation",
    "Module 26 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 26 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/controlled-promotion-activation"),
    "Module 26 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/controlled-promotion-activation"),
    "Module 26 controlled promotion activation API route is missing."
  );
  assert(
    result.summary.totalReviews === SOURCE_STACK_REGISTRY.length,
    "Controlled promotion activation gate must review every source-stack profile."
  );
  assert(
    result.summary.activationReady === 0 &&
      result.summary.activationExecuted === 0 &&
      result.summary.promotionAllowed === 0,
    "Local controlled promotion activation gate must not mark sources activation-ready or execute activation."
  );
  assert(
    result.summary.liveFetchEnabled === 0 &&
      result.summary.externalActionsPerformed === 0,
    "Live fetch and external actions must remain disabled for every activation review."
  );
  assert(
    result.summary.legalAdviceProvided === 0 &&
      result.summary.publicVerificationAllowed === 0,
    "Controlled promotion activation must not provide legal advice or public verification authority."
  );
  assert(
    result.controlledPromotionActivationReviews.every(
      (review) =>
        review.productionBlocked &&
        !review.activationExecuted &&
        !review.promotionAllowed
    ),
    "Every controlled promotion activation review must remain production-blocked and unexecuted."
  );
  assert(
    result.controlledPromotionActivationReviews.every(
      (review) =>
        review.controlledPromotionRequired &&
        review.humanApprovalRequired &&
        review.legalAdviceProvided === false &&
        review.publicVerificationAllowed === false
    ),
    "Every controlled promotion activation review must require controlled promotion and qualified human approval."
  );
  assert(
    result.controlledPromotionActivationReviews.every((review) =>
      review.checks.some(
        (gate) => gate.id === "source-production-readiness-attached"
      )
    ),
    "Every activation review must consume source production readiness evidence."
  );
  assert(
    result.controlledPromotionActivationReviews.every((review) =>
      review.checks.some((gate) => gate.id === "kill-switch-owner")
    ),
    "Every activation review must include kill-switch owner control."
  );
  assert(
    result.controlledPromotionActivationReviews.every((review) =>
      review.checks.some(
        (gate) => gate.id === "post-activation-verification-plan"
      )
    ),
    "Every activation review must include post-activation verification plan control."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes("No activation ceremony has been executed."),
    "Controlled promotion activation disclosures must include required safe status messages."
  );
  assert(
    eventTypes.has("controlled.promotion.activation.reviewed"),
    "Missing controlled.promotion.activation.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "source-production-readiness" &&
        handoff.toModuleId === "controlled-promotion-activation" &&
        handoff.eventType === "source.production.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing source production readiness to controlled promotion activation handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "controlled-promotion-activation" &&
        handoff.toModuleId === "promotion" &&
        handoff.eventType === "controlled.promotion.activation.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing controlled promotion activation to promotion handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        reviewsChecked: result.summary.totalReviews,
        activationReady: result.summary.activationReady,
        activationExecuted: result.summary.activationExecuted,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        message: "Controlled promotion activation gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
