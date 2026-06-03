import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  REVENUE_INTELLIGENCE_V2_DISCLOSURES,
  REVENUE_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS,
  REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
  composeRevenueIntelligenceV2,
  revenueIntelligenceV2Lineage,
} from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";
import {
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_SOURCE_INTELLIGENCE_VERSION,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Revenue Intelligence v2 Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical revenue intelligence composition
 *   over Capital Graph (Build 13) and Customer Type Registry (Build 14).
 * - Vol II: keeps the composed pack from becoming customer eligibility
 *   determination, credit decision, lender commitment, or program
 *   approval.
 * - Vol III: validates deterministic composition with explicit version
 *   lineage chaining v2 → Customer Type → Capital Graph → v1
 *   revenue-source-intelligence.
 * - Vol III-B: confirms human-review-required posture and governed
 *   evidence.
 * - Vol IV: confirms governed handoffs to the Capital Graph, Customer
 *   Type Registry, financing pathway guidance, opportunity discovery,
 *   customer revenue, revenue opportunities, advanced intelligence,
 *   lender workflow, evidence engine, certification engine, registry
 *   framework, evidence packets, audit replay, governance, reviews, and
 *   module readiness.
 * - Vol V: confirms canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and advisory-only boundaries.
 * - Vol VI: confirms public-safe DTO posture; no raw borrower or sponsor
 *   records, no live external fetch, no source-certainty claim.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  // Runtime version + lineage.
  assert(
    REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION ===
      "revenue-intelligence-v2-runtime-v0.1.0",
    "Revenue Intelligence v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = revenueIntelligenceV2Lineage();
  assert(
    lineage.runtimeVersion === REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal the canonical runtime version."
  );
  assert(
    lineage.customerTypeCount === CUSTOMER_TYPE_REGISTRY.length,
    "Lineage customerTypeCount must equal the Customer Type Registry size."
  );
  assert(
    lineage.capitalProgramCount === CAPITAL_GRAPH_REGISTRY.length,
    "Lineage capitalProgramCount must equal the Capital Graph Registry size."
  );
  assert(
    lineage.legacyProgramGraphCount === PROGRAM_GRAPH.length,
    "Lineage legacyProgramGraphCount must equal the v1 PROGRAM_GRAPH size."
  );
  assert(
    lineage.legacyRevenueOpportunityCount ===
      REVENUE_OPPORTUNITY_REGISTRY.length,
    "Lineage legacyRevenueOpportunityCount must equal the v1 REVENUE_OPPORTUNITY_REGISTRY size."
  );
  assert(
    lineage.legacyBridgeVersion === REVENUE_SOURCE_INTELLIGENCE_VERSION,
    "Lineage legacyBridgeVersion must equal the v1 revenue-source-intelligence version."
  );

  // Default composition (no declared types) returns an empty profile set
  // but preserves all constitutional flags and legacy bridge counts.
  const defaultPack = composeRevenueIntelligenceV2({});

  assert(
    defaultPack.runtimeVersion === REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.revenueIntelligenceV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Revenue Intelligence v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.customerProfileCount === 0,
    "Default pack must return zero customer profiles when no declared types are provided."
  );
  assert(
    defaultPack.legacyBridge.programGraphCount === PROGRAM_GRAPH.length &&
      defaultPack.legacyBridge.revenueOpportunityCount ===
        REVENUE_OPPORTUNITY_REGISTRY.length &&
      defaultPack.legacyBridge.bridgeVersion ===
        REVENUE_SOURCE_INTELLIGENCE_VERSION,
    "Default pack must expose the v1 legacy bridge counts and bridge version."
  );

  // Sovereign federation gate: declared sovereign type without
  // sovereignFederationAllowed must not appear.
  const sovereignClosedPack = composeRevenueIntelligenceV2({
    borrowerContext: {
      declaredCustomerTypes: ["federally recognized tribe"],
    },
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    sovereignClosedPack.customerProfiles.every(
      (profile) => profile.customerType.federationScope !== "SOVEREIGN"
    ),
    "Sovereign federation gate (closed) must hide SOVEREIGN customer types."
  );

  // Sovereign federation gate: declared sovereign type WITH
  // sovereignFederationAllowed must expose at least one sovereign
  // profile.
  const sovereignOpenPack = composeRevenueIntelligenceV2({
    borrowerContext: {
      declaredCustomerTypes: ["federally recognized tribe"],
    },
    scope: { sovereignFederationAllowed: true },
  });

  assert(
    sovereignOpenPack.customerProfiles.some(
      (profile) => profile.customerType.federationScope === "SOVEREIGN"
    ),
    "Sovereign federation gate (open) must expose SOVEREIGN customer types when declared."
  );

  // Composition with declared customer types + intended uses + jurisdiction.
  // Intended uses include legacy-registry product categories so the
  // compatibility bridge produces at least one matched entry.
  const pack = composeRevenueIntelligenceV2({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    borrowerContext: {
      declaredCustomerTypes: [
        "beginning farmer",
        "rural small business",
        "utility customer",
      ],
      intendedUses: [
        "specialty crops",
        "energy efficiency",
        "farm experiences",
        "operating capital",
      ],
      jurisdiction: { federal: true, state: "MD" },
    },
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    pack.summary.customerProfileCount >= 3,
    "Revenue Intelligence v2 pack must compose at least three customer profiles for the declared archetypes."
  );
  assert(
    pack.summary.totalComposedProgramCount > 0,
    "Revenue Intelligence v2 pack must compose at least one Capital Graph program across the matched customer types."
  );
  assert(
    pack.customerProfiles.every(
      (profile) => profile.blockedClaims.includes("approval")
    ),
    "Every customer profile must propagate the approval-blocked claim."
  );
  assert(
    pack.customerProfiles.every(
      (profile) =>
        typeof profile.reviewBoundary === "string" &&
        profile.reviewBoundary.length > 0
    ),
    "Every customer profile must propagate a customer-type review boundary."
  );
  assert(
    pack.summary.capitalPathwayCount > 0,
    "Revenue Intelligence v2 pack must expose at least one Capital Graph pathway candidate."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount > 0 ||
      pack.summary.conflictSignalCount > 0,
    "Revenue Intelligence v2 pack must preserve at least one conflict signal or cross-source conflict as first-class evidence."
  );

  // Legacy bridge connectivity: at least one profile should resolve at
  // least one legacy revenue opportunity for the chosen archetypes.
  assert(
    pack.summary.totalLegacyOpportunityCount > 0 ||
      pack.customerProfiles.some(
        (profile) => profile.legacyRevenueOpportunityBridge.length > 0
      ),
    "Revenue Intelligence v2 pack must surface at least one legacy revenue opportunity bridge entry across matched profiles."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Revenue Intelligence v2 output is advisory, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Revenue Intelligence v2 disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous customer eligibility determination"
      ) &&
      pack.productionRestrictions.includes("no public verification") &&
      pack.productionRestrictions.includes("no live external action"),
    "Revenue Intelligence v2 production restrictions must block lending, eligibility, public verification, and live external action."
  );
  assert(
    REVENUE_INTELLIGENCE_V2_DISCLOSURES.includes(
      "When Customer Type Registry and Capital Graph disagree on eligibility boundaries, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Revenue Intelligence v2 disclosure constants must include the cross-source conflict-preservation language."
  );
  assert(
    REVENUE_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous customer eligibility determination"
    ),
    "Revenue Intelligence v2 production restriction constants must block autonomous eligibility determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-revenue-intelligence-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-revenue-intelligence-v2 module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "governance-revenue-intelligence-v2 must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.publicSurfaceAllowed === false,
    "governance-revenue-intelligence-v2 must not have a public surface."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "governance-revenue-intelligence-v2 must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.revenue.intelligence.v2.composed"
    ),
    "governance-revenue-intelligence-v2 must publish the v2 composed event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.revenue.intelligence.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.revenue.intelligence.v2.composed contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Revenue Intelligence v2 event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Revenue Intelligence v2 event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Revenue Intelligence v2 event contract must not be public-surface allowed."
  );

  // Handoff conformance.
  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-revenue-intelligence-v2" ||
      handoff.toModuleId === "governance-revenue-intelligence-v2"
  );
  assert(
    handoffs.length >= 15,
    "Revenue Intelligence v2 module must have at least fifteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every Revenue Intelligence v2 handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-capital-graph"
    ),
    "Revenue Intelligence v2 must hand off to the Capital Graph for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-customer-type-registry"
    ),
    "Revenue Intelligence v2 must hand off to the Customer Type Registry for paired composition review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyProgramGraphCount: lineage.legacyProgramGraphCount,
        legacyRevenueOpportunityCount: lineage.legacyRevenueOpportunityCount,
        legacyBridgeVersion: lineage.legacyBridgeVersion,
        customerProfileCount: pack.summary.customerProfileCount,
        totalComposedProgramCount: pack.summary.totalComposedProgramCount,
        totalLegacyOpportunityCount: pack.summary.totalLegacyOpportunityCount,
        conflictSignalCount: pack.summary.conflictSignalCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        sovereignProgramCount: pack.summary.sovereignProgramCount,
        participantProgramCount: pack.summary.participantProgramCount,
        publicProgramCount: pack.summary.publicProgramCount,
        capitalPathwayCount: pack.summary.capitalPathwayCount,
        sovereignClosedProfileCount: sovereignClosedPack.summary.customerProfileCount,
        sovereignOpenProfileCount: sovereignOpenPack.summary.customerProfileCount,
        handoffs: handoffs.length,
        message: "Revenue Intelligence v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
