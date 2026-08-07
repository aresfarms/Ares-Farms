import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { ENVIRONMENTAL_INTAKE_RUNTIME_VERSION } from "@/lib/environmental/intakeRuntime";
import {
  ENVIRONMENTAL_INTAKE_V2_DISCLOSURES,
  ENVIRONMENTAL_INTAKE_V2_PRODUCTION_RESTRICTIONS,
  ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
  ENVIRONMENTAL_INTAKE_V2_SIGNAL_IDS,
  composeEnvironmentalIntakeV2,
  environmentalIntakeV2Lineage,
} from "@/lib/environmental/intakeV2Runtime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION ===
      "environmental-intake-v2-runtime-v0.1.0",
    "Environmental Intake v2 runtime version must match the canonical v0.1.0 seal."
  );

  const lineage = environmentalIntakeV2Lineage();
  assert(
    lineage.runtimeVersion === ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
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
    lineage.legacyEnvironmentalIntakeVersion ===
      ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
    "Lineage legacyEnvironmentalIntakeVersion must equal v1 environmental intake version."
  );

  // Default composition.
  const defaultPack = composeEnvironmentalIntakeV2({});

  assert(
    defaultPack.runtimeVersion === ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    "Default pack must emit canonical runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.environmentalIntakeV2InternalOnly &&
      defaultPack.spokeIsolationRequired &&
      defaultPack.feeAutonomyPreserved &&
      defaultPack.noAutonomousLending &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousPathway &&
      defaultPack.noAutonomousOpportunity &&
      defaultPack.noAutonomousIntelligence &&
      defaultPack.noAutonomousEvidence &&
      defaultPack.noAutonomousCertification &&
      defaultPack.noAutonomousOnboarding &&
      defaultPack.noAutonomousReadiness &&
      defaultPack.noAutonomousEnvironmentalIntake &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLenderCommitment &&
      defaultPack.noLegalReliance &&
      defaultPack.noOfficialEnvironmentalReport &&
      defaultPack.noEnvironmentalClearance &&
      defaultPack.noProviderEngagement &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.noNoticeSend &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Environmental Intake v2 pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2SignalCount ===
      ENVIRONMENTAL_INTAKE_V2_SIGNAL_IDS.length,
    "Default pack must compose all three canonical v2 environmental signals."
  );

  // Composition with populated context including environmental triggers.
  const pack = composeEnvironmentalIntakeV2({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    declaredCustomerTypes: [
      "beginning farmer",
      "environmental market participant",
    ],
    intendedUses: ["environmental compliance", "energy efficiency"],
    scope: { sovereignFederationAllowed: false },
    onboardingState: {
      stage: "BEGINNER",
      location: { country: "US", state: "MD", county: "Frederick" },
      farmTypes: ["CROPS"],
      goals: ["SUSTAINABILITY"],
      acreage: 40,
      interests: {
        soilAnalysis: true,
        environmentalReports: true,
        financing: true,
        vendorRecommendations: false,
        commodityIntelligence: false,
      },
    },
    legacy: {
      realPropertyCollateral: true,
      federalFundingTrigger: true,
      knownEnvironmentalStatuteTrigger: false,
      borrowerExternalFirmInterest: true,
      feeDisclosureAcknowledged: false,
    },
  });

  assert(
    pack.summary.v2SignalCount === 3,
    "Pack must compose three v2 governed signals."
  );
  assert(
    pack.summary.v1ReadinessPercent >= 0 &&
      pack.summary.v1ReadinessPercent <= 100,
    "Pack must report v1 readiness as percentage."
  );
  assert(
    pack.v2Signals.every((signal) =>
      ENVIRONMENTAL_INTAKE_V2_SIGNAL_IDS.includes(signal.id)
    ),
    "Every composed v2 signal must use a canonical v2 signal id."
  );
  assert(
    pack.v2Signals.every((signal) =>
      signal.blockedClaims.includes("official environmental report")
    ),
    "Every v2 signal must propagate the official-environmental-report-blocked claim."
  );

  // Legacy bridge integrity.
  assert(
    pack.legacyBridge.environmentalIntakeVersion ===
      ENVIRONMENTAL_INTAKE_RUNTIME_VERSION &&
      pack.legacyBridge.borrowerOnboardingCoreV2Version ===
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Legacy bridge must expose v1 environmental intake + BO v2 version seals."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Environmental Intake v2 output is advisory borrower guidance and review routing, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes(
        "no autonomous environmental intake determination"
      ) &&
      pack.productionRestrictions.includes("no NEPA determination") &&
      pack.productionRestrictions.includes("no provider engagement"),
    "Production restrictions must block lending, autonomous environmental intake, NEPA determination, and provider engagement."
  );
  assert(
    ENVIRONMENTAL_INTAKE_V2_DISCLOSURES.includes(
      "Environmental Engineering Spoke isolation is preserved; no Banker Spoke decision flows from this intake."
    ),
    "Disclosure constants must include spoke isolation language."
  );
  assert(
    ENVIRONMENTAL_INTAKE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous environmental intake determination"
    ),
    "Production restriction constants must block autonomous environmental intake."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-environmental-intake-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-environmental-intake-v2 module manifest must be registered."
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
      "governance.environmental.intake.v2.composed"
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
    (entry) =>
      entry.eventType === "governance.environmental.intake.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.environmental.intake.v2.composed contract must be registered."
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
      handoff.fromModuleId === "governance-environmental-intake-v2" ||
      handoff.toModuleId === "governance-environmental-intake-v2"
  );
  assert(
    handoffs.length >= 16,
    "Environmental Intake v2 module must have at least sixteen governed handoff routes."
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
    handoffs.some((handoff) => handoff.toModuleId === "environmental-compliance"),
    "Module must hand off to environmental-compliance."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
        borrowerOnboardingCoreV2Version:
          lineage.borrowerOnboardingCoreV2Version,
        opportunityDiscoveryV2Version: lineage.opportunityDiscoveryV2Version,
        financingPathwayEngineV2Version:
          lineage.financingPathwayEngineV2Version,
        revenueIntelligenceV2Version: lineage.revenueIntelligenceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        legacyEnvironmentalIntakeVersion:
          lineage.legacyEnvironmentalIntakeVersion,
        v2SignalCount: pack.summary.v2SignalCount,
        v2ReadyCount: pack.summary.v2ReadyCount,
        v2NeedsInputCount: pack.summary.v2NeedsInputCount,
        v2BlockedCount: pack.summary.v2BlockedCount,
        v2NotStartedCount: pack.summary.v2NotStartedCount,
        v2OverallReadinessPercent: pack.summary.v2OverallReadinessPercent,
        v1ReadinessPercent: pack.summary.v1ReadinessPercent,
        v1TriggerSignalCount: pack.summary.v1TriggerSignalCount,
        v1ExemptionCandidateCount: pack.summary.v1ExemptionCandidateCount,
        v1HandoffCount: pack.summary.v1HandoffCount,
        crossSourceConflictCount: pack.summary.crossSourceConflictCount,
        environmentalEligibleCustomerTypeCount:
          pack.summary.environmentalEligibleCustomerTypeCount,
        environmentalCapitalProgramCount:
          pack.summary.environmentalCapitalProgramCount,
        legacyAssessmentRoute: pack.legacyBridge.legacyAssessmentRoute,
        legacyPathwayPosture: pack.legacyBridge.legacyPathwayPosture,
        handoffs: handoffs.length,
        message: "Environmental Intake v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
