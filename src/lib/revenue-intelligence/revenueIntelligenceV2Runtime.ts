import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
  CapitalEligibilityFinding,
  CapitalGraphInput,
  CapitalPathwayCandidate,
  CapitalProgram,
  composeCapitalGraph,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CUSTOMER_TYPE_REGISTRY,
  CustomerType,
  CustomerTypeInput,
  CustomerTypeProfile,
  composeCustomerTypeRegistry,
} from "@/lib/customer-types/customerTypeRuntime";
import {
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_SOURCE_INTELLIGENCE_VERSION,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Revenue Intelligence v2 Runtime
 *
 * The first downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14). Composes a unified, deterministic,
 * replay-safe, audit-safe, conflict-preserving advisory pack across:
 *
 * - Customer Type profiles (from composeCustomerTypeRegistry).
 * - Capital Graph composition (from composeCapitalGraph), scoped to the
 *   capital categories named by each matched customer type.
 * - Per-customer-type composed program candidates: the intersection of
 *   Capital Graph matched programs and the customer type's
 *   eligibleCapitalCategories.
 * - Legacy compatibility bridge to REVENUE_OPPORTUNITY_REGISTRY and
 *   PROGRAM_GRAPH from the v1 revenueSourceIntelligenceRuntime, so
 *   existing consumers continue to see legacy intelligence as a
 *   first-class evidence layer.
 *
 * Conflict signals from both upstream runtimes are preserved as first-
 * class evidence and never collapsed. Cross-source conflict signals are
 * emitted when Customer Type and Capital Graph disagree on eligibility
 * boundaries (sovereign federation, classification, sponsor authority).
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): preserves Customer Type review
 *   boundaries and Capital Graph sponsor authority; never grants
 *   authority or composes an autonomous determination.
 * - Vol II (Regulatory Governance): every composed program carries the
 *   underlying Capital Graph + Customer Type doctrine refs; matching is
 *   review-bound and not a regulatory determination.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition with explicit version lineage chaining v2 → Customer
 *   Type → Capital Graph → v1 revenue-source-intelligence.
 * - Vol III-B (Governance Runtime): runtime evidence with classification,
 *   observability, explainability, and replay verification posture.
 * - Vol IV (Operational Runbooks): routes handoffs to the Capital Graph,
 *   Customer Type Registry, financing pathway guidance, opportunity
 *   discovery, advanced intelligence, lender workflow, evidence engine,
 *   certification engine, registry framework, governance, and reviews.
 * - Vol V (Canonical Doctrines): preserves claims governance, controlled
 *   disclosure, replay, audit, portability, and advisory-only boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every composed entry
 *   behind a public-safe DTO; no raw sponsor or borrower records, no
 *   live external fetch, no source-certainty claim.
 *
 * Safety boundary:
 * - The runtime produces internal advisory evidence only.
 * - It does not approve, deny, certify, underwrite, fund, commit, or
 *   otherwise create an autonomous customer eligibility determination,
 *   credit decision, lender commitment, program approval, tax-credit
 *   allocation, environmental clearance, carbon-credit issuance,
 *   regulatory reliance, or legal reliance.
 * - It does not perform a live external customer or sponsor fetch.
 * - Output remains advisory, replay-safe, conflict-preserving, and
 *   human-review-bound.
 * - Sponsor authority, customer-type review boundary, and qualified-
 *   reviewer approval remain with the named human authorities; the
 *   runtime never grants authority.
 */

export const REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION =
  "revenue-intelligence-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type RevenueIntelligenceV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  borrowerContext?: {
    declaredCustomerTypes?: string[];
    intendedUses?: string[];
    jurisdiction?: {
      federal?: boolean;
      state?: string | null;
      county?: string | null;
      utilityTerritory?: string | null;
    } | null;
  } | null;
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type RevenueIntelligenceV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  customerTypeId: string;
  capitalProgramIds: string[];
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type RevenueIntelligenceV2ComposedProgram = {
  programId: string;
  programName: string;
  categoryId: CapitalCategoryId;
  sponsorAuthority: string;
  federationScope: CapitalProgram["federationScope"];
  capitalFitScore: number;
  customerTypeTier: "EXACT" | "TOKEN_MATCH" | "ARCHETYPE_ALIGNED";
  capitalFitReasons: string[];
  conflictSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type RevenueIntelligenceV2CustomerProfile = {
  customerType: CustomerType;
  composedPrograms: RevenueIntelligenceV2ComposedProgram[];
  legacyRevenueOpportunityBridge: Array<{
    revenueOpportunityId: string;
    productCategory: string;
    estimatedRevenueRange: string;
    estimatedCostRange: string;
    projectionBasis: string;
    sourceRefs: string[];
  }>;
  crossSourceConflicts: RevenueIntelligenceV2CrossSourceConflict[];
  blockedClaims: string[];
  reviewBoundary: string;
};

export type RevenueIntelligenceV2LegacyBridge = {
  programGraphCount: number;
  revenueOpportunityCount: number;
  bridgeVersion: string;
};

export type RevenueIntelligenceV2Summary = {
  customerProfileCount: number;
  totalComposedProgramCount: number;
  totalLegacyOpportunityCount: number;
  conflictSignalCount: number;
  crossSourceConflictCount: number;
  sovereignProgramCount: number;
  participantProgramCount: number;
  publicProgramCount: number;
  capitalPathwayCount: number;
};

export type RevenueIntelligenceV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: RevenueIntelligenceV2Summary;
  customerProfiles: RevenueIntelligenceV2CustomerProfile[];
  capitalPathwayDigest: CapitalPathwayCandidate[];
  legacyBridge: RevenueIntelligenceV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  revenueIntelligenceV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
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
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "guaranteed revenue",
  "official report publication",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "payment authorization",
  "notice send",
] as const;

export const REVENUE_INTELLIGENCE_V2_DISCLOSURES = [
  "Revenue Intelligence v2 output is advisory, replay-safe, audit-safe, and conflict-preserving.",
  "Revenue Intelligence v2 does not authorize approval, autonomous customer eligibility determination, credit decision, underwriting, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Revenue Intelligence v2 does not perform a live external customer or sponsor fetch.",
  "Sponsor authority and customer-type review boundaries remain with the named human authorities; the runtime does not grant authority.",
  "When Customer Type Registry and Capital Graph disagree on eligibility boundaries, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Legacy revenue opportunity bridge preserves backward compatibility with the v1 revenue-source-intelligence runtime; legacy entries remain advisory and review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const REVENUE_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
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
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
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

function deriveCustomerTypeTier(
  matchSignalTypes: ReadonlyArray<"EXACT" | "TOKEN_MATCH" | "ARCHETYPE">
): "EXACT" | "TOKEN_MATCH" | "ARCHETYPE_ALIGNED" {
  if (matchSignalTypes.includes("EXACT")) {
    return "EXACT";
  }

  if (matchSignalTypes.includes("TOKEN_MATCH")) {
    return "TOKEN_MATCH";
  }

  return "ARCHETYPE_ALIGNED";
}

function buildComposedPrograms(
  profile: CustomerTypeProfile,
  capitalMatched: Map<string, CapitalEligibilityFinding>
): RevenueIntelligenceV2ComposedProgram[] {
  const eligibleCategorySet = new Set(
    profile.customerType.eligibleCapitalCategories
  );
  const composed: RevenueIntelligenceV2ComposedProgram[] = [];

  const matchSignalTypes = profile.matchSignals.map((signal) => signal.signalType);
  const customerTypeTier = deriveCustomerTypeTier(matchSignalTypes);

  for (const ref of profile.eligibleCapitalRefs) {
    if (!eligibleCategorySet.has(ref.categoryId)) {
      continue;
    }

    const finding = capitalMatched.get(ref.programId);

    if (!finding) {
      continue;
    }

    const program = CAPITAL_GRAPH_REGISTRY.find(
      (entry) => entry.programId === ref.programId
    );

    if (!program) {
      continue;
    }

    composed.push({
      programId: ref.programId,
      programName: ref.programName,
      categoryId: ref.categoryId,
      sponsorAuthority: program.sponsorAuthority,
      federationScope: ref.federationScope,
      capitalFitScore: finding.fitScore,
      customerTypeTier,
      capitalFitReasons: [...finding.fitReasons],
      conflictSignals: [...finding.conflictSignals],
      blockedClaims: [
        ...new Set([...finding.blockedClaims, ...program.blockedClaims]),
      ],
      reviewRoute: finding.requiredReviewRoute,
      doctrineRefs: [...program.doctrineRefs],
    });
  }

  composed.sort((a, b) => b.capitalFitScore - a.capitalFitScore);
  return composed;
}

function buildLegacyRevenueOpportunityBridge(
  profile: CustomerTypeProfile,
  intendedUses: string[]
): RevenueIntelligenceV2CustomerProfile["legacyRevenueOpportunityBridge"] {
  const customerTypeLabel = profile.customerType.label.toLowerCase();
  const matchingTokens = profile.customerType.matchingTokens.map((token) =>
    token.toLowerCase()
  );

  const bridge: RevenueIntelligenceV2CustomerProfile["legacyRevenueOpportunityBridge"] =
    [];

  for (const opportunity of REVENUE_OPPORTUNITY_REGISTRY) {
    const opportunityCustomerType = opportunity.customer_type.toLowerCase();
    const matchesCustomer =
      opportunityCustomerType.includes(customerTypeLabel) ||
      matchingTokens.some(
        (token) =>
          opportunityCustomerType.includes(token) ||
          token.includes(opportunityCustomerType)
      );

    if (!matchesCustomer) {
      continue;
    }

    const matchesIntendedUse =
      intendedUses.length === 0 ||
      intendedUses.some((use) => {
        const lowered = use.toLowerCase();

        return (
          opportunity.product_or_service_category
            .toLowerCase()
            .includes(lowered) ||
          lowered.includes(
            opportunity.product_or_service_category.toLowerCase()
          )
        );
      });

    if (!matchesIntendedUse) {
      continue;
    }

    bridge.push({
      revenueOpportunityId: opportunity.revenue_opportunity_id,
      productCategory: opportunity.product_or_service_category,
      estimatedRevenueRange: opportunity.estimated_revenue_range ?? "",
      estimatedCostRange: opportunity.estimated_cost_range ?? "",
      projectionBasis: opportunity.projection_basis,
      sourceRefs: [...opportunity.source_refs],
    });
  }

  return bridge;
}

function buildCrossSourceConflicts(
  profile: CustomerTypeProfile,
  composed: RevenueIntelligenceV2ComposedProgram[]
): RevenueIntelligenceV2CrossSourceConflict[] {
  const conflicts: RevenueIntelligenceV2CrossSourceConflict[] = [];

  // Customer type federation scope vs program federation scope mismatch.
  const mismatched = composed.filter(
    (program) =>
      program.federationScope !== profile.customerType.federationScope
  );

  if (mismatched.length > 0) {
    conflicts.push({
      conflictId: `federation-mismatch-${profile.customerType.typeId}`,
      topic: `Federation scope mismatch for ${profile.customerType.label}`,
      description: `Customer type federation scope (${profile.customerType.federationScope}) differs from ${mismatched.length} composed program(s); review required to apply correct disclosure boundaries.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: mismatched.map((entry) => entry.programId),
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/revenue-intelligence-v2",
    });
  }

  // Capital Graph eligibility categories that the customer type allows
  // but for which the Capital Graph eligibility evaluator returned no
  // match in the current borrower context.
  const composedCategories = new Set(composed.map((entry) => entry.categoryId));
  const missingCategories = profile.customerType.eligibleCapitalCategories.filter(
    (category) => !composedCategories.has(category)
  );

  if (missingCategories.length > 0) {
    conflicts.push({
      conflictId: `eligibility-gap-${profile.customerType.typeId}`,
      topic: `Eligibility gap for ${profile.customerType.label}`,
      description: `${missingCategories.length} eligible capital categor(ies) listed by the customer type did not return Capital Graph matches under the current borrower context; review whether borrower context is incomplete or sponsor authority requires additional input.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: missingCategories,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/revenue-intelligence-v2",
    });
  }

  return conflicts;
}

function buildCapitalGraphInput(
  input: RevenueIntelligenceV2Input,
  matchedCustomerTypes: CustomerType[]
): CapitalGraphInput {
  const customerTypeTokens = unique(
    matchedCustomerTypes.flatMap((customerType) => [
      customerType.label,
      ...customerType.matchingTokens,
    ])
  );

  return {
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    eligibility: {
      customerTypes: customerTypeTokens,
      intendedUses: input.borrowerContext?.intendedUses ?? [],
      jurisdiction: input.borrowerContext?.jurisdiction ?? null,
      sovereignFederationAllowed:
        input.scope?.sovereignFederationAllowed ?? false,
    },
    scope: {
      categoryIds: input.scope?.capitalCategoryIds,
    },
  };
}

function buildCustomerTypeInput(
  input: RevenueIntelligenceV2Input
): CustomerTypeInput {
  return {
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    borrowerContext: {
      declaredTypes: input.borrowerContext?.declaredCustomerTypes ?? [],
      jurisdiction: input.borrowerContext?.jurisdiction
        ? {
            federal: input.borrowerContext.jurisdiction.federal,
            state: input.borrowerContext.jurisdiction.state ?? null,
          }
        : null,
    },
    scope: {
      sovereignFederationAllowed:
        input.scope?.sovereignFederationAllowed ?? false,
    },
  };
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeRevenueIntelligenceV2(
  input: RevenueIntelligenceV2Input = {}
): RevenueIntelligenceV2Result {
  // 1. Compose Customer Type profiles.
  const customerTypeResult = composeCustomerTypeRegistry(
    buildCustomerTypeInput(input)
  );

  // 2. Compose Capital Graph eligibility with customer-context-derived inputs.
  const matchedCustomerTypes = customerTypeResult.profiles.map(
    (profile) => profile.customerType
  );
  const capitalGraphInput = buildCapitalGraphInput(
    input,
    matchedCustomerTypes
  );
  const capitalGraphResult = composeCapitalGraph(capitalGraphInput);

  const capitalMatchedById = new Map<string, CapitalEligibilityFinding>(
    capitalGraphResult.eligibility.matched.map((finding) => [
      finding.programId,
      finding,
    ])
  );

  // 3. Compose per-customer-type intelligence profiles.
  const customerProfiles: RevenueIntelligenceV2CustomerProfile[] =
    customerTypeResult.profiles.map((profile) => {
      const composedPrograms = buildComposedPrograms(
        profile,
        capitalMatchedById
      );
      const legacyBridge = buildLegacyRevenueOpportunityBridge(
        profile,
        input.borrowerContext?.intendedUses ?? []
      );
      const crossSourceConflicts = buildCrossSourceConflicts(
        profile,
        composedPrograms
      );

      return {
        customerType: profile.customerType,
        composedPrograms,
        legacyRevenueOpportunityBridge: legacyBridge,
        crossSourceConflicts,
        blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
        reviewBoundary: profile.customerType.reviewBoundary,
      };
    });

  // 4. Summarize.
  const totalComposedProgramCount = customerProfiles.reduce(
    (sum, profile) => sum + profile.composedPrograms.length,
    0
  );
  const totalLegacyOpportunityCount = customerProfiles.reduce(
    (sum, profile) => sum + profile.legacyRevenueOpportunityBridge.length,
    0
  );
  const conflictSignalCount = customerProfiles.reduce(
    (sum, profile) =>
      sum +
      profile.composedPrograms.reduce(
        (innerSum, program) => innerSum + program.conflictSignals.length,
        0
      ),
    0
  );
  const crossSourceConflictCount = customerProfiles.reduce(
    (sum, profile) => sum + profile.crossSourceConflicts.length,
    0
  );

  const allComposedPrograms = customerProfiles.flatMap(
    (profile) => profile.composedPrograms
  );
  const sovereignProgramCount = allComposedPrograms.filter(
    (program) => program.federationScope === "SOVEREIGN"
  ).length;
  const participantProgramCount = allComposedPrograms.filter(
    (program) => program.federationScope === "PARTICIPANT"
  ).length;
  const publicProgramCount = allComposedPrograms.filter(
    (program) => program.federationScope === "PUBLIC"
  ).length;

  const summary: RevenueIntelligenceV2Summary = {
    customerProfileCount: customerProfiles.length,
    totalComposedProgramCount,
    totalLegacyOpportunityCount,
    conflictSignalCount,
    crossSourceConflictCount,
    sovereignProgramCount,
    participantProgramCount,
    publicProgramCount,
    capitalPathwayCount: capitalGraphResult.pathways.length,
  };

  const recommendedReviewRoutes = unique([
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/financing-pathways",
    "/portal/borrower/opportunities",
    "/portal/revenue-opportunities",
    "/customer-revenue",
    "/lender/workflow",
    "/governance/advanced-intelligence",
    "/governance/certification-engine",
    "/governance/evidence-engine",
    "/governance/registry-framework",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    customerProfiles,
    capitalPathwayDigest: capitalGraphResult.pathways,
    legacyBridge: {
      programGraphCount: PROGRAM_GRAPH.length,
      revenueOpportunityCount: REVENUE_OPPORTUNITY_REGISTRY.length,
      bridgeVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...REVENUE_INTELLIGENCE_V2_DISCLOSURES,
      ...REVENUE_SOURCE_REQUIRED_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...REVENUE_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS,
      ...REVENUE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    revenueIntelligenceV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

// Version-lineage helper chains v2 → Customer Type → Capital Graph → v1.
export function revenueIntelligenceV2Lineage(): {
  runtimeVersion: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyProgramGraphCount: number;
  legacyRevenueOpportunityCount: number;
  legacyBridgeVersion: string;
} {
  return {
    runtimeVersion: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyProgramGraphCount: PROGRAM_GRAPH.length,
    legacyRevenueOpportunityCount: REVENUE_OPPORTUNITY_REGISTRY.length,
    legacyBridgeVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
  };
}
