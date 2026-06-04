import {
  BORROWER_ONBOARDING_CORE_V1_LINEAGE_REF,
  BORROWER_ONBOARDING_CORE_V2_DISCLOSURES,
  BORROWER_ONBOARDING_CORE_V2_PRODUCTION_RESTRICTIONS,
  BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
  borrowerOnboardingCoreV2Lineage,
  composeBorrowerOnboardingCoreV2,
} from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION ===
      "borrower-onboarding-core-v2-runtime-v0.1.0",
    "Borrower Onboarding Core v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = borrowerOnboardingCoreV2Lineage();
  assert(
    lineage.runtimeVersion === BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.opportunityDiscoveryV2Version ===
      OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage opportunityDiscoveryV2Version must equal canonical OD v2."
  );
  assert(
    lineage.financingPathwayEngineV2Version ===
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage financingPathwayEngineV2Version must equal canonical FPE v2."
  );
  assert(
    lineage.revenueIntelligenceV2Version ===
      REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage revenueIntelligenceV2Version must equal canonical RI v2."
  );
  assert(
    lineage.customerTypeCount === CUSTOMER_TYPE_REGISTRY.length,
    "Lineage customerTypeCount must equal Customer Type Registry size."
  );
  assert(
    lineage.capitalProgramCount === CAPITAL_GRAPH_REGISTRY.length,
    "Lineage capitalProgramCount must equal Capital Graph Registry size."
  );
  assert(
    lineage.legacyBorrowerOnboardingCoreVersion ===
      BORROWER_ONBOARDING_CORE_V1_LINEAGE_REF,
    "Lineage legacyBorrowerOnboardingCoreVersion must equal v1 lineage ref."
  );

  // Default composition.
  const defaultPack = composeBorrowerOnboardingCoreV2({});

  assert(
    defaultPack.runtimeVersion === BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Default pack must emit canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.borrowerOnboardingCoreV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noAutonomousCertification &&
      defaultPack.noAutonomousOnboarding &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLenderCommitment &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.noNoticeSend &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Borrower Onboarding Core v2 pack must preserve every constitutional flag."
  );

  // Composition with a populated onboarding state + declared types.
  const pack = composeBorrowerOnboardingCoreV2({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    declaredCustomerTypes: [
      "beginning farmer",
      "rural small business",
      "utility customer",
    ],
    intendedUses: ["specialty crops", "energy efficiency", "operating capital"],
    scope: { sovereignFederationAllowed: false },
    onboardingState: {
      stage: "BEGINNER",
      location: { country: "US", state: "MD", county: "Frederick" },
      farmTypes: ["CROPS", "LIVESTOCK"],
      goals: ["EXPANSION", "SUSTAINABILITY"],
      acreage: 40,
      interests: {
        soilAnalysis: true,
        environmentalReports: true,
        financing: true,
        vendorRecommendations: true,
        commodityIntelligence: true,
      },
    },
  });

  assert(
    pack.summary.declaredCustomerTypeCount === 3,
    "Pack must report declared customer type count."
  );
  assert(
    pack.summary.matchedCustomerProfileCount >= 3,
    "Pack must match at least three customer profiles from declared types."
  );
  assert(
    pack.summary.totalGrantCardCount > 0,
    "Pack must produce Capital Graph-backed grant cards."
  );
  assert(
    pack.summary.legacyReadinessPercent === 100,
    "Pack with complete onboarding state must report 100% legacy readiness."
  );
  assert(
    pack.summary.legacyMissingItemCount === 0,
    "Pack with complete onboarding state must report zero legacy missing items."
  );
  assert(
    pack.customerSummaries.every(
      (summary) => summary.reviewBoundary.length > 0
    ),
    "Every customer summary must propagate a review boundary."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.borrowerOnboardingCoreVersion ===
      BORROWER_ONBOARDING_CORE_V1_LINEAGE_REF &&
      pack.legacyBridge.opportunityDiscoveryV2Version ===
        OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 lineage ref + OD v2 version seals."
  );

  // Sovereign federation gate conflict.
  const sovereignDeclaredClosed = composeBorrowerOnboardingCoreV2({
    declaredCustomerTypes: ["federally recognized tribe"],
    scope: { sovereignFederationAllowed: false },
    onboardingState: {
      stage: "INTERMEDIATE",
      location: { country: "US", state: "MT", county: "Yellowstone" },
      farmTypes: ["LIVESTOCK"],
      goals: ["EXPANSION"],
      acreage: 200,
      interests: {
        soilAnalysis: false,
        environmentalReports: false,
        financing: true,
        vendorRecommendations: false,
        commodityIntelligence: false,
      },
    },
  });
  assert(
    sovereignDeclaredClosed.crossSourceConflicts.some((conflict) =>
      conflict.conflictId.includes("sovereign-declared-without-authorization")
    ),
    "Pack must surface the sovereign-declared-without-authorization conflict."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Borrower Onboarding Core v2 output is advisory intake-and-discovery posture, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous onboarding determination"
      ) &&
      pack.productionRestrictions.includes("no notice send") &&
      pack.productionRestrictions.includes("no source certainty"),
    "Production restrictions must block lending, autonomous onboarding, notice send, and source certainty."
  );
  assert(
    BORROWER_ONBOARDING_CORE_V2_DISCLOSURES.includes(
      "Sovereign customer types are visible only when named federation participation is authorized."
    ),
    "Disclosure constants must include sovereign federation language."
  );
  assert(
    BORROWER_ONBOARDING_CORE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous onboarding determination"
    ),
    "Production restriction constants must block autonomous onboarding."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-borrower-onboarding-core-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-borrower-onboarding-core-v2 module manifest must be registered."
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
      "governance.borrower.onboarding.core.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.opportunity.discovery.v2.composed"
    ),
    "Module must consume upstream Opportunity Discovery v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.borrower.onboarding.core.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.borrower.onboarding.core.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-borrower-onboarding-core-v2" ||
      handoff.toModuleId === "governance-borrower-onboarding-core-v2"
  );
  assert(
    handoffs.length >= 16,
    "Borrower Onboarding Core v2 module must have at least sixteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-opportunity-discovery-v2"
    ),
    "Module must hand off to Opportunity Discovery v2."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "portal-borrower-onboarding"
    ),
    "Module must hand off to portal-borrower-onboarding."
  );
  assert(
    handoffs.some((handoff) => handoff.toModuleId === "applications"),
    "Module must hand off to applications."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyBorrowerOnboardingCoreVersion:
          lineage.legacyBorrowerOnboardingCoreVersion,
        declaredCustomerTypeCount: pack.summary.declaredCustomerTypeCount,
        matchedCustomerProfileCount: pack.summary.matchedCustomerProfileCount,
        totalGrantCardCount: pack.summary.totalGrantCardCount,
        totalLegacyDiscoverySectionCount:
          pack.summary.totalLegacyDiscoverySectionCount,
        totalLegacyDiscoveryCardCount:
          pack.summary.totalLegacyDiscoveryCardCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        legacyReadinessPercent: pack.summary.legacyReadinessPercent,
        legacyMissingItemCount: pack.summary.legacyMissingItemCount,
        capitalProgramCoverageCount: pack.summary.capitalProgramCoverageCount,
        handoffs: handoffs.length,
        message: "Borrower Onboarding Core v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
