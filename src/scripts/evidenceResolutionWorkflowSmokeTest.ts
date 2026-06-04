import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION } from "@/lib/environmental/complianceV2Runtime";
import { ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION } from "@/lib/environmental/escalationEngineV2Runtime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
import { ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION } from "@/lib/environmental/riskAssessmentV2Runtime";
import {
  EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS,
  EVIDENCE_RESOLUTION_WORKFLOW_DISCLOSURES,
  EVIDENCE_RESOLUTION_WORKFLOW_PRODUCTION_RESTRICTIONS,
  EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
  EVIDENCE_RESOLUTION_WORKFLOW_SIGNAL_IDS,
  composeEvidenceResolutionWorkflow,
  evidenceResolutionWorkflowLineage,
} from "@/lib/evidence-resolution/evidenceResolutionWorkflowRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { READINESS_ASSESSMENT_V2_RUNTIME_VERSION } from "@/lib/readiness/readinessAssessmentV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION ===
      "evidence-resolution-workflow-runtime-v0.1.0",
    "Runtime version must match v0.1.0 seal."
  );

  const lineage = evidenceResolutionWorkflowLineage();
  assert(
    lineage.runtimeVersion === EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
    "Lineage runtime version must match canonical."
  );
  assert(
    lineage.readinessAssessmentV2Version ===
      READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    "Lineage must seal canonical RA v2."
  );
  assert(
    lineage.borrowerOnboardingCoreV2Version ===
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical BO v2."
  );
  assert(
    lineage.environmentalEscalationEngineV2Version ===
      ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical EEE v2."
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
  // Scenario A: default empty input — variances may exist (default
  // onboarding state has empty sections) but every variance must be
  // converted into a clarification request, no banned language, and
  // every signal must be READY_FOR_REVIEW.
  // ────────────────────────────────────────────────────────────────────
  const defaultPack = composeEvidenceResolutionWorkflow({});
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.evidenceResolutionWorkflowInternalOnly &&
      defaultPack.uncertaintyPreserved &&
      defaultPack.noFraudAccusation &&
      defaultPack.noDenial &&
      defaultPack.noRejection &&
      defaultPack.noFalseRejection &&
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
      defaultPack.noAutonomousEnvironmentalEscalation &&
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
    "Default pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.v1SignalCount ===
      EVIDENCE_RESOLUTION_WORKFLOW_SIGNAL_IDS.length,
    "Default pack must compose all four workflow signals."
  );
  assert(
    defaultPack.summary.varianceCount ===
      defaultPack.summary.clarificationRequestCount,
    "Default pack must convert every detected variance into a clarification request."
  );
  assert(
    defaultPack.summary.fraudAccusationRiskCount === 0,
    "Default pack must produce zero fraud-accusation-flagged clarification requests."
  );
  assert(
    defaultPack.summary.falseRejectionRiskCount === 0,
    "Default pack must produce zero false-rejection-flagged clarification requests."
  );
  assert(
    defaultPack.summary.v1ReadyCount === defaultPack.summary.v1SignalCount,
    "Default pack must report all four workflow signals as READY_FOR_REVIEW."
  );
  assert(
    defaultPack.summary.v1OverallReadinessPercent === 100,
    "Default pack must report 100% workflow readiness."
  );

  // Every clarification request preserves uncertainty.
  for (const clarification of defaultPack.clarificationRequests) {
    assert(
      clarification.uncertaintyPreservedFlag === true,
      `Clarification ${clarification.clarificationId} must preserve uncertainty.`
    );
    assert(
      clarification.resolution === "REQUIRES_HUMAN_REVIEW",
      `Clarification ${clarification.clarificationId} must resolve to REQUIRES_HUMAN_REVIEW.`
    );
    assert(
      clarification.evidenceReplayRef.length > 0,
      `Clarification ${clarification.clarificationId} must carry an evidence replay reference.`
    );
    assert(
      clarification.expectedResolutionWindowDays > 0,
      `Clarification ${clarification.clarificationId} must declare a non-zero resolution window.`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario B: triggered spoke-blocked compliance gate — must
  // produce URGENT-tier escalation clarifications routed to the
  // spoke reviewer; still zero banned language, zero false rejection.
  // ────────────────────────────────────────────────────────────────────
  const spokeBlockedPack = composeEvidenceResolutionWorkflow({
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
    spokeBlockedPack.clarificationRequests.some(
      (c) =>
        c.reviewerRole === "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER" &&
        c.sourceModule === "ENVIRONMENTAL_ESCALATION_ENGINE_V2"
    ),
    "Spoke-blocked pack must route at least one escalation clarification to ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER."
  );
  assert(
    spokeBlockedPack.summary.fraudAccusationRiskCount === 0,
    "Spoke-blocked pack must NOT flag fraud-accusation risk."
  );
  assert(
    spokeBlockedPack.summary.falseRejectionRiskCount === 0,
    "Spoke-blocked pack must NOT flag false-rejection risk."
  );
  // No banned tokens anywhere in any clarification text.
  for (const c of spokeBlockedPack.clarificationRequests) {
    const haystack = (
      c.topic +
      " " +
      c.borrowerFacingQuestion +
      " " +
      c.reviewerExplanation
    ).toLowerCase();
    // Specific borrower-claim accusation tokens must not appear in
    // affirmative position. The runtime's negation-aware detector
    // is the canonical gate; here we do a final spot-check on the
    // most dangerous single-word tokens.
    assert(
      !/\bfraud\b/.test(haystack),
      `Clarification ${c.clarificationId} must not contain the word "fraud".`
    );
    assert(
      !/\bdenied\b/.test(haystack),
      `Clarification ${c.clarificationId} must not contain the word "denied".`
    );
    assert(
      !/\brejected\b/.test(haystack),
      `Clarification ${c.clarificationId} must not contain the word "rejected".`
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Scenario C: tribal land + sovereign-closed — sovereign-tier
  // entries hidden from escalation queue (so no SOVEREIGN_FEDERATION_AUTHORITY
  // routed clarifications); but cross-source conflict propagation
  // must produce clarification requests.
  // ────────────────────────────────────────────────────────────────────
  const tribalClosedPack = composeEvidenceResolutionWorkflow({
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
    tribalClosedPack.clarificationRequests.every(
      (c) => c.reviewerRole !== "SOVEREIGN_FEDERATION_AUTHORITY"
    ),
    "Sovereign-closed scope must HIDE SOVEREIGN_FEDERATION_AUTHORITY clarifications."
  );
  assert(
    tribalClosedPack.summary.upstreamEscalationConflictCount >= 1,
    "Sovereign-closed pack must propagate upstream EEE v2 sovereign-without-authorization conflict."
  );

  // ────────────────────────────────────────────────────────────────────
  // Scenario D: tribal land + sovereign-authorized — sovereign-tier
  // escalation entries are visible and routed to the sovereign
  // reviewer.
  // ────────────────────────────────────────────────────────────────────
  const tribalOpenPack = composeEvidenceResolutionWorkflow({
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
    tribalOpenPack.clarificationRequests.some(
      (c) => c.reviewerRole === "SOVEREIGN_FEDERATION_AUTHORITY"
    ),
    "Sovereign-authorized scope must surface at least one SOVEREIGN_FEDERATION_AUTHORITY clarification request."
  );

  // Banned language token registry sanity.
  assert(
    EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS.includes("fraud"),
    "Banned tokens must include 'fraud'."
  );
  assert(
    EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS.includes("denied"),
    "Banned tokens must include 'denied'."
  );
  assert(
    EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS.includes("rejected"),
    "Banned tokens must include 'rejected'."
  );
  assert(
    EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS.includes("approved"),
    "Banned tokens must include 'approved'."
  );

  // Disclosure + production restriction posture.
  assert(
    EVIDENCE_RESOLUTION_WORKFLOW_DISCLOSURES.some((d) =>
      d.includes("Uncertainty is not denial")
    ),
    "Disclosures must include 'Uncertainty is not denial.'"
  );
  assert(
    EVIDENCE_RESOLUTION_WORKFLOW_PRODUCTION_RESTRICTIONS.includes(
      "no denial"
    ) &&
      EVIDENCE_RESOLUTION_WORKFLOW_PRODUCTION_RESTRICTIONS.includes(
        "no rejection"
      ) &&
      EVIDENCE_RESOLUTION_WORKFLOW_PRODUCTION_RESTRICTIONS.includes(
        "no fraud accusation"
      ),
    "Production restrictions must block denial, rejection, and fraud accusation."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (m) => m.id === "governance-evidence-resolution-workflow"
  );
  assert(
    moduleManifest !== undefined,
    "governance-evidence-resolution-workflow module manifest must be registered."
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
      "governance.evidence.resolution.workflow.composed"
    ),
    "Module must publish the workflow composed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.environmental.escalation.engine.v2.composed"
    ),
    "Module must consume upstream Environmental Escalation Engine v2 event."
  );
  assert(
    moduleManifest.eventsConsumed.includes(
      "governance.readiness.assessment.v2.composed"
    ),
    "Module must consume upstream Readiness Assessment v2 event."
  );

  // Event contract conformance.
  const contract = eventContractRegistry.find(
    (entry) =>
      entry.eventType === "governance.evidence.resolution.workflow.composed"
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
      handoff.fromModuleId === "governance-evidence-resolution-workflow" ||
      handoff.toModuleId === "governance-evidence-resolution-workflow"
  );
  assert(
    handoffs.length >= 12,
    "Evidence Resolution Workflow module must declare at least twelve governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (h) =>
        h.toModuleId === "governance-environmental-escalation-engine-v2"
    ),
    "Module must hand off to Environmental Escalation Engine v2."
  );
  assert(
    handoffs.some(
      (h) => h.toModuleId === "governance-readiness-assessment-v2"
    ),
    "Module must hand off to Readiness Assessment v2."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
        readinessAssessmentV2Version: lineage.readinessAssessmentV2Version,
        environmentalEscalationEngineV2Version:
          lineage.environmentalEscalationEngineV2Version,
        customerTypeCount: lineage.customerTypeCount,
        capitalProgramCount: lineage.capitalProgramCount,
        defaultPackVarianceCount: defaultPack.summary.varianceCount,
        defaultPackClarificationCount:
          defaultPack.summary.clarificationRequestCount,
        defaultPackOverallReadiness:
          defaultPack.summary.v1OverallReadinessPercent,
        spokeBlockedPackClarificationCount:
          spokeBlockedPack.summary.clarificationRequestCount,
        spokeBlockedPackFraudAccusationRisk:
          spokeBlockedPack.summary.fraudAccusationRiskCount,
        tribalClosedPackUpstreamConflicts:
          tribalClosedPack.summary.upstreamEscalationConflictCount,
        tribalOpenPackClarificationCount:
          tribalOpenPack.summary.clarificationRequestCount,
        handoffs: handoffs.length,
        message: "Evidence Resolution Workflow v1 smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
