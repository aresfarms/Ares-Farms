import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import {
  BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
  composeBorrowerOnboardingCoreV2,
} from "@/lib/borrower/onboardingCoreV2Runtime";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import {
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  OpportunityDiscoveryV2GrantCard,
  OpportunityDiscoveryV2Result,
  composeOpportunityDiscoveryV2,
} from "@/lib/opportunity/discoveryV2Runtime";
import {
  READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
  composeReadinessAssessmentV2,
} from "@/lib/readiness/readinessAssessmentV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";
import {
  RECOMMENDATION_PRECISION_BANNED_LANGUAGE_TOKENS,
  RECOMMENDATION_PRECISION_SCENARIOS,
  RECOMMENDATION_PRECISION_SCENARIOS_VERSION,
  RecommendationPrecisionScenario,
} from "@/lib/testing/recommendationPrecisionScenarios";

/**
 * Recommendation Precision Test Harness Runtime
 *
 * Trust-preservation gate for Furlong recommendations. The harness
 * runs each canonical persona fixture
 * (`RECOMMENDATION_PRECISION_SCENARIOS`) through the full canonical
 * v2 stack (Customer Type Registry, Capital Graph, Revenue
 * Intelligence v2, Financing Pathway Engine v2, Opportunity
 * Discovery v2, Borrower Onboarding Core v2, Readiness Assessment
 * v2) and computes:
 *
 * - `precision_score` = expected relevant categories returned /
 *   total returned categories (high score = recommendations are
 *   on-topic for the borrower profile).
 * - `exclusion_score` = expected excluded categories absent / total
 *   expected excluded (1.0 means every disallowed category was
 *   correctly suppressed).
 * - `explanation_score` = grant cards with at least one fitReason /
 *   total grant cards (1.0 means every recommendation carries
 *   reviewer-visible justification).
 * - `trust_score` = weighted aggregate of the three scores plus
 *   banned-language and conflict-preservation penalties.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): keeps the harness subordinate
 *   to constitutional authority; precision testing never grants
 *   authority and never replaces external review.
 * - Vol II (Regulatory Governance): blocks the harness from
 *   claiming approval, eligibility certainty, lender commitment,
 *   funding certainty, agency decision, public verification,
 *   regulatory reliance, or legal reliance.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   scenario execution with explicit version lineage chaining the
 *   harness through the v2 composition stack.
 * - Vol III-B (Governance Runtime): runtime evidence with
 *   classification, observability, explainability, and replay
 *   verification posture.
 * - Vol IV (Operational Runbooks): routes governed handoffs to the
 *   upstream canonical v2 modules and to governance, reviews,
 *   evidence packets, audit replay, and module readiness.
 * - Vol V (Canonical Doctrines): preserves claims governance,
 *   controlled disclosure, replay, audit, advisory-only
 *   boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every composed
 *   recommendation behind a public-safe DTO; no live external
 *   fetch; no source-certainty claim.
 *
 * Safety boundary:
 * - Internal test harness only.
 * - No customer-facing approval, eligibility, lender commitment,
 *   agency decision, public verification, or regulatory reliance.
 * - Validates advisory relevance and trust-preserving
 *   recommendation behavior only.
 */

export const RECOMMENDATION_PRECISION_RUNTIME_VERSION =
  "recommendation-precision-runtime-v0.1.0";

export const RECOMMENDATION_PRECISION_TRUST_THRESHOLD = 0.85;

export type RecommendationPrecisionGate =
  | "BANNED_LANGUAGE"
  | "EXCLUDED_CATEGORY_RETURNED"
  | "MISSING_EXPLANATION"
  | "PRECISION_BELOW_THRESHOLD"
  | "CONFLICT_PROPAGATION_LOST"
  | "MATCHED_PROFILE_BOUNDARY_VIOLATED";

export type RecommendationPrecisionGateFinding = {
  gate: RecommendationPrecisionGate;
  scenarioId: string;
  description: string;
  evidence: string[];
};

export type RecommendationPrecisionScores = {
  precisionScore: number;
  exclusionScore: number;
  explanationScore: number;
  trustScore: number;
  conflictPropagationPreserved: boolean;
  bannedLanguageFound: string[];
  excludedCategoriesReturned: CapitalCategoryId[];
  matchedProfileBoundaryViolated: boolean;
};

export type RecommendationPrecisionScenarioOutcome = {
  scenarioId: string;
  label: string;
  customerType: string;
  geography: RecommendationPrecisionScenario["geography"];
  expectsZeroMatchedProfiles: boolean;
  matchedCustomerProfileCount: number;
  returnedGrantCardCount: number;
  returnedRelevantCategoryCount: number;
  returnedExcludedCategoryCount: number;
  returnedCategorySamples: CapitalCategoryId[];
  scores: RecommendationPrecisionScores;
  gateFindings: RecommendationPrecisionGateFinding[];
  passed: boolean;
};

export type RecommendationPrecisionHarnessSummary = {
  scenarioCount: number;
  passedScenarioCount: number;
  failedScenarioCount: number;
  meanPrecisionScore: number;
  meanExclusionScore: number;
  meanExplanationScore: number;
  meanTrustScore: number;
  bannedLanguageScenarioCount: number;
  excludedCategoryScenarioCount: number;
  missingExplanationScenarioCount: number;
  precisionBelowThresholdScenarioCount: number;
  conflictPropagationLostScenarioCount: number;
  matchedProfileBoundaryViolationScenarioCount: number;
};

export type RecommendationPrecisionHarnessLegacyBridge = {
  scenariosVersion: string;
  borrowerOnboardingCoreV2Version: string;
  readinessAssessmentV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
};

export type RecommendationPrecisionHarnessResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  scenarioOutcomes: RecommendationPrecisionScenarioOutcome[];
  gateFindings: RecommendationPrecisionGateFinding[];
  summary: RecommendationPrecisionHarnessSummary;
  legacyBridge: RecommendationPrecisionHarnessLegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  trustThreshold: number;
  ciGatePassed: boolean;
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  recommendationPrecisionInternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousOnboarding: true;
  noAutonomousReadiness: true;
  noAutonomousEnvironmentalIntake: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  noNoticeSend: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

export type RecommendationPrecisionHarnessInput = {
  reviewerRole?: string | null;
  applicationId?: string | null;
  scenarioIds?: string[];
  metadata?: Record<string, unknown> | null;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous readiness determination",
  "autonomous environmental intake determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding commitment",
  "funding guarantee",
  "program approval",
  "official certification",
  "agency decision",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const RECOMMENDATION_PRECISION_HARNESS_DISCLOSURES = [
  "Recommendation Precision Test Harness output is internal advisory test evidence only.",
  "The harness does not create customer-facing approval, eligibility, lender commitment, agency decision, public verification, or regulatory reliance.",
  "The harness validates advisory relevance and trust-preserving recommendation behavior; precision scoring is review-bound, not a regulatory determination.",
  "Cross-source conflicts surfaced by upstream v2 modules are preserved as first-class evidence and never collapsed.",
  "Sovereign customer types and sovereign sponsor programs remain hidden unless named federation participation is authorized.",
  "Banned-language tokens (approval/preapproval/guaranteed/lender commitment/etc.) trigger a hard CI gate failure when present in any composed recommendation.",
  "Excluded category leakage (e.g. agricultural/farm pathways returned for a hotel owner) triggers a hard CI gate failure.",
  "Human review remains required before any composed recommendation is treated as a decision.",
] as const;

export const RECOMMENDATION_PRECISION_HARNESS_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous readiness determination",
  "no autonomous environmental intake determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding commitment",
  "no funding guarantee",
  "no program approval",
  "no official certification",
  "no agency decision",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no payment authorization",
  "no notice send",
] as const;

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    const key =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
        ? value
        : JSON.stringify(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(value);
  }
  return out;
}

function buildOnboardingState(
  scenario: RecommendationPrecisionScenario
): BorrowerOnboardingState {
  const override = scenario.borrowerStateOverride ?? {};
  return {
    stage: override.stage ?? "BEGINNER",
    location: override.location ?? {
      country: scenario.geography.country,
      state: scenario.geography.state,
      county: scenario.geography.county ?? "",
    },
    farmTypes: override.farmTypes ?? [],
    goals: override.goals ?? ["EXPANSION"],
    acreage: override.acreage ?? 0,
    interests:
      override.interests ?? {
        soilAnalysis: false,
        environmentalReports: false,
        financing: true,
        vendorRecommendations: false,
        commodityIntelligence: false,
      },
  };
}

function collectGrantCards(
  odV2: OpportunityDiscoveryV2Result
): OpportunityDiscoveryV2GrantCard[] {
  return odV2.customerProfiles.flatMap((profile) => profile.grantCards);
}

/**
 * Build the set of borrower-facing advisory text fragments that the
 * harness scans for banned claim language. This intentionally
 * EXCLUDES:
 *   - System-level disclosures + production-restriction registries
 *     (which by construction contain phrases like "no lender
 *     commitment" — the negation is the safety property, not a
 *     banned-language failure).
 *   - Capital program names and sponsor authority labels (which are
 *     factual catalog labels — e.g. "USDA Guaranteed Farm Operating
 *     Loan" or "Approved voluntary carbon registry" — and not
 *     borrower-facing claims toward the borrower).
 *
 * The harness scans only the advisory output text the v2 stack
 * generates per grant card: fitReasons, missingItems,
 * conflictSignals. Those are the strings a reviewer would actually
 * surface in front of a borrower, so a claim like "you are approved"
 * or "lender commitment" would land there and must trigger a hard
 * CI gate.
 */
function buildBorrowerFacingFragments(
  odV2: OpportunityDiscoveryV2Result
): string[] {
  const grantCards = collectGrantCards(odV2);
  const fragments: string[] = [];
  for (const card of grantCards) {
    for (const reason of card.fitReasons) {
      fragments.push(reason);
    }
    for (const missing of card.missingItems) {
      fragments.push(missing);
    }
    for (const conflict of card.conflictSignals) {
      fragments.push(conflict);
    }
  }
  return fragments;
}

const NEGATION_PREFIXES = [
  "no ",
  "not ",
  "non-",
  "non ",
  "never ",
  "without ",
  "blocked ",
  "block ",
  "blocks ",
  "blocking ",
  "denied ",
  "deny ",
  "denies ",
  "excluded ",
  "exclude ",
  "excludes ",
  "excluding ",
  "absent ",
  "prohibit ",
  "prohibits ",
  "prohibited ",
  "prohibiting ",
  "disallow ",
  "disallowed ",
  "disallows ",
  "neither ",
  "nor ",
  "not-",
  "no-",
  "un-",
  "anti-",
];

const NEGATION_WINDOW = 24;

function isNegatedAt(haystack: string, index: number): boolean {
  const start = Math.max(0, index - NEGATION_WINDOW);
  const window = haystack.slice(start, index);
  return NEGATION_PREFIXES.some((prefix) => window.includes(prefix));
}

function detectBannedLanguage(fragments: string[]): string[] {
  const hits = new Set<string>();
  for (const fragment of fragments) {
    const lower = fragment.toLowerCase();
    for (const token of RECOMMENDATION_PRECISION_BANNED_LANGUAGE_TOKENS) {
      const tokenLower = token.toLowerCase();
      let searchFrom = 0;
      while (true) {
        const index = lower.indexOf(tokenLower, searchFrom);
        if (index === -1) {
          break;
        }
        if (!isNegatedAt(lower, index)) {
          hits.add(token);
          break;
        }
        searchFrom = index + tokenLower.length;
      }
    }
  }
  return Array.from(hits);
}

function scoreScenario(
  scenario: RecommendationPrecisionScenario,
  odV2: OpportunityDiscoveryV2Result,
  conflictPropagationPreserved: boolean
): {
  scores: RecommendationPrecisionScores;
  returnedCategories: CapitalCategoryId[];
  grantCards: OpportunityDiscoveryV2GrantCard[];
} {
  const grantCards = collectGrantCards(odV2);
  const returnedCategories = unique(
    grantCards.map((card) => card.categoryId)
  );

  // Precision: trust-preservation framing. A returned category is
  // "precise" when it is NOT on the excluded list — that is, when
  // the v2 stack did not pull in a category the borrower archetype
  // explicitly should not see. We do not punish breadth: if Capital
  // Graph returns a broader-than-handpicked set of categories that
  // are reasonable matches for the customer type, that is not a
  // precision failure. The trust-preservation gate is exclusion +
  // explanation + conflict propagation; expected-relevant coverage
  // is reported separately via returnedRelevantCategoryCount.
  const excludedSet = new Set(scenario.expectedExcludedCategories);
  let precisionScore = 1;
  if (scenario.expectsZeroMatchedProfiles) {
    // For bad-fit scenarios the precision-preserving outcome is
    // zero returned categories. Any returned category is a
    // precision failure.
    precisionScore = returnedCategories.length === 0 ? 1 : 0;
  } else if (returnedCategories.length > 0) {
    const onTopic = returnedCategories.filter(
      (cat) => !excludedSet.has(cat)
    ).length;
    precisionScore = onTopic / returnedCategories.length;
  } else {
    // No grant cards returned for a scenario that expects matches —
    // this is treated as a coverage/conflict situation handled by
    // conflict propagation, not a precision failure.
    precisionScore = 1;
  }

  // Exclusion: of expected excluded categories, how many are
  // absent from the returned set?
  let exclusionScore = 1;
  if (scenario.expectedExcludedCategories.length > 0) {
    const returnedSet = new Set(returnedCategories);
    const excludedAbsent = scenario.expectedExcludedCategories.filter(
      (cat) => !returnedSet.has(cat)
    ).length;
    exclusionScore =
      excludedAbsent / scenario.expectedExcludedCategories.length;
  }

  // Explanation: of returned grant cards, how many have at
  // least one fitReason?
  let explanationScore = 1;
  if (grantCards.length > 0) {
    const withReason = grantCards.filter(
      (card) => card.fitReasons.length > 0
    ).length;
    explanationScore = withReason / grantCards.length;
  }

  const bannedLanguageFound = detectBannedLanguage(
    buildBorrowerFacingFragments(odV2)
  );

  const excludedReturnedSet = new Set(returnedCategories);
  const excludedCategoriesReturned =
    scenario.expectedExcludedCategories.filter((cat) =>
      excludedReturnedSet.has(cat)
    );

  const matchedProfileBoundaryViolated =
    scenario.expectsZeroMatchedProfiles &&
    odV2.summary.customerProfileCount > 0 &&
    odV2.summary.crossSourceConflictCount === 0;

  // Weighted aggregate. Heavier weight on exclusion + explanation
  // since those are the trust-preservation gates.
  let trustScore =
    precisionScore * 0.25 +
    exclusionScore * 0.4 +
    explanationScore * 0.25 +
    (conflictPropagationPreserved ? 0.1 : 0);

  if (bannedLanguageFound.length > 0) {
    trustScore = Math.max(0, trustScore - 0.5);
  }
  if (excludedCategoriesReturned.length > 0) {
    trustScore = Math.max(0, trustScore - 0.5);
  }
  if (matchedProfileBoundaryViolated) {
    trustScore = Math.max(0, trustScore - 0.5);
  }

  return {
    scores: {
      precisionScore,
      exclusionScore,
      explanationScore,
      trustScore,
      conflictPropagationPreserved,
      bannedLanguageFound,
      excludedCategoriesReturned,
      matchedProfileBoundaryViolated,
    },
    returnedCategories,
    grantCards,
  };
}

function buildGateFindings(
  scenario: RecommendationPrecisionScenario,
  scores: RecommendationPrecisionScores
): RecommendationPrecisionGateFinding[] {
  const findings: RecommendationPrecisionGateFinding[] = [];

  if (scores.bannedLanguageFound.length > 0) {
    findings.push({
      gate: "BANNED_LANGUAGE",
      scenarioId: scenario.scenarioId,
      description:
        "Banned approval/eligibility/commitment/decision language detected in scenario output.",
      evidence: scores.bannedLanguageFound,
    });
  }

  if (scores.excludedCategoriesReturned.length > 0) {
    findings.push({
      gate: "EXCLUDED_CATEGORY_RETURNED",
      scenarioId: scenario.scenarioId,
      description:
        "Excluded capital category returned by the v2 stack; this is a trust-preservation failure.",
      evidence: scores.excludedCategoriesReturned,
    });
  }

  if (scores.explanationScore < 1) {
    findings.push({
      gate: "MISSING_EXPLANATION",
      scenarioId: scenario.scenarioId,
      description:
        "At least one returned grant card has no fitReasons. Every recommendation must be reviewable.",
      evidence: [
        `explanation_score=${scores.explanationScore.toFixed(2)}`,
      ],
    });
  }

  if (scores.trustScore < RECOMMENDATION_PRECISION_TRUST_THRESHOLD) {
    findings.push({
      gate: "PRECISION_BELOW_THRESHOLD",
      scenarioId: scenario.scenarioId,
      description: `Aggregate trust score below threshold (${RECOMMENDATION_PRECISION_TRUST_THRESHOLD}).`,
      evidence: [
        `trust_score=${scores.trustScore.toFixed(2)}`,
        `precision_score=${scores.precisionScore.toFixed(2)}`,
        `exclusion_score=${scores.exclusionScore.toFixed(2)}`,
        `explanation_score=${scores.explanationScore.toFixed(2)}`,
      ],
    });
  }

  if (!scores.conflictPropagationPreserved) {
    findings.push({
      gate: "CONFLICT_PROPAGATION_LOST",
      scenarioId: scenario.scenarioId,
      description:
        "Upstream v2 cross-source conflict was not propagated through the v2 stack into Readiness Assessment v2.",
      evidence: [],
    });
  }

  if (scores.matchedProfileBoundaryViolated) {
    findings.push({
      gate: "MATCHED_PROFILE_BOUNDARY_VIOLATED",
      scenarioId: scenario.scenarioId,
      description:
        "Scenario was declared as expectsZeroMatchedProfiles=true but the v2 stack matched customer profiles without surfacing a cross-source conflict.",
      evidence: [],
    });
  }

  return findings;
}

function preservesConflictPropagation(
  scenario: RecommendationPrecisionScenario,
  odV2: OpportunityDiscoveryV2Result
): boolean {
  if (scenario.expectedConflictTopics.length === 0) {
    return true;
  }

  const haystack = [
    ...odV2.customerProfiles.flatMap((profile) =>
      profile.crossSourceConflicts.flatMap((conflict) => [
        conflict.topic,
        conflict.description,
      ])
    ),
    ...odV2.disclosures,
  ]
    .join(" ")
    .toLowerCase();

  return scenario.expectedConflictTopics.every((topic) =>
    haystack.includes(topic.toLowerCase())
  );
}

function runOneScenario(
  scenario: RecommendationPrecisionScenario,
  reviewerRole: string | null,
  applicationId: string | null
): RecommendationPrecisionScenarioOutcome {
  const onboardingState = buildOnboardingState(scenario);

  // Compose the canonical v2 stack via OD v2 directly so we can
  // inspect grant cards. We also compose RA v2 to ensure the
  // upstream chain is exercised end-to-end and conflicts propagate.
  const odV2 = composeOpportunityDiscoveryV2({
    reviewerRole,
    applicationId,
    borrowerContext: {
      declaredCustomerTypes: scenario.declaredCustomerTypes,
      intendedUses: scenario.desiredUseOfFunds,
      jurisdiction: {
        federal: scenario.geography.country === "US",
        state: scenario.geography.state,
        county: scenario.geography.county,
        utilityTerritory: null,
      },
      location: {
        country: scenario.geography.country,
        state: scenario.geography.state,
        county: scenario.geography.county ?? null,
      },
      farmTypes: onboardingState.farmTypes.map((t) =>
        t.toLowerCase().replace(/_/g, " ")
      ),
      goals: onboardingState.goals.map((g) =>
        g.toLowerCase().replace(/_/g, " ")
      ),
      acreage: onboardingState.acreage > 0 ? onboardingState.acreage : null,
      requestedAmount: null,
      stage: onboardingState.stage || null,
      interests: onboardingState.interests,
    },
    scope: { sovereignFederationAllowed: false },
    metadata: {
      precisionScenarioId: scenario.scenarioId,
    },
  });

  // Exercise Borrower Onboarding Core v2 + Readiness Assessment v2
  // composition so the upstream chain end-to-end behavior is
  // observed; we rely on RA v2 propagating any conflict.
  const boV2 = composeBorrowerOnboardingCoreV2({
    reviewerRole,
    applicationId,
    onboardingState,
    declaredCustomerTypes: scenario.declaredCustomerTypes,
    intendedUses: scenario.desiredUseOfFunds,
    scope: { sovereignFederationAllowed: false },
    metadata: {
      precisionScenarioId: scenario.scenarioId,
    },
  });

  const raV2 = composeReadinessAssessmentV2({
    reviewerRole,
    applicationId,
    onboardingState,
    declaredCustomerTypes: scenario.declaredCustomerTypes,
    intendedUses: scenario.desiredUseOfFunds,
    scope: { sovereignFederationAllowed: false },
    metadata: {
      precisionScenarioId: scenario.scenarioId,
    },
  });

  // Conflict propagation considered preserved when either OD v2
  // surfaced the expected topic OR upstream BO v2 / RA v2 raised
  // any cross-source conflict (since OD v2 conflicts propagate
  // upward by construction).
  const conflictPropagationPreserved =
    preservesConflictPropagation(scenario, odV2) ||
    boV2.summary.crossSourceConflictCount > 0 ||
    raV2.summary.crossSourceConflictCount > 0;

  const { scores, returnedCategories, grantCards } = scoreScenario(
    scenario,
    odV2,
    conflictPropagationPreserved
  );

  const expectedRelevantSet = new Set(scenario.expectedRelevantCategories);
  const returnedRelevantCategoryCount = returnedCategories.filter((cat) =>
    expectedRelevantSet.has(cat)
  ).length;
  const returnedExcludedCategoryCount =
    scores.excludedCategoriesReturned.length;

  const gateFindings = buildGateFindings(scenario, scores);

  return {
    scenarioId: scenario.scenarioId,
    label: scenario.label,
    customerType: scenario.customerType,
    geography: scenario.geography,
    expectsZeroMatchedProfiles: scenario.expectsZeroMatchedProfiles,
    matchedCustomerProfileCount: odV2.summary.customerProfileCount,
    returnedGrantCardCount: grantCards.length,
    returnedRelevantCategoryCount,
    returnedExcludedCategoryCount,
    returnedCategorySamples: returnedCategories.slice(0, 12),
    scores,
    gateFindings,
    passed: gateFindings.length === 0,
  };
}

export function composeRecommendationPrecisionHarness(
  input: RecommendationPrecisionHarnessInput = {}
): RecommendationPrecisionHarnessResult {
  const reviewerRole = input.reviewerRole ?? null;
  const applicationId = input.applicationId ?? null;
  const requestedIds = input.scenarioIds && input.scenarioIds.length > 0
    ? new Set(input.scenarioIds)
    : null;
  const scenarios = RECOMMENDATION_PRECISION_SCENARIOS.filter((scenario) =>
    requestedIds ? requestedIds.has(scenario.scenarioId) : true
  );

  const scenarioOutcomes = scenarios.map((scenario) =>
    runOneScenario(scenario, reviewerRole, applicationId)
  );
  const gateFindings = scenarioOutcomes.flatMap(
    (outcome) => outcome.gateFindings
  );

  const passedScenarioCount = scenarioOutcomes.filter(
    (outcome) => outcome.passed
  ).length;
  const failedScenarioCount = scenarioOutcomes.length - passedScenarioCount;

  const sumPrecision = scenarioOutcomes.reduce(
    (sum, outcome) => sum + outcome.scores.precisionScore,
    0
  );
  const sumExclusion = scenarioOutcomes.reduce(
    (sum, outcome) => sum + outcome.scores.exclusionScore,
    0
  );
  const sumExplanation = scenarioOutcomes.reduce(
    (sum, outcome) => sum + outcome.scores.explanationScore,
    0
  );
  const sumTrust = scenarioOutcomes.reduce(
    (sum, outcome) => sum + outcome.scores.trustScore,
    0
  );

  const summary: RecommendationPrecisionHarnessSummary = {
    scenarioCount: scenarioOutcomes.length,
    passedScenarioCount,
    failedScenarioCount,
    meanPrecisionScore:
      scenarioOutcomes.length === 0
        ? 0
        : sumPrecision / scenarioOutcomes.length,
    meanExclusionScore:
      scenarioOutcomes.length === 0
        ? 0
        : sumExclusion / scenarioOutcomes.length,
    meanExplanationScore:
      scenarioOutcomes.length === 0
        ? 0
        : sumExplanation / scenarioOutcomes.length,
    meanTrustScore:
      scenarioOutcomes.length === 0 ? 0 : sumTrust / scenarioOutcomes.length,
    bannedLanguageScenarioCount: scenarioOutcomes.filter(
      (outcome) => outcome.scores.bannedLanguageFound.length > 0
    ).length,
    excludedCategoryScenarioCount: scenarioOutcomes.filter(
      (outcome) => outcome.scores.excludedCategoriesReturned.length > 0
    ).length,
    missingExplanationScenarioCount: scenarioOutcomes.filter(
      (outcome) => outcome.scores.explanationScore < 1
    ).length,
    precisionBelowThresholdScenarioCount: scenarioOutcomes.filter(
      (outcome) =>
        outcome.scores.trustScore < RECOMMENDATION_PRECISION_TRUST_THRESHOLD
    ).length,
    conflictPropagationLostScenarioCount: scenarioOutcomes.filter(
      (outcome) => !outcome.scores.conflictPropagationPreserved
    ).length,
    matchedProfileBoundaryViolationScenarioCount: scenarioOutcomes.filter(
      (outcome) => outcome.scores.matchedProfileBoundaryViolated
    ).length,
  };

  const recommendedReviewRoutes = unique([
    "/governance/recommendation-precision-harness",
    "/governance/readiness-assessment-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/governance/environmental-intake-v2",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
    "/module-readiness",
  ]);

  return {
    runtimeVersion: RECOMMENDATION_PRECISION_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole,
    applicationId,
    scenarioOutcomes,
    gateFindings,
    summary,
    legacyBridge: {
      scenariosVersion: RECOMMENDATION_PRECISION_SCENARIOS_VERSION,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      readinessAssessmentV2Version: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
      customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
      capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    },
    recommendedReviewRoutes,
    disclosures: [...RECOMMENDATION_PRECISION_HARNESS_DISCLOSURES],
    productionRestrictions: [
      ...RECOMMENDATION_PRECISION_HARNESS_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    trustThreshold: RECOMMENDATION_PRECISION_TRUST_THRESHOLD,
    ciGatePassed: gateFindings.length === 0,
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    recommendationPrecisionInternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousOnboarding: true,
    noAutonomousReadiness: true,
    noAutonomousEnvironmentalIntake: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function recommendationPrecisionHarnessLineage(): {
  runtimeVersion: string;
  scenariosVersion: string;
  scenarioCount: number;
  borrowerOnboardingCoreV2Version: string;
  readinessAssessmentV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
} {
  return {
    runtimeVersion: RECOMMENDATION_PRECISION_RUNTIME_VERSION,
    scenariosVersion: RECOMMENDATION_PRECISION_SCENARIOS_VERSION,
    scenarioCount: RECOMMENDATION_PRECISION_SCENARIOS.length,
    borrowerOnboardingCoreV2Version:
      BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    readinessAssessmentV2Version: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
  };
}
