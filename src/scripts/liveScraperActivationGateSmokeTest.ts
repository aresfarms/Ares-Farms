import fs from "fs";
import path from "path";

import { evaluateLiveScraperActivationGate } from "@/lib/governance/liveScraperActivationGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { SCRAPER_REGISTRY } from "@/lib/source-intelligence/sourceIntelligenceRuntime";
import { SOURCE_STACK_REGISTRY } from "@/lib/source-stack/sourceStackRuntime";

/**
 * Live Scraper Activation Gate Smoke Test
 *
 * Confirms Module 22 stays aligned with the Master Volume source intelligence
 * doctrine: all governed scrapers are registered, source-stack alignment is
 * visible, safe status messages are present, live fetch remains blocked, and
 * promotion handoffs are explicit.
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
  const result = evaluateLiveScraperActivationGate();
  const manifest = moduleManifests.find(
    (entry) => entry.id === "live-scraper-activation"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 22 manifest is missing.");
  assert(
    manifest?.route === "/live-scraper-activation",
    "Module 22 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 22 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/live-scraper-activation"),
    "Module 22 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/live-scraper-activation"),
    "Module 22 activation gate API route is missing."
  );
  assert(
    result.summary.totalScrapers === SCRAPER_REGISTRY.length,
    "Activation gate must review every governed scraper."
  );
  assert(
    result.summary.sourceStackProfiles === SOURCE_STACK_REGISTRY.length,
    "Activation gate must report canonical source-stack profile count."
  );
  assert(
    result.summary.liveFetchEnabled === 0,
    "Live fetch must remain disabled for every scraper."
  );
  assert(
    result.sourceReviews.every((review) => review.activationBlocked),
    "Every scraper activation review must remain blocked."
  );
  assert(
    result.sourceReviews.every((review) =>
      review.checks.some((gate) => gate.id === "human-promotion-approval")
    ),
    "Every scraper activation review must require human promotion approval."
  );
  assert(
    result.sourceReviews.every((review) =>
      review.checks.some((gate) => gate.id === "legal-terms-review")
    ),
    "Every scraper activation review must require legal and ToS review."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed."),
    "Activation gate disclosures must include required safe status messages."
  );
  assert(
    eventTypes.has("scraper.activation.reviewed"),
    "Missing scraper.activation.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "live-scraper-activation" &&
        handoff.toModuleId === "promotion" &&
        handoff.eventType === "scraper.activation.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing live scraper activation to promotion handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        scrapersReviewed: result.summary.totalScrapers,
        sourceStackProfiles: result.summary.sourceStackProfiles,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        message: "Live scraper activation gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
