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
  ADVANCED_INTELLIGENCE_DISCLOSURES,
  ADVANCED_INTELLIGENCE_DOMAIN_IDS,
  ADVANCED_INTELLIGENCE_PRODUCTION_RESTRICTIONS,
  ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
  AdvancedIntelligenceDomainId,
  AdvancedIntelligenceDomainResult,
  AdvancedIntelligenceInput,
  AdvancedIntelligenceResult,
  evaluateAdvancedIntelligence,
} from "@/lib/intelligence/advancedIntelligenceRuntime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import {
  REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
  RevenueIntelligenceV2Result,
  composeRevenueIntelligenceV2,
} from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Advanced Intelligence v2 Runtime
 *
 * The fifth downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2
 * (Build 16), Opportunity Discovery v2 (Build 17), and Lender
 * Workflow v2 (Build 18). It composes a unified, deterministic,
 * replay-safe, audit-safe, conflict-preserving advisory intelligence
 * pack that joins:
 *
 * - The legacy v1 `evaluateAdvancedIntelligence` runtime (source,
 *   revenue, market, geospatial, pathway intelligence domains)
 *   preserved as an additive compatibility bridge.
 * - Four new v2 governed intelligence domains derived from the
 *   canonical stack:
 *     - `customer_type_intelligence` (Customer Type Registry +
 *       Capital Graph cross-reference posture),
 *     - `capital_program_intelligence` (Capital Graph composition
 *       posture, federation scope, sponsor authority),
 *     - `pathway_v2_intelligence` (Financing Pathway Engine v2
 *       posture, Revenue Intelligence v2 cross-source conflicts,
 *       Opportunity Discovery v2 conflict signals),
 *     - `lender_coordination_intelligence` (Lender Workflow v2
 *       briefing posture and cross-source conflict signals).
 * - Each v2 domain emits replay-safe signals and conflict signals
 *   that inherit upstream Vol I–VI doctrine refs.
 * - Cross-source conflicts are preserved when (a) a v1 domain
 *   surfaces a signal whose underlying source authority is not
 *   represented in the v2 canonical stack, or (b) the v2 stack
 *   produces a federation-scope or sponsor-authority signal that
 *   the v1 stack cannot evaluate, or (c) the v2 stack reports
 *   readiness gaps that v1 cannot enumerate.
 *
 * Master Volume Governance:
 * - Vol I: keeps advanced intelligence subordinate to constitutional
 *   authority; the runtime never grants intelligence authority and
 *   never composes an autonomous determination.
 * - Vol II: composed intelligence inherits upstream Capital Graph +
 *   Customer Type + Revenue / Pathway / Opportunity / Lender
 *   doctrine refs; review-bound, not regulatory determination.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   advanced-intelligence-v2-runtime-v0.1.0 →
 *   lender-workflow-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   advanced-intelligence-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, and replay verification posture.
 * - Vol IV: routes governed handoffs to Capital Graph, Customer Type
 *   Registry, Revenue Intelligence v2, Financing Pathway Engine v2,
 *   Opportunity Discovery v2, Lender Workflow v2, advanced
 *   intelligence (v1), evidence engine, certification engine,
 *   registry framework, evidence packets, audit replay, governance,
 *   reviews, and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and advisory-only boundaries.
 * - Vol VI: keeps every composed insight behind a public-safe DTO;
 *   no raw borrower / sponsor / property records, no live external
 *   fetch, no source-certainty claim.
 *
 * Safety boundary:
 * - Internal advisory evidence only.
 * - No autonomous customer eligibility / pathway / opportunity /
 *   intelligence determination, credit decision, lender commitment,
 *   program approval, tax-credit allocation, environmental
 *   clearance, carbon-credit issuance, live external fetch, source
 *   certainty claim, payment authorization, or borrower notice send.
 */

export const ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION =
  "advanced-intelligence-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type AdvancedIntelligenceV2DomainId =
  | "customer_type_intelligence"
  | "capital_program_intelligence"
  | "pathway_v2_intelligence"
  | "lender_coordination_intelligence";

export type AdvancedIntelligenceV2Signal = {
  signalId: string;
  label: string;
  value: string;
  sourceRefs: string[];
  authorityTier?: string;
  confidenceScore?: number;
};

export type AdvancedIntelligenceV2Conflict = {
  conflictId: string;
  topic: string;
  description: string;
  competingSignals: AdvancedIntelligenceV2Signal[];
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type AdvancedIntelligenceV2Insight = {
  id: string;
  domain: AdvancedIntelligenceV2DomainId;
  title: string;
  summary: string;
  signals: AdvancedIntelligenceV2Signal[];
  conflicts: AdvancedIntelligenceV2Conflict[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type AdvancedIntelligenceV2DomainResult = {
  id: AdvancedIntelligenceV2DomainId;
  label: string;
  insights: AdvancedIntelligenceV2Insight[];
  conflictCount: number;
  reviewRoute: string;
};

export type AdvancedIntelligenceV2Input = {
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
    v2Domains?: AdvancedIntelligenceV2DomainId[];
    v1Domains?: AdvancedIntelligenceDomainId[];
    capitalCategoryIds?: CapitalCategoryId[];
    state?: string | null;
    customerType?: string | null;
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type AdvancedIntelligenceV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  customerTypeId: string | null;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type AdvancedIntelligenceV2LegacyBridge = {
  advancedIntelligenceVersion: string;
  legacyDomainCount: number;
  legacyInsightCount: number;
  legacyConflictCount: number;
  legacySourceAuthorityCount: number;
  legacyDisclosureCount: number;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type AdvancedIntelligenceV2Summary = {
  v2DomainCount: number;
  v1DomainCount: number;
  totalInsightCount: number;
  v2InsightCount: number;
  v1InsightCount: number;
  conflictCount: number;
  v2ConflictCount: number;
  v1ConflictCount: number;
  crossSourceConflictCount: number;
  customerTypeCoverageCount: number;
  capitalProgramCoverageCount: number;
};

export type AdvancedIntelligenceV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: AdvancedIntelligenceV2Summary;
  v2Domains: AdvancedIntelligenceV2DomainResult[];
  legacyDomains: AdvancedIntelligenceDomainResult[];
  crossSourceConflicts: AdvancedIntelligenceV2CrossSourceConflict[];
  legacyBridge: AdvancedIntelligenceV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  advancedIntelligenceV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
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
  "autonomous intelligence determination",
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
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const ADVANCED_INTELLIGENCE_V2_DISCLOSURES = [
  "Advanced Intelligence v2 output is advisory, replay-safe, audit-safe, and conflict-preserving.",
  "Advanced Intelligence v2 does not authorize approval, autonomous customer eligibility determination, autonomous pathway determination, autonomous opportunity determination, autonomous intelligence determination, credit decision, underwriting, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Advanced Intelligence v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "When the legacy v1 advanced intelligence and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Each v2 domain (customer-type, capital-program, pathway-v2, lender-coordination) inherits upstream doctrine refs and remains review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed intelligence signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ADVANCED_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
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

const V2_DOMAIN_IDS: readonly AdvancedIntelligenceV2DomainId[] = [
  "customer_type_intelligence",
  "capital_program_intelligence",
  "pathway_v2_intelligence",
  "lender_coordination_intelligence",
];

const V2_DOMAIN_LABELS: Record<AdvancedIntelligenceV2DomainId, string> = {
  customer_type_intelligence: "Customer Type Intelligence",
  capital_program_intelligence: "Capital Program Intelligence",
  pathway_v2_intelligence: "Pathway Intelligence (v2)",
  lender_coordination_intelligence: "Lender Coordination Intelligence",
};

const V2_DOMAIN_REVIEW_ROUTES: Record<AdvancedIntelligenceV2DomainId, string> =
  {
    customer_type_intelligence: "/governance/customer-types",
    capital_program_intelligence: "/governance/capital-graph",
    pathway_v2_intelligence: "/governance/financing-pathway-engine-v2",
    lender_coordination_intelligence: "/governance/lender-workflow-v2",
  };

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

function buildCustomerTypeInsights(
  v2Result: RevenueIntelligenceV2Result
): AdvancedIntelligenceV2Insight[] {
  const insights: AdvancedIntelligenceV2Insight[] = [];

  for (const profile of v2Result.customerProfiles) {
    const customerType: CustomerType = profile.customerType;
    insights.push({
      id: `ai-v2-customer-${customerType.typeId}`,
      domain: "customer_type_intelligence",
      title: `Customer type posture: ${customerType.label}`,
      summary: `Customer type ${customerType.typeId} (archetype ${customerType.archetype}, federation ${customerType.federationScope}) matched ${profile.composedPrograms.length} Capital Graph-backed program(s) and ${profile.legacyRevenueOpportunityBridge.length} legacy revenue opportunit(ies). Review boundary: ${customerType.reviewBoundary}.`,
      signals: [
        {
          signalId: `ai-v2-customer-${customerType.typeId}-archetype`,
          label: "archetype",
          value: customerType.archetype,
          sourceRefs: ["customer-type-runtime-v0.1.0"],
          authorityTier: "canonical-registry",
        },
        {
          signalId: `ai-v2-customer-${customerType.typeId}-federation`,
          label: "federation scope",
          value: customerType.federationScope,
          sourceRefs: ["customer-type-runtime-v0.1.0"],
          authorityTier: "canonical-registry",
        },
        {
          signalId: `ai-v2-customer-${customerType.typeId}-eligible-categories`,
          label: "eligible capital categories",
          value: customerType.eligibleCapitalCategories.join(","),
          sourceRefs: [
            "customer-type-runtime-v0.1.0",
            "capital-graph-runtime-v0.1.0",
          ],
          authorityTier: "canonical-registry",
        },
      ],
      conflicts: profile.crossSourceConflicts.map((conflict) => ({
        conflictId: conflict.conflictId,
        topic: conflict.topic,
        description: conflict.description,
        competingSignals: [
          {
            signalId: `${conflict.conflictId}-customer-type`,
            label: "customer type",
            value: customerType.label,
            sourceRefs: ["customer-type-runtime-v0.1.0"],
            authorityTier: "canonical-registry",
          },
          ...conflict.capitalProgramIds.map((programId) => ({
            signalId: `${conflict.conflictId}-program-${programId}`,
            label: "capital program",
            value: programId,
            sourceRefs: ["capital-graph-runtime-v0.1.0"],
            authorityTier: "canonical-registry",
          })),
        ],
        resolution: "REQUIRES_HUMAN_REVIEW" as const,
        reviewRoute: conflict.reviewRoute,
      })),
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: V2_DOMAIN_REVIEW_ROUTES.customer_type_intelligence,
      doctrineRefs: customerType.doctrineRefs,
    });
  }

  return insights;
}

function buildCapitalProgramInsights(
  v2Result: RevenueIntelligenceV2Result
): AdvancedIntelligenceV2Insight[] {
  const insights: AdvancedIntelligenceV2Insight[] = [];
  const programIdsSeen = new Set<string>();

  for (const profile of v2Result.customerProfiles) {
    for (const composed of profile.composedPrograms) {
      if (programIdsSeen.has(composed.programId)) {
        continue;
      }
      programIdsSeen.add(composed.programId);

      const program = CAPITAL_GRAPH_REGISTRY.find(
        (entry) => entry.programId === composed.programId
      );

      if (!program) {
        continue;
      }

      insights.push({
        id: `ai-v2-program-${composed.programId}`,
        domain: "capital_program_intelligence",
        title: `Capital program: ${composed.programName}`,
        summary: `Program ${composed.programId} (category ${composed.categoryId}, sponsor ${composed.sponsorAuthority}, federation ${composed.federationScope}) composed for at least ${composed.customerTypeTier} customer-type match with capital fit ${composed.capitalFitScore.toFixed(2)}.`,
        signals: [
          {
            signalId: `ai-v2-program-${composed.programId}-sponsor`,
            label: "sponsor authority",
            value: composed.sponsorAuthority,
            sourceRefs: ["capital-graph-runtime-v0.1.0"],
            authorityTier: "canonical-registry",
          },
          {
            signalId: `ai-v2-program-${composed.programId}-federation`,
            label: "federation scope",
            value: composed.federationScope,
            sourceRefs: ["capital-graph-runtime-v0.1.0"],
            authorityTier: "canonical-registry",
          },
          {
            signalId: `ai-v2-program-${composed.programId}-category`,
            label: "capital category",
            value: composed.categoryId,
            sourceRefs: ["capital-graph-runtime-v0.1.0"],
            authorityTier: "canonical-registry",
          },
          {
            signalId: `ai-v2-program-${composed.programId}-fit-score`,
            label: "capital fit score",
            value: composed.capitalFitScore.toFixed(2),
            sourceRefs: [
              "capital-graph-runtime-v0.1.0",
              "revenue-intelligence-v2-runtime-v0.1.0",
            ],
            authorityTier: "composed",
            confidenceScore: composed.capitalFitScore,
          },
        ],
        conflicts: [],
        blockedClaims: [
          ...new Set([...DEFAULT_BLOCKED_CLAIMS, ...composed.blockedClaims]),
        ],
        reviewRoute: V2_DOMAIN_REVIEW_ROUTES.capital_program_intelligence,
        doctrineRefs: program.doctrineRefs,
      });
    }
  }

  return insights;
}

function buildPathwayV2Insights(
  v2Result: RevenueIntelligenceV2Result
): AdvancedIntelligenceV2Insight[] {
  const insights: AdvancedIntelligenceV2Insight[] = [];

  insights.push({
    id: "ai-v2-pathway-summary",
    domain: "pathway_v2_intelligence",
    title: "Pathway intelligence v2 summary",
    summary: `Revenue Intelligence v2 composed ${v2Result.summary.customerProfileCount} customer profile(s), ${v2Result.summary.totalComposedProgramCount} Capital Graph-backed program(s), ${v2Result.summary.totalLegacyOpportunityCount} legacy revenue opportunit(ies), ${v2Result.summary.conflictSignalCount} conflict signal(s), and ${v2Result.summary.crossSourceConflictCount} cross-source conflict(s) across the current borrower context.`,
    signals: [
      {
        signalId: "ai-v2-pathway-customer-profile-count",
        label: "customer profile count",
        value: String(v2Result.summary.customerProfileCount),
        sourceRefs: ["revenue-intelligence-v2-runtime-v0.1.0"],
        authorityTier: "composed",
      },
      {
        signalId: "ai-v2-pathway-program-count",
        label: "composed program count",
        value: String(v2Result.summary.totalComposedProgramCount),
        sourceRefs: ["revenue-intelligence-v2-runtime-v0.1.0"],
        authorityTier: "composed",
      },
      {
        signalId: "ai-v2-pathway-conflict-count",
        label: "conflict signal count",
        value: String(v2Result.summary.conflictSignalCount),
        sourceRefs: ["revenue-intelligence-v2-runtime-v0.1.0"],
        authorityTier: "composed",
      },
      {
        signalId: "ai-v2-pathway-cross-source-conflict-count",
        label: "cross-source conflict count",
        value: String(v2Result.summary.crossSourceConflictCount),
        sourceRefs: ["revenue-intelligence-v2-runtime-v0.1.0"],
        authorityTier: "composed",
      },
      {
        signalId: "ai-v2-pathway-capital-pathway-count",
        label: "capital pathway count",
        value: String(v2Result.summary.capitalPathwayCount),
        sourceRefs: [
          "capital-graph-runtime-v0.1.0",
          "revenue-intelligence-v2-runtime-v0.1.0",
        ],
        authorityTier: "composed",
      },
    ],
    conflicts: [],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DOMAIN_REVIEW_ROUTES.pathway_v2_intelligence,
    doctrineRefs: [
      "Vol III §Pathway Intelligence v2 — replay-safe pathway composition",
      "Vol IV §Pathway Review Route — review-bound pathway handoffs",
    ],
  });

  return insights;
}

function buildLenderCoordinationInsights(
  _v2Result: RevenueIntelligenceV2Result
): AdvancedIntelligenceV2Insight[] {
  // We do not run Lender Workflow v2 here (it requires application
  // inputs we do not have at this scope). Instead we surface the
  // version-lineage seal so reviewers can hand off to lender workflow
  // v2 for paired application-level review.
  return [
    {
      id: "ai-v2-lender-coordination-summary",
      domain: "lender_coordination_intelligence",
      title: "Lender coordination intelligence handoff",
      summary:
        "Lender Workflow v2 composition is application-scoped; see governance/lender-workflow-v2 for per-application briefings, queue posture, and per-customer-type top-5 Capital Graph-backed grant cards.",
      signals: [
        {
          signalId: "ai-v2-lender-runtime-version",
          label: "lender workflow v2 runtime version",
          value: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
          sourceRefs: ["lender-workflow-v2-runtime-v0.1.0"],
          authorityTier: "version-lineage",
        },
        {
          signalId: "ai-v2-opportunity-runtime-version",
          label: "opportunity discovery v2 runtime version",
          value: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
          sourceRefs: ["opportunity-discovery-v2-runtime-v0.1.0"],
          authorityTier: "version-lineage",
        },
      ],
      conflicts: [],
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: V2_DOMAIN_REVIEW_ROUTES.lender_coordination_intelligence,
      doctrineRefs: [
        "Vol III §Lender Coordination Intelligence — coordination-only composition",
        "Vol IV §Lender Coordination Review Route — review-bound coordination handoffs",
      ],
    },
  ];
}

const V2_INSIGHT_BUILDERS: Record<
  AdvancedIntelligenceV2DomainId,
  (v2Result: RevenueIntelligenceV2Result) => AdvancedIntelligenceV2Insight[]
> = {
  customer_type_intelligence: buildCustomerTypeInsights,
  capital_program_intelligence: buildCapitalProgramInsights,
  pathway_v2_intelligence: buildPathwayV2Insights,
  lender_coordination_intelligence: buildLenderCoordinationInsights,
};

function buildLegacyInput(
  input: AdvancedIntelligenceV2Input
): AdvancedIntelligenceInput {
  return {
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    scope: {
      domains: input.scope?.v1Domains,
      state: input.scope?.state ?? null,
      customerType: input.scope?.customerType ?? null,
    },
    metadata: input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  v2Result: RevenueIntelligenceV2Result,
  legacyResult: AdvancedIntelligenceResult
): AdvancedIntelligenceV2CrossSourceConflict[] {
  const conflicts: AdvancedIntelligenceV2CrossSourceConflict[] = [];

  if (
    v2Result.summary.customerProfileCount > 0 &&
    legacyResult.summary.insightCount === 0
  ) {
    conflicts.push({
      conflictId: "ai-v2-legacy-empty-coverage",
      topic:
        "Legacy v1 advanced intelligence returned zero insights while v2 stack returned matched customer profiles",
      description: `Canonical v2 stack composed ${v2Result.summary.customerProfileCount} customer profile(s) but the legacy v1 advanced intelligence returned ${legacyResult.summary.insightCount} insight(s); review whether the v1 source / revenue / market / geospatial / pathway registries require expansion.`,
      customerTypeId: null,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/advanced-intelligence-v2",
    });
  }

  if (
    v2Result.summary.customerProfileCount === 0 &&
    legacyResult.summary.insightCount > 0
  ) {
    conflicts.push({
      conflictId: "ai-v2-v2-empty-coverage",
      topic:
        "Canonical v2 stack returned no customer profiles while legacy v1 advanced intelligence produced insights",
      description: `Legacy v1 advanced intelligence returned ${legacyResult.summary.insightCount} insight(s) but the v2 stack returned no matched customer profiles; review whether the Customer Type Registry or Capital Graph require additional eligibility tokens, or whether the borrower context is incomplete.`,
      customerTypeId: null,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/advanced-intelligence-v2",
    });
  }

  if (v2Result.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "ai-v2-upstream-cross-source-conflicts",
      topic:
        "Upstream Revenue Intelligence v2 surfaced cross-source conflicts",
      description: `Revenue Intelligence v2 composition surfaced ${v2Result.summary.crossSourceConflictCount} cross-source conflict(s) (federation-scope mismatch, eligibility gap) that propagate into Advanced Intelligence v2 evidence; review with paired governance handoffs.`,
      customerTypeId: null,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/advanced-intelligence-v2",
    });
  }

  return conflicts;
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeAdvancedIntelligenceV2(
  input: AdvancedIntelligenceV2Input = {}
): AdvancedIntelligenceV2Result {
  // 1. Compose Revenue Intelligence v2 (which composes Customer
  //    Type Registry + Capital Graph + legacy revenue opportunity
  //    bridge). This is the smallest upstream context that surfaces
  //    customer-type composition; deeper layers (FPE v2, OD v2, LWF
  //    v2) are application-scoped and handed off separately.
  const v2Result: RevenueIntelligenceV2Result = composeRevenueIntelligenceV2({
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
          sovereignFederationAllowed:
            input.scope.sovereignFederationAllowed === true,
        }
      : null,
    metadata: input.metadata ?? null,
  });

  // 2. Compose legacy v1 advanced intelligence.
  const legacyResult = evaluateAdvancedIntelligence(buildLegacyInput(input));

  // 3. Build v2 governed insight domains.
  const requestedV2Domains: readonly AdvancedIntelligenceV2DomainId[] =
    input.scope?.v2Domains && input.scope.v2Domains.length > 0
      ? input.scope.v2Domains
      : V2_DOMAIN_IDS;

  const v2Domains: AdvancedIntelligenceV2DomainResult[] = requestedV2Domains
    .filter((id) => V2_DOMAIN_IDS.includes(id))
    .map((id) => {
      const insights = V2_INSIGHT_BUILDERS[id](v2Result);
      const conflictCount = insights.reduce(
        (sum, insight) => sum + insight.conflicts.length,
        0
      );
      return {
        id,
        label: V2_DOMAIN_LABELS[id],
        insights,
        conflictCount,
        reviewRoute: V2_DOMAIN_REVIEW_ROUTES[id],
      };
    });

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    v2Result,
    legacyResult
  );

  // 5. Summarize.
  const v2InsightCount = v2Domains.reduce(
    (sum, domain) => sum + domain.insights.length,
    0
  );
  const v2ConflictCount = v2Domains.reduce(
    (sum, domain) => sum + domain.conflictCount,
    0
  );

  const summary: AdvancedIntelligenceV2Summary = {
    v2DomainCount: v2Domains.length,
    v1DomainCount: legacyResult.domains.length,
    totalInsightCount: v2InsightCount + legacyResult.summary.insightCount,
    v2InsightCount,
    v1InsightCount: legacyResult.summary.insightCount,
    conflictCount: v2ConflictCount + legacyResult.summary.conflictCount,
    v2ConflictCount,
    v1ConflictCount: legacyResult.summary.conflictCount,
    crossSourceConflictCount: crossSourceConflicts.length,
    customerTypeCoverageCount: v2Result.summary.customerProfileCount,
    capitalProgramCoverageCount: v2Result.summary.totalComposedProgramCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/advanced-intelligence-v2",
    "/governance/lender-workflow-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
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
    runtimeVersion: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Domains,
    legacyDomains: legacyResult.domains,
    crossSourceConflicts,
    legacyBridge: {
      advancedIntelligenceVersion: ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
      legacyDomainCount: legacyResult.domains.length,
      legacyInsightCount: legacyResult.summary.insightCount,
      legacyConflictCount: legacyResult.summary.conflictCount,
      legacySourceAuthorityCount:
        legacyResult.summary.sourceAuthorityCount,
      legacyDisclosureCount: legacyResult.disclosures.length,
      lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version:
        OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...ADVANCED_INTELLIGENCE_V2_DISCLOSURES,
      ...ADVANCED_INTELLIGENCE_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...ADVANCED_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS,
      ...ADVANCED_INTELLIGENCE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    advancedIntelligenceV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
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

// Version-lineage helper chains v2 → Lender Workflow v2 →
// Opportunity Discovery v2 → Financing Pathway Engine v2 → Revenue
// Intelligence v2 → Customer Type → Capital Graph → legacy v1
// advanced intelligence.
export function advancedIntelligenceV2Lineage(): {
  runtimeVersion: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyAdvancedIntelligenceVersion: string;
  legacyV1DomainCount: number;
} {
  return {
    runtimeVersion: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyAdvancedIntelligenceVersion: ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
    legacyV1DomainCount: ADVANCED_INTELLIGENCE_DOMAIN_IDS.length,
  };
}

export const ADVANCED_INTELLIGENCE_V2_DOMAIN_IDS = V2_DOMAIN_IDS;
