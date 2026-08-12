import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION } from "@/lib/environmental/complianceV2Runtime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
import {
  ENVIRONMENTAL_RISK_ASSESSMENT_V2_DISCLOSURES,
  ENVIRONMENTAL_RISK_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS,
  ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
  ENVIRONMENTAL_RISK_ASSESSMENT_V2_SIGNAL_IDS,
  composeEnvironmentalRiskAssessmentV2,
  environmentalRiskAssessmentV2Lineage,
} from "@/lib/environmental/riskAssessmentV2Runtime";
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
    ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION ===
      "environmental-risk-assessment-v2-runtime-v0.1.0",
    "Env Risk Assessment v2 runtime version must match v0.1.0 seal."
  );

  const lineage = environmentalRiskAssessmentV2Lineage();
  assert(
    lineage.runtimeVersion === ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.environmentalComplianceV2Version ===
      ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Env Compliance v2."
  );
  assert(
    lineage.environmentalIntakeV2Version ===
      ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Env Intake v2."
  );
  assert(
    lineage.borrowerOnboardingCoreV2Version ===
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical BO v2."
  );
  assert(
    lineage.opportunityDiscoveryV2Version ===
      OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage must seal canonical OD v2."
  );
  assert(
    lineage.financingPathwayEngineV2Version ===
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical FPE v2."
  );
  assert(
    lineage.revenueIntelligenceV2Version ===
      REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical RI v2."
  );
  assert(
    lineage.customerTypeCount === CUSTOMER_TYPE_REGISTRY.length,
    "Lineage customerTypeCount must equal Customer Type Registry size."
  );
  assert(
    lineage.capitalProgramCount === CAPITAL_GRAPH_REGISTRY.length,
    "Lineage capitalProgramCount must equal Capital Graph Registry size."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: default empty risk overlay — all signals DATA_GAP
  // (UNKNOWN), NEEDS_INPUT.
  // ────────────────────────────────────────────────────────────────────
  const defaultPack = composeEnvironmentalRiskAssessmentV2({});
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.environmentalRiskAssessmentV2InternalOnly &&
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
      defaultPack.noAutonomousEnvironmentalCompliance &&
      defaultPack.noAutonomousEnvironmentalRiskAssessment &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLenderCommitment &&
      defaultPack.noLegalReliance &&
      defaultPack.noOfficialEnvironmentalReport &&
      defaultPack.noEnvironmentalClearance &&
      defaultPack.noNEPADetermination &&
      defaultPack.noPhaseIESAReport &&
      defaultPack.noPhaseIIESAReport &&
      defaultPack.noPermitIssued &&
      defaultPack.noProviderEngagement &&
      defaultPack.noFeeAuthorization &&
      defaultPack.noLiveExternalAction &&
      defaultPack.noSourceCertainty &&
      defaultPack.noNoticeSend &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Default pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v2SignalCount ===
      ENVIRONMENTAL_RISK_ASSESSMENT_V2_SIGNAL_IDS.length,
    "Default pack must compose all seven risk signals."
  );
  assert(
    defaultPack.summary.v2DataGapSignalCount === 7,
    "Default pack with no overlay must report 7 DATA_GAP signals."
  );
  assert(
    defaultPack.summary.v2NeedsInputCount === 7,
    "Default pack must report 7 NEEDS_INPUT signals."
  );
  assert(
    defaultPack.summary.v2HighRiskSignalCount === 0,
    "Default pack must report 0 high-risk signals."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: all-NONE overlay — every signal READY_FOR_REVIEW,
  // 100% readiness.
  // ────────────────────────────────────────────────────────────────────
  const cleanPack = composeEnvironmentalRiskAssessmentV2({
    riskOverlay: {
      siteContaminationHistory: "NONE",
      waterWetlandProximity: "NONE",
      floodplainStatus: "NONE",
      tribalLandStatus: "NONE",
      historicDistrictStatus: "NONE",
      endangeredSpeciesHabitatStatus: "NONE",
      brownfieldStatus: "NONE",
    },
  });
  assert(
    cleanPack.summary.v2ReadyCount === 7,
    "All-NONE overlay must report 7 READY_FOR_REVIEW signals."
  );
  assert(
    cleanPack.summary.v2OverallReadinessPercent === 100,
    "All-NONE overlay must report 100% v2 readiness."
  );
  assert(
    cleanPack.summary.v2HighRiskSignalCount === 0,
    "All-NONE overlay must report 0 high-risk signals."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario C: high-impact overlay with v1 gate CLEARED — must
  // surface era-v2-gate-cleared-risk-blocked conflict.
  // ────────────────────────────────────────────────────────────────────
  const highRiskClearedPack = composeEnvironmentalRiskAssessmentV2({
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerLicenseRef: "license://spoke/eng-001",
      providerLicenseVerified: true,
      assessmentOutcome: "CLEARED",
      feeAmount: 2500,
      standardMarketRateAmount: 2800,
      feeDisclosureRef: "fee-disclosure://test/risk-cleared",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      spokeIsolationConfirmed: true,
      bankerSpokeIsolated: true,
      auditAnchorRef: "audit-anchor://test/risk-cleared",
    },
    riskOverlay: {
      siteContaminationHistory: "NONE",
      waterWetlandProximity: "ON_SITE",
      floodplainStatus: "NONE",
      tribalLandStatus: "NONE",
      historicDistrictStatus: "NONE",
      endangeredSpeciesHabitatStatus: "NONE",
      brownfieldStatus: "NONE",
    },
  });
  assert(
    highRiskClearedPack.environmentalComplianceV2.gateSnapshot
      .assessmentRequirementStatus === "ENVIRONMENTAL_LINEAGE_CONFIRMED",
    "Upstream v1 gate must report ENVIRONMENTAL_LINEAGE_CONFIRMED."
  );
  assert(
    highRiskClearedPack.summary.v2BlockedCount >= 1,
    "ON_SITE water/wetland must surface at least one BLOCKED_BY_CONFLICT signal."
  );
  assert(
    highRiskClearedPack.crossSourceConflicts.some(
      (c) => c.conflictId === "era-v2-gate-cleared-risk-blocked"
    ),
    "High-risk descriptor with cleared gate must surface era-v2-gate-cleared-risk-blocked conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario D: tribal land ON_SOVEREIGN_LAND without
  // authorization — must surface the sovereign conflict.
  // ────────────────────────────────────────────────────────────────────
  const tribalPack = composeEnvironmentalRiskAssessmentV2({
    scope: { sovereignFederationAllowed: false },
    riskOverlay: {
      siteContaminationHistory: "NONE",
      waterWetlandProximity: "NONE",
      floodplainStatus: "NONE",
      tribalLandStatus: "ON_SOVEREIGN_LAND",
      historicDistrictStatus: "NONE",
      endangeredSpeciesHabitatStatus: "NONE",
      brownfieldStatus: "NONE",
    },
  });
  const tribalSignal = tribalPack.v2Signals.find(
    (s) => s.id === "risk_tribal_land_alignment"
  );
  assert(
    tribalSignal !== undefined,
    "Tribal land signal must be present."
  );
  assert(
    tribalSignal.status === "BLOCKED_BY_CONFLICT" &&
      tribalSignal.riskTier === "SOVEREIGN_REVIEW",
    "Tribal-land ON_SOVEREIGN_LAND must escalate to SOVEREIGN_REVIEW + BLOCKED_BY_CONFLICT."
  );
  assert(
    tribalPack.crossSourceConflicts.some(
      (c) => c.conflictId === "era-v2-tribal-land-without-sovereign-authorization"
    ),
    "Tribal-land sovereign-without-authorization conflict must surface."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario E: 100-year floodplain in REAL_ESTATE pathway with
  // a CLEARED gate — must surface the floodplain conflict.
  // ────────────────────────────────────────────────────────────────────
  const floodPack = composeEnvironmentalRiskAssessmentV2({
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerLicenseRef: "license://spoke/eng-001",
      providerLicenseVerified: true,
      assessmentOutcome: "CLEARED",
      feeAmount: 1500,
      standardMarketRateAmount: 1800,
      feeDisclosureRef: "fee-disclosure://test/flood",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      spokeIsolationConfirmed: true,
      bankerSpokeIsolated: true,
      auditAnchorRef: "audit-anchor://test/flood",
    },
    riskOverlay: {
      siteContaminationHistory: "NONE",
      waterWetlandProximity: "NONE",
      floodplainStatus: "100_YEAR",
      tribalLandStatus: "NONE",
      historicDistrictStatus: "NONE",
      endangeredSpeciesHabitatStatus: "NONE",
      brownfieldStatus: "NONE",
    },
  });
  assert(
    floodPack.crossSourceConflicts.some(
      (c) => c.conflictId === "era-v2-floodplain-real-estate-without-block"
    ),
    "100_YEAR floodplain in REAL_ESTATE pathway with cleared gate must surface flood conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario F: RECORDED contamination without Phase II ESA — must
  // surface the contamination conflict.
  // ────────────────────────────────────────────────────────────────────
  const contaminationPack = composeEnvironmentalRiskAssessmentV2({
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerLicenseRef: "license://spoke/eng-001",
      providerLicenseVerified: true,
      assessmentOutcome: "CLEARED",
      feeAmount: 2500,
      standardMarketRateAmount: 2800,
      feeDisclosureRef: "fee-disclosure://test/contamination",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      spokeIsolationConfirmed: true,
      bankerSpokeIsolated: true,
      auditAnchorRef: "audit-anchor://test/contamination",
    },
    riskOverlay: {
      siteContaminationHistory: "RECORDED",
      waterWetlandProximity: "NONE",
      floodplainStatus: "NONE",
      tribalLandStatus: "NONE",
      historicDistrictStatus: "NONE",
      endangeredSpeciesHabitatStatus: "NONE",
      brownfieldStatus: "NONE",
    },
  });
  assert(
    contaminationPack.crossSourceConflicts.some(
      (c) => c.conflictId === "era-v2-contamination-without-phase-ii"
    ),
    "RECORDED contamination without Phase II/III ESA must surface contamination conflict."
  );

  // Disclosure + production restriction posture.
  assert(
    ENVIRONMENTAL_RISK_ASSESSMENT_V2_DISCLOSURES.some((d) =>
      d.includes("advisory site-risk-overlay posture")
    ),
    "Disclosures must include advisory/site-risk framing."
  );
  assert(
    ENVIRONMENTAL_RISK_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous environmental risk determination"
    ),
    "Production restrictions must block autonomous risk determination."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-environmental-risk-assessment-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-environmental-risk-assessment-v2 module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Module must be production-blocked and replay-required."
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
      "governance.environmental.risk.assessment.v2.composed"
    ),
    "Module must publish the v2 risk assessment event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.environmental.compliance.v2.composed"
    ),
    "Module must consume upstream Environmental Compliance v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.environmental.risk.assessment.v2.composed"
  );
  assert(contract !== undefined, "Event contract must be registered.");
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
      handoff.fromModuleId === "governance-environmental-risk-assessment-v2" ||
      handoff.toModuleId === "governance-environmental-risk-assessment-v2"
  );
  assert(
    handoffs.length >= 15,
    "Env Risk Assessment v2 module must declare at least fifteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (h) => h.toModuleId === "governance-environmental-compliance-v2"
    ),
    "Module must hand off to Environmental Compliance v2."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
        environmentalComplianceV2Version:
          lineage.environmentalComplianceV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        defaultPackDataGap: defaultPack.summary.v2DataGapSignalCount,
        cleanPackReadyCount: cleanPack.summary.v2ReadyCount,
        cleanPackReadiness: cleanPack.summary.v2OverallReadinessPercent,
        highRiskClearedPackBlocked: highRiskClearedPack.summary.v2BlockedCount,
        highRiskClearedConflicts:
          highRiskClearedPack.summary.crossSourceConflictCount,
        tribalPackConflicts: tribalPack.summary.crossSourceConflictCount,
        floodPackConflicts: floodPack.summary.crossSourceConflictCount,
        contaminationPackConflicts:
          contaminationPack.summary.crossSourceConflictCount,
        handoffs: handoffs.length,
        message: "Environmental Risk Assessment v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
