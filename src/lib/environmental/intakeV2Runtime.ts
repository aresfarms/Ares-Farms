import {
  BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
  BorrowerOnboardingCoreV2Result,
  composeBorrowerOnboardingCoreV2,
} from "@/lib/borrower/onboardingCoreV2Runtime";
import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import {
  ENVIRONMENTAL_INTAKE_BLOCKED_CLAIMS,
  ENVIRONMENTAL_INTAKE_DISCLOSURES,
  ENVIRONMENTAL_INTAKE_PRODUCTION_RESTRICTIONS,
  ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
  EnvironmentalIntakeInput,
  EnvironmentalIntakeResult,
  evaluateEnvironmentalIntake,
} from "@/lib/environmental/intakeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Borrower Environmental Intake v2 Runtime
 *
 * The twelfth downstream consumer of the Capital Graph (Build 13)
 * and Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2
 * (Build 16), Opportunity Discovery v2 (Build 17), and Borrower
 * Onboarding Core v2 (Build 24). It joins:
 *
 * - The legacy v1 `evaluateEnvironmentalIntake` runtime (NEPA
 *   screening / Phase I ESA / state environmental review /
 *   exemption pathway routing) preserved as an additive
 *   compatibility bridge.
 * - Borrower Onboarding Core v2 (which composes the full canonical
 *   v2 stack: OD v2 + FPE v2 + RI v2 + Customer Type + Capital
 *   Graph + legacy v1 borrower onboarding workflow). The BO v2
 *   pack provides matched customer profiles, Capital Graph-backed
 *   grant card counts, environmental-tagged sponsor authority
 *   posture, and propagated cross-source conflicts.
 * - Three new v2 governed environmental intake signals:
 *     - `environmental_customer_type_alignment` — matched customer
 *       types declaring environmental-eligible Capital Graph
 *       categories;
 *     - `environmental_capital_program_alignment` — Capital
 *       Graph-backed grant cards under environmental categories
 *       (environmental remediation, conservation, energy
 *       efficiency, carbon markets);
 *     - `environmental_pathway_v2_alignment` — upstream BO v2
 *       cross-source conflict propagation and environmental review
 *       gating.
 * - Cross-source conflict signals: legacy v1 TRIGGERED pathway
 *   while v2 stack returned no environmental-eligible Capital
 *   Graph coverage, legacy v1 EXEMPTION_PATHWAY while v2 returned
 *   matched environmental sponsor authority, upstream BO v2
 *   cross-source conflicts propagated.
 *
 * Environmental Intake v2 output is operational guidance and
 * review routing only. It does not engage an external
 * environmental provider, authorize a provider fee, or create an
 * official environmental determination, clearance, permit, or
 * report. Spoke isolation is preserved.
 *
 * Master Volume Governance:
 * - Vol I: keeps environmental intake subordinate to the
 *   Environmental Engineering Spoke's constitutional authority and
 *   to Banker Spoke isolation.
 * - Vol II: blocks intake from becoming an official environmental
 *   report, environmental clearance, NEPA determination, permit,
 *   lender commitment, or regulatory or legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   environmental-intake-v2-runtime-v0.1.0 →
 *   borrower-onboarding-core-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   environmental-intake-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification,
 *   observability, explainability, replay verification posture.
 * - Vol IV: routes governed handoffs to Borrower Onboarding Core
 *   v2, Opportunity Discovery v2, Financing Pathway Engine v2,
 *   Revenue Intelligence v2, Customer Type Registry, Capital
 *   Graph, environmental compliance, portal-borrower-
 *   environmental-intake, applications, documents, data-rights,
 *   evidence packets, audit replay, governance, reviews, module
 *   readiness.
 * - Vol V-VII: preserves claims, source authority, conformance,
 *   provider-license and fee-disclosure boundaries.
 *
 * Safety boundary:
 * - Internal advisory environmental intake posture only.
 * - No autonomous customer eligibility / pathway / opportunity /
 *   intelligence / evidence / certification / onboarding /
 *   readiness / environmental intake determination, credit
 *   decision, lender commitment, official environmental report,
 *   environmental clearance, NEPA determination, permit,
 *   provider-engagement authorization, fee authorization, source
 *   certainty claim, notice send, or legal reliance.
 */

export const ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION =
  "environmental-intake-v2-runtime-v0.1.0";

const ENVIRONMENTAL_CAPITAL_CATEGORIES: readonly CapitalCategoryId[] = [
  "ENVIRONMENTAL_MARKETS",
  "CARBON_MARKETS",
  "ENERGY_CREDITS",
  "UTILITY_INCENTIVES",
  "REAP",
];

export type EnvironmentalIntakeV2SignalId =
  | "environmental_customer_type_alignment"
  | "environmental_capital_program_alignment"
  | "environmental_pathway_v2_alignment";

export type EnvironmentalIntakeV2SignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type EnvironmentalIntakeV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  onboardingState?: BorrowerOnboardingState;
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  legacy?: EnvironmentalIntakeInput;
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type EnvironmentalIntakeV2Signal = {
  id: EnvironmentalIntakeV2SignalId;
  label: string;
  status: EnvironmentalIntakeV2SignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type EnvironmentalIntakeV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type EnvironmentalIntakeV2LegacyBridge = {
  environmentalIntakeVersion: string;
  legacyReadinessPercent: number;
  legacyMissingItemCount: number;
  legacyAssessmentRoute: string;
  legacyPathwayPosture: string;
  legacyTriggerSignalCount: number;
  legacyExemptionCandidateCount: number;
  legacyHandoffCount: number;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type EnvironmentalIntakeV2Summary = {
  v2SignalCount: number;
  v2ReadyCount: number;
  v2NeedsInputCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  v1ReadinessPercent: number;
  v1TriggerSignalCount: number;
  v1ExemptionCandidateCount: number;
  v1HandoffCount: number;
  crossSourceConflictCount: number;
  environmentalEligibleCustomerTypeCount: number;
  environmentalCapitalProgramCount: number;
};

export type EnvironmentalIntakeV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: EnvironmentalIntakeV2Summary;
  v2Signals: EnvironmentalIntakeV2Signal[];
  legacyIntake: EnvironmentalIntakeResult;
  borrowerOnboardingCoreV2: BorrowerOnboardingCoreV2Result;
  crossSourceConflicts: EnvironmentalIntakeV2CrossSourceConflict[];
  legacyBridge: EnvironmentalIntakeV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  environmentalIntakeV2InternalOnly: true;
  spokeIsolationRequired: true;
  feeAutonomyPreserved: true;
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
  noOfficialEnvironmentalReport: true;
  noEnvironmentalClearance: true;
  noProviderEngagement: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  noNoticeSend: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

// =============================================================================
// Canonical disclosure / production-restriction posture
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "permit issued",
  "provider engagement authorized",
  "fee authorized",
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous intelligence determination",
  "autonomous evidence determination",
  "autonomous certification determination",
  "autonomous onboarding determination",
  "autonomous readiness determination",
  "autonomous environmental intake determination",
  "credit decision",
  "lender commitment",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const ENVIRONMENTAL_INTAKE_V2_DISCLOSURES = [
  "Environmental Intake v2 output is advisory borrower guidance and review routing, replay-safe, audit-safe, and conflict-preserving.",
  "Environmental Intake v2 does not authorize an external environmental provider, authorize a provider fee, or create an official environmental determination, clearance, permit, or report.",
  "Environmental Intake v2 does not authorize approval, autonomous customer eligibility / pathway / opportunity / intelligence / evidence / certification / onboarding / readiness / environmental intake determination, credit decision, lender commitment, NEPA determination, Phase I ESA report, public verification, regulatory reliance, or legal reliance.",
  "Environmental Engineering Spoke isolation is preserved; no Banker Spoke decision flows from this intake.",
  "Borrower external firm right and provider fee disclosure remain with the named human authorities; the runtime does not grant authority.",
  "When the legacy v1 environmental intake and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Three v2 governed signals (environmental customer-type alignment, environmental capital-program alignment, environmental pathway v2 alignment) inherit upstream BO v2 + OD v2 + RI v2 + Capital Graph doctrine refs and remain review-bound.",
  "Sovereign customer types are visible only when named federation participation is authorized.",
  "Human review is required before any composed environmental intake signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ENVIRONMENTAL_INTAKE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
  "no autonomous certification determination",
  "no autonomous onboarding determination",
  "no autonomous readiness determination",
  "no autonomous environmental intake determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no tax-credit allocation",
  "no environmental clearance",
  "no NEPA determination",
  "no Phase I ESA report",
  "no permit issued",
  "no provider engagement",
  "no fee authorized",
  "no official environmental report",
  "no carbon-credit issuance",
  "no guaranteed revenue",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

const V2_SIGNAL_IDS: readonly EnvironmentalIntakeV2SignalId[] = [
  "environmental_customer_type_alignment",
  "environmental_capital_program_alignment",
  "environmental_pathway_v2_alignment",
];

const V2_SIGNAL_LABELS: Record<EnvironmentalIntakeV2SignalId, string> = {
  environmental_customer_type_alignment:
    "Environmental Customer Type Alignment",
  environmental_capital_program_alignment:
    "Environmental Capital Program Alignment",
  environmental_pathway_v2_alignment: "Environmental Pathway v2 Alignment",
};

const V2_SIGNAL_REVIEW_ROUTES: Record<EnvironmentalIntakeV2SignalId, string> = {
  environmental_customer_type_alignment: "/governance/customer-types",
  environmental_capital_program_alignment: "/governance/capital-graph",
  environmental_pathway_v2_alignment: "/governance/financing-pathway-engine-v2",
};

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

function buildEnvironmentalCustomerTypeAlignment(
  boV2: BorrowerOnboardingCoreV2Result
): EnvironmentalIntakeV2Signal {
  const environmentalEligibleCount = boV2.customerSummaries.filter((summary) =>
    summary.customerType.eligibleCapitalCategories.some((cat) =>
      ENVIRONMENTAL_CAPITAL_CATEGORIES.includes(cat)
    )
  ).length;

  const totalMatched = boV2.summary.matchedCustomerProfileCount;
  const reviewSignals: string[] = [];

  let status: EnvironmentalIntakeV2SignalStatus;
  let readinessPercent: number;

  if (totalMatched === 0) {
    status = "NOT_STARTED";
    readinessPercent = 0;
    reviewSignals.push("no matched customer profiles to evaluate");
  } else if (environmentalEligibleCount === 0) {
    status = "NEEDS_INPUT";
    readinessPercent = 0;
    reviewSignals.push(
      "no matched customer types declare environmental-eligible Capital Graph categories"
    );
  } else {
    status = "READY_FOR_REVIEW";
    readinessPercent = Math.min(
      100,
      Math.round((environmentalEligibleCount / Math.max(totalMatched, 1)) * 100)
    );
  }

  return {
    id: "environmental_customer_type_alignment",
    label: V2_SIGNAL_LABELS.environmental_customer_type_alignment,
    status,
    readinessPercent,
    coverageCount: environmentalEligibleCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES.environmental_customer_type_alignment,
    doctrineRefs: [
      "Vol I §Customer Type Review Boundary",
      "Vol I §Environmental Engineering Spoke Authority",
      "Vol II §Environmental Determination Boundary",
    ],
  };
}

function buildEnvironmentalCapitalProgramAlignment(
  boV2: BorrowerOnboardingCoreV2Result
): EnvironmentalIntakeV2Signal {
  let environmentalProgramCount = 0;
  for (const profile of boV2.customerSummaries) {
    environmentalProgramCount += profile.grantCardCount;
  }

  const reviewSignals: string[] = [];
  let status: EnvironmentalIntakeV2SignalStatus;
  let readinessPercent: number;

  if (boV2.summary.totalGrantCardCount === 0) {
    status = "NOT_STARTED";
    readinessPercent = 0;
    reviewSignals.push("no Capital Graph-backed grant cards composed");
  } else if (environmentalProgramCount === 0) {
    status = "NEEDS_INPUT";
    readinessPercent = 0;
    reviewSignals.push("no environmental-category Capital Graph programs available");
  } else {
    status = "READY_FOR_REVIEW";
    readinessPercent = 100;
  }

  return {
    id: "environmental_capital_program_alignment",
    label: V2_SIGNAL_LABELS.environmental_capital_program_alignment,
    status,
    readinessPercent,
    coverageCount: environmentalProgramCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES.environmental_capital_program_alignment,
    doctrineRefs: [
      "Vol I §Capital Graph Sponsor Authority",
      "Vol I §Environmental Engineering Spoke Authority",
      "Vol III §Capital Graph Composition Determinism",
    ],
  };
}

function buildEnvironmentalPathwayV2Alignment(
  boV2: BorrowerOnboardingCoreV2Result
): EnvironmentalIntakeV2Signal {
  const conflicts = boV2.summary.crossSourceConflictCount;
  const reviewSignals: string[] = [];
  let status: EnvironmentalIntakeV2SignalStatus;
  let readinessPercent: number;

  if (conflicts > 0) {
    reviewSignals.push(
      `${conflicts} upstream Borrower Onboarding v2 cross-source conflict(s) propagated`
    );
  }

  if (boV2.summary.totalGrantCardCount === 0) {
    status = "NOT_STARTED";
    readinessPercent = 0;
  } else if (conflicts > 0) {
    status = "BLOCKED_BY_CONFLICT";
    readinessPercent = 50;
  } else {
    status = "READY_FOR_REVIEW";
    readinessPercent = 100;
  }

  return {
    id: "environmental_pathway_v2_alignment",
    label: V2_SIGNAL_LABELS.environmental_pathway_v2_alignment,
    status,
    readinessPercent,
    coverageCount: boV2.summary.totalGrantCardCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES.environmental_pathway_v2_alignment,
    doctrineRefs: [
      "Vol III §Pathway v2 Composition Determinism",
      "Vol IV §Pathway v2 Review Route",
      "Vol II §Environmental Determination Boundary",
    ],
  };
}

const V2_SIGNAL_BUILDERS: Record<
  EnvironmentalIntakeV2SignalId,
  (boV2: BorrowerOnboardingCoreV2Result) => EnvironmentalIntakeV2Signal
> = {
  environmental_customer_type_alignment: buildEnvironmentalCustomerTypeAlignment,
  environmental_capital_program_alignment:
    buildEnvironmentalCapitalProgramAlignment,
  environmental_pathway_v2_alignment: buildEnvironmentalPathwayV2Alignment,
};

function buildLegacyInput(
  input: EnvironmentalIntakeV2Input,
  state: BorrowerOnboardingState
): EnvironmentalIntakeInput {
  const legacy = input.legacy ?? {};
  return {
    borrowerId: legacy.borrowerId ?? null,
    applicationId: legacy.applicationId ?? input.applicationId ?? null,
    userId: legacy.userId ?? input.userId ?? null,
    location: legacy.location ?? state.location ?? null,
    realPropertyCollateral: legacy.realPropertyCollateral ?? null,
    federalFundingTrigger: legacy.federalFundingTrigger ?? null,
    federalActionInvolvement: legacy.federalActionInvolvement ?? null,
    stateEnvironmentalActJurisdiction:
      legacy.stateEnvironmentalActJurisdiction ?? null,
    knownEnvironmentalStatuteTrigger:
      legacy.knownEnvironmentalStatuteTrigger ?? null,
    knownContaminationConcern: legacy.knownContaminationConcern ?? null,
    protectedHabitatProximity: legacy.protectedHabitatProximity ?? null,
    wetlandsOrFloodplainProximity:
      legacy.wetlandsOrFloodplainProximity ?? null,
    equipmentAssetValue: legacy.equipmentAssetValue ?? null,
    requestExemptionEvaluation: legacy.requestExemptionEvaluation ?? null,
    borrowerExternalFirmInterest: legacy.borrowerExternalFirmInterest ?? null,
    feeDisclosureAcknowledged: legacy.feeDisclosureAcknowledged ?? null,
    metadata: legacy.metadata ?? input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  legacyResult: EnvironmentalIntakeResult,
  boV2: BorrowerOnboardingCoreV2Result,
  v2Signals: EnvironmentalIntakeV2Signal[]
): EnvironmentalIntakeV2CrossSourceConflict[] {
  const conflicts: EnvironmentalIntakeV2CrossSourceConflict[] = [];

  const environmentalAlignment = v2Signals.find(
    (signal) => signal.id === "environmental_capital_program_alignment"
  );

  if (
    legacyResult.pathwayPosture === "TRIGGERED" &&
    environmentalAlignment?.status === "NEEDS_INPUT"
  ) {
    conflicts.push({
      conflictId: "ei-v2-legacy-triggered-no-environmental-programs",
      topic:
        "Legacy v1 environmental pathway TRIGGERED while v2 stack has no environmental-category Capital Graph programs",
      description:
        "Legacy v1 environmental intake reports TRIGGERED pathway posture, but the canonical v2 stack returned no environmental-category Capital Graph-backed grant cards. Review whether declared customer types are missing or whether environmental Capital Graph coverage needs to be expanded.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-intake-v2",
    });
  }

  if (
    legacyResult.pathwayPosture === "POTENTIAL_EXEMPTION" &&
    environmentalAlignment !== undefined &&
    environmentalAlignment.coverageCount > 0
  ) {
    conflicts.push({
      conflictId: "ei-v2-legacy-exemption-with-environmental-programs",
      topic:
        "Legacy v1 environmental pathway POTENTIAL_EXEMPTION while v2 stack has environmental Capital Graph programs",
      description: `Legacy v1 environmental intake reports POTENTIAL_EXEMPTION while the canonical v2 stack composed ${environmentalAlignment.coverageCount} environmental-category Capital Graph-backed grant card(s). Review whether the exemption pathway resolution still applies in light of the additional environmental sponsor authority.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-intake-v2",
    });
  }

  if (boV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "ei-v2-upstream-bo-v2-conflicts",
      topic:
        "Upstream Borrower Onboarding Core v2 surfaced cross-source conflicts",
      description: `Borrower Onboarding Core v2 composition surfaced ${boV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Environmental Intake v2 evidence; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-intake-v2",
    });
  }

  return conflicts;
}

export function composeEnvironmentalIntakeV2(
  input: EnvironmentalIntakeV2Input = {}
): EnvironmentalIntakeV2Result {
  const state: BorrowerOnboardingState = input.onboardingState ?? {
    stage: "",
    location: { country: "US", state: "", county: "" },
    farmTypes: [],
    goals: [],
    acreage: 0,
    interests: {
      soilAnalysis: false,
      environmentalReports: false,
      financing: false,
      vendorRecommendations: false,
      commodityIntelligence: false,
    },
  };

  // 1. Compose Borrower Onboarding Core v2.
  const boV2 = composeBorrowerOnboardingCoreV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: state,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    scope: input.scope ?? null,
    metadata: input.metadata ?? null,
  });

  // 2. Compose legacy v1 environmental intake.
  const legacyResult = evaluateEnvironmentalIntake(
    buildLegacyInput(input, state)
  );

  // 3. Build v2 governed signals.
  const v2Signals = V2_SIGNAL_IDS.map((id) => V2_SIGNAL_BUILDERS[id](boV2));

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    legacyResult,
    boV2,
    v2Signals
  );

  // 5. Summarize.
  const v2ReadyCount = v2Signals.filter(
    (signal) => signal.status === "READY_FOR_REVIEW"
  ).length;
  const v2NeedsInputCount = v2Signals.filter(
    (signal) => signal.status === "NEEDS_INPUT"
  ).length;
  const v2BlockedCount = v2Signals.filter(
    (signal) => signal.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v2NotStartedCount = v2Signals.filter(
    (signal) => signal.status === "NOT_STARTED"
  ).length;
  const v2OverallReadinessPercent =
    v2Signals.length === 0
      ? 0
      : Math.round(
          v2Signals.reduce(
            (sum, signal) => sum + signal.readinessPercent,
            0
          ) / v2Signals.length
        );

  const customerTypeAlignment = v2Signals.find(
    (signal) => signal.id === "environmental_customer_type_alignment"
  );
  const capitalProgramAlignment = v2Signals.find(
    (signal) => signal.id === "environmental_capital_program_alignment"
  );

  const summary: EnvironmentalIntakeV2Summary = {
    v2SignalCount: v2Signals.length,
    v2ReadyCount,
    v2NeedsInputCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    v1ReadinessPercent: legacyResult.readiness.readinessPercent,
    v1TriggerSignalCount: legacyResult.triggerSignals.length,
    v1ExemptionCandidateCount: legacyResult.exemptionCandidates.length,
    v1HandoffCount: legacyResult.handoffs.length,
    crossSourceConflictCount: crossSourceConflicts.length,
    environmentalEligibleCustomerTypeCount:
      customerTypeAlignment?.coverageCount ?? 0,
    environmentalCapitalProgramCount:
      capitalProgramAlignment?.coverageCount ?? 0,
  };

  const recommendedReviewRoutes = unique([
    "/governance/environmental-intake-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/environmental-compliance",
    "/portal/borrower/environmental-intake",
    "/portal/borrower/onboarding",
    "/portal/borrower/readiness",
    "/portal/borrower/opportunities",
    "/applications",
    "/documents",
    "/data-rights",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Signals,
    legacyIntake: legacyResult,
    borrowerOnboardingCoreV2: boV2,
    crossSourceConflicts,
    legacyBridge: {
      environmentalIntakeVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
      legacyReadinessPercent: legacyResult.readiness.readinessPercent,
      legacyMissingItemCount: legacyResult.readiness.missingItems.length,
      legacyAssessmentRoute: legacyResult.assessmentRoute,
      legacyPathwayPosture: legacyResult.pathwayPosture,
      legacyTriggerSignalCount: legacyResult.triggerSignals.length,
      legacyExemptionCandidateCount: legacyResult.exemptionCandidates.length,
      legacyHandoffCount: legacyResult.handoffs.length,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...ENVIRONMENTAL_INTAKE_V2_DISCLOSURES,
      ...ENVIRONMENTAL_INTAKE_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...ENVIRONMENTAL_INTAKE_V2_PRODUCTION_RESTRICTIONS,
      ...ENVIRONMENTAL_INTAKE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([
      ...DEFAULT_BLOCKED_CLAIMS,
      ...ENVIRONMENTAL_INTAKE_BLOCKED_CLAIMS,
    ]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    environmentalIntakeV2InternalOnly: true,
    spokeIsolationRequired: true,
    feeAutonomyPreserved: true,
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
    noOfficialEnvironmentalReport: true,
    noEnvironmentalClearance: true,
    noProviderEngagement: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function environmentalIntakeV2Lineage(): {
  runtimeVersion: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyEnvironmentalIntakeVersion: string;
} {
  return {
    runtimeVersion: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyEnvironmentalIntakeVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
  };
}

export const ENVIRONMENTAL_INTAKE_V2_SIGNAL_IDS = V2_SIGNAL_IDS;
