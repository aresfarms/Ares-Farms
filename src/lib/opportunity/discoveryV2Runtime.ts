import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
  CapitalProgram,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CUSTOMER_TYPE_REGISTRY,
  CustomerType,
} from "@/lib/customer-types/customerTypeRuntime";
import {
  FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
  FinancingPathwayEngineV2Candidate,
  FinancingPathwayEngineV2CustomerProfile,
  FinancingPathwayEngineV2Result,
  composeFinancingPathwayEngineV2,
} from "@/lib/financing/pathwayEngineV2Runtime";
import {
  OPPORTUNITY_DISCOVERY_DISCLOSURES,
  OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
  OpportunityCard,
  OpportunityDiscoveryInput,
  OpportunityDiscoveryResult,
  OpportunityDiscoverySection,
  OpportunityKind,
  evaluateOpportunityDiscovery,
} from "@/lib/opportunity/discoveryRuntime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";
import {
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_SOURCE_INTELLIGENCE_VERSION,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Opportunity Discovery v2 Runtime
 *
 * The third downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15) and Financing Pathway Engine v2
 * (Build 16). Produces a unified, deterministic, replay-safe,
 * audit-safe, conflict-preserving advisory opportunity pack that
 * joins:
 *
 * - Financing Pathway Engine v2 (and therefore Revenue Intelligence
 *   v2 + Customer Type + Capital Graph + legacy revenue + legacy v1
 *   pathway engine) as the authoritative governed source for
 *   per-customer-type pathway candidates.
 * - Customer Type review boundary and federation scope.
 * - Capital Graph sponsor authority and category posture.
 * - An additive backward-compatibility bridge to the legacy v1
 *   `evaluateOpportunityDiscovery` runtime so the existing
 *   marketplace, market-signal, operating-cost, geo-suitability,
 *   sellable-catalog, and property-discovery sections continue to
 *   appear as first-class evidence.
 * - Per-customer-type opportunity cards organized into governed
 *   sections — `grants_and_programs` (composed pathways promoted from
 *   v2), `revenue_opportunities`, `equipment_and_marketplace`,
 *   `market_context`, `geo_suitability`, `sellable_catalog`,
 *   `property_discovery`, and `operating_costs` — each tagged with
 *   blocked claims, source refs, review route, and conflict signals.
 * - Cross-source conflict signals when (a) the legacy v1 discovery
 *   surfaces an opportunity for a customer type that v2 composition
 *   does not cover, (b) federation scope mismatches, or (c) the v1
 *   discovery returns zero cards for a matched customer type.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): preserves Customer Type review
 *   boundary, Capital Graph sponsor authority, and the v1 discovery
 *   review boundary; never grants opportunity authority.
 * - Vol II (Regulatory Governance): every composed opportunity
 *   carries upstream doctrine refs; matching is review-bound and not
 *   a regulatory determination.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition with explicit version lineage chaining
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   opportunity-discovery-runtime-v0.1.0 →
 *   revenue-source-intelligence-runtime-v0.1.0.
 * - Vol III-B (Governance Runtime): runtime evidence with
 *   classification, observability, explainability, and replay
 *   verification posture.
 * - Vol IV (Operational Runbooks): routes governed handoffs to
 *   Capital Graph, Customer Type Registry, Revenue Intelligence v2,
 *   Financing Pathway Engine v2, borrower opportunities, revenue
 *   opportunities, customer revenue, lender workflow, advanced
 *   intelligence, evidence engine, certification engine, registry
 *   framework, evidence packets, audit replay, governance, reviews,
 *   and module readiness.
 * - Vol V (Canonical Doctrines): preserves claims governance,
 *   controlled disclosure, replay, audit, portability, and
 *   advisory-only boundaries.
 * - Vol VI (Source Intelligence Integration): every composed
 *   opportunity card remains behind a public-safe DTO; no raw
 *   borrower, sponsor, or property records; no live external fetch;
 *   no source-certainty claim.
 *
 * Safety boundary:
 * - Internal advisory evidence only.
 * - No autonomous customer eligibility determination, autonomous
 *   pathway determination, autonomous opportunity determination,
 *   credit decision, lender commitment, program approval, tax-credit
 *   allocation, environmental clearance, carbon-credit issuance,
 *   live external customer / sponsor / source / property fetch,
 *   source-certainty claim, payment authorization, or notice send.
 */

export const OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION =
  "opportunity-discovery-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type OpportunityDiscoveryV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  borrowerContext?: {
    borrowerId?: string | null;
    declaredCustomerTypes?: string[];
    intendedUses?: string[];
    jurisdiction?: {
      federal?: boolean;
      state?: string | null;
      county?: string | null;
      utilityTerritory?: string | null;
    } | null;
    location?: {
      country?: string | null;
      state?: string | null;
      county?: string | null;
    } | null;
    farmTypes?: string[];
    goals?: string[];
    acreage?: number | null;
    requestedAmount?: number | null;
    stage?: string | null;
    requestedPrograms?: string[];
    documents?: string[];
    interests?: {
      grants?: boolean;
      properties?: boolean;
      equipment?: boolean;
      marketContext?: boolean;
      revenueOpportunities?: boolean;
      soilAnalysis?: boolean;
      commodityIntelligence?: boolean;
    } | null;
  } | null;
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type OpportunityDiscoveryV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  customerTypeId: string | null;
  capitalProgramIds: string[];
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type OpportunityDiscoveryV2GrantCard = {
  cardId: string;
  programId: string;
  programName: string;
  categoryId: CapitalCategoryId;
  sponsorAuthority: string;
  federationScope: CapitalProgram["federationScope"];
  capitalFitScore: number;
  customerTypeTier: "EXACT" | "TOKEN_MATCH" | "ARCHETYPE_ALIGNED";
  pathwayStatus:
    | "REVIEW_REQUIRED"
    | "MISSING_INFORMATION"
    | "FEDERATION_GATED";
  fitReasons: string[];
  missingItems: string[];
  conflictSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type OpportunityDiscoveryV2CustomerProfile = {
  customerType: CustomerType;
  grantCards: OpportunityDiscoveryV2GrantCard[];
  legacySections: OpportunityDiscoverySection[];
  legacyCardCount: number;
  crossSourceConflicts: OpportunityDiscoveryV2CrossSourceConflict[];
  blockedClaims: string[];
  reviewBoundary: string;
};

export type OpportunityDiscoveryV2LegacyBridge = {
  opportunityDiscoveryVersion: string;
  legacySectionCount: number;
  legacyCardCount: number;
  legacyHandoffCount: number;
  legacyDisclosureCount: number;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  revenueSourceIntelligenceVersion: string;
};

export type OpportunityDiscoveryV2Summary = {
  customerProfileCount: number;
  totalGrantCardCount: number;
  totalLegacyCardCount: number;
  conflictSignalCount: number;
  crossSourceConflictCount: number;
  sovereignCardCount: number;
  participantCardCount: number;
  publicCardCount: number;
  reviewRequiredCount: number;
  missingInformationCount: number;
  federationGatedCount: number;
  sectionsBySource: Record<OpportunityKind, number>;
};

export type OpportunityDiscoveryV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: OpportunityDiscoveryV2Summary;
  customerProfiles: OpportunityDiscoveryV2CustomerProfile[];
  legacyBridge: OpportunityDiscoveryV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  opportunityDiscoveryV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
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
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "guaranteed revenue",
  "official property certification",
  "official report publication",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const OPPORTUNITY_DISCOVERY_V2_DISCLOSURES = [
  "Opportunity Discovery v2 output is advisory, replay-safe, audit-safe, and conflict-preserving.",
  "Opportunity Discovery v2 does not authorize approval, autonomous customer eligibility determination, autonomous pathway determination, autonomous opportunity determination, credit decision, underwriting, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Opportunity Discovery v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "Sponsor authority, customer-type review boundaries, and qualified-reviewer approval remain with the named human authorities.",
  "When Financing Pathway Engine v2 composition and the legacy v1 opportunity discovery surfaces disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Opportunity cards organized into grants_and_programs, revenue_opportunities, equipment_and_marketplace, market_context, geo_suitability, sellable_catalog, property_discovery, and operating_costs sections remain advisory and review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed opportunity signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
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

const SECTION_KINDS: readonly OpportunityKind[] = [
  "grants_and_programs",
  "revenue_opportunities",
  "equipment_and_marketplace",
  "market_context",
  "geo_suitability",
  "sellable_catalog",
  "property_discovery",
  "operating_costs",
];

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

function candidateToGrantCard(
  candidate: FinancingPathwayEngineV2Candidate,
  customerTypeId: string
): OpportunityDiscoveryV2GrantCard {
  return {
    cardId: `od-v2-${customerTypeId}-${candidate.programId}`,
    programId: candidate.programId,
    programName: candidate.programName,
    categoryId: candidate.categoryId,
    sponsorAuthority: candidate.sponsorAuthority,
    federationScope: candidate.federationScope,
    capitalFitScore: candidate.capitalFitScore,
    customerTypeTier: candidate.customerTypeTier,
    pathwayStatus: candidate.pathwayStatus,
    fitReasons: [...candidate.fitReasons],
    missingItems: [...candidate.missingItems],
    conflictSignals: [...candidate.conflictSignals],
    blockedClaims: [...candidate.blockedClaims],
    reviewRoute: candidate.reviewRoute,
    doctrineRefs: [...candidate.doctrineRefs],
  };
}

function profileTokens(profile: FinancingPathwayEngineV2CustomerProfile): {
  customerLabel: string;
  tokens: string[];
} {
  return {
    customerLabel: profile.customerType.label.toLowerCase(),
    tokens: profile.customerType.matchingTokens.map((token) =>
      token.toLowerCase()
    ),
  };
}

function filterLegacySectionsForProfile(
  profile: FinancingPathwayEngineV2CustomerProfile,
  legacyResult: OpportunityDiscoveryResult
): OpportunityDiscoverySection[] {
  const { customerLabel, tokens } = profileTokens(profile);

  return legacyResult.sections.map((section) => {
    const cards: OpportunityCard[] = section.cards.filter((card) => {
      const haystack = [
        card.title,
        card.summary,
        card.category ?? "",
        card.sponsorOrSourceType ?? "",
        ...card.fitReasons,
      ]
        .join(" ")
        .toLowerCase();

      return (
        haystack.includes(customerLabel) ||
        tokens.some((token) => haystack.includes(token))
      );
    });

    return {
      id: section.id,
      label: section.label,
      cards,
      reviewSignals: [...section.reviewSignals],
      reviewRoute: section.reviewRoute,
    };
  });
}

function countLegacyCards(sections: OpportunityDiscoverySection[]): number {
  return sections.reduce((sum, section) => sum + section.cards.length, 0);
}

function buildCrossSourceConflicts(
  profile: FinancingPathwayEngineV2CustomerProfile,
  grantCards: OpportunityDiscoveryV2GrantCard[],
  legacyCardCount: number
): OpportunityDiscoveryV2CrossSourceConflict[] {
  const conflicts: OpportunityDiscoveryV2CrossSourceConflict[] = [];

  const federationMismatched = grantCards.filter(
    (card) => card.federationScope !== profile.customerType.federationScope
  );

  if (federationMismatched.length > 0) {
    conflicts.push({
      conflictId: `od-v2-federation-mismatch-${profile.customerType.typeId}`,
      topic: `Opportunity federation scope mismatch for ${profile.customerType.label}`,
      description: `Customer type federation scope (${profile.customerType.federationScope}) differs from ${federationMismatched.length} composed opportunity card(s); review required to apply correct disclosure boundaries.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: federationMismatched.map((card) => card.programId),
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/opportunity-discovery-v2",
    });
  }

  if (grantCards.length === 0 && legacyCardCount > 0) {
    conflicts.push({
      conflictId: `od-v2-pathway-gap-${profile.customerType.typeId}`,
      topic: `Pathway gap for ${profile.customerType.label}`,
      description: `Legacy v1 opportunity discovery returned ${legacyCardCount} card(s) for this customer type, but Financing Pathway Engine v2 composition returned no Capital Graph-backed grant cards under the current borrower context; review whether Capital Graph or Customer Type Registry require additional eligibility tokens.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: [],
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/opportunity-discovery-v2",
    });
  }

  if (grantCards.length > 0 && legacyCardCount === 0) {
    conflicts.push({
      conflictId: `od-v2-legacy-coverage-gap-${profile.customerType.typeId}`,
      topic: `Legacy v1 coverage gap for ${profile.customerType.label}`,
      description: `Financing Pathway Engine v2 composition produced ${grantCards.length} Capital Graph-backed grant card(s), but the legacy v1 opportunity discovery returned no matching opportunity for this customer type; review whether legacy program / marketplace / market-signal / geo-suitability registries require expansion.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: grantCards.map((card) => card.programId),
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/opportunity-discovery-v2",
    });
  }

  return conflicts;
}

function buildLegacyInput(
  input: OpportunityDiscoveryV2Input
): OpportunityDiscoveryInput {
  const ctx = input.borrowerContext ?? {};

  return {
    borrowerId: ctx.borrowerId ?? null,
    applicationId: input.applicationId ?? null,
    userId: input.userId ?? null,
    location: ctx.location ?? undefined,
    customerTypes: ctx.declaredCustomerTypes ?? [],
    farmTypes: ctx.farmTypes ?? [],
    goals: ctx.goals ?? [],
    interests: ctx.interests ?? undefined,
    metadata: input.metadata ?? {},
  };
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeOpportunityDiscoveryV2(
  input: OpportunityDiscoveryV2Input = {}
): OpportunityDiscoveryV2Result {
  // 1. Compose Financing Pathway Engine v2 (which composes Revenue
  //    Intelligence v2 + Customer Type Registry + Capital Graph +
  //    legacy v1 financing-pathway-engine).
  const fpeV2: FinancingPathwayEngineV2Result =
    composeFinancingPathwayEngineV2({
      reviewerRole: input.reviewerRole ?? null,
      userId: input.userId ?? null,
      applicationId: input.applicationId ?? null,
      borrowerContext: input.borrowerContext
        ? {
            borrowerId: input.borrowerContext.borrowerId ?? null,
            declaredCustomerTypes:
              input.borrowerContext.declaredCustomerTypes ?? [],
            intendedUses: input.borrowerContext.intendedUses ?? [],
            jurisdiction: input.borrowerContext.jurisdiction ?? null,
            location: input.borrowerContext.location ?? null,
            farmTypes: input.borrowerContext.farmTypes ?? [],
            goals: input.borrowerContext.goals ?? [],
            acreage: input.borrowerContext.acreage ?? null,
            requestedAmount: input.borrowerContext.requestedAmount ?? null,
            stage: input.borrowerContext.stage ?? null,
            requestedPrograms:
              input.borrowerContext.requestedPrograms ?? [],
            documents: input.borrowerContext.documents ?? [],
          }
        : null,
      scope: input.scope ?? null,
      metadata: input.metadata ?? null,
    });

  // 2. Compose legacy v1 opportunity discovery for the same borrower
  //    context.
  const legacyResult = evaluateOpportunityDiscovery(buildLegacyInput(input));

  // 3. Compose per-customer-type opportunity packs.
  const customerProfiles: OpportunityDiscoveryV2CustomerProfile[] =
    fpeV2.customerProfiles.map((profile) => {
      const grantCards = profile.candidates.map((candidate) =>
        candidateToGrantCard(candidate, profile.customerType.typeId)
      );

      const legacySections = filterLegacySectionsForProfile(
        profile,
        legacyResult
      );
      const legacyCardCount = countLegacyCards(legacySections);
      const crossSourceConflicts = buildCrossSourceConflicts(
        profile,
        grantCards,
        legacyCardCount
      );

      return {
        customerType: profile.customerType,
        grantCards,
        legacySections,
        legacyCardCount,
        crossSourceConflicts,
        blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
        reviewBoundary: profile.customerType.reviewBoundary,
      };
    });

  // 4. Summarize.
  const allGrantCards = customerProfiles.flatMap((profile) => profile.grantCards);
  const totalLegacyCardCount = customerProfiles.reduce(
    (sum, profile) => sum + profile.legacyCardCount,
    0
  );

  const sectionsBySource = SECTION_KINDS.reduce<Record<OpportunityKind, number>>(
    (acc, kind) => {
      acc[kind] = 0;
      return acc;
    },
    {} as Record<OpportunityKind, number>
  );
  for (const profile of customerProfiles) {
    for (const section of profile.legacySections) {
      sectionsBySource[section.id] += section.cards.length;
    }
  }

  const summary: OpportunityDiscoveryV2Summary = {
    customerProfileCount: customerProfiles.length,
    totalGrantCardCount: allGrantCards.length,
    totalLegacyCardCount,
    conflictSignalCount: allGrantCards.reduce(
      (sum, card) => sum + card.conflictSignals.length,
      0
    ),
    crossSourceConflictCount: customerProfiles.reduce(
      (sum, profile) => sum + profile.crossSourceConflicts.length,
      0
    ),
    sovereignCardCount: allGrantCards.filter(
      (card) => card.federationScope === "SOVEREIGN"
    ).length,
    participantCardCount: allGrantCards.filter(
      (card) => card.federationScope === "PARTICIPANT"
    ).length,
    publicCardCount: allGrantCards.filter(
      (card) => card.federationScope === "PUBLIC"
    ).length,
    reviewRequiredCount: allGrantCards.filter(
      (card) => card.pathwayStatus === "REVIEW_REQUIRED"
    ).length,
    missingInformationCount: allGrantCards.filter(
      (card) => card.pathwayStatus === "MISSING_INFORMATION"
    ).length,
    federationGatedCount: allGrantCards.filter(
      (card) => card.pathwayStatus === "FEDERATION_GATED"
    ).length,
    sectionsBySource,
  };

  const recommendedReviewRoutes = unique([
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
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
    runtimeVersion: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    customerProfiles,
    legacyBridge: {
      opportunityDiscoveryVersion: OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
      legacySectionCount: legacyResult.sections.length,
      legacyCardCount: legacyResult.totalOpportunityCount,
      legacyHandoffCount: legacyResult.handoffs.length,
      legacyDisclosureCount: legacyResult.disclosures.length,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
      revenueSourceIntelligenceVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...OPPORTUNITY_DISCOVERY_V2_DISCLOSURES,
      ...OPPORTUNITY_DISCOVERY_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS,
      ...REVENUE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    opportunityDiscoveryV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

// Version-lineage helper chains v2 → Financing Pathway Engine v2 →
// Revenue Intelligence v2 → Customer Type → Capital Graph → legacy v1
// opportunity discovery → legacy v1 revenue-source-intelligence.
export function opportunityDiscoveryV2Lineage(): {
  runtimeVersion: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyOpportunityDiscoveryVersion: string;
  legacyRevenueSourceIntelligenceVersion: string;
} {
  return {
    runtimeVersion: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyOpportunityDiscoveryVersion: OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
    legacyRevenueSourceIntelligenceVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
  };
}
