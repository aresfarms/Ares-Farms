import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
  CapitalEligibilityFinding,
  CapitalPathwayCandidate,
  CapitalProgram,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CUSTOMER_TYPE_REGISTRY,
  CustomerType,
} from "@/lib/customer-types/customerTypeRuntime";
import {
  FINANCING_PATHWAY_DISCLOSURES,
  FINANCING_PATHWAY_ENGINE_VERSION,
  FinancingPathwayInput,
  FinancingPathwayResult,
  evaluateFinancingPathways,
} from "@/lib/financing/pathwayEngine";
import {
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_PRODUCTION_RESTRICTIONS,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";
import {
  REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
  RevenueIntelligenceV2ComposedProgram,
  RevenueIntelligenceV2CustomerProfile,
  RevenueIntelligenceV2Result,
  composeRevenueIntelligenceV2,
} from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Financing Pathway Engine v2 Runtime
 *
 * The second downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15). Builds a unified, deterministic, replay-
 * safe, audit-safe, conflict-preserving advisory pathway pack across:
 *
 * - Revenue Intelligence v2 (Customer Type profiles + Capital Graph
 *   composed programs + legacy revenue opportunity bridge + cross-
 *   source conflicts).
 * - Capital Graph pathway candidates and sponsor authority.
 * - Customer Type review boundaries and federation scope.
 * - Per-customer-type ranked pathway candidates (composed programs
 *   ordered by capital fit + customer-type tier + sponsor authority,
 *   tagged with readiness gaps and conflict signals).
 * - Backward-compatibility bridge to the v1
 *   `evaluateFinancingPathways` runtime, so existing consumers
 *   continue to see legacy pathway intelligence as a first-class
 *   evidence layer.
 *
 * Cross-source conflicts include sponsor-authority disagreement,
 * stacking conflict, federation-scope mismatch, readiness gap, and
 * legacy-v1-vs-v2 divergence — preserved as first-class evidence and
 * never collapsed.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): preserves Customer Type review
 *   boundary and Capital Graph sponsor authority; the runtime never
 *   grants pathway authority and never composes an autonomous
 *   pathway determination.
 * - Vol II (Regulatory Governance): pathway candidates carry the
 *   upstream Customer Type and Capital Graph doctrine refs; matching
 *   is review-bound and not a regulatory determination.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition with explicit version lineage chaining
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 → capital-graph-runtime-v0.1.0 →
 *   financing-pathway-engine-v0.1.0.
 * - Vol III-B (Governance Runtime): runtime evidence with
 *   classification, observability, explainability, and replay
 *   verification posture.
 * - Vol IV (Operational Runbooks): routes handoffs to the Capital
 *   Graph, Customer Type Registry, Revenue Intelligence v2,
 *   borrower opportunities, revenue opportunities, customer
 *   revenue, lender workflow, advanced intelligence, evidence
 *   engine, certification engine, registry framework, governance,
 *   reviews, evidence packets, audit replay, and module readiness.
 * - Vol V (Canonical Doctrines): preserves claims governance,
 *   controlled disclosure, replay, audit, portability, and
 *   advisory-only boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every composed
 *   pathway entry behind a public-safe DTO; no raw borrower or
 *   sponsor records, no live external fetch, no source-certainty
 *   claim.
 *
 * Safety boundary:
 * - The runtime produces internal advisory evidence only.
 * - It does not approve, deny, certify, underwrite, fund, commit,
 *   or otherwise create an autonomous customer eligibility
 *   determination, credit decision, lender commitment, program
 *   approval, tax-credit allocation, environmental clearance,
 *   carbon-credit issuance, regulatory reliance, legal reliance,
 *   live external customer/sponsor fetch, notice send, or payment
 *   authorization.
 * - Sponsor authority, customer-type review boundary, and
 *   qualified-reviewer approval remain with the named human
 *   authorities.
 */

export const FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION =
  "financing-pathway-engine-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type FinancingPathwayEngineV2Input = {
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
  } | null;
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type FinancingPathwayEngineV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  customerTypeId: string | null;
  capitalProgramIds: string[];
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type FinancingPathwayEngineV2Candidate = {
  pathwayId: string;
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

export type FinancingPathwayEngineV2CustomerProfile = {
  customerType: CustomerType;
  candidates: FinancingPathwayEngineV2Candidate[];
  legacyCandidateBridge: Array<{
    pathwayId: string;
    label: string;
    sponsorType: string;
    fitScore: number;
    status: "REVIEW_REQUIRED" | "MISSING_INFORMATION";
    fitReasons: string[];
    missingItems: string[];
    sourceRefs: string[];
  }>;
  crossSourceConflicts: FinancingPathwayEngineV2CrossSourceConflict[];
  blockedClaims: string[];
  reviewBoundary: string;
};

export type FinancingPathwayEngineV2LegacyBridge = {
  pathwayEngineVersion: string;
  legacyPathwayCount: number;
  legacyReadinessPercent: number;
  legacyMissingItems: string[];
  revenueIntelligenceV2Version: string;
  programGraphCount: number;
  revenueOpportunityCount: number;
};

export type FinancingPathwayEngineV2Summary = {
  customerProfileCount: number;
  totalCandidateCount: number;
  totalLegacyCandidateCount: number;
  conflictSignalCount: number;
  crossSourceConflictCount: number;
  sovereignCandidateCount: number;
  participantCandidateCount: number;
  publicCandidateCount: number;
  capitalPathwayCount: number;
  reviewRequiredCount: number;
  missingInformationCount: number;
  federationGatedCount: number;
};

export type FinancingPathwayEngineV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: FinancingPathwayEngineV2Summary;
  customerProfiles: FinancingPathwayEngineV2CustomerProfile[];
  capitalPathwayDigest: CapitalPathwayCandidate[];
  legacyBridge: FinancingPathwayEngineV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  financingPathwayEngineV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noPathwayAuthority: true;
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
  "autonomous pathway determination",
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

export const FINANCING_PATHWAY_ENGINE_V2_DISCLOSURES = [
  "Financing Pathway Engine v2 output is advisory, replay-safe, audit-safe, and conflict-preserving.",
  "Financing Pathway Engine v2 does not authorize approval, autonomous customer eligibility determination, autonomous pathway determination, credit decision, underwriting, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Financing Pathway Engine v2 does not perform a live external customer, sponsor, or lender fetch.",
  "Sponsor authority and customer-type review boundaries remain with the named human authorities; the runtime does not grant pathway authority.",
  "When Revenue Intelligence v2 and the legacy v1 financing pathway engine disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Pathway candidates ranked by capital fit, customer-type match tier, and sponsor authority remain advisory and review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed pathway signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const FINANCING_PATHWAY_ENGINE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
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

const READINESS_REQUIRED_ITEMS = [
  "borrower identity",
  "farm location",
  "farm type",
  "borrower goal",
  "acreage",
  "requested amount or financing purpose",
] as const;

function buildReadinessMissingItems(
  input: FinancingPathwayEngineV2Input
): string[] {
  const ctx = input.borrowerContext ?? {};
  const missing: string[] = [];

  if (!ctx.borrowerId) missing.push("borrower identity");
  if (!ctx.location?.state && !ctx.location?.country) {
    missing.push("farm location");
  }
  if (!ctx.farmTypes || ctx.farmTypes.length === 0) {
    missing.push("farm type");
  }
  if (!ctx.goals || ctx.goals.length === 0) {
    missing.push("borrower goal");
  }
  if (ctx.acreage === null || ctx.acreage === undefined) {
    missing.push("acreage");
  }
  if (!ctx.requestedAmount && (!ctx.intendedUses || ctx.intendedUses.length === 0)) {
    missing.push("requested amount or financing purpose");
  }

  return missing;
}

function rankPathwayStatus(
  composed: RevenueIntelligenceV2ComposedProgram,
  missingItems: string[],
  sovereignFederationAllowed: boolean
): FinancingPathwayEngineV2Candidate["pathwayStatus"] {
  if (
    composed.federationScope === "SOVEREIGN" &&
    !sovereignFederationAllowed
  ) {
    return "FEDERATION_GATED";
  }

  if (missingItems.length > 0) {
    return "MISSING_INFORMATION";
  }

  return "REVIEW_REQUIRED";
}

function buildCandidatesForProfile(
  profile: RevenueIntelligenceV2CustomerProfile,
  missingItems: string[],
  sovereignFederationAllowed: boolean
): FinancingPathwayEngineV2Candidate[] {
  const candidates: FinancingPathwayEngineV2Candidate[] = [];

  for (const composed of profile.composedPrograms) {
    const program = CAPITAL_GRAPH_REGISTRY.find(
      (entry) => entry.programId === composed.programId
    );

    if (!program) {
      continue;
    }

    candidates.push({
      pathwayId: `fpe-v2-${profile.customerType.typeId}-${composed.programId}`,
      programId: composed.programId,
      programName: composed.programName,
      categoryId: composed.categoryId,
      sponsorAuthority: composed.sponsorAuthority,
      federationScope: composed.federationScope,
      capitalFitScore: composed.capitalFitScore,
      customerTypeTier: composed.customerTypeTier,
      pathwayStatus: rankPathwayStatus(
        composed,
        missingItems,
        sovereignFederationAllowed
      ),
      fitReasons: [...composed.capitalFitReasons],
      missingItems: [...missingItems],
      conflictSignals: [...composed.conflictSignals],
      blockedClaims: [...composed.blockedClaims],
      reviewRoute: composed.reviewRoute,
      doctrineRefs: [...composed.doctrineRefs],
    });
  }

  candidates.sort((a, b) => {
    if (b.capitalFitScore !== a.capitalFitScore) {
      return b.capitalFitScore - a.capitalFitScore;
    }

    if (a.pathwayStatus !== b.pathwayStatus) {
      return a.pathwayStatus.localeCompare(b.pathwayStatus);
    }

    return a.pathwayId.localeCompare(b.pathwayId);
  });

  return candidates;
}

function buildLegacyCandidateBridge(
  profile: RevenueIntelligenceV2CustomerProfile,
  legacy: FinancingPathwayResult
): FinancingPathwayEngineV2CustomerProfile["legacyCandidateBridge"] {
  const customerLabel = profile.customerType.label.toLowerCase();
  const tokens = profile.customerType.matchingTokens.map((token) =>
    token.toLowerCase()
  );

  return legacy.pathways
    .filter((candidate) => {
      const sponsor = candidate.sponsorType.toLowerCase();
      const label = candidate.label.toLowerCase();

      return (
        label.includes(customerLabel) ||
        sponsor.includes(customerLabel) ||
        tokens.some(
          (token) => label.includes(token) || sponsor.includes(token)
        )
      );
    })
    .map((candidate) => ({
      pathwayId: candidate.id,
      label: candidate.label,
      sponsorType: candidate.sponsorType,
      fitScore: candidate.fitScore,
      status: candidate.status,
      fitReasons: [...candidate.fitReasons],
      missingItems: [...candidate.missingItems],
      sourceRefs: [...candidate.sourceRefs],
    }));
}

function buildCrossSourceConflicts(
  profile: RevenueIntelligenceV2CustomerProfile,
  candidates: FinancingPathwayEngineV2Candidate[],
  legacyBridgeCount: number
): FinancingPathwayEngineV2CrossSourceConflict[] {
  const conflicts: FinancingPathwayEngineV2CrossSourceConflict[] = [];

  const federationMismatched = candidates.filter(
    (candidate) =>
      candidate.federationScope !== profile.customerType.federationScope
  );

  if (federationMismatched.length > 0) {
    conflicts.push({
      conflictId: `fpe-v2-federation-mismatch-${profile.customerType.typeId}`,
      topic: `Pathway federation scope mismatch for ${profile.customerType.label}`,
      description: `Customer type federation scope (${profile.customerType.federationScope}) differs from ${federationMismatched.length} composed pathway candidate(s); review required to apply correct disclosure boundaries and sponsor authority.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: federationMismatched.map((entry) => entry.programId),
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/financing-pathway-engine-v2",
    });
  }

  // Surface v1-vs-v2 divergence: if the legacy bridge produced no
  // candidates for this customer type but v2 produced candidates, or
  // vice versa, that disagreement is preserved as evidence.
  if (legacyBridgeCount === 0 && candidates.length > 0) {
    conflicts.push({
      conflictId: `fpe-v2-legacy-divergence-${profile.customerType.typeId}`,
      topic: `Legacy v1 pathway engine returned no match for ${profile.customerType.label}`,
      description: `Revenue Intelligence v2 produced ${candidates.length} composed pathway candidate(s), but the legacy v1 financing pathway engine returned no matching candidate for this customer type; review whether v1 program coverage requires expansion or v2 composition needs sponsor-authority confirmation.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: candidates.map((entry) => entry.programId),
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/financing-pathway-engine-v2",
    });
  }

  if (legacyBridgeCount > 0 && candidates.length === 0) {
    conflicts.push({
      conflictId: `fpe-v2-coverage-gap-${profile.customerType.typeId}`,
      topic: `Customer type coverage gap for ${profile.customerType.label}`,
      description: `Legacy v1 pathway engine produced ${legacyBridgeCount} candidate(s) for this customer type, but Revenue Intelligence v2 composition returned no Capital Graph match under the current borrower context; review whether Capital Graph or Customer Type Registry require additional eligibility tokens.`,
      customerTypeId: profile.customerType.typeId,
      capitalProgramIds: [],
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/financing-pathway-engine-v2",
    });
  }

  return conflicts;
}

function buildLegacyInput(
  input: FinancingPathwayEngineV2Input
): FinancingPathwayInput {
  const ctx = input.borrowerContext ?? {};

  return {
    borrowerId: ctx.borrowerId ?? null,
    applicationId: input.applicationId ?? null,
    location: ctx.location ?? undefined,
    farmTypes: ctx.farmTypes ?? [],
    goals: ctx.goals ?? [],
    acreage: ctx.acreage ?? null,
    requestedAmount: ctx.requestedAmount ?? null,
    stage: ctx.stage ?? null,
    requestedPrograms: ctx.requestedPrograms ?? [],
    documents: ctx.documents ?? [],
    metadata: input.metadata ?? {},
  };
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeFinancingPathwayEngineV2(
  input: FinancingPathwayEngineV2Input = {}
): FinancingPathwayEngineV2Result {
  const sovereignFederationAllowed =
    input.scope?.sovereignFederationAllowed === true;

  // 1. Compose Revenue Intelligence v2 (which composes Customer Type
  //    Registry + Capital Graph + legacy revenue opportunity bridge).
  const revenueV2: RevenueIntelligenceV2Result = composeRevenueIntelligenceV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    borrowerContext: input.borrowerContext
      ? {
          declaredCustomerTypes:
            input.borrowerContext.declaredCustomerTypes ?? [],
          intendedUses: input.borrowerContext.intendedUses ?? [],
          jurisdiction: input.borrowerContext.jurisdiction ?? null,
        }
      : null,
    scope: input.scope
      ? {
          capitalCategoryIds: input.scope.capitalCategoryIds,
          sovereignFederationAllowed,
        }
      : null,
    metadata: input.metadata ?? null,
  });

  // 2. Compose legacy v1 pathway engine for the same borrower context.
  const legacyResult = evaluateFinancingPathways(buildLegacyInput(input));

  // 3. Compute borrower-level readiness gaps.
  const missingItems = buildReadinessMissingItems(input);

  // 4. Compose per-customer-type pathway profiles.
  const customerProfiles: FinancingPathwayEngineV2CustomerProfile[] =
    revenueV2.customerProfiles.map((profile) => {
      const candidates = buildCandidatesForProfile(
        profile,
        missingItems,
        sovereignFederationAllowed
      );
      const legacyBridge = buildLegacyCandidateBridge(profile, legacyResult);
      const crossSourceConflicts = buildCrossSourceConflicts(
        profile,
        candidates,
        legacyBridge.length
      );

      return {
        customerType: profile.customerType,
        candidates,
        legacyCandidateBridge: legacyBridge,
        crossSourceConflicts,
        blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
        reviewBoundary: profile.customerType.reviewBoundary,
      };
    });

  // 5. Summarize.
  const allCandidates = customerProfiles.flatMap(
    (profile) => profile.candidates
  );

  const summary: FinancingPathwayEngineV2Summary = {
    customerProfileCount: customerProfiles.length,
    totalCandidateCount: allCandidates.length,
    totalLegacyCandidateCount: customerProfiles.reduce(
      (sum, profile) => sum + profile.legacyCandidateBridge.length,
      0
    ),
    conflictSignalCount: allCandidates.reduce(
      (sum, candidate) => sum + candidate.conflictSignals.length,
      0
    ),
    crossSourceConflictCount: customerProfiles.reduce(
      (sum, profile) => sum + profile.crossSourceConflicts.length,
      0
    ),
    sovereignCandidateCount: allCandidates.filter(
      (candidate) => candidate.federationScope === "SOVEREIGN"
    ).length,
    participantCandidateCount: allCandidates.filter(
      (candidate) => candidate.federationScope === "PARTICIPANT"
    ).length,
    publicCandidateCount: allCandidates.filter(
      (candidate) => candidate.federationScope === "PUBLIC"
    ).length,
    capitalPathwayCount: revenueV2.capitalPathwayDigest.length,
    reviewRequiredCount: allCandidates.filter(
      (candidate) => candidate.pathwayStatus === "REVIEW_REQUIRED"
    ).length,
    missingInformationCount: allCandidates.filter(
      (candidate) => candidate.pathwayStatus === "MISSING_INFORMATION"
    ).length,
    federationGatedCount: allCandidates.filter(
      (candidate) => candidate.pathwayStatus === "FEDERATION_GATED"
    ).length,
  };

  const recommendedReviewRoutes = unique([
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
    runtimeVersion: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    customerProfiles,
    capitalPathwayDigest: revenueV2.capitalPathwayDigest,
    legacyBridge: {
      pathwayEngineVersion: FINANCING_PATHWAY_ENGINE_VERSION,
      legacyPathwayCount: legacyResult.pathways.length,
      legacyReadinessPercent: legacyResult.readiness.readinessPercent,
      legacyMissingItems: [...legacyResult.readiness.missingItems],
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
      programGraphCount: PROGRAM_GRAPH.length,
      revenueOpportunityCount: REVENUE_OPPORTUNITY_REGISTRY.length,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...FINANCING_PATHWAY_ENGINE_V2_DISCLOSURES,
      ...FINANCING_PATHWAY_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...FINANCING_PATHWAY_ENGINE_V2_PRODUCTION_RESTRICTIONS,
      ...REVENUE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    financingPathwayEngineV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noPathwayAuthority: true,
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

// Version-lineage helper chains v2 → Revenue Intelligence v2 →
// Customer Type → Capital Graph → legacy v1 pathway engine.
export function financingPathwayEngineV2Lineage(): {
  runtimeVersion: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyPathwayEngineVersion: string;
  legacyProgramGraphCount: number;
  legacyRevenueOpportunityCount: number;
} {
  return {
    runtimeVersion: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyPathwayEngineVersion: FINANCING_PATHWAY_ENGINE_VERSION,
    legacyProgramGraphCount: PROGRAM_GRAPH.length,
    legacyRevenueOpportunityCount: REVENUE_OPPORTUNITY_REGISTRY.length,
  };
}

// Suppress unused-import warning for the Capital Graph finding type
// (kept for downstream consumers that depend on this module barrel).
export type _FinancingPathwayEngineV2CapitalEligibilityFinding =
  CapitalEligibilityFinding;
