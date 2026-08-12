import fs from "fs";
import path from "path";

import { evaluateSourceLegalReviewGate } from "@/lib/governance/sourceLegalReviewGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { SOURCE_STACK_REGISTRY } from "@/lib/platform/authorities/source";

/**
 * Source Legal and Licensing Review Gate Smoke Test
 *
 * Verifies Module 23 keeps source-specific legal, ToS, licensing, anti-bulk,
 * retention, republication, public DTO, and qualified-review gates explicit
 * before any scraper or connector activation can proceed.
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
  const result = evaluateSourceLegalReviewGate();
  const manifest = moduleManifests.find(
    (entry) => entry.id === "source-legal-review"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 23 manifest is missing.");
  assert(
    manifest?.route === "/source-legal-review",
    "Module 23 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 23 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/source-legal-review"),
    "Module 23 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/source-legal-review"),
    "Module 23 source legal review API route is missing."
  );
  assert(
    result.summary.totalSources === SOURCE_STACK_REGISTRY.length,
    "Source legal review gate must review every source-stack profile."
  );
  assert(
    result.summary.legalApproved === 0 && result.summary.tosApproved === 0,
    "Local source legal review gate must not approve sources."
  );
  assert(
    result.summary.liveFetchEnabled === 0,
    "Live fetch must remain disabled for every source profile."
  );
  assert(
    result.sourceLegalReviews.every((review) => review.activationBlocked),
    "Every source legal review must remain activation-blocked."
  );
  assert(
    result.sourceLegalReviews.every(
      (review) =>
        review.legalAdviceProvided === false &&
        review.qualifiedReviewRequired === true
    ),
    "Source legal review must not provide legal advice and must require qualified review."
  );
  assert(
    result.sourceLegalReviews.every((review) =>
      review.checks.some((gate) => gate.id === "terms-of-service-reviewed")
    ),
    "Every source legal review must require terms-of-service review."
  );
  assert(
    result.sourceLegalReviews.every((review) =>
      review.checks.some((gate) => gate.id === "anti-bulk-posture")
    ),
    "Every source legal review must require anti-bulk review."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed."),
    "Source legal review disclosures must include required safe status messages."
  );
  assert(
    eventTypes.has("source.legal.reviewed"),
    "Missing source.legal.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "source-legal-review" &&
        handoff.toModuleId === "live-scraper-activation" &&
        handoff.eventType === "source.legal.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing source legal review to live scraper activation handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        sourcesReviewed: result.summary.totalSources,
        legalApproved: result.summary.legalApproved,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        message: "Source legal review gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
