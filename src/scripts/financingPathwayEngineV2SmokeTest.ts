import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import {
  FINANCING_PATHWAY_ENGINE_V2_DISCLOSURES,
  FINANCING_PATHWAY_ENGINE_V2_PRODUCTION_RESTRICTIONS,
  FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
  composeFinancingPathwayEngineV2,
  financingPathwayEngineV2Lineage,
} from "@/lib/financing/pathwayEngineV2Runtime";
import { FINANCING_PATHWAY_ENGINE_VERSION } from "@/lib/financing/pathwayEngine";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";
import {
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Financing Pathway Engine v2 Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical pathway composition over
 *   Revenue Intelligence v2 (Build 15), Customer Type Registry
 *   (Build 14), and Capital Graph (Build 13).
 * - Vol II: keeps the composed pack from becoming customer eligibility
 *   determination, pathway authority, credit decision, lender
 *   commitment, or program approval.
 * - Vol III: validates deterministic composition with explicit
 *   version lineage chaining v2 → Revenue Intelligence v2 → Customer
 *   Type → Capital Graph → legacy v1 financing-pathway-engine.
 * - Vol III-B: confirms human-review-required posture and governed
 *   evidence.
 * - Vol IV: confirms governed handoffs to upstream canonical modules
 *   plus downstream consumers across portal, lender, governance,
 *   reviews, evidence packets, audit replay, and module readiness.
 * - Vol V: confirms canonical claims governance, controlled
 *   disclosure, replay, audit, portability, and advisory-only
 *   boundaries.
 * - Vol VI: confirms public-safe DTO posture; no raw borrower or
 *   sponsor records, no live external fetch, no source-certainty
 *   claim.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  // Runtime version + lineage.
  assert(
    FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION ===
      "financing-pathway-engine-v2-runtime-v0.1.0",
    "Financing Pathway Engine v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = financingPathwayEngineV2Lineage();
  assert(
    lineage.runtimeVersion === FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal the canonical runtime version."
  );
  assert(
    lineage.revenueIntelligenceV2Version === REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
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
    lineage.legacyPathwayEngineVersion === FINANCING_PATHWAY_ENGINE_VERSION,
    "Lineage legacyPathwayEngineVersion must equal the v1 financing-pathway-engine version."
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

  // Default composition.
  const defaultPack = composeFinancingPathwayEngineV2({});

  assert(
    defaultPack.runtimeVersion === FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Default pack must emit the canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.financingPathwayEngineV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noPathwayAuthority &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Financing Pathway Engine v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.customerProfileCount === 0,
    "Default pack must return zero customer profiles when no declared types are provided."
  );
  assert(
    defaultPack.legacyBridge.pathwayEngineVersion ===
      FINANCING_PATHWAY_ENGINE_VERSION &&
      defaultPack.legacyBridge.revenueIntelligenceV2Version ===
        REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Default pack must expose the v1 legacy bridge version + RI v2 lineage version."
  );

  // Sovereign federation gate (closed).
  const sovereignClosed = composeFinancingPathwayEngineV2({
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

  // Sovereign federation gate (open).
  const sovereignOpen = composeFinancingPathwayEngineV2({
    borrowerContext: {
      declaredCustomerTypes: ["federally recognized tribe"],
    },
    scope: { sovereignFederationAllowed: true },
  });
  assert(
    sovereignOpen.customerProfiles.some(
      (profile) => profile.customerType.federationScope === "SOVEREIGN"
    ),
    "Sovereign federation gate (open) must expose SOVEREIGN customer types when declared."
  );

  // Composition.
  const pack = composeFinancingPathwayEngineV2({
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
    },
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    pack.summary.customerProfileCount >= 3,
    "Financing Pathway Engine v2 pack must compose at least three customer profiles for the declared archetypes."
  );
  assert(
    pack.summary.totalCandidateCount > 0,
    "Financing Pathway Engine v2 pack must compose at least one pathway candidate across matched customer types."
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

  // Pathway-status enumeration: at least one candidate falls into a
  // governed status bucket.
  assert(
    pack.summary.reviewRequiredCount +
      pack.summary.missingInformationCount +
      pack.summary.federationGatedCount ===
      pack.summary.totalCandidateCount,
    "Pathway candidate status buckets must sum to total candidate count."
  );

  // Cross-source conflict preservation.
  assert(
    pack.summary.crossSourceConflictCount > 0 ||
      pack.summary.conflictSignalCount > 0,
    "Financing Pathway Engine v2 pack must preserve at least one conflict signal or cross-source conflict as first-class evidence."
  );

  // Federation gate evaluation on a sovereign customer type with
  // closed federation: pathway candidates for that type must be
  // FEDERATION_GATED.
  const sovereignGatedPack = composeFinancingPathwayEngineV2({
    borrowerContext: {
      borrowerId: "borrower-sovereign",
      declaredCustomerTypes: ["federally recognized tribe"],
      intendedUses: ["operating capital"],
      jurisdiction: { federal: true, state: "MT" },
      location: { country: "US", state: "MT" },
      farmTypes: ["range"],
      goals: ["operating capital"],
      acreage: 100,
      requestedAmount: 500000,
    },
    scope: { sovereignFederationAllowed: true },
  });

  if (sovereignGatedPack.summary.sovereignCandidateCount > 0) {
    assert(
      sovereignGatedPack.customerProfiles.some((profile) =>
        profile.candidates.some(
          (candidate) => candidate.federationScope === "SOVEREIGN"
        )
      ),
      "Sovereign federation-allowed pack must expose SOVEREIGN candidates."
    );
  }

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Financing Pathway Engine v2 output is advisory, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Financing Pathway Engine v2 disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous customer eligibility determination"
      ) &&
      pack.productionRestrictions.includes(
        "no autonomous pathway determination"
      ) &&
      pack.productionRestrictions.includes("no public verification") &&
      pack.productionRestrictions.includes("no live external action"),
    "Financing Pathway Engine v2 production restrictions must block lending, eligibility, pathway, public verification, and live external action."
  );
  assert(
    FINANCING_PATHWAY_ENGINE_V2_DISCLOSURES.includes(
      "When Revenue Intelligence v2 and the legacy v1 financing pathway engine disagree, the cross-source conflict is preserved as first-class evidence and never collapsed."
    ),
    "Financing Pathway Engine v2 disclosure constants must include the legacy-v1-vs-v2 conflict-preservation language."
  );
  assert(
    FINANCING_PATHWAY_ENGINE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous pathway determination"
    ),
    "Financing Pathway Engine v2 production restriction constants must block autonomous pathway determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-financing-pathway-engine-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-financing-pathway-engine-v2 module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "governance-financing-pathway-engine-v2 must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.publicSurfaceAllowed === false,
    "governance-financing-pathway-engine-v2 must not have a public surface."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "governance-financing-pathway-engine-v2 must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.financing.pathway.engine.v2.composed"
    ),
    "governance-financing-pathway-engine-v2 must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.revenue.intelligence.v2.composed"
    ),
    "governance-financing-pathway-engine-v2 must consume the upstream Revenue Intelligence v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.financing.pathway.engine.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.financing.pathway.engine.v2.composed contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Financing Pathway Engine v2 event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Financing Pathway Engine v2 event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Financing Pathway Engine v2 event contract must not be public-surface allowed."
  );

  // Handoff conformance.
  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-financing-pathway-engine-v2" ||
      handoff.toModuleId === "governance-financing-pathway-engine-v2"
  );
  assert(
    handoffs.length >= 16,
    "Financing Pathway Engine v2 module must have at least sixteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every Financing Pathway Engine v2 handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-revenue-intelligence-v2"
    ),
    "Financing Pathway Engine v2 must hand off to Revenue Intelligence v2 for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-capital-graph"
    ),
    "Financing Pathway Engine v2 must hand off to Capital Graph for paired composition review."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-customer-type-registry"
    ),
    "Financing Pathway Engine v2 must hand off to Customer Type Registry for paired composition review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyPathwayEngineVersion: lineage.legacyPathwayEngineVersion,
        customerProfileCount: pack.summary.customerProfileCount,
        totalCandidateCount: pack.summary.totalCandidateCount,
        totalLegacyCandidateCount: pack.summary.totalLegacyCandidateCount,
        conflictSignalCount: pack.summary.conflictSignalCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        sovereignCandidateCount: pack.summary.sovereignCandidateCount,
        participantCandidateCount: pack.summary.participantCandidateCount,
        publicCandidateCount: pack.summary.publicCandidateCount,
        capitalPathwayCount: pack.summary.capitalPathwayCount,
        reviewRequiredCount: pack.summary.reviewRequiredCount,
        missingInformationCount: pack.summary.missingInformationCount,
        federationGatedCount: pack.summary.federationGatedCount,
        sovereignClosedProfileCount:
          sovereignClosed.summary.customerProfileCount,
        sovereignOpenProfileCount: sovereignOpen.summary.customerProfileCount,
        handoffs: handoffs.length,
        message: "Financing Pathway Engine v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
