import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  OPPORTUNITY_DISCOVERY_DISCLOSURES,
  OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
  evaluateOpportunityDiscovery,
} from "@/lib/opportunity/discoveryRuntime";

/**
 * Opportunity Discovery Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects borrower-readable opportunity discovery accountability.
 * - Vol II: keeps discovery from becoming approval, eligibility, revenue
 *   guarantee, program approval, legal permission, certification, or
 *   reliance.
 * - Vol III: validates deterministic composition across program graph,
 *   marketplace, market signals, geo suitability, sellable catalog,
 *   property discovery, operating costs, and revenue opportunities.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms operator/borrower handoff coverage.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const emptyResult = evaluateOpportunityDiscovery({});

  assert(
    emptyResult.runtimeVersion === OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
    "Opportunity discovery must emit the runtime version."
  );
  assert(
    emptyResult.productionBlocked === true,
    "Opportunity discovery must remain production-blocked."
  );
  assert(
    emptyResult.humanReviewRequired === true,
    "Opportunity discovery must require human review."
  );
  assert(
    emptyResult.liveFetchPerformed === false,
    "Opportunity discovery must not perform a live fetch."
  );
  assert(
    emptyResult.noGuaranteedRevenue === true &&
      emptyResult.noProgramApproval === true &&
      emptyResult.noSourceCertainty === true &&
      emptyResult.noLegalOrRegulatoryReliance === true,
    "Opportunity discovery must block guarantee, approval, source certainty, and reliance claims."
  );
  assert(
    emptyResult.sections.length === 8,
    "Opportunity discovery must surface eight advisory sections."
  );
  assert(
    emptyResult.totalOpportunityCount > 0,
    "Opportunity discovery must compose at least one advisory item even on empty input."
  );

  const populatedResult = evaluateOpportunityDiscovery({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    location: {
      country: "US",
      state: "MD",
      county: "Queen Anne's",
    },
    customerTypes: ["beginning farmer", "agritourism operator"],
    farmTypes: ["CROPS"],
    goals: ["EXPANSION", "SUSTAINABILITY"],
  });

  assert(
    populatedResult.totalOpportunityCount >= emptyResult.totalOpportunityCount,
    "Populated discovery input should not lose advisory items."
  );

  const sectionIds = populatedResult.sections.map((section) => section.id);

  for (const required of [
    "grants_and_programs",
    "revenue_opportunities",
    "equipment_and_marketplace",
    "market_context",
    "geo_suitability",
    "sellable_catalog",
    "property_discovery",
    "operating_costs",
  ]) {
    assert(
      sectionIds.includes(required as (typeof sectionIds)[number]),
      `Opportunity discovery must include the ${required} section.`
    );
  }

  const grantsSection = populatedResult.sections.find(
    (section) => section.id === "grants_and_programs"
  );

  assert(
    grantsSection !== undefined && grantsSection.cards.length >= 3,
    "Opportunity discovery grants section must compose the program graph."
  );

  const revenueSection = populatedResult.sections.find(
    (section) => section.id === "revenue_opportunities"
  );

  assert(
    revenueSection !== undefined && revenueSection.cards.length >= 3,
    "Opportunity discovery revenue section must compose the revenue opportunity registry."
  );

  assert(
    populatedResult.disclosures.includes(
      "Opportunity discovery is advisory only."
    ),
    "Opportunity discovery disclosures must include the advisory-only language."
  );
  assert(
    populatedResult.disclosures.includes(
      "Opportunity discovery does not perform a live external source fetch."
    ),
    "Opportunity discovery disclosures must include the no-live-fetch language."
  );
  assert(
    populatedResult.productionRestrictions.includes(
      "no guaranteed revenue claims"
    ),
    "Opportunity discovery production restrictions must block guaranteed revenue claims."
  );
  assert(
    OPPORTUNITY_DISCOVERY_DISCLOSURES.includes(
      "Opportunity discovery does not claim source certainty."
    ),
    "Opportunity discovery disclosure constants must block source certainty claims."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "portal-borrower-opportunities"
  );
  assert(
    moduleManifest !== undefined,
    "Borrower opportunities module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Borrower opportunities module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "borrower.opportunity.discovery.viewed"
    ),
    "Borrower opportunities module must publish the discovery viewed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes("borrower.onboarding.submitted"),
    "Borrower opportunities module must consume upstream onboarding events."
  );

  const contract = eventContractRegistry.find(
    (eventContract) =>
      eventContract.eventType === "borrower.opportunity.discovery.viewed"
  );
  assert(
    contract !== undefined,
    "Opportunity discovery viewed event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Opportunity discovery event contract must be production-blocked and replay-required."
  );
  assert(
    contract.purpose.includes("without guaranteed revenue"),
    "Opportunity discovery contract must preserve no-guarantee purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "portal-borrower-opportunities" ||
      handoff.toModuleId === "portal-borrower-opportunities"
  );
  assert(
    handoffs.length >= 4,
    "Opportunity discovery module must have at least four governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every opportunity discovery handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        sectionCount: populatedResult.sections.length,
        totalOpportunityCount: populatedResult.totalOpportunityCount,
        emptyTotal: emptyResult.totalOpportunityCount,
        handoffs: handoffs.length,
        disclosures: populatedResult.disclosures.length,
        message: "Opportunity discovery smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
