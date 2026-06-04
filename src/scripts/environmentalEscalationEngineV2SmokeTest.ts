import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION } from "@/lib/environmental/complianceV2Runtime";
import {
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_DISCLOSURES,
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_PRODUCTION_RESTRICTIONS,
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_SIGNAL_IDS,
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_REVIEWER,
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_TIMELINE_DAYS,
  composeEnvironmentalEscalationEngineV2,
  environmentalEscalationEngineV2Lineage,
} from "@/lib/environmental/escalationEngineV2Runtime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
import { ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION } from "@/lib/environmental/riskAssessmentV2Runtime";
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
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION ===
      "environmental-escalation-engine-v2-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );

  const lineage = environmentalEscalationEngineV2Lineage();
  assert(
    lineage.runtimeVersion ===
      ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.environmentalRiskAssessmentV2Version ===
      ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
    "Lineage must seal canonical ERA v2."
  );
  assert(
    lineage.environmentalComplianceV2Version ===
      ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical EC v2."
  );
  assert(
    lineage.environmentalIntakeV2Version ===
      ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical EI v2."
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

  // Tier timeline + reviewer constants.
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_TIMELINE_DAYS.URGENT === 3,
    "URGENT tier must have a 3-day resolution window."
  );
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_TIMELINE_DAYS.SOVEREIGN_REVIEW ===
      14,
    "SOVEREIGN_REVIEW tier must have a 14-day resolution window."
  );
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_REVIEWER.URGENT ===
      "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER",
    "URGENT tier must route to ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER."
  );
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_TIER_REVIEWER.SOVEREIGN_REVIEW ===
      "SOVEREIGN_FEDERATION_AUTHORITY",
    "SOVEREIGN_REVIEW tier must route to SOVEREIGN_FEDERATION_AUTHORITY."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario A: default empty input — exempt pathway, no
  // escalations needed.
  // ────────────────────────────────────────────────────────────────────
  const exemptPack = composeEnvironmentalEscalationEngineV2({});
  assert(
    exemptPack.productionBlocked &&
      exemptPack.humanReviewRequired &&
      exemptPack.advisoryOnly &&
      exemptPack.environmentalEscalationEngineV2InternalOnly &&
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
      exemptPack.noAutonomousEnvironmentalRiskAssessment &&
      exemptPack.noAutonomousEnvironmentalEscalation &&
      exemptPack.noPublicVerification &&
      exemptPack.noRegulatoryReliance &&
      exemptPack.noLenderCommitment &&
      exemptPack.noLegalReliance &&
      exemptPack.noOfficialEnvironmentalReport &&
      exemptPack.noEnvironmentalClearance &&
      exemptPack.noNEPADetermination &&
      exemptPack.noPhaseIESAReport &&
      exemptPack.noPhaseIIESAReport &&
      exemptPack.noPermitIssued &&
      exemptPack.noProviderEngagement &&
      exemptPack.noFeeAuthorization &&
      exemptPack.noLiveExternalAction &&
      exemptPack.noExternalEscalationNotification &&
      exemptPack.noSourceCertainty &&
      exemptPack.noNoticeSend &&
      exemptPack.replaySafe &&
      exemptPack.auditSafe &&
      exemptPack.federationScoped &&
      exemptPack.conflictPreserving,
    "Default pack must preserve every constitutional flag."
  );
  assert(
    exemptPack.summary.v2SignalCount ===
      ENVIRONMENTAL_ESCALATION_ENGINE_V2_SIGNAL_IDS.length,
    "Default pack must compose all four escalation signals."
  );
  assert(
    exemptPack.summary.queueSize === 0,
    "Default exempt pack must produce zero escalation entries."
  );
  assert(
    exemptPack.summary.v2OverallReadinessPercent === 100,
    "Default exempt pack must report 100% readiness."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: triggered + spoke isolation not confirmed — should
  // produce at least one URGENT entry routed to ENVIRONMENTAL_
  // ENGINEERING_SPOKE_REVIEWER.
  // ────────────────────────────────────────────────────────────────────
  const spokeBlockedPack = composeEnvironmentalEscalationEngineV2({
    complianceGate: {
      pathwayType: "REAL_ESTATE",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerLicenseRef: "license://spoke/eng-001",
      providerLicenseVerified: true,
      assessmentOutcome: "CLEARED",
      feeDisclosureRef: "fee-disclosure://test/spoke",
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      // spokeIsolationConfirmed + bankerSpokeIsolated NOT SET (falsy)
      auditAnchorRef: "audit-anchor://test/spoke",
    },
  });
  assert(
    spokeBlockedPack.summary.queueSize > 0,
    "Spoke-blocked pack must produce escalation entries."
  );
  assert(
    spokeBlockedPack.summary.urgentCount >= 1,
    "Spoke-blocked pack must produce at least one URGENT escalation."
  );
  assert(
    spokeBlockedPack.escalationQueue.some(
      (entry) =>
        entry.tier === "URGENT" &&
        entry.reviewerRole === "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER" &&
        entry.expectedResolutionWindowDays === 3
    ),
    "Spoke-blocked pack must produce a URGENT entry routed to the spoke reviewer with a 3-day window."
  );
  assert(
    spokeBlockedPack.summary.v2OverallReadinessPercent === 100,
    "Spoke-blocked pack should still report 100% signal readiness when routing is correct."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario C: tribal land ON_SOVEREIGN_LAND without sovereign
  // authorization — sovereign entries must be HIDDEN; sovereign-
  // without-authorization conflict must surface.
  // ────────────────────────────────────────────────────────────────────
  const tribalClosedPack = composeEnvironmentalEscalationEngineV2({
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
  assert(
    tribalClosedPack.escalationQueue.every(
      (entry) => entry.tier !== "SOVEREIGN_REVIEW"
    ),
    "Sovereign-closed scope must HIDE sovereign-tier escalation entries from the queue."
  );
  assert(
    tribalClosedPack.crossSourceConflicts.some(
      (c) => c.conflictId === "eee-v2-sovereign-tier-without-authorization"
    ),
    "Sovereign tribal without authorization must surface sovereign-without-authorization conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario D: tribal land ON_SOVEREIGN_LAND WITH sovereign
  // authorization — SOVEREIGN_REVIEW entry must appear.
  // ────────────────────────────────────────────────────────────────────
  const tribalOpenPack = composeEnvironmentalEscalationEngineV2({
    scope: { sovereignFederationAllowed: true },
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
  assert(
    tribalOpenPack.summary.sovereignReviewCount >= 1,
    "Sovereign-authorized scope must produce at least one SOVEREIGN_REVIEW escalation entry."
  );
  assert(
    tribalOpenPack.escalationQueue.some(
      (entry) =>
        entry.tier === "SOVEREIGN_REVIEW" &&
        entry.reviewerRole === "SOVEREIGN_FEDERATION_AUTHORITY" &&
        entry.expectedResolutionWindowDays === 14
    ),
    "Sovereign-authorized scope must route SOVEREIGN_REVIEW to SOVEREIGN_FEDERATION_AUTHORITY with a 14-day window."
  );

  // Disclosure + production restriction posture.
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_DISCLOSURES.some((d) =>
      d.includes("advisory escalation routing posture")
    ),
    "Disclosures must include advisory/escalation framing."
  );
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no external escalation notification"
    ),
    "Production restrictions must block external escalation notification."
  );
  assert(
    ENVIRONMENTAL_ESCALATION_ENGINE_V2_PRODUCTION_RESTRICTIONS.includes(
      "no external ticket creation"
    ),
    "Production restrictions must block external ticket creation."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-environmental-escalation-engine-v2"
  );
  assert(
    moduleManifest !== undefined,
    "governance-environmental-escalation-engine-v2 module manifest must be registered."
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
      "governance.environmental.escalation.engine.v2.composed"
    ),
    "Module must publish the v2 escalation engine event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.environmental.risk.assessment.v2.composed"
    ),
    "Module must consume upstream Environmental Risk Assessment v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType ===
      "governance.environmental.escalation.engine.v2.composed"
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
      handoff.fromModuleId ===
        "governance-environmental-escalation-engine-v2" ||
      handoff.toModuleId === "governance-environmental-escalation-engine-v2"
  );
  assert(
    handoffs.length >= 15,
    "Env Escalation Engine v2 module must declare at least fifteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (h) => h.toModuleId === "governance-environmental-risk-assessment-v2"
    ),
    "Module must hand off to Environmental Risk Assessment v2."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
        environmentalRiskAssessmentV2Version:
          lineage.environmentalRiskAssessmentV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        exemptPackQueueSize: exemptPack.summary.queueSize,
        spokeBlockedPackQueueSize: spokeBlockedPack.summary.queueSize,
        spokeBlockedPackUrgentCount: spokeBlockedPack.summary.urgentCount,
        tribalClosedPackSovereignCount:
          tribalClosedPack.summary.sovereignReviewCount,
        tribalClosedPackConflicts:
          tribalClosedPack.summary.crossSourceConflictCount,
        tribalOpenPackSovereignCount:
          tribalOpenPack.summary.sovereignReviewCount,
        handoffs: handoffs.length,
        message: "Environmental Escalation Engine v2 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
