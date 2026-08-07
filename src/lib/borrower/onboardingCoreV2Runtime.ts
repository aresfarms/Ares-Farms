import {
  BorrowerOnboardingState,
  BorrowerOnboardingWorkflow,
  borrowerOnboardingDisclosureMessages,
  createBorrowerOnboardingWorkflow,
} from "@/lib/borrower/onboardingCore";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CUSTOMER_TYPE_REGISTRY,
  CustomerType,
} from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import {
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  OpportunityDiscoveryV2CustomerProfile,
  OpportunityDiscoveryV2Result,
  composeOpportunityDiscoveryV2,
} from "@/lib/platform/authorities/opportunity";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Borrower Onboarding Core v2 Runtime
 *
 * The tenth downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2
 * (Build 16), and Opportunity Discovery v2 (Build 17). This is the
 * borrower entry point of the canonical v2 backbone: it joins the
 * legacy v1 borrower onboarding workflow with governed v2
 * composition so that a borrower's declared customer types,
 * intended uses, and jurisdiction immediately yield governed
 * advisory next steps from the full canonical stack.
 *
 * Sources composed:
 *
 * - Legacy v1 `createBorrowerOnboardingWorkflow` (readinessPercent,
 *   missing items, default handoffs, disclosures) preserved as an
 *   additive compatibility bridge.
 * - Opportunity Discovery v2 (which composes FPE v2 + RI v2 +
 *   Customer Type + Capital Graph + legacy bridges) using the
 *   declared customer types, farm types, goals, intended uses, and
 *   jurisdiction derived from onboarding state.
 * - Per-customer-type onboarding summaries: matched customer type,
 *   archetype, federation scope, Capital Graph-backed grant card
 *   count, legacy v1 discovery section count, cross-source conflict
 *   count.
 * - Cross-source conflicts: legacy onboarding ready (readiness
 *   100%) while v2 stack returned no matched customer types,
 *   borrower selected financing interest but v2 stack returned no
 *   grant cards, declared sovereign customer types without
 *   sovereign federation authorization, upstream OD v2 cross-source
 *   conflicts propagated.
 *
 * Borrower Onboarding Core v2 output is advisory borrower
 * intake-and-discovery posture only. It does not approve, deny,
 * commit credit, or claim any external verification / certification
 * / public reliance. Live external borrower communication remains
 * gated by the borrower notice modules.
 *
 * Master Volume Governance:
 * - Vol I: keeps borrower intake accountable and understandable;
 *   composition never grants authority.
 * - Vol II: blocks intake from becoming approval, eligibility,
 *   financing, permitting, legal, or regulatory reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   borrower-onboarding-core-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   borrower-onboarding-core-runtime-v0.1.0 (the v1 module exports
 *   the workflow factory as the conceptual seal — see lineage
 *   helper below).
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, and replay verification posture.
 * - Vol IV: routes governed handoffs to Opportunity Discovery v2,
 *   Financing Pathway Engine v2, Revenue Intelligence v2, Customer
 *   Type Registry, Capital Graph, portal-borrower-onboarding,
 *   portal-borrower-opportunities, portal-borrower-financing-
 *   pathways, portal-borrower-readiness, portal-borrower-
 *   environmental-intake, applications, documents, data-rights,
 *   evidence packets, audit replay, governance, reviews, and module
 *   readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and advisory-only boundaries.
 * - Vol VI: keeps every composed entry behind a public-safe DTO; no
 *   raw sponsor or borrower records; no live external fetch; no
 *   source-certainty claim.
 *
 * Safety boundary:
 * - Internal advisory onboarding posture only.
 * - No autonomous customer eligibility / pathway / opportunity /
 *   intelligence / evidence / certification / registry / connector
 *   activation / onboarding determination, credit decision, lender
 *   commitment, program approval, tax-credit allocation,
 *   environmental clearance, carbon-credit issuance, public
 *   verification, source certainty claim, payment authorization,
 *   live external action, notice send, or legal reliance.
 */

export const BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION =
  "borrower-onboarding-core-v2-runtime-v0.1.0";

export const BORROWER_ONBOARDING_CORE_V1_LINEAGE_REF =
  "borrower-onboarding-core-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type BorrowerOnboardingCoreV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  onboardingState?: BorrowerOnboardingState;
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type BorrowerOnboardingCoreV2CustomerSummary = {
  customerType: CustomerType;
  grantCardCount: number;
  legacySectionCount: number;
  legacyCardCount: number;
  crossSourceConflictCount: number;
  reviewBoundary: string;
};

export type BorrowerOnboardingCoreV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type BorrowerOnboardingCoreV2LegacyBridge = {
  borrowerOnboardingCoreVersion: string;
  legacyReadinessPercent: number;
  legacyMissingItemCount: number;
  legacyHandoffCount: number;
  legacyDisclosureCount: number;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type BorrowerOnboardingCoreV2Summary = {
  declaredCustomerTypeCount: number;
  matchedCustomerProfileCount: number;
  totalGrantCardCount: number;
  totalLegacyDiscoverySectionCount: number;
  totalLegacyDiscoveryCardCount: number;
  crossSourceConflictCount: number;
  legacyReadinessPercent: number;
  legacyMissingItemCount: number;
  capitalProgramCoverageCount: number;
};

export type BorrowerOnboardingCoreV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: BorrowerOnboardingCoreV2Summary;
  legacyWorkflow: BorrowerOnboardingWorkflow;
  customerSummaries: BorrowerOnboardingCoreV2CustomerSummary[];
  crossSourceConflicts: BorrowerOnboardingCoreV2CrossSourceConflict[];
  legacyBridge: BorrowerOnboardingCoreV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  borrowerOnboardingCoreV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousOnboarding: true;
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

// =============================================================================
// Canonical disclosure / production-restriction posture
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous intelligence determination",
  "autonomous evidence determination",
  "autonomous certification determination",
  "autonomous onboarding determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "guaranteed revenue",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const BORROWER_ONBOARDING_CORE_V2_DISCLOSURES = [
  "Borrower Onboarding Core v2 output is advisory intake-and-discovery posture, replay-safe, audit-safe, and conflict-preserving.",
  "Borrower Onboarding Core v2 does not authorize approval, autonomous customer eligibility determination, autonomous pathway / opportunity / intelligence / evidence / certification / onboarding determination, credit decision, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, public verification, regulatory reliance, or legal reliance.",
  "Borrower Onboarding Core v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "Borrower Onboarding Core v2 does not send borrower notices; notice delivery is gated by the borrower notice modules.",
  "When the legacy v1 borrower onboarding workflow reports complete readiness but the canonical v2 stack returns no matched customer types, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Sovereign customer types are visible only when named federation participation is authorized.",
  "Human review is required before any composed onboarding signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const BORROWER_ONBOARDING_CORE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
  "no autonomous certification determination",
  "no autonomous onboarding determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no tax-credit allocation",
  "no environmental clearance",
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

// =============================================================================
// Composition helpers
// =============================================================================

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

function deriveIntendedUses(state: BorrowerOnboardingState): string[] {
  const intended: string[] = [];

  for (const farmType of state.farmTypes) {
    intended.push(farmType.toLowerCase().replace(/_/g, " "));
  }

  for (const goal of state.goals) {
    intended.push(goal.toLowerCase().replace(/_/g, " "));
  }

  if (state.interests.financing) {
    intended.push("financing");
    intended.push("operating capital");
  }
  if (state.interests.environmentalReports) {
    intended.push("environmental compliance");
  }
  if (state.interests.soilAnalysis) {
    intended.push("soil analysis");
  }
  if (state.interests.commodityIntelligence) {
    intended.push("commodity intelligence");
  }
  if (state.interests.vendorRecommendations) {
    intended.push("equipment");
    intended.push("vendor recommendations");
  }

  return intended;
}

function summarizeProfile(
  profile: OpportunityDiscoveryV2CustomerProfile
): BorrowerOnboardingCoreV2CustomerSummary {
  return {
    customerType: profile.customerType,
    grantCardCount: profile.grantCards.length,
    legacySectionCount: profile.legacySections.filter(
      (section) => section.cards.length > 0
    ).length,
    legacyCardCount: profile.legacyCardCount,
    crossSourceConflictCount: profile.crossSourceConflicts.length,
    reviewBoundary: profile.reviewBoundary,
  };
}

function buildCrossSourceConflicts(
  legacyWorkflow: BorrowerOnboardingWorkflow,
  odV2Result: OpportunityDiscoveryV2Result,
  state: BorrowerOnboardingState,
  sovereignFederationAllowed: boolean,
  declaredCustomerTypes: string[]
): BorrowerOnboardingCoreV2CrossSourceConflict[] {
  const conflicts: BorrowerOnboardingCoreV2CrossSourceConflict[] = [];

  if (
    legacyWorkflow.readinessPercent === 100 &&
    odV2Result.customerProfiles.length === 0
  ) {
    conflicts.push({
      conflictId: "boc-v2-legacy-ready-v2-empty",
      topic:
        "Legacy v1 borrower onboarding reports 100% readiness while v2 stack returned no matched customer profiles",
      description:
        "The legacy v1 workflow flags onboarding as ready, but the canonical v2 stack returned no matched customer types. Review whether declared customer types were missing or whether v2 registry coverage requires additional eligibility tokens.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/borrower-onboarding-core-v2",
    });
  }

  if (
    state.interests.financing &&
    odV2Result.summary.totalGrantCardCount === 0
  ) {
    conflicts.push({
      conflictId: "boc-v2-financing-interest-no-grants",
      topic:
        "Borrower selected financing interest but v2 stack returned no Capital Graph-backed grant cards",
      description:
        "Financing interest was selected during onboarding, but the canonical v2 stack returned zero Capital Graph-backed grant cards across all matched customer types. Review whether declared customer types or borrower context need to be expanded for Capital Graph composition.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/borrower-onboarding-core-v2",
    });
  }

  const declaredSovereign = declaredCustomerTypes.some((token) =>
    /tribe|tribal|sovereign/i.test(token)
  );
  if (declaredSovereign && !sovereignFederationAllowed) {
    conflicts.push({
      conflictId: "boc-v2-sovereign-declared-without-authorization",
      topic:
        "Borrower declared a sovereign customer type without sovereign federation authorization",
      description:
        "One or more declared customer types reference a sovereign archetype (e.g. federally recognized tribe), but the scope did not authorize sovereign federation. The sovereign types are hidden until a reviewer explicitly authorizes sovereign federation participation.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/borrower-onboarding-core-v2",
    });
  }

  if (odV2Result.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "boc-v2-upstream-od-v2-conflicts",
      topic:
        "Upstream Opportunity Discovery v2 surfaced cross-source conflicts",
      description: `Opportunity Discovery v2 composition surfaced ${odV2Result.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Borrower Onboarding Core v2; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/borrower-onboarding-core-v2",
    });
  }

  return conflicts;
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeBorrowerOnboardingCoreV2(
  input: BorrowerOnboardingCoreV2Input = {}
): BorrowerOnboardingCoreV2Result {
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

  // 1. Compose legacy v1 borrower onboarding workflow.
  const legacyWorkflow = createBorrowerOnboardingWorkflow(state);

  // 2. Derive declared customer types + intended uses + jurisdiction
  //    from onboarding state + explicit input.
  const declaredCustomerTypes = input.declaredCustomerTypes ?? [];
  const intendedUses = unique([
    ...(input.intendedUses ?? []),
    ...deriveIntendedUses(state),
  ]);

  const sovereignFederationAllowed =
    input.scope?.sovereignFederationAllowed === true;

  // 3. Compose Opportunity Discovery v2 (full canonical v2 stack at
  //    the borrower-context scope).
  const odV2Result: OpportunityDiscoveryV2Result =
    composeOpportunityDiscoveryV2({
      reviewerRole: input.reviewerRole ?? null,
      userId: input.userId ?? null,
      applicationId: input.applicationId ?? null,
      borrowerContext: {
        borrowerId: input.userId ?? null,
        declaredCustomerTypes,
        intendedUses,
        jurisdiction: state.location
          ? {
              federal: state.location.country === "US",
              state: state.location.state || null,
              county: state.location.county || null,
            }
          : null,
        location: state.location ?? null,
        farmTypes: state.farmTypes.map((t) =>
          t.toLowerCase().replace(/_/g, " ")
        ),
        goals: state.goals.map((g) => g.toLowerCase().replace(/_/g, " ")),
        acreage: state.acreage > 0 ? state.acreage : null,
        requestedAmount: null,
        stage: state.stage || null,
        interests: state.interests,
      },
      scope: { sovereignFederationAllowed },
      metadata: input.metadata ?? null,
    });

  // 4. Build per-customer-type onboarding summaries.
  const customerSummaries = odV2Result.customerProfiles.map(summarizeProfile);

  // 5. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    legacyWorkflow,
    odV2Result,
    state,
    sovereignFederationAllowed,
    declaredCustomerTypes
  );

  // 6. Summarize.
  const totalLegacyDiscoverySectionCount = customerSummaries.reduce(
    (sum, summary) => sum + summary.legacySectionCount,
    0
  );
  const totalLegacyDiscoveryCardCount = customerSummaries.reduce(
    (sum, summary) => sum + summary.legacyCardCount,
    0
  );

  const summary: BorrowerOnboardingCoreV2Summary = {
    declaredCustomerTypeCount: declaredCustomerTypes.length,
    matchedCustomerProfileCount: odV2Result.summary.customerProfileCount,
    totalGrantCardCount: odV2Result.summary.totalGrantCardCount,
    totalLegacyDiscoverySectionCount,
    totalLegacyDiscoveryCardCount,
    crossSourceConflictCount: crossSourceConflicts.length,
    legacyReadinessPercent: legacyWorkflow.readinessPercent,
    legacyMissingItemCount: legacyWorkflow.missingItems.length,
    capitalProgramCoverageCount: odV2Result.summary.totalGrantCardCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/borrower-onboarding-core-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/portal/borrower/onboarding",
    "/portal/borrower/opportunities",
    "/portal/borrower/financing-pathways",
    "/portal/borrower/readiness",
    "/portal/borrower/environmental-intake",
    "/portal/borrower/applications",
    "/portal/borrower/documents",
    "/portal/borrower/data-rights",
    "/financing-pathways",
    "/readiness",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    legacyWorkflow,
    customerSummaries,
    crossSourceConflicts,
    legacyBridge: {
      borrowerOnboardingCoreVersion: BORROWER_ONBOARDING_CORE_V1_LINEAGE_REF,
      legacyReadinessPercent: legacyWorkflow.readinessPercent,
      legacyMissingItemCount: legacyWorkflow.missingItems.length,
      legacyHandoffCount: legacyWorkflow.handoffs.length,
      legacyDisclosureCount: legacyWorkflow.disclosures.length,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...BORROWER_ONBOARDING_CORE_V2_DISCLOSURES,
      ...borrowerOnboardingDisclosureMessages,
    ]),
    productionRestrictions: unique([
      ...BORROWER_ONBOARDING_CORE_V2_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    borrowerOnboardingCoreV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousOnboarding: true,
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

export function borrowerOnboardingCoreV2Lineage(): {
  runtimeVersion: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyBorrowerOnboardingCoreVersion: string;
} {
  return {
    runtimeVersion: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyBorrowerOnboardingCoreVersion: BORROWER_ONBOARDING_CORE_V1_LINEAGE_REF,
  };
}
