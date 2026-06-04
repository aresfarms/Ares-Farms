import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import { CAPITAL_GRAPH_REGISTRY } from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { READINESS_ASSESSMENT_V2_RUNTIME_VERSION } from "@/lib/readiness/readinessAssessmentV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";
import {
  RECOMMENDATION_PRECISION_HARNESS_DISCLOSURES,
  RECOMMENDATION_PRECISION_HARNESS_PRODUCTION_RESTRICTIONS,
  RECOMMENDATION_PRECISION_RUNTIME_VERSION,
  RECOMMENDATION_PRECISION_TRUST_THRESHOLD,
  composeRecommendationPrecisionHarness,
  recommendationPrecisionHarnessLineage,
} from "@/lib/testing/recommendationPrecisionRuntime";
import {
  RECOMMENDATION_PRECISION_BANNED_LANGUAGE_TOKENS,
  RECOMMENDATION_PRECISION_SCENARIOS,
  RECOMMENDATION_PRECISION_SCENARIOS_VERSION,
} from "@/lib/testing/recommendationPrecisionScenarios";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  // Version seals.
  assert(
    RECOMMENDATION_PRECISION_RUNTIME_VERSION ===
      "recommendation-precision-runtime-v0.1.0",
    "Recommendation Precision runtime version must match the canonical v0.1.0 seal."
  );
  assert(
    RECOMMENDATION_PRECISION_SCENARIOS_VERSION ===
      "recommendation-precision-scenarios-v0.1.0",
    "Recommendation Precision scenarios version must match the canonical v0.1.0 seal."
  );

  // Scenario fixture sanity.
  assert(
    RECOMMENDATION_PRECISION_SCENARIOS.length >= 9,
    "Harness must declare at least nine canonical persona fixtures."
  );
  const scenarioIds = new Set(
    RECOMMENDATION_PRECISION_SCENARIOS.map((s) => s.scenarioId)
  );
  assert(
    scenarioIds.size === RECOMMENDATION_PRECISION_SCENARIOS.length,
    "Scenario ids must be unique."
  );
  assert(
    scenarioIds.has("hotel-owner-urban-nj"),
    "Hotel owner in urban NJ scenario must be present (the canonical trust-preservation example)."
  );
  assert(
    scenarioIds.has("farmer-rancher-md"),
    "Beginning farmer / rancher scenario must be present."
  );
  assert(
    scenarioIds.has("intentionally-bad-fit-sovereign-closed"),
    "Intentionally bad-fit sovereign-closed scenario must be present."
  );

  // Lineage.
  const lineage = recommendationPrecisionHarnessLineage();
  assert(
    lineage.runtimeVersion === RECOMMENDATION_PRECISION_RUNTIME_VERSION,
    "Lineage runtimeVersion must equal canonical runtime version."
  );
  assert(
    lineage.scenariosVersion === RECOMMENDATION_PRECISION_SCENARIOS_VERSION,
    "Lineage scenariosVersion must equal canonical scenarios version."
  );
  assert(
    lineage.scenarioCount === RECOMMENDATION_PRECISION_SCENARIOS.length,
    "Lineage scenarioCount must equal scenarios array length."
  );
  assert(
    lineage.borrowerOnboardingCoreV2Version ===
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Borrower Onboarding Core v2."
  );
  assert(
    lineage.readinessAssessmentV2Version ===
      READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    "Lineage must seal canonical Readiness Assessment v2."
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

  // Compose harness.
  const result = composeRecommendationPrecisionHarness({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-precision-smoke",
  });

  // Constitutional posture flags.
  assert(
    result.productionBlocked &&
      result.humanReviewRequired &&
      result.advisoryOnly &&
      result.recommendationPrecisionInternalOnly &&
      result.noAutonomousLending &&
      result.noAutonomousEligibility &&
      result.noAutonomousPathway &&
      result.noAutonomousOpportunity &&
      result.noAutonomousIntelligence &&
      result.noAutonomousEvidence &&
      result.noAutonomousCertification &&
      result.noAutonomousOnboarding &&
      result.noAutonomousReadiness &&
      result.noAutonomousEnvironmentalIntake &&
      result.noPublicVerification &&
      result.noRegulatoryReliance &&
      result.noLenderCommitment &&
      result.noLegalReliance &&
      result.noLiveExternalAction &&
      result.noSourceCertainty &&
      result.noNoticeSend &&
      result.replaySafe &&
      result.auditSafe &&
      result.federationScoped &&
      result.conflictPreserving,
    "Recommendation Precision harness result must preserve every constitutional flag."
  );

  // Scenario coverage.
  assert(
    result.summary.scenarioCount === RECOMMENDATION_PRECISION_SCENARIOS.length,
    "Harness must run every canonical persona fixture."
  );
  assert(
    result.scenarioOutcomes.length === RECOMMENDATION_PRECISION_SCENARIOS.length,
    "Harness must produce one outcome per scenario."
  );

  // Disclosures and production restrictions.
  assert(
    RECOMMENDATION_PRECISION_HARNESS_DISCLOSURES.some((d) =>
      d.includes("internal advisory test evidence")
    ),
    "Disclosures must include the internal-advisory framing."
  );
  assert(
    RECOMMENDATION_PRECISION_HARNESS_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous lending decision"
    ),
    "Production restrictions must block autonomous lending decisions."
  );

  // Hard CI gates per the build doctrine:
  // (a) no banned language anywhere in any scenario output
  // (b) no excluded categories returned
  // (c) every grant card has at least one fitReason
  // (d) no scenario falls below the trust threshold
  // (e) conflict propagation preserved for every scenario that
  //     expects it
  // (f) sovereign-closed bad-fit scenario surfaces zero matched
  //     profiles
  for (const outcome of result.scenarioOutcomes) {
    assert(
      outcome.scores.bannedLanguageFound.length === 0,
      `Scenario ${outcome.scenarioId}: banned-language tokens found: ${outcome.scores.bannedLanguageFound.join(", ")}`
    );
    assert(
      outcome.scores.excludedCategoriesReturned.length === 0,
      `Scenario ${outcome.scenarioId}: excluded capital categories returned: ${outcome.scores.excludedCategoriesReturned.join(", ")}`
    );
    assert(
      outcome.scores.explanationScore === 1,
      `Scenario ${outcome.scenarioId}: every returned grant card must carry at least one fitReason (explanation_score=${outcome.scores.explanationScore.toFixed(2)}).`
    );
    assert(
      outcome.scores.conflictPropagationPreserved,
      `Scenario ${outcome.scenarioId}: expected cross-source conflict propagation was lost.`
    );
    assert(
      !outcome.scores.matchedProfileBoundaryViolated,
      `Scenario ${outcome.scenarioId}: matched-profile boundary violation — bad-fit scenario surfaced matched profiles without conflict.`
    );
    assert(
      outcome.scores.trustScore >= RECOMMENDATION_PRECISION_TRUST_THRESHOLD,
      `Scenario ${outcome.scenarioId}: trust_score ${outcome.scores.trustScore.toFixed(2)} is below threshold ${RECOMMENDATION_PRECISION_TRUST_THRESHOLD}.`
    );
  }

  // Mean trust score floor.
  assert(
    result.summary.meanTrustScore >= RECOMMENDATION_PRECISION_TRUST_THRESHOLD,
    `Harness mean trust_score ${result.summary.meanTrustScore.toFixed(2)} is below threshold ${RECOMMENDATION_PRECISION_TRUST_THRESHOLD}.`
  );

  // Aggregate CI gate.
  assert(
    result.ciGatePassed,
    `Harness CI gate failed: ${result.gateFindings
      .map((finding) => `${finding.scenarioId}/${finding.gate}`)
      .join("; ")}`
  );

  // Banned-language tokens registered.
  assert(
    RECOMMENDATION_PRECISION_BANNED_LANGUAGE_TOKENS.includes("approved"),
    "Banned-language token set must include 'approved'."
  );
  assert(
    RECOMMENDATION_PRECISION_BANNED_LANGUAGE_TOKENS.includes("lender commitment"),
    "Banned-language token set must include 'lender commitment'."
  );

  // Module manifest conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-recommendation-precision-harness"
  );
  assert(
    moduleManifest !== undefined,
    "governance-recommendation-precision-harness module manifest must be registered."
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
      "governance.recommendation.precision.tested"
    ),
    "Module must publish the precision tested event."
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
      entry.eventType === "governance.recommendation.precision.tested"
  );
  assert(
    contract !== undefined,
    "governance.recommendation.precision.tested contract must be registered."
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
      handoff.fromModuleId === "governance-recommendation-precision-harness" ||
      handoff.toModuleId === "governance-recommendation-precision-harness"
  );
  assert(
    handoffs.length >= 12,
    "Recommendation Precision harness must declare at least twelve governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every harness handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-readiness-assessment-v2"
    ),
    "Harness must hand off to Readiness Assessment v2."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-borrower-onboarding-core-v2"
    ),
    "Harness must hand off to Borrower Onboarding Core v2."
  );
  assert(
    handoffs.some(
      (handoff) =>
        handoff.toModuleId === "governance-opportunity-discovery-v2"
    ),
    "Harness must hand off to Opportunity Discovery v2."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: RECOMMENDATION_PRECISION_RUNTIME_VERSION,
        scenariosVersion: RECOMMENDATION_PRECISION_SCENARIOS_VERSION,
        scenarioCount: result.summary.scenarioCount,
        passedScenarioCount: result.summary.passedScenarioCount,
        failedScenarioCount: result.summary.failedScenarioCount,
        meanPrecisionScore: Number(
          result.summary.meanPrecisionScore.toFixed(3)
        ),
        meanExclusionScore: Number(
          result.summary.meanExclusionScore.toFixed(3)
        ),
        meanExplanationScore: Number(
          result.summary.meanExplanationScore.toFixed(3)
        ),
        meanTrustScore: Number(result.summary.meanTrustScore.toFixed(3)),
        trustThreshold: RECOMMENDATION_PRECISION_TRUST_THRESHOLD,
        bannedLanguageScenarioCount:
          result.summary.bannedLanguageScenarioCount,
        excludedCategoryScenarioCount:
          result.summary.excludedCategoryScenarioCount,
        missingExplanationScenarioCount:
          result.summary.missingExplanationScenarioCount,
        precisionBelowThresholdScenarioCount:
          result.summary.precisionBelowThresholdScenarioCount,
        conflictPropagationLostScenarioCount:
          result.summary.conflictPropagationLostScenarioCount,
        matchedProfileBoundaryViolationScenarioCount:
          result.summary.matchedProfileBoundaryViolationScenarioCount,
        ciGatePassed: result.ciGatePassed,
        handoffs: handoffs.length,
        message: "Recommendation Precision Test Harness smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
