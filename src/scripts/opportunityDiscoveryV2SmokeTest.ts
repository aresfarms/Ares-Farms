import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_RUNTIME_VERSION } from "@/lib/opportunity/discoveryRuntime";
import {
  OPPORTUNITY_DISCOVERY_V2_DISCLOSURES,
  OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS,
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  composeOpportunityDiscoveryV2,
  opportunityDiscoveryV2Lineage,
} from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";
import { REVENUE_SOURCE_INTELLIGENCE_VERSION } from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Opportunity Discovery v2 Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical opportunity composition over
 *   Financing Pathway Engine v2 (Build 16), Revenue Intelligence v2
 *   (Build 15), Customer Type Registry (Build 14), and Capital Graph
 *   (Build 13).
 * - Vol II: keeps the composed pack from becoming customer eligibility
 *   determination, pathway authority, opportunity authority, credit
 *   decision, lender commitment, or program approval.
 * - Vol III: validates deterministic composition with explicit
 *   version lineage chaining v2 → Financing Pathway Engine v2 →
 *   Revenue Intelligence v2 → Customer Type → Capital Graph → legacy
 *   v1 opportunity discovery → legacy v1 revenue-source-intelligence.
 * - Vol III-B: confirms human-review-required posture and governed
 *   evidence.
 * - Vol IV: confirms governed handoffs to upstream canonical modules
 *   plus downstream consumers.
 * - Vol V: confirms canonical claims governance, controlled
 *   disclosure, replay, audit, portability, and advisory-only
 *   boundaries.
 * - Vol VI: confirms public-safe DTO posture; no raw borrower,
 *   sponsor, or property records, no live external fetch, no
 *   source-certainty claim.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION ===
      "opportunity-discovery-v2-runtime-v0.1.0",
    "Opportunity Discovery v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = opportunityDiscoveryV2Lineage();
  assert(
    lineage.runtimeVersion === OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal the canonical runtime version."
  );
  assert(
    lineage.financingPathwayEngineV2Version ===
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage financingPathwayEngineV2Version must equal the canonical FPE v2 version."
  );
  assert(
    lineage.revenueIntelligenceV2Version ===
      REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage revenueIntelligenceV2Version must equal the canonical RI v2 version."
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
    lineage.legacyOpportunityDiscoveryVersion ===
      OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
    "Lineage legacyOpportunityDiscoveryVersion must equal the v1 discovery version."
  );
  assert(
    lineage.legacyRevenueSourceIntelligenceVersion ===
      REVENUE_SOURCE_INTELLIGENCE_VERSION,
    "Lineage legacyRevenueSourceIntelligenceVersion must equal the v1 RSI version."
  );

  // Default composition.
  const defaultPack = composeOpportunityDiscoveryV2({});

  assert(
    defaultPack.runtimeVersion === OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.opportunityDiscoveryV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Opportunity Discovery v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.customerProfileCount === 0,
    "Default pack must return zero customer profiles when no declared types are provided."
  );

  // Sovereign federation gate (closed / open).
  const sovereignClosed = composeOpportunityDiscoveryV2({
    borrowerContext: {
      declaredCustomerTypes: ["federally recognized tribe"],
    },
    scope: { sovereignFederationAllowed: false },
  });
  assert(
    sovereignClosed.customerProfiles.every(
      (profile) => profile.customerType.federationScope !== "SOVEREIGN"
    ),
    "Sovereign federation gate (closed) must hide SOVEREIGN customer types."
  );

  const sovereignOpen = composeOpportunityDiscoveryV2({
    borrowerContext: {
      declaredCustomerTypes: ["federally recognized tribe"],
    },
    scope: { sovereignFederationAllowed: true },
  });
  assert(
    sovereignOpen.customerProfiles.some(
      (profile) => profile.customerType.federationScope === "SOVEREIGN"
    ),
    "Sovereign federation gate (open) must expose SOVEREIGN customer types."
  );

  // Full composition.
  const pack = composeOpportunityDiscoveryV2({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    borrowerContext: {
      borrowerId: "borrower-smoke",
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
      location: { country: "US", state: "MD" },
      farmTypes: ["specialty crops"],
      goals: ["operating capital"],
      acreage: 40,
      requestedAmount: 250000,
      interests: {
        grants: true,
        properties: true,
        equipment: true,
        marketContext: true,
        revenueOpportunities: true,
        soilAnalysis: true,
        commodityIntelligence: true,
      },
    },
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    pack.summary.customerProfileCount >= 3,
    "Pack must compose at least three customer profiles for the declared archetypes."
  );
  assert(
    pack.summary.totalGrantCardCount > 0,
    "Pack must compose at least one Capital Graph-backed grant card across matched profiles."
  );
  assert(
    pack.customerProfiles.every((profile) =>
      profile.blockedClaims.includes("approval")
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

  // Pathway status buckets must sum to total grant card count.
  assert(
    pack.summary.reviewRequiredCount +
      pack.summary.missingInformationCount +
      pack.summary.federationGatedCount ===
      pack.summary.totalGrantCardCount,
    "Pathway status buckets must sum to total grant card count."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount > 0 ||
      pack.summary.conflictSignalCount > 0,
    "Pack must preserve at least one conflict signal or cross-source conflict as first-class evidence."
  );

  // Legacy bridge must expose section counts.
  assert(
    pack.legacyBridge.legacySectionCount > 0,
    "Legacy bridge must expose v1 opportunity discovery sections."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Opportunity Discovery v2 output is advisory, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous customer eligibility determination"
      ) &&
      pack.productionRestrictions.includes(
        "no autonomous pathway determination"
      ) &&
      pack.productionRestrictions.includes(
        "no autonomous opportunity determination"
      ) &&
      pack.productionRestrictions.includes("no source certainty") &&
      pack.productionRestrictions.includes("no live external action"),
    "Production restrictions must block lending, eligibility, pathway, opportunity, source certainty, and live external action."
  );
  assert(
    OPPORTUNITY_DISCOVERY_V2_DISCLOSURES.includes(
      "When Financing Pathway Engine v2 composition and the legacy v1 opportunity discovery surfaces disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous opportunity determination"
    ),
    "Production restriction constants must block autonomous opportunity determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-opportunity-discovery-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-opportunity-discovery-v2 module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.publicSurfaceAllowed === false,
    "Module must not have a public surface."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "Module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.opportunity.discovery.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.financing.pathway.engine.v2.composed"
    ),
    "Module must consume upstream Financing Pathway Engine v2 event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.revenue.intelligence.v2.composed"
    ),
    "Module must consume upstream Revenue Intelligence v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.opportunity.discovery.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.opportunity.discovery.v2.composed contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Event contract must not be public-surface allowed."
  );

  // Handoff conformance.
  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-opportunity-discovery-v2" ||
      handoff.toModuleId === "governance-opportunity-discovery-v2"
  );
  assert(
    handoffs.length >= 17,
    "Opportunity Discovery v2 module must have at least seventeen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-financing-pathway-engine-v2"
    ),
    "Module must hand off to Financing Pathway Engine v2 for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-revenue-intelligence-v2"
    ),
    "Module must hand off to Revenue Intelligence v2 for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-capital-graph"
    ),
    "Module must hand off to Capital Graph for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-customer-type-registry"
    ),
    "Module must hand off to Customer Type Registry for paired composition review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyOpportunityDiscoveryVersion:
          lineage.legacyOpportunityDiscoveryVersion,
        customerProfileCount: pack.summary.customerProfileCount,
        totalGrantCardCount: pack.summary.totalGrantCardCount,
        totalLegacyCardCount: pack.summary.totalLegacyCardCount,
        conflictSignalCount: pack.summary.conflictSignalCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        sovereignCardCount: pack.summary.sovereignCardCount,
        participantCardCount: pack.summary.participantCardCount,
        publicCardCount: pack.summary.publicCardCount,
        reviewRequiredCount: pack.summary.reviewRequiredCount,
        missingInformationCount: pack.summary.missingInformationCount,
        federationGatedCount: pack.summary.federationGatedCount,
        sovereignClosedProfileCount:
          sovereignClosed.summary.customerProfileCount,
        sovereignOpenProfileCount:
          sovereignOpen.summary.customerProfileCount,
        legacySectionCount: pack.legacyBridge.legacySectionCount,
        handoffs: handoffs.length,
        message: "Opportunity Discovery v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
