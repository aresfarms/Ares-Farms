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
  SELLABLE_CATALOG,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";
import {
  PROPERTY_DISCOVERY_DISCLOSURES,
  propertyDiscovery,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";

/**
 * Borrower Opportunity Discovery Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps opportunity discovery subordinate to constitutional authority
 *   and accountable human review.
 * - Vol II: blocks discovery from becoming approval, eligibility, guaranteed
 *   revenue, program approval, legal permission, lender commitment, payment
 *   capture, official report publication, or any regulatory or legal reliance.
 * - Vol III: provides deterministic, replay-safe composition across the
 *   program graph, marketplace, market signals, operating costs, geo
 *   suitability profiles, revenue opportunity registry, sellable catalog,
 *   and property discovery source stack.
 * - Vol III-B: supplies classification-, version-, observability-, and
 *   explainability-ready posture for runtime evidence.
 * - Vol IV: routes borrower handoffs to revenue opportunities, property
 *   discovery, financing pathways, readiness, applications, documents, and
 *   data-rights surfaces.
 * - Vol V: preserves claims controls, source authority, replay, controlled
 *   disclosure, conformance, and live-fetch blocks.
 * - Vol VI-VII: keeps the surface as a portable governed module with a
 *   public-safe translation layer for discovery output.
 *
 * Safety boundary:
 * - Discovery is advisory intelligence only.
 * - It does not perform a live source fetch, claim source certainty,
 *   guarantee revenue, approve a program, grant a permit, certify a property,
 *   commit a lender, capture a payment, send a notice, or authorize a
 *   regulatory or legal reliance.
 */

export const OPPORTUNITY_DISCOVERY_RUNTIME_VERSION =
  "opportunity-discovery-runtime-v0.1.0";

export type OpportunityKind =
  | "grants_and_programs"
  | "revenue_opportunities"
  | "equipment_and_marketplace"
  | "market_context"
  | "geo_suitability"
  | "sellable_catalog"
  | "property_discovery"
  | "operating_costs";

export type OpportunityDiscoveryInput = {
  borrowerId?: string | null;
  applicationId?: string | null;
  userId?: string | null;
  location?: {
    country?: string | null;
    state?: string | null;
    county?: string | null;
  } | null;
  customerTypes?: string[];
  farmTypes?: string[];
  goals?: string[];
  interests?: {
    grants?: boolean;
    properties?: boolean;
    equipment?: boolean;
    marketContext?: boolean;
    revenueOpportunities?: boolean;
    soilAnalysis?: boolean;
    commodityIntelligence?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type OpportunityCard = {
  id: string;
  kind: OpportunityKind;
  title: string;
  summary: string;
  sponsorOrSourceType?: string;
  category?: string;
  geographyScope?: string;
  confidenceScore?: number;
  fitReasons: string[];
  blockedClaims: string[];
  sourceRefs: string[];
  replayRefs: string[];
  reviewRoute: string;
  advisoryOnly: true;
};

export type OpportunityDiscoverySection = {
  id: OpportunityKind;
  label: string;
  cards: OpportunityCard[];
  reviewSignals: string[];
  reviewRoute: string;
};

export type OpportunityDiscoveryHandoff = {
  id: string;
  label: string;
  route: string;
  status: "pending-review" | "needs-input";
  reason: string;
};

export type OpportunityDiscoveryResult = {
  runtimeVersion: string;
  generatedAt: string;
  sections: OpportunityDiscoverySection[];
  totalOpportunityCount: number;
  handoffs: OpportunityDiscoveryHandoff[];
  recommendedNextRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  liveFetchPerformed: false;
  noSourceCertainty: true;
  noGuaranteedRevenue: true;
  noProgramApproval: true;
  noLegalOrRegulatoryReliance: true;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "guaranteed revenue",
  "program approval",
  "legal permission",
  "lender commitment",
  "underwriting reliance",
  "source certainty",
  "official property certification",
  "live external action",
] as const;

export const OPPORTUNITY_DISCOVERY_DISCLOSURES = [
  "Opportunity discovery is advisory only.",
  "Opportunity discovery does not perform a live external source fetch.",
  "Opportunity discovery does not claim source certainty.",
  "Opportunity discovery does not guarantee revenue.",
  "Opportunity discovery does not approve a program.",
  "Opportunity discovery does not grant a permit or legal permission.",
  "Opportunity discovery does not certify a property.",
  "Opportunity discovery does not commit a lender.",
  "Opportunity discovery does not authorize legal or regulatory reliance.",
  "Opportunity discovery does not authorize payment capture or notice sending.",
  "Human review is required before any opportunity is treated as a decision.",
  "Discovery outputs reflect translation-layer summaries and are not raw records.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function lowerSet(values: string[] | undefined): Set<string> {
  if (!Array.isArray(values)) {
    return new Set();
  }

  return new Set(
    values
      .filter((value) => typeof value === "string")
      .map((value) => value.toLowerCase())
  );
}

function locationFitReason(
  geographyScope: string | string[] | undefined,
  state: string | null | undefined
): string | null {
  if (!hasText(state)) {
    return null;
  }

  if (Array.isArray(geographyScope) && geographyScope.length > 0) {
    return `Geography scope (${geographyScope.join(
      ", "
    )}) may apply to disclosed state ${state}.`;
  }

  if (typeof geographyScope === "string" && hasText(geographyScope)) {
    return `Geography scope (${geographyScope}) may apply to disclosed state ${state}.`;
  }

  return null;
}

function buildGrantsAndProgramsSection(
  input: OpportunityDiscoveryInput
): OpportunityDiscoverySection {
  const goalSet = lowerSet(input.goals);
  const customerSet = lowerSet(input.customerTypes);
  const cards: OpportunityCard[] = PROGRAM_GRAPH.map((program) => {
    const reasons: string[] = [
      `${program.sponsor_type} program source requires governed program review.`,
    ];

    if (program.stacking_rules.length > 0) {
      reasons.push("Stacking rules require review before combining pathways.");
    }

    if (program.conflict_rules.length > 0) {
      reasons.push("Conflict rules require review before borrower-facing reliance.");
    }

    const locationReason = locationFitReason(
      program.geography_scope,
      input.location?.state ?? null
    );

    if (locationReason) {
      reasons.push(locationReason);
    }

    if (
      customerSet.size > 0 &&
      program.eligible_customer_types.some((customerType) =>
        customerSet.has(customerType.toLowerCase())
      )
    ) {
      reasons.push("Borrower customer type matches an eligible program customer type.");
    }

    if (
      goalSet.size > 0 &&
      program.eligible_uses.some((use) => {
        const lowered = use.toLowerCase();

        return Array.from(goalSet).some(
          (goal) => lowered.includes(goal) || goal.includes("expansion") || goal.includes("sustainability")
        );
      })
    ) {
      reasons.push("Borrower goal aligns with an eligible program use.");
    }

    return {
      id: program.program_id,
      kind: "grants_and_programs",
      title: program.program_name,
      summary: `${program.sponsor_type} program source — ${program.eligible_uses
        .slice(0, 2)
        .join(", ")}.`,
      sponsorOrSourceType: program.sponsor_type,
      geographyScope: program.geography_scope.join(", "),
      fitReasons: unique(reasons),
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      sourceRefs: [...program.source_refs],
      replayRefs: [...program.replay_refs],
      reviewRoute: "/portal/revenue-opportunities",
      advisoryOnly: true,
    };
  });

  return {
    id: "grants_and_programs",
    label: "Grants and programs",
    cards,
    reviewSignals: [
      "Program sources require human review before reliance.",
      "Deadline, stacking, and conflict rules must be reviewed before borrower-facing presentation.",
    ],
    reviewRoute: "/portal/revenue-opportunities",
  };
}

function buildRevenueOpportunitiesSection(
  input: OpportunityDiscoveryInput
): OpportunityDiscoverySection {
  const customerSet = lowerSet(input.customerTypes);
  const cards: OpportunityCard[] = REVENUE_OPPORTUNITY_REGISTRY.map(
    (opportunity) => {
      const reasons: string[] = [
        `${opportunity.customer_type} revenue pathway requires governed advisory review.`,
        `Projection basis is ${opportunity.projection_basis}; numerical claims remain advisory.`,
      ];

      if (customerSet.has(opportunity.customer_type.toLowerCase())) {
        reasons.push("Borrower customer type matches an eligible opportunity customer type.");
      }

      const locationReason = locationFitReason(
        opportunity.geography_scope,
        input.location?.state ?? null
      );

      if (locationReason) {
        reasons.push(locationReason);
      }

      return {
        id: opportunity.revenue_opportunity_id,
        kind: "revenue_opportunities",
        title: `${opportunity.product_or_service_category} (${opportunity.customer_type})`,
        summary: `${opportunity.estimated_revenue_range}; ${opportunity.estimated_cost_range}.`,
        sponsorOrSourceType: opportunity.customer_type,
        category: opportunity.product_or_service_category,
        geographyScope: opportunity.geography_scope,
        confidenceScore: opportunity.confidence_score,
        fitReasons: unique(reasons),
        blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
        sourceRefs: [...opportunity.source_refs],
        replayRefs: [...opportunity.replay_refs],
        reviewRoute: "/portal/revenue-opportunities",
        advisoryOnly: true,
      };
    }
  );

  return {
    id: "revenue_opportunities",
    label: "Revenue opportunities",
    cards,
    reviewSignals: [
      "Revenue opportunities are advisory pathway summaries only.",
      "Estimated revenue and cost ranges remain advisory and require human review.",
    ],
    reviewRoute: "/portal/revenue-opportunities",
  };
}

function buildEquipmentAndMarketplaceSection(): OpportunityDiscoverySection {
  const cards: OpportunityCard[] = MARKETPLACE_ITEMS.map((item) => ({
    id: item.marketplace_item_id,
    kind: "equipment_and_marketplace",
    title: item.category,
    summary: `${item.condition} — ${item.price_range}; basis ${item.price_basis}.`,
    sponsorOrSourceType: item.manufacturer ?? "vendor review required",
    category: item.category,
    confidenceScore: item.confidence_score,
    fitReasons: [
      "Marketplace equipment is shown for borrower planning only.",
      "Pricing remains advisory and requires vendor and source review.",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    sourceRefs: [...item.source_refs],
    replayRefs: [...item.replay_refs],
    reviewRoute: "/portal/revenue-opportunities",
    advisoryOnly: true,
  }));

  return {
    id: "equipment_and_marketplace",
    label: "Equipment and marketplace",
    cards,
    reviewSignals: [
      "Equipment and marketplace listings are advisory summaries only.",
      "Vendor engagement requires governed review and is not authorized by discovery.",
    ],
    reviewRoute: "/portal/revenue-opportunities",
  };
}

function buildMarketContextSection(): OpportunityDiscoverySection {
  const cards: OpportunityCard[] = MARKET_SIGNALS.map((signal) => ({
    id: signal.market_signal_id,
    kind: "market_context",
    title: signal.commodity_or_category,
    summary: `${signal.market_type} — trend ${signal.trend_direction}; volatility ${signal.volatility_score}.`,
    sponsorOrSourceType: signal.signal_basis,
    geographyScope: signal.geography_scope,
    fitReasons: [
      "Market signals are advisory context only and require human review before reliance.",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    sourceRefs: [...signal.source_refs],
    replayRefs: [...signal.replay_refs],
    reviewRoute: "/portal/revenue-opportunities",
    advisoryOnly: true,
  }));

  return {
    id: "market_context",
    label: "Market context",
    cards,
    reviewSignals: [
      "Market context summaries reflect translation-layer advisory state only.",
      "No live market fetch is performed by discovery.",
    ],
    reviewRoute: "/portal/revenue-opportunities",
  };
}

function buildGeoSuitabilitySection(
  input: OpportunityDiscoveryInput
): OpportunityDiscoverySection {
  const cards: OpportunityCard[] = GEO_SUITABILITY_PROFILES.map((profile) => {
    const reasons: string[] = [
      "Geo suitability profiles are advisory planning summaries only.",
    ];
    const locationReason = locationFitReason(
      profile.geography_scope,
      input.location?.state ?? null
    );

    if (locationReason) {
      reasons.push(locationReason);
    }

    const suitabilityEntries = Object.entries(profile.suitability_scores);
    const topSuitability = suitabilityEntries
      .slice()
      .sort((a, b) => b[1] - a[1])[0];

    return {
      id: profile.geo_profile_id,
      kind: "geo_suitability",
      title: profile.geo_profile_id,
      summary: topSuitability
        ? `Top suitability ${topSuitability[0]} (${topSuitability[1]}); review required.`
        : "Suitability summary review required.",
      geographyScope: profile.geography_scope,
      confidenceScore: topSuitability ? topSuitability[1] : undefined,
      fitReasons: unique(reasons),
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      sourceRefs: [...profile.source_refs],
      replayRefs: [...profile.replay_refs],
      reviewRoute: "/portal/property-discovery",
      advisoryOnly: true,
    };
  });

  return {
    id: "geo_suitability",
    label: "Geo suitability",
    cards,
    reviewSignals: [
      "Geo suitability profiles are advisory and not a property certification.",
    ],
    reviewRoute: "/portal/property-discovery",
  };
}

function buildSellableCatalogSection(
  input: OpportunityDiscoveryInput
): OpportunityDiscoverySection {
  const farmTypeSet = lowerSet(input.farmTypes);
  const cards: OpportunityCard[] = SELLABLE_CATALOG.map((item) => {
    const reasons: string[] = [
      "Sellable catalog items are advisory planning summaries only.",
    ];

    if (
      farmTypeSet.size > 0 &&
      Array.from(farmTypeSet).some(
        (farmType) =>
          item.category.toLowerCase().includes(farmType) ||
          item.common_name.toLowerCase().includes(farmType)
      )
    ) {
      reasons.push("Borrower farm type aligns with a catalog item category.");
    }

    return {
      id: item.item_id,
      kind: "sellable_catalog",
      title: item.common_name,
      summary: `${item.category} — licensing ${
        item.licensing_requirements.length > 0
          ? item.licensing_requirements.join(", ")
          : "review-required"
      }.`,
      category: item.category,
      confidenceScore: item.confidence_score,
      fitReasons: unique(reasons),
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
      sourceRefs: [...item.source_refs],
      replayRefs: [...item.replay_refs],
      reviewRoute: "/portal/revenue-opportunities",
      advisoryOnly: true,
    };
  });

  return {
    id: "sellable_catalog",
    label: "Sellable catalog",
    cards,
    reviewSignals: [
      "Sellable catalog reflects advisory planning context only.",
      "Licensing and regional restrictions require governed review.",
    ],
    reviewRoute: "/portal/revenue-opportunities",
  };
}

function buildPropertyDiscoverySection(
  input: OpportunityDiscoveryInput
): OpportunityDiscoverySection {
  const discovery = propertyDiscovery({
    jurisdictionScope: input.location?.state ?? null,
  });
  const sources = Array.isArray(discovery.sources)
    ? (discovery.sources as Array<{
        sourceId: string;
        sourceName: string;
        authorityTier: string;
        useBoundary?: string;
      }>)
    : [];

  const cards: OpportunityCard[] = sources.map((source) => ({
    id: source.sourceId,
    kind: "property_discovery",
    title: source.sourceName,
    summary: `Authority tier ${source.authorityTier}. Use boundary: ${
      source.useBoundary ?? "advisory only"
    }.`,
    sponsorOrSourceType: source.authorityTier,
    fitReasons: [
      "Property discovery sources are advisory and not authoritative.",
      "Live fetch is not performed by discovery.",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    sourceRefs: [source.sourceId],
    replayRefs: [`property-discovery-replay-${source.sourceId}`],
    reviewRoute: "/portal/property-discovery",
    advisoryOnly: true,
  }));

  return {
    id: "property_discovery",
    label: "Property discovery",
    cards,
    reviewSignals: [
      "Property discovery sources are advisory and not authoritative.",
      "No live fetch is performed by discovery.",
    ],
    reviewRoute: "/portal/property-discovery",
  };
}

function buildOperatingCostsSection(): OpportunityDiscoverySection {
  const cards: OpportunityCard[] = OPERATING_COST_SIGNALS.map((cost) => ({
    id: cost.cost_signal_id,
    kind: "operating_costs",
    title: cost.category,
    summary: `${cost.price_range} (geography ${cost.geography_scope}; freshness ${cost.freshness_status}).`,
    category: cost.category,
    geographyScope: cost.geography_scope,
    confidenceScore: cost.volatility_score,
    fitReasons: [
      "Operating cost signals are advisory planning context only.",
      "Pricing remains advisory and requires source review before reliance.",
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    sourceRefs: [...cost.source_refs],
    replayRefs: [...cost.replay_refs],
    reviewRoute: "/portal/revenue-opportunities",
    advisoryOnly: true,
  }));

  return {
    id: "operating_costs",
    label: "Operating costs",
    cards,
    reviewSignals: [
      "Operating cost signals are advisory and not a quoted price.",
    ],
    reviewRoute: "/portal/revenue-opportunities",
  };
}

function buildHandoffs(
  input: OpportunityDiscoveryInput,
  totalOpportunityCount: number
): OpportunityDiscoveryHandoff[] {
  const status: OpportunityDiscoveryHandoff["status"] =
    totalOpportunityCount === 0 ? "needs-input" : "pending-review";

  return [
    {
      id: "revenue-opportunities",
      label: "Revenue opportunities review",
      route: "/portal/revenue-opportunities",
      status,
      reason:
        "Borrower-safe revenue opportunity translation layer for advisory review.",
    },
    {
      id: "property-discovery",
      label: "Property discovery review",
      route: "/portal/property-discovery",
      status,
      reason:
        "Borrower-safe property discovery translation layer for advisory review.",
    },
    {
      id: "financing-pathways",
      label: "Financing pathway guidance",
      route: "/financing-pathways",
      status: "pending-review",
      reason:
        "Discovery context can be reviewed alongside borrower financing pathway guidance.",
    },
    {
      id: "readiness",
      label: "Readiness assessment",
      route: "/readiness",
      status: "pending-review",
      reason:
        "Discovery activity feeds the borrower readiness assessment as advisory context.",
    },
    {
      id: "applications",
      label: "Application status",
      route: "/portal/borrower/applications",
      status: "pending-review",
      reason:
        "Application status reflects discovery posture through governed review handoffs.",
    },
    {
      id: "data-rights",
      label: "Data rights",
      route: "/portal/borrower/data-rights",
      status: "pending-review",
      reason:
        "Borrower retains data portability and access rights across discovery review.",
    },
  ];
}

export function evaluateOpportunityDiscovery(
  input: OpportunityDiscoveryInput = {}
): OpportunityDiscoveryResult {
  const sections: OpportunityDiscoverySection[] = [
    buildGrantsAndProgramsSection(input),
    buildRevenueOpportunitiesSection(input),
    buildEquipmentAndMarketplaceSection(),
    buildMarketContextSection(),
    buildGeoSuitabilitySection(input),
    buildSellableCatalogSection(input),
    buildPropertyDiscoverySection(input),
    buildOperatingCostsSection(),
  ];

  const totalOpportunityCount = sections.reduce(
    (sum, section) => sum + section.cards.length,
    0
  );
  const handoffs = buildHandoffs(input, totalOpportunityCount);
  const recommendedNextRoutes = unique(handoffs.map((handoff) => handoff.route));

  return {
    runtimeVersion: OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    sections,
    totalOpportunityCount,
    handoffs,
    recommendedNextRoutes,
    disclosures: unique([
      ...OPPORTUNITY_DISCOVERY_DISCLOSURES,
      ...REVENUE_SOURCE_REQUIRED_DISCLOSURES,
      ...PROPERTY_DISCOVERY_DISCLOSURES,
    ]),
    productionRestrictions: unique([...REVENUE_PRODUCTION_RESTRICTIONS]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    liveFetchPerformed: false,
    noSourceCertainty: true,
    noGuaranteedRevenue: true,
    noProgramApproval: true,
    noLegalOrRegulatoryReliance: true,
  };
}

export const OPPORTUNITY_DISCOVERY_VERSION_REFS = {
  runtime: OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
  revenueIntelligence: REVENUE_SOURCE_INTELLIGENCE_VERSION,
} as const;
