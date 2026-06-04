import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { READINESS_ASSESSMENT_RUNTIME_VERSION } from "@/lib/readiness/readinessAssessment";
import {
  READINESS_ASSESSMENT_V2_DISCLOSURES,
  READINESS_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS,
  READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
  READINESS_ASSESSMENT_V2_SIGNAL_IDS,
  composeReadinessAssessmentV2,
  readinessAssessmentV2Lineage,
} from "@/lib/readiness/readinessAssessmentV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    READINESS_ASSESSMENT_V2_RUNTIME_VERSION ===
      "readiness-assessment-v2-runtime-v0.1.0",
    "Readiness Assessment v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = readinessAssessmentV2Lineage();
  assert(
    lineage.runtimeVersion === READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.borrowerOnboardingCoreV2Version ===
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage borrowerOnboardingCoreV2Version must equal canonical BO v2."
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
    lineage.legacyReadinessAssessmentVersion ===
      READINESS_ASSESSMENT_RUNTIME_VERSION,
    "Lineage legacyReadinessAssessmentVersion must equal v1 readiness assessment version."
  );

  // Default composition.
  const defaultPack = composeReadinessAssessmentV2({});

  assert(
    defaultPack.runtimeVersion === READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    "Default pack must emit canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.readinessAssessmentV2InternalOnly &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noAutonomousCertification &&
      defaultPack.noAutonomousOnboarding &&
      defaultPack.noAutonomousReadiness &&
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
    "Readiness Assessment v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2SignalCount ===
      READINESS_ASSESSMENT_V2_SIGNAL_IDS.length,
    "Default pack must compose all three canonical v2 readiness signals."
  );

  // Composition with populated borrower context.
  const pack = composeReadinessAssessmentV2({
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
    pack.summary.v1OverallReadinessPercent >= 0 &&
      pack.summary.v1OverallReadinessPercent <= 100,
    "Pack must report v1 overall readiness as a percentage between 0 and 100."
  );
  assert(
    pack.v2Signals.every((signal) =>
      READINESS_ASSESSMENT_V2_SIGNAL_IDS.includes(signal.id)
    ),
    "Every composed v2 signal must use a canonical v2 signal id."
  );
  assert(
    pack.v2Signals.every((signal) =>
      signal.blockedClaims.includes("approval")
    ),
    "Every v2 signal must propagate the approval-blocked claim."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.readinessAssessmentVersion ===
      READINESS_ASSESSMENT_RUNTIME_VERSION &&
      pack.legacyBridge.borrowerOnboardingCoreV2Version ===
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 readiness assessment + BO v2 version seals."
  );

  // Cross-source conflict preservation: declared sovereign without
  // authorization should propagate via BO v2.
  const sovereignPack = composeReadinessAssessmentV2({
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
    sovereignPack.summary.crossSourceConflictCount > 0,
    "Sovereign-declared-without-authorization must propagate as a cross-source conflict."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Readiness Assessment v2 output is advisory borrower guidance, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous readiness determination"
      ) &&
      pack.productionRestrictions.includes("no notice send") &&
      pack.productionRestrictions.includes("no source certainty"),
    "Production restrictions must block lending, autonomous readiness, notice send, and source certainty."
  );
  assert(
    READINESS_ASSESSMENT_V2_DISCLOSURES.includes(
      "Sovereign customer types are visible only when named federation participation is authorized."
    ),
    "Disclosure constants must include sovereign federation language."
  );
  assert(
    READINESS_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous readiness determination"
    ),
    "Production restriction constants must block autonomous readiness."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-readiness-assessment-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-readiness-assessment-v2 module manifest must be registered."
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
      "governance.readiness.assessment.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.borrower.onboarding.core.v2.composed"
    ),
    "Module must consume upstream Borrower Onboarding Core v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.readiness.assessment.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.readiness.assessment.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-readiness-assessment-v2" ||
      handoff.toModuleId === "governance-readiness-assessment-v2"
  );
  assert(
    handoffs.length >= 17,
    "Readiness Assessment v2 module must have at least seventeen governed handoff routes."
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
        handoff.toModuleId === "governance-borrower-onboarding-core-v2"
    ),
    "Module must hand off to Borrower Onboarding Core v2."
  );
  assert(
    handoffs.some((handoff) => handoff.toModuleId === "portal-borrower-readiness"),
    "Module must hand off to portal-borrower-readiness."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
        borrowerOnboardingCoreV2Version:
          lineage.borrowerOnboardingCoreV2Version,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyReadinessAssessmentVersion:
          lineage.legacyReadinessAssessmentVersion,
        v2SignalCount: pack.summary.v2SignalCount,
        v2ReadyCount: pack.summary.v2ReadyCount,
        v2NeedsInputCount: pack.summary.v2NeedsInputCount,
        v2BlockedCount: pack.summary.v2BlockedCount,
        v2NotStartedCount: pack.summary.v2NotStartedCount,
        v2OverallReadinessPercent: pack.summary.v2OverallReadinessPercent,
        v1OverallReadinessPercent: pack.summary.v1OverallReadinessPercent,
        v1SectionCount: pack.summary.v1SectionCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        declaredCustomerTypeCount: pack.summary.declaredCustomerTypeCount,
        matchedCustomerProfileCount: pack.summary.matchedCustomerProfileCount,
        totalGrantCardCount: pack.summary.totalGrantCardCount,
        handoffs: handoffs.length,
        message: "Readiness Assessment v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
