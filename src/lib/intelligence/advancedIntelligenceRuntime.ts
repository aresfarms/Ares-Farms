import {
  GEO_SUITABILITY_PROFILES,
  MARKETPLACE_ITEMS,
  MARKET_SIGNALS,
  OPERATING_COST_SIGNALS,
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_SOURCE_INTELLIGENCE_VERSION,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";
import {
  SOURCE_AUTHORITY_REGISTRY,
  SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES,
  SOURCE_INTELLIGENCE_VERSION,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";

/**
 * Advanced Intelligence Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps advanced intelligence subordinate to constitutional
 *   authority; composed intelligence describes accountable advisory
 *   guidance and never replaces external review, public verification, or
 *   regulatory reliance.
 * - Vol II: blocks the runtime from claiming approval, eligibility,
 *   underwriting, credit decision, lender commitment, environmental
 *   clearance, payment authorization, official report publication, or
 *   legal reliance.
 * - Vol III: provides deterministic, replay-safe composition over source,
 *   revenue, market, geospatial, and pathway intelligence, with explicit
 *   conflict-preservation when canonical sources disagree.
 * - Vol III-B: supplies runtime evidence with version lineage,
 *   classification, observability, and explainability-ready posture.
 * - Vol IV: routes intelligence handoffs to the Revenue Opportunity
 *   Workspace, Property Discovery, Customer Revenue Review, Borrower
 *   Opportunity Discovery, Registry Framework, Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Audit Replay Console, Governance, and Reviews.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI-VII: keeps composed intelligence advisory; no portable external
 *   conformance or live execution claim is created.
 *
 * Safety boundary:
 * - Advanced intelligence output is advisory, replay-safe, and
 *   conflict-preserving.
 * - It does not create approval, eligibility, underwriting, credit
 *   decision, lender commitment, environmental clearance, payment
 *   authorization, official report publication, notice send, live
 *   external action, or legal reliance.
 * - When canonical sources disagree, both signals are preserved with
 *   their respective source authority tiers; the runtime never collapses
 *   conflicts into a single authoritative claim.
 */

export const ADVANCED_INTELLIGENCE_RUNTIME_VERSION =
  "advanced-intelligence-runtime-v0.1.0";

export type AdvancedIntelligenceDomainId =
  | "source_intelligence"
  | "revenue_intelligence"
  | "market_intelligence"
  | "geospatial_intelligence"
  | "pathway_intelligence";

export type AdvancedIntelligenceInsightSignal = {
  signalId: string;
  label: string;
  value: string;
  sourceRefs: string[];
  authorityTier?: string;
  confidenceScore?: number;
};

export type AdvancedIntelligenceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  competingSignals: AdvancedIntelligenceInsightSignal[];
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type AdvancedIntelligenceInsight = {
  id: string;
  domain: AdvancedIntelligenceDomainId;
  title: string;
  summary: string;
  signals: AdvancedIntelligenceInsightSignal[];
  conflicts: AdvancedIntelligenceConflict[];
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  advisoryOnly: true;
};

export type AdvancedIntelligenceDomainResult = {
  id: AdvancedIntelligenceDomainId;
  label: string;
  insights: AdvancedIntelligenceInsight[];
  conflictCount: number;
  reviewRoute: string;
};

export type AdvancedIntelligenceInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  scope?: {
    domains?: AdvancedIntelligenceDomainId[];
    state?: string | null;
    customerType?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type AdvancedIntelligenceSummary = {
  domainCount: number;
  insightCount: number;
  conflictCount: number;
  sourceAuthorityCount: number;
  reviewBoundEntryCount: number;
};

export type AdvancedIntelligenceResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  summary: AdvancedIntelligenceSummary;
  domains: AdvancedIntelligenceDomainResult[];
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  replaySafe: true;
  conflictPreserving: true;
  noApproval: true;
  noGuarantee: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "eligibility determination",
  "underwriting decision",
  "credit decision",
  "lender commitment",
  "guaranteed revenue",
  "public verification",
  "regulatory reliance",
  "environmental clearance",
  "payment authorization",
  "official report publication",
  "live external action",
  "legal reliance",
] as const;

export const ADVANCED_INTELLIGENCE_DISCLOSURES = [
  "Advanced intelligence output is advisory, replay-safe, and conflict-preserving.",
  "Advanced intelligence does not create approval, eligibility, underwriting, or credit decision.",
  "Advanced intelligence does not create a lender commitment, environmental clearance, or payment authorization.",
  "Advanced intelligence does not create public verification, regulatory reliance, or legal reliance.",
  "When canonical sources disagree, both signals are preserved with their respective source authority tiers; the runtime never collapses conflicts into a single authoritative claim.",
  "Human review is required before any intelligence signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ADVANCED_INTELLIGENCE_PRODUCTION_RESTRICTIONS = [
  "no approval",
  "no eligibility determination",
  "no underwriting decision",
  "no credit decision",
  "no lender commitment",
  "no guaranteed revenue",
  "no public verification",
  "no regulatory reliance",
  "no environmental clearance",
  "no payment authorization",
  "no official report publication",
  "no notice send",
  "no live external action",
  "no legal reliance",
] as const;

const DOMAIN_LABELS: Record<AdvancedIntelligenceDomainId, string> = {
  source_intelligence: "Source intelligence",
  revenue_intelligence: "Revenue intelligence",
  market_intelligence: "Market intelligence",
  geospatial_intelligence: "Geospatial intelligence",
  pathway_intelligence: "Pathway intelligence",
};

const DOMAIN_REVIEW_ROUTES: Record<AdvancedIntelligenceDomainId, string> = {
  source_intelligence: "/source-ingestion",
  revenue_intelligence: "/portal/revenue-opportunities",
  market_intelligence: "/portal/borrower/opportunities",
  geospatial_intelligence: "/portal/property-discovery",
  pathway_intelligence: "/financing-pathways",
};

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

function shouldIncludeDomain(
  id: AdvancedIntelligenceDomainId,
  scope: AdvancedIntelligenceInput["scope"]
): boolean {
  if (!scope || !Array.isArray(scope.domains) || scope.domains.length === 0) {
    return true;
  }

  return scope.domains.includes(id);
}

function buildSourceIntelligenceInsights(): AdvancedIntelligenceInsight[] {
  const grouped = new Map<string, typeof SOURCE_AUTHORITY_REGISTRY>();

  for (const source of SOURCE_AUTHORITY_REGISTRY) {
    const bucket = grouped.get(source.sourceAuthorityTier) ?? [];

    bucket.push(source);
    grouped.set(source.sourceAuthorityTier, bucket);
  }

  return Array.from(grouped.entries()).map(([tier, sources]) => {
    const certificationStatuses = unique(
      sources.map((source) => source.connectorCertificationStatus)
    );
    const conflicts: AdvancedIntelligenceConflict[] = [];

    if (certificationStatuses.length > 1) {
      conflicts.push({
        conflictId: `source-certification-mix-${tier}`,
        topic: `Source authority ${tier} certification mix`,
        description:
          "Sources at this authority tier currently report mixed certification statuses; human review required to interpret intelligence across them.",
        competingSignals: certificationStatuses.map((status) => ({
          signalId: `source-${tier}-${status}`,
          label: status,
          value: status,
          sourceRefs: sources
            .filter((source) => source.connectorCertificationStatus === status)
            .map((source) => source.sourceId),
          authorityTier: tier,
        })),
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: "/governance/connector-certification",
      });
    }

    return {
      id: `source-intel-${tier}`,
      domain: "source_intelligence" as AdvancedIntelligenceDomainId,
      title: `Source authority ${tier}`,
      summary: `${sources.length} canonical source(s) at authority tier ${tier}. Certification statuses preserved for human review.`,
      signals: sources.map((source) => ({
        signalId: source.sourceId,
        label: source.sourceName,
        value: source.connectorCertificationStatus,
        sourceRefs: [source.sourceVersion],
        authorityTier: source.sourceAuthorityTier,
        confidenceScore: source.provenanceScore,
      })),
      conflicts,
      reviewSignals: [
        "Source intelligence is advisory and review-bound.",
        "Source certification posture remains under qualified human review.",
      ],
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: "/source-ingestion",
      advisoryOnly: true,
    };
  });
}

function buildRevenueIntelligenceInsights(
  scope: AdvancedIntelligenceInput["scope"]
): AdvancedIntelligenceInsight[] {
  const customerType = scope?.customerType ?? null;
  const opportunities =
    customerType !== null
      ? REVENUE_OPPORTUNITY_REGISTRY.filter(
          (entry) => entry.customer_type === customerType
        )
      : REVENUE_OPPORTUNITY_REGISTRY;

  return opportunities.map((opportunity) => {
    const programSignals: AdvancedIntelligenceInsightSignal[] = (
      opportunity.program_refs ?? []
    ).map((programRef) => {
      const program = PROGRAM_GRAPH.find(
        (entry) => entry.program_id === programRef
      );

      return {
        signalId: programRef,
        label: program?.program_name ?? programRef,
        value: program?.sponsor_type ?? "sponsor review required",
        sourceRefs: program?.source_refs ?? [],
        confidenceScore: opportunity.confidence_score,
      };
    });

    const projectionSignal: AdvancedIntelligenceInsightSignal = {
      signalId: `revenue-projection-${opportunity.revenue_opportunity_id}`,
      label: "Projection basis",
      value: opportunity.projection_basis,
      sourceRefs: opportunity.source_refs,
      confidenceScore: opportunity.confidence_score,
    };

    return {
      id: opportunity.revenue_opportunity_id,
      domain: "revenue_intelligence" as AdvancedIntelligenceDomainId,
      title: `${opportunity.product_or_service_category} (${opportunity.customer_type})`,
      summary: `${opportunity.estimated_revenue_range}; ${opportunity.estimated_cost_range}. Projection basis: ${opportunity.projection_basis}.`,
      signals: [projectionSignal, ...programSignals],
      conflicts: [],
      reviewSignals: [
        "Revenue intelligence is advisory; estimates require human review.",
        "Numeric projections are not guaranteed revenue or credit decision.",
      ],
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: "/portal/revenue-opportunities",
      advisoryOnly: true,
    };
  });
}

function buildMarketIntelligenceInsights(): AdvancedIntelligenceInsight[] {
  const grouped = new Map<string, typeof MARKET_SIGNALS>();

  for (const signal of MARKET_SIGNALS) {
    const key = signal.commodity_or_category;
    const bucket = grouped.get(key) ?? [];

    bucket.push(signal);
    grouped.set(key, bucket);
  }

  return Array.from(grouped.entries()).map(([category, signals]) => {
    const trends = unique(signals.map((signal) => signal.trend_direction));
    const conflicts: AdvancedIntelligenceConflict[] = [];

    if (trends.length > 1) {
      conflicts.push({
        conflictId: `market-trend-mix-${category}`,
        topic: `Market trend mix for ${category}`,
        description:
          "Market signals for this category currently report differing trend directions; the runtime preserves both for human review.",
        competingSignals: trends.map((trend) => ({
          signalId: `market-${category}-${trend}`,
          label: `${trend} trend`,
          value: trend ?? "",
          sourceRefs: signals
            .filter((signal) => signal.trend_direction === trend)
            .flatMap((signal) => signal.source_refs),
        })),
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: "/portal/borrower/opportunities",
      });
    }

    const costContext = OPERATING_COST_SIGNALS.filter(
      (cost) =>
        cost.category.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(cost.category.toLowerCase())
    );

    const operatingCostSignals: AdvancedIntelligenceInsightSignal[] = costContext.map(
      (cost) => ({
        signalId: cost.cost_signal_id,
        label: `${cost.category} cost`,
        value: cost.price_range,
        sourceRefs: cost.source_refs,
        confidenceScore: cost.volatility_score,
      })
    );

    return {
      id: `market-intel-${category}`,
      domain: "market_intelligence" as AdvancedIntelligenceDomainId,
      title: category,
      summary: `${signals.length} market signal(s) and ${costContext.length} operating cost signal(s) preserved as advisory context.`,
      signals: [
        ...signals.map((signal) => ({
          signalId: signal.market_signal_id,
          label: `${signal.market_type} trend`,
          value: signal.trend_direction ?? "",
          sourceRefs: signal.source_refs,
          confidenceScore: signal.volatility_score,
        })),
        ...operatingCostSignals,
      ],
      conflicts,
      reviewSignals: [
        "Market intelligence is advisory; no live market fetch is performed.",
        "Operating cost signals require review for jurisdiction and freshness before reliance.",
      ],
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: "/portal/borrower/opportunities",
      advisoryOnly: true,
    };
  });
}

function buildGeospatialIntelligenceInsights(
  scope: AdvancedIntelligenceInput["scope"]
): AdvancedIntelligenceInsight[] {
  return GEO_SUITABILITY_PROFILES.map((profile) => {
    const suitabilityEntries = Object.entries(profile.suitability_scores);
    const conflicts: AdvancedIntelligenceConflict[] = [];

    if (suitabilityEntries.length > 1) {
      const max = Math.max(
        ...suitabilityEntries.map(([, score]) => score as number)
      );
      const min = Math.min(
        ...suitabilityEntries.map(([, score]) => score as number)
      );

      if (max - min >= 10) {
        conflicts.push({
          conflictId: `geo-suitability-spread-${profile.geo_profile_id}`,
          topic: `Suitability spread for ${profile.geo_profile_id}`,
          description:
            "Suitability scores within this profile span a meaningful range; conflicting scores preserved for human review.",
          competingSignals: suitabilityEntries.map(([category, score]) => ({
            signalId: `geo-${profile.geo_profile_id}-${category}`,
            label: `${category} suitability`,
            value: `${score}`,
            sourceRefs: profile.source_refs,
            confidenceScore: score as number,
          })),
          resolution: "REQUIRES_HUMAN_REVIEW",
          reviewRoute: "/portal/property-discovery",
        });
      }
    }

    const stateContext = scope?.state ?? null;
    const reviewSignals: string[] = [
      "Geospatial intelligence is advisory and not a property certification.",
    ];

    if (stateContext) {
      reviewSignals.push(
        `Geography scope (${profile.geography_scope}) may apply to disclosed state ${stateContext}.`
      );
    }

    return {
      id: profile.geo_profile_id,
      domain: "geospatial_intelligence" as AdvancedIntelligenceDomainId,
      title: profile.geo_profile_id,
      summary: `Suitability scores across ${suitabilityEntries.length} category(ies); ${profile.weighting_assumptions.length} weighting assumption(s) preserved.`,
      signals: suitabilityEntries.map(([category, score]) => ({
        signalId: `${profile.geo_profile_id}-${category}`,
        label: category,
        value: `${score}`,
        sourceRefs: profile.source_refs,
        confidenceScore: score as number,
      })),
      conflicts,
      reviewSignals,
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: "/portal/property-discovery",
      advisoryOnly: true,
    };
  });
}

function buildPathwayIntelligenceInsights(): AdvancedIntelligenceInsight[] {
  return PROGRAM_GRAPH.map((program) => {
    const conflicts: AdvancedIntelligenceConflict[] = [];

    if (
      program.stacking_rules.length > 0 ||
      program.conflict_rules.length > 0
    ) {
      conflicts.push({
        conflictId: `pathway-rule-conflict-${program.program_id}`,
        topic: `Pathway rule context for ${program.program_name}`,
        description:
          "Stacking and conflict rules require human review before any pathway reliance.",
        competingSignals: [
          ...program.stacking_rules.map((rule) => ({
            signalId: `${program.program_id}-stacking`,
            label: "Stacking rule",
            value: rule,
            sourceRefs: program.source_refs,
          })),
          ...program.conflict_rules.map((rule) => ({
            signalId: `${program.program_id}-conflict`,
            label: "Conflict rule",
            value: rule,
            sourceRefs: program.source_refs,
          })),
        ],
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: "/financing-pathways",
      });
    }

    const marketplaceLinkSignals = MARKETPLACE_ITEMS.filter((item) =>
      item.program_use_refs?.includes(program.program_id)
    ).map((item) => ({
      signalId: item.marketplace_item_id,
      label: item.category,
      value: item.price_range ?? "",
      sourceRefs: item.source_refs,
      confidenceScore: item.confidence_score,
    }));

    const revenueLinkSignals = REVENUE_OPPORTUNITY_REGISTRY.filter((entry) =>
      entry.program_refs?.includes(program.program_id)
    ).map((entry) => ({
      signalId: entry.revenue_opportunity_id,
      label: entry.product_or_service_category,
      value: entry.estimated_revenue_range ?? "",
      sourceRefs: entry.source_refs,
      confidenceScore: entry.confidence_score,
    }));

    return {
      id: program.program_id,
      domain: "pathway_intelligence" as AdvancedIntelligenceDomainId,
      title: program.program_name,
      summary: `${program.sponsor_type} program — ${program.eligible_uses
        .slice(0, 2)
        .join(", ")}; ${marketplaceLinkSignals.length} marketplace link(s), ${revenueLinkSignals.length} revenue link(s).`,
      signals: [
        ...marketplaceLinkSignals,
        ...revenueLinkSignals,
      ],
      conflicts,
      reviewSignals: [
        "Pathway intelligence is advisory; program approval remains blocked.",
        "Deadlines, stacking rules, and conflict rules require human review before reliance.",
      ],
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      reviewRoute: "/financing-pathways",
      advisoryOnly: true,
    };
  });
}

const DOMAIN_BUILDERS: Record<
  AdvancedIntelligenceDomainId,
  (scope: AdvancedIntelligenceInput["scope"]) => AdvancedIntelligenceInsight[]
> = {
  source_intelligence: () => buildSourceIntelligenceInsights(),
  revenue_intelligence: (scope) => buildRevenueIntelligenceInsights(scope),
  market_intelligence: () => buildMarketIntelligenceInsights(),
  geospatial_intelligence: (scope) =>
    buildGeospatialIntelligenceInsights(scope),
  pathway_intelligence: () => buildPathwayIntelligenceInsights(),
};

export function evaluateAdvancedIntelligence(
  input: AdvancedIntelligenceInput = {}
): AdvancedIntelligenceResult {
  const scope = input.scope ?? null;
  const domainIds: AdvancedIntelligenceDomainId[] = (
    [
      "source_intelligence",
      "revenue_intelligence",
      "market_intelligence",
      "geospatial_intelligence",
      "pathway_intelligence",
    ] as AdvancedIntelligenceDomainId[]
  ).filter((id) => shouldIncludeDomain(id, scope));

  const domains: AdvancedIntelligenceDomainResult[] = domainIds.map((id) => {
    const insights = DOMAIN_BUILDERS[id](scope);
    const conflictCount = insights.reduce(
      (sum, insight) => sum + insight.conflicts.length,
      0
    );

    return {
      id,
      label: DOMAIN_LABELS[id],
      insights,
      conflictCount,
      reviewRoute: DOMAIN_REVIEW_ROUTES[id],
    };
  });

  const insightCount = domains.reduce(
    (sum, domain) => sum + domain.insights.length,
    0
  );
  const conflictCount = domains.reduce(
    (sum, domain) => sum + domain.conflictCount,
    0
  );

  const summary: AdvancedIntelligenceSummary = {
    domainCount: domains.length,
    insightCount,
    conflictCount,
    sourceAuthorityCount: SOURCE_AUTHORITY_REGISTRY.length,
    reviewBoundEntryCount: insightCount,
  };

  const recommendedReviewRoutes = unique([
    ...domains.map((domain) => domain.reviewRoute),
    "/governance/registry-framework",
    "/governance/certification-engine",
    "/governance/evidence-engine",
    "/evidence-packets",
    "/audit-replay",
    "/governance",
    "/reviews",
  ]);

  return {
    runtimeVersion: ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    summary,
    domains,
    recommendedReviewRoutes,
    disclosures: unique([
      ...ADVANCED_INTELLIGENCE_DISCLOSURES,
      ...REVENUE_SOURCE_REQUIRED_DISCLOSURES,
      ...SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...ADVANCED_INTELLIGENCE_PRODUCTION_RESTRICTIONS,
      ...REVENUE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    replaySafe: true,
    conflictPreserving: true,
    noApproval: true,
    noGuarantee: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
  };
}

export const ADVANCED_INTELLIGENCE_DOMAIN_IDS: AdvancedIntelligenceDomainId[] = [
  "source_intelligence",
  "revenue_intelligence",
  "market_intelligence",
  "geospatial_intelligence",
  "pathway_intelligence",
];

// Touch the canonical version refs so advanced intelligence stays
// version-locked to its upstream runtimes.
export function advancedIntelligenceLineage(): {
  revenueSourceIntelligenceVersion: string;
  sourceIntelligenceVersion: string;
} {
  return {
    revenueSourceIntelligenceVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
    sourceIntelligenceVersion: SOURCE_INTELLIGENCE_VERSION,
  };
}
