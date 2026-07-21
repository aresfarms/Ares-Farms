import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import {
  ENVIRONMENTAL_COMPLIANCE_V2_DISCLOSURES,
  ENVIRONMENTAL_COMPLIANCE_V2_PRODUCTION_RESTRICTIONS,
  ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
  ENVIRONMENTAL_COMPLIANCE_V2_SIGNAL_IDS,
  composeEnvironmentalComplianceV2,
  environmentalComplianceV2Lineage,
} from "@/lib/environmental/complianceV2Runtime";
import { ENVIRONMENTAL_INTAKE_RUNTIME_VERSION } from "@/lib/environmental/intakeRuntime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
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
  // Version seals.
  assert(
    ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION ===
      "environmental-compliance-v2-runtime-v0.1.0",
    "Environmental Compliance v2 runtime version must match canonical v0.1.0 seal."
  );

  const lineage = environmentalComplianceV2Lineage();
  assert(
    lineage.runtimeVersion === ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.environmentalIntakeV2Version ===
      ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Environmental Intake v2."
  );
  assert(
    lineage.borrowerOnboardingCoreV2Version ===
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Borrower Onboarding Core v2."
  );
  assert(
    lineage.opportunityDiscoveryV2Version ===
      OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Opportunity Discovery v2."
  );
  assert(
    lineage.financingPathwayEngineV2Version ===
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Financing Pathway Engine v2."
  );
  assert(
    lineage.revenueIntelligenceV2Version ===
      REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Revenue Intelligence v2."
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
    "Lineage must seal legacy v1 environmental intake."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: default empty input — exempt pathway, all signals
  // READY_FOR_REVIEW; no banker decision flows.
  // ────────────────────────────────────────────────────────────────────
  const exemptPack = composeEnvironmentalComplianceV2({});

  assert(
    exemptPack.runtimeVersion === ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    "Default pack must emit canonical runtime version."
  );
  assert(
    exemptPack.productionBlocked &&
      exemptPack.humanReviewRequired &&
      exemptPack.advisoryOnly &&
      exemptPack.environmentalComplianceV2InternalOnly &&
      exemptPack.spokeIsolationRequired &&
      exemptPack.feeAutonomyPreserved &&
      exemptPack.noAutonomousLending &&
      exemptPack.noAutonomousEligibility &&
      exemptPack.noAutonomousPathway &&
      exemptPack.noAutonomousOpportunity &&
      exemptPack.noAutonomousIntelligence &&
      exemptPack.noAutonomousEvidence &&
      exemptPack.noAutonomousCertification &&
      exemptPack.noAutonomousOnboarding &&
      exemptPack.noAutonomousReadiness &&
      exemptPack.noAutonomousEnvironmentalIntake &&
      exemptPack.noAutonomousEnvironmentalCompliance &&
      exemptPack.noPublicVerification &&
      exemptPack.noRegulatoryReliance &&
      exemptPack.noLenderCommitment &&
      exemptPack.noLegalReliance &&
      exemptPack.noOfficialEnvironmentalReport &&
      exemptPack.noEnvironmentalClearance &&
      exemptPack.noNEPADetermination &&
      exemptPack.noPhaseIESAReport &&
      exemptPack.noPermitIssued &&
      exemptPack.noProviderEngagement &&
      exemptPack.noFeeAuthorization &&
      exemptPack.noLiveExternalAction &&
      exemptPack.noSourceCertainty &&
      exemptPack.noNoticeSend &&
      exemptPack.replaySafe &&
      exemptPack.auditSafe &&
      exemptPack.federationScoped &&
      exemptPack.conflictPreserving,
    "Environmental Compliance v2 pack must preserve every constitutional flag."
  );
  assert(
    exemptPack.summary.v2SignalCount ===
      ENVIRONMENTAL_COMPLIANCE_V2_SIGNAL_IDS.length,
    "Default pack must compose all four canonical v2 compliance signals."
  );
  assert(
    exemptPack.gateSnapshot.triggered === false,
    "Default pack must NOT trigger environmental assessment."
  );
  assert(
    exemptPack.gateSnapshot.assessmentRequirementStatus ===
      "PATHWAY_EXEMPTION_RECORDED",
    "Default pack must record pathway exemption."
  );
  assert(
    exemptPack.gateSnapshot.loanPathwayAdvancementAllowed === true,
    "Default pack with pathway exemption must allow loan pathway advancement."
  );
  assert(
    exemptPack.summary.v2ReadyCount === 4,
    "Exempt pack must report 4 READY_FOR_REVIEW signals."
  );
  assert(
    exemptPack.summary.v2OverallReadinessPercent === 100,
    "Exempt pack must report 100% v2 readiness."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: triggered + fully populated gate inputs — pack
  // exercises every v2 signal with full evidence.
  // ────────────────────────────────────────────────────────────────────
  const triggeredPack = composeEnvironmentalComplianceV2({
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
    legacyIntake: {
      realPropertyCollateral: true,
      federalFundingTrigger: true,
      knownEnvironmentalStatuteTrigger: false,
      borrowerExternalFirmInterest: true,
      feeDisclosureAcknowledged: true,
    },
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      triggeringPathway: "ENVIRONMENTAL_REVIEW_TRIGGERED",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerName: "Furlong Environmental Engineering Spoke",
      providerLicenseRef: "license://spoke/eng-001",
      providerLicenseVerified: true,
      assessmentOutcome: "CLEARED",
      feeAmount: 2500,
      standardMarketRateAmount: 2800,
      feeDisclosureRef: "fee-disclosure://smoke/environmental",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      spokeIsolationConfirmed: true,
      bankerSpokeIsolated: true,
      auditAnchorRef: "audit-anchor://smoke/eng-001",
    },
  });

  assert(
    triggeredPack.gateSnapshot.triggered === true,
    "Triggered pack must trigger environmental assessment."
  );
  assert(
    triggeredPack.gateSnapshot.assessmentRequirementStatus ===
      "ENVIRONMENTAL_LINEAGE_CONFIRMED",
    "Triggered pack with all gates passing + CLEARED outcome must confirm lineage."
  );
  assert(
    triggeredPack.gateSnapshot.loanPathwayAdvancementAllowed === true,
    "Triggered pack with all gates passing must allow loan pathway advancement."
  );
  assert(
    triggeredPack.gateSnapshot.providerType ===
      "ENVIRONMENTAL_ENGINEERING_SPOKE",
    "Provider type must be normalized to ENVIRONMENTAL_ENGINEERING_SPOKE."
  );
  assert(
    triggeredPack.gateSnapshot.assessmentType === "PHASE_I_ESA",
    "Assessment type must be PHASE_I_ESA."
  );
  assert(
    triggeredPack.summary.v1AssessmentOutcome === "CLEARED",
    "Assessment outcome must be CLEARED."
  );
  assert(
    triggeredPack.summary.v1FeeAmount === 2500 &&
      triggeredPack.summary.v1StandardMarketRateAmount === 2800,
    "Fee + standard market rate must be reflected in the summary."
  );
  assert(
    triggeredPack.summary.v1GatesBlockedCount === 0,
    "Fully populated triggered pack must have zero gate blockers."
  );
  assert(
    triggeredPack.summary.v2ReadyCount === 4,
    "Fully populated triggered pack must report 4 READY_FOR_REVIEW signals."
  );
  assert(
    triggeredPack.summary.v2OverallReadinessPercent === 100,
    "Fully populated triggered pack must report 100% v2 readiness."
  );
  // Cross-source conflicts: the only allowed conflict for a fully
  // populated triggered pack is the upstream-propagation conflict
  // (ec-v2-upstream-ei-v2-conflicts). v2's own gate-derived
  // conflicts must be absent.
  const triggeredOwnGateConflicts = triggeredPack.crossSourceConflicts.filter(
    (c) =>
      c.conflictId !== "ec-v2-upstream-ei-v2-conflicts" &&
      c.conflictId !== "ec-v2-upstream-bo-v2-conflicts"
  );
  assert(
    triggeredOwnGateConflicts.length === 0,
    `Fully populated triggered pack must report zero v2-gate-derived conflicts (got ${triggeredOwnGateConflicts.map((c) => c.conflictId).join(", ")}).`
  );
  assert(
    triggeredPack.gateSnapshot.blockerReasons.length === 0,
    "Fully populated triggered pack must report zero v1 gate blocker reasons."
  );
  assert(
    triggeredPack.v2Signals.every((signal) =>
      ENVIRONMENTAL_COMPLIANCE_V2_SIGNAL_IDS.includes(signal.id)
    ),
    "Every composed signal must use a canonical v2 compliance signal id."
  );
  assert(
    triggeredPack.v2Signals.every((signal) =>
      signal.blockedClaims.includes("official environmental report")
    ),
    "Every v2 signal must propagate the official-environmental-report-blocked claim."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario C: triggered + spoke isolation NOT confirmed — must
  // BLOCK_BY_CONFLICT on spoke isolation signal, surface
  // ec-v2-spoke-isolation-not-confirmed cross-source conflict.
  // ────────────────────────────────────────────────────────────────────
  const spokeBlockedPack = composeEnvironmentalComplianceV2({
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
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerLicenseRef: "license://spoke/eng-001",
      providerLicenseVerified: true,
      assessmentOutcome: "CLEARED",
      feeDisclosureRef: "fee-disclosure://smoke/environmental",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      // spokeIsolationConfirmed: NOT SET (falsy)
      // bankerSpokeIsolated: NOT SET (falsy)
      auditAnchorRef: "audit-anchor://smoke/eng-001",
    },
  });

  const spokeSignal = spokeBlockedPack.v2Signals.find(
    (s) => s.id === "compliance_spoke_isolation_alignment"
  );
  assert(
    spokeSignal !== undefined,
    "Spoke isolation signal must be present in the pack."
  );
  assert(
    spokeSignal.status === "BLOCKED_BY_CONFLICT",
    "Spoke isolation signal must be BLOCKED_BY_CONFLICT when isolation is not confirmed."
  );
  assert(
    spokeBlockedPack.summary.v2BlockedCount >= 1,
    "Spoke-blocked pack must report at least one BLOCKED_BY_CONFLICT signal."
  );
  assert(
    spokeBlockedPack.crossSourceConflicts.some(
      (c) => c.conflictId === "ec-v2-spoke-isolation-not-confirmed"
    ),
    "Spoke-blocked pack must surface the spoke-isolation-not-confirmed conflict."
  );
  assert(
    spokeBlockedPack.gateSnapshot.loanPathwayAdvancementAllowed === false,
    "Spoke-blocked pack must NOT allow loan pathway advancement."
  );
  assert(
    spokeBlockedPack.gateSnapshot.assessmentRequirementStatus ===
      "ENVIRONMENTAL_GATE_BLOCKED",
    "Spoke-blocked pack must report ENVIRONMENTAL_GATE_BLOCKED status."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario D: ESCALATED outcome without escalation ref — conflict
  // surfaces, audit anchor signal goes NEEDS_INPUT.
  // ────────────────────────────────────────────────────────────────────
  const escalatedPack = composeEnvironmentalComplianceV2({
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      realPropertyCollateral: true,
      assessmentType: "PHASE_II_ESA",
      assessmentProviderType: "APPROVED_EXTERNAL_FIRM",
      providerLicenseRef: "license://firm/abc",
      providerLicenseVerified: true,
      assessmentOutcome: "ESCALATED",
      feeAmount: 5000,
      standardMarketRateAmount: 4800,
      feeDisclosureRef: "fee-disclosure://smoke/environmental-escalated",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      spokeIsolationConfirmed: true,
      bankerSpokeIsolated: true,
      auditAnchorRef: "audit-anchor://smoke/escalated",
      // escalationRef: NOT SET
    },
  });

  assert(
    escalatedPack.crossSourceConflicts.some(
      (c) => c.conflictId === "ec-v2-escalation-ref-missing"
    ),
    "Escalated pack without escalation ref must surface the missing-escalation-ref conflict."
  );
  assert(
    escalatedPack.gateSnapshot.loanPathwayAdvancementAllowed === false,
    "Escalated pack without escalation ref must NOT allow loan pathway advancement."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario E: sovereign tribal customer type declared without
  // sovereign federation authorization — conflict surfaces.
  // ────────────────────────────────────────────────────────────────────
  const sovereignPack = composeEnvironmentalComplianceV2({
    declaredCustomerTypes: ["federally recognized tribe"],
    scope: { sovereignFederationAllowed: false },
    onboardingState: {
      stage: "BEGINNER",
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
    sovereignPack.crossSourceConflicts.some(
      (c) => c.conflictId === "ec-v2-sovereign-declared-without-authorization"
    ),
    "Sovereign declaration without authorization must surface the sovereign-without-authorization conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Disclosure / production-restriction posture.
  // ────────────────────────────────────────────────────────────────────
  assert(
    ENVIRONMENTAL_COMPLIANCE_V2_DISCLOSURES.some((d) =>
      d.includes("advisory operational environmental compliance posture")
    ),
    "Disclosures must include the advisory/operational framing."
  );
  assert(
    ENVIRONMENTAL_COMPLIANCE_V2_DISCLOSURES.some((d) =>
      d.includes("Environmental Engineering Spoke isolation is preserved")
    ),
    "Disclosures must include spoke isolation language."
  );
  assert(
    ENVIRONMENTAL_COMPLIANCE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous environmental compliance determination"
    ),
    "Production restrictions must block autonomous environmental compliance determination."
  );
  assert(
    ENVIRONMENTAL_COMPLIANCE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no provider engagement"
    ),
    "Production restrictions must block provider engagement."
  );
  assert(
    ENVIRONMENTAL_COMPLIANCE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no fee authorization"
    ),
    "Production restrictions must block fee authorization."
  );

  // ────────────────────────────────────────────────────────────────────
  // Module manifest conformance.
  // ────────────────────────────────────────────────────────────────────
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-environmental-compliance-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-environmental-compliance-v2 module manifest must be registered."
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
      "governance.environmental.compliance.v2.composed"
    ),
    "Module must publish the v2 composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.environmental.intake.v2.composed"
    ),
    "Module must consume upstream Environmental Intake v2 event."
  );

  // ────────────────────────────────────────────────────────────────────
  // Event contract conformance.
  // ────────────────────────────────────────────────────────────────────
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.environmental.compliance.v2.composed"
  );
  assert(
    contract !== undefined,
    "governance.environmental.compliance.v2.composed contract must be registered."
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

  // ────────────────────────────────────────────────────────────────────
  // Handoff conformance.
  // ────────────────────────────────────────────────────────────────────
  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-environmental-compliance-v2" ||
      handoff.toModuleId === "governance-environmental-compliance-v2"
  );
  assert(
    handoffs.length >= 15,
    "Environmental Compliance v2 module must declare at least fifteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (h) => h.toModuleId === "governance-environmental-intake-v2"
    ),
    "Module must hand off to Environmental Intake v2."
  );
  assert(
    handoffs.some((h) => h.toModuleId === "environmental-compliance"),
    "Module must hand off to environmental-compliance v1 review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
        environmentalIntakeV2Version:
          lineage.environmentalIntakeV2Version,
        borrowerOnboardingCoreV2Version:
          lineage.borrowerOnboardingCoreV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        exemptPackTriggered: exemptPack.gateSnapshot.triggered,
        exemptPackReadyCount: exemptPack.summary.v2ReadyCount,
        triggeredPackAssessmentRequirementStatus:
          triggeredPack.gateSnapshot.assessmentRequirementStatus,
        triggeredPackReadyCount: triggeredPack.summary.v2ReadyCount,
        triggeredPackV1GatesBlockedCount:
          triggeredPack.summary.v1GatesBlockedCount,
        spokeBlockedPackBlockedCount:
          spokeBlockedPack.summary.v2BlockedCount,
        spokeBlockedPackConflictCount:
          spokeBlockedPack.summary.crossSourceConflictCount,
        escalatedPackConflictCount:
          escalatedPack.summary.crossSourceConflictCount,
        sovereignPackConflictCount:
          sovereignPack.summary.crossSourceConflictCount,
        handoffs: handoffs.length,
        message: "Environmental Compliance v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
