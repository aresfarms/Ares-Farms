import { createHash } from "crypto";

import {
  ADVISORY_ONLY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";
import {
  GEO_SUITABILITY_PROFILES,
  MARKET_SIGNALS,
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
} from "@/lib/modules/sourceProgramCatalog";

export {
  GEO_SUITABILITY_PROFILES,
  MARKET_SIGNALS,
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
} from "@/lib/modules/sourceProgramCatalog";

/**
 * Revenue Source Intelligence Runtime
 *
 * Master Volume Governance:
 * - Vol I: Revenue, program, catalog, market, regulatory, and geospatial
 *   intelligence remains subordinate to constitutional governance.
 * - Vol II: Customer-facing outputs are advisory only and cannot become legal
 *   advice, program approval, lender commitment, underwriting evidence,
 *   guaranteed revenue, or official report content.
 * - Vol III: Every advisory signal preserves source lineage, replay refs,
 *   classification, assumptions, conflicts, jurisdiction, and customer type
 *   constraints.
 * - Vol III-B: Runtime, classification, observability, source authority,
 *   claims validation, and human review are explicit in every result.
 * - Vol IV: Source conflicts, stale signals, restricted categories, and
 *   uncertain program fits route to governed human review.
 * - Vol V: Source authority, replayability, claims governance,
 *   canonicalization, disclosure, and controlled use govern all outputs.
 *
 * Supplemental governing input:
 * - Ares Furlong Revenue Source Intelligence Doctrines.docx
 */

export const REVENUE_SOURCE_INTELLIGENCE_VERSION =
  "revenue-source-intelligence-runtime-v0.1.0";

export const REVENUE_SOURCE_INTELLIGENCE_SOURCES = [
  "Ares Furlong Revenue Source Intelligence Doctrines.docx",
] as const;

export type RevenueSourceActionInput = {
  actorId?: string | null;
  customerId?: string | null;
  customerType?: string | null;
  geographyScope?: string | null;
  revenueOpportunityId?: string | null;
  itemId?: string | null;
  programId?: string | null;
  liveSourceRefreshRequested?: boolean;
  productionUseRequested?: boolean;
  officialUseRequested?: boolean;
  legalAdviceRequested?: boolean;
  guaranteedClaimRequested?: boolean;
  payload?: Record<string, unknown>;
};

export type RevenueDispatchResult = {
  ok: boolean;
  action: string;
  result: Record<string, unknown>;
  blockedReasons: string[];
  disclosures: string[];
  productionBlocked: true;
  replayRequired: true;
  humanReviewRequired: true;
};

type SellableCatalogItem = {
  item_id: string;
  common_name: string;
  scientific_name?: string;
  category: string;
  allowed_regions: string[];
  restricted_regions: string[];
  suitable_climate_zones: string[];
  soil_requirements?: string[];
  water_requirements?: string[];
  growing_season?: string;
  production_cycle?: string;
  licensing_requirements: string[];
  program_eligibility_refs: string[];
  prohibited_customer_types?: string[];
  minor_operator_constraints?: string[];
  market_price_refs: string[];
  source_refs: string[];
  confidence_score: number;
  replay_refs: string[];
};

type MarketplaceItem = {
  marketplace_item_id: string;
  category: string;
  manufacturer?: string;
  model?: string;
  condition?: "new" | "used" | "refurbished" | "rental";
  price_range?: string;
  availability_region: string[];
  vendor_refs: string[];
  program_use_refs: string[];
  revenue_opportunity_refs: string[];
  source_refs: string[];
  last_verified_at: string;
  confidence_score: number;
  replay_refs: string[];
  price_basis:
    "list-price" | "estimated-price" | "used-market-price" | "quoted-price";
};

type OperatingCostSignal = {
  cost_signal_id: string;
  category: string;
  geography_scope: string;
  customer_type: string;
  price_range: string;
  source_refs: string[];
  effective_at: string;
  freshness_status: string;
  volatility_score?: number;
  replay_refs: string[];
  uncertainty_classification:
    "OBSERVED" | "ESTIMATE" | "FORECAST" | "USER_PROVIDED";
};

type StateRegulatoryRecord = {
  state_record_id: string;
  jurisdiction: string;
  regulatory_domain: string;
  affected_customer_types: string[];
  affected_products_or_services: string[];
  requirement_summary: string;
  source_refs: string[];
  effective_at?: string;
  expiration_or_review_date?: string;
  replay_refs: string[];
};

type CustomerTypeEligibilityProfile = {
  profile_id: string;
  customer_type: string;
  eligible_programs: string[];
  eligible_revenue_categories: string[];
  prohibited_or_restricted_categories: string[];
  required_documents: string[];
  licensing_constraints: string[];
  age_constraints?: string[];
  geography_constraints: string[];
  replay_refs: string[];
};

type AdvisoryFusionResult = {
  fusion_result_id: string;
  customer_id?: string;
  customer_type: string;
  geography_scope: string;
  opportunity_refs: string[];
  source_refs: string[];
  conflict_refs: string[];
  assumptions: string[];
  confidence_score: number;
  required_human_review: boolean;
  claims_profile: string;
  replay_refs: string[];
  facts_estimates_forecasts_assumptions: Record<string, string[]>;
};

const FIXED_RUNTIME_AT = "2026-05-25T00:00:00.000Z";

export const REVENUE_SOURCE_CATEGORIES = [
  "USDA specialty crop and program sources",
  "state agriculture and licensing sources",
  "county extension and land-grant university sources",
  "market and commodity pricing sources",
  "equipment, input, and supplier sources",
  "soil, weather, climate, water, and infrastructure sources",
  "state regulatory records and entity compliance sources",
  "philanthropic, nonprofit, and local program sources",
] as const;

export const SELLABLE_CATALOG: SellableCatalogItem[] = [
  {
    item_id: "item-cut-flowers",
    common_name: "Cut flowers",
    category: "flowers",
    allowed_regions: ["reviewed state/county regions"],
    restricted_regions: ["regions with invasive or nursery restrictions"],
    suitable_climate_zones: ["zone-review-required"],
    soil_requirements: ["drainage and organic matter review"],
    water_requirements: ["irrigation availability review"],
    growing_season: "regional frost-date dependent",
    production_cycle: "annual/perennial mix",
    licensing_requirements: [
      "nursery or sales licensing review may be required",
    ],
    program_eligibility_refs: ["prog-usda-specialty-crop"],
    prohibited_customer_types: [],
    minor_operator_constraints: ["guardian/consent and labor rules review"],
    market_price_refs: ["market-local-cut-flower"],
    source_refs: ["state-ag-crop-list", "extension-floriculture-guide"],
    confidence_score: 74,
    replay_refs: ["replay-item-cut-flowers-v0.1.0"],
  },
  {
    item_id: "item-honey",
    common_name: "Honey",
    category: "value-added products",
    allowed_regions: ["reviewed state/county regions"],
    restricted_regions: ["regions with apiary or processing restrictions"],
    suitable_climate_zones: ["pollinator suitability review required"],
    licensing_requirements: ["apiary, food handling, and labeling review"],
    program_eligibility_refs: ["prog-value-added-producer"],
    minor_operator_constraints: ["guardian/consent review"],
    market_price_refs: ["market-local-honey"],
    source_refs: ["state-apiary-source", "cottage-food-source"],
    confidence_score: 70,
    replay_refs: ["replay-item-honey-v0.1.0"],
  },
  {
    item_id: "item-greenhouse-herbs",
    common_name: "Greenhouse herbs",
    category: "greenhouse products",
    allowed_regions: ["state/county review"],
    restricted_regions: ["water or zoning constrained regions"],
    suitable_climate_zones: ["controlled-environment review"],
    water_requirements: ["water source and discharge review"],
    growing_season: "extended season",
    production_cycle: "short-cycle crop",
    licensing_requirements: ["business, nursery, and local rule review"],
    program_eligibility_refs: ["prog-state-ag-grant", "prog-energy-rebate"],
    market_price_refs: ["market-regional-herbs"],
    source_refs: ["extension-greenhouse-guide", "state-nursery-source"],
    confidence_score: 73,
    replay_refs: ["replay-item-greenhouse-herbs-v0.1.0"],
  },
];

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    marketplace_item_id: "marketplace-greenhouse-kit",
    category: "greenhouses",
    manufacturer: "vendor review required",
    condition: "new",
    price_range: "advisory vendor range",
    availability_region: ["regional supplier review required"],
    vendor_refs: ["supplier-greenhouse-registry"],
    program_use_refs: ["prog-energy-rebate", "prog-state-ag-grant"],
    revenue_opportunity_refs: ["rev-specialty-crop-market-garden"],
    source_refs: ["greenhouse-supplier-source"],
    last_verified_at: FIXED_RUNTIME_AT,
    confidence_score: 62,
    replay_refs: ["replay-marketplace-greenhouse-kit-v0.1.0"],
    price_basis: "estimated-price",
  },
  {
    marketplace_item_id: "marketplace-commercial-washer",
    category: "commercial laundry equipment",
    condition: "new",
    price_range: "advisory list range",
    availability_region: ["utility territory review required"],
    vendor_refs: ["supplier-laundry-equipment"],
    program_use_refs: ["prog-energy-rebate"],
    revenue_opportunity_refs: ["rev-rural-laundry-efficiency"],
    source_refs: ["laundry-equipment-source"],
    last_verified_at: FIXED_RUNTIME_AT,
    confidence_score: 60,
    replay_refs: ["replay-marketplace-commercial-washer-v0.1.0"],
    price_basis: "list-price",
  },
];

export const OPERATING_COST_SIGNALS: OperatingCostSignal[] = [
  {
    cost_signal_id: "cost-fertilizer-regional",
    category: "fertilizer",
    geography_scope: "regional",
    customer_type: "farmer",
    price_range: "advisory input range",
    source_refs: ["fertilizer-index-source"],
    effective_at: FIXED_RUNTIME_AT,
    freshness_status: "refresh-required-before-use",
    volatility_score: 77,
    replay_refs: ["replay-cost-fertilizer-regional-v0.1.0"],
    uncertainty_classification: "ESTIMATE",
  },
  {
    cost_signal_id: "cost-utility-laundry",
    category: "electricity",
    geography_scope: "utility territory",
    customer_type: "laundromat owner",
    price_range: "utility tariff review required",
    source_refs: ["utility-rate-source"],
    effective_at: FIXED_RUNTIME_AT,
    freshness_status: "review-required",
    volatility_score: 55,
    replay_refs: ["replay-cost-utility-laundry-v0.1.0"],
    uncertainty_classification: "ESTIMATE",
  },
];

export const STATE_REGULATORY_RECORDS: StateRegulatoryRecord[] = [
  {
    state_record_id: "state-cottage-food-review",
    jurisdiction: "state",
    regulatory_domain: "cottage food and value-added products",
    affected_customer_types: [
      "farmer",
      "rural business owner",
      "minor/youth operator",
    ],
    affected_products_or_services: [
      "honey",
      "jams",
      "sauces",
      "dried products",
    ],
    requirement_summary:
      "State and local food production, labeling, sales, and facility requirements require qualified review.",
    source_refs: ["state-cottage-food-source"],
    replay_refs: ["replay-state-cottage-food-review-v0.1.0"],
  },
  {
    state_record_id: "state-exotic-animal-review",
    jurisdiction: "state",
    regulatory_domain: "exotic animal and livestock restrictions",
    affected_customer_types: ["livestock operator", "minor/youth operator"],
    affected_products_or_services: ["specialty livestock", "exotics"],
    requirement_summary:
      "Restricted animals require jurisdictional licensing, animal welfare, and program compatibility review.",
    source_refs: ["state-livestock-source", "exotic-animal-source"],
    replay_refs: ["replay-state-exotic-animal-review-v0.1.0"],
  },
];

export const CUSTOMER_TYPE_ELIGIBILITY_PROFILES: CustomerTypeEligibilityProfile[] =
  [
    {
      profile_id: "profile-beginning-farmer",
      customer_type: "beginning farmer",
      eligible_programs: ["prog-usda-specialty-crop", "prog-state-ag-grant"],
      eligible_revenue_categories: [
        "specialty crops",
        "greenhouse products",
        "value-added products",
      ],
      prohibited_or_restricted_categories: [
        "restricted exotics",
        "unreviewed livestock",
      ],
      required_documents: [
        "identity",
        "entity",
        "property/control",
        "program documentation",
      ],
      licensing_constraints: ["state and local review required"],
      age_constraints: ["minor/youth posture requires guardian/consent review"],
      geography_constraints: ["state/county review required"],
      replay_refs: ["replay-profile-beginning-farmer-v0.1.0"],
    },
    {
      profile_id: "profile-laundromat-owner",
      customer_type: "laundromat owner",
      eligible_programs: ["prog-energy-rebate", "prog-sba-small-business"],
      eligible_revenue_categories: [
        "energy efficiency add-on",
        "equipment-supported business lines",
      ],
      prohibited_or_restricted_categories: ["unreviewed utility claims"],
      required_documents: [
        "entity",
        "utility account",
        "equipment quote or source reference",
      ],
      licensing_constraints: ["business licensing review required"],
      geography_constraints: ["state/utility territory review required"],
      replay_refs: ["replay-profile-laundromat-owner-v0.1.0"],
    },
  ];

export const ADVISORY_FUSION_RESULTS: AdvisoryFusionResult[] = [
  {
    fusion_result_id: "fusion-beginning-farmer-specialty-crops",
    customer_type: "beginning farmer",
    geography_scope: "state/county",
    opportunity_refs: ["rev-specialty-crop-market-garden"],
    source_refs: [
      "usda-specialty-crop",
      "state-ag-crop-list",
      "extension-crop-guide",
      "nrcs-soil-source",
    ],
    conflict_refs: ["state-cottage-food-review"],
    assumptions: [
      "Market demand, input cost, soil suitability, water availability, and program deadlines require refresh before use.",
    ],
    confidence_score: 66,
    required_human_review: true,
    claims_profile: "advisory-only",
    replay_refs: ["replay-fusion-beginning-farmer-specialty-crops-v0.1.0"],
    facts_estimates_forecasts_assumptions: {
      facts: ["source refs and program refs are preserved"],
      estimates: ["cost and revenue ranges are planning estimates"],
      forecasts: ["market direction requires refresh"],
      assumptions: ["jurisdictional restrictions require review"],
    },
  },
];

export const REVENUE_REQUIRED_SCHEMA_TABLES = [
  "customer_revenue_opportunity_registry",
  "sellable_catalog_items",
  "program_graph_nodes",
  "program_graph_edges",
  "program_stacking_rules",
  "program_conflict_rules",
  "marketplace_items",
  "supplier_registry",
  "marketplace_price_snapshots",
  "operating_cost_signals",
  "market_signal_registry",
  "market_signal_snapshots",
  "geospatial_source_registry",
  "geo_suitability_profiles",
  "state_regulatory_records",
  "customer_type_eligibility_profiles",
  "advisory_fusion_results",
  "revenue_claim_validation_events",
  "revenue_human_review_events",
  "revenue_source_lineage_records",
] as const;

export function hashRevenueSourceRecord(
  record: Record<string, unknown>,
): string {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

function controlledBlocks(input: RevenueSourceActionInput): string[] {
  const blockedReasons: string[] = [];

  if (input.liveSourceRefreshRequested) {
    blockedReasons.push(
      "live source refresh is blocked until connector promotion",
    );
  }

  if (input.productionUseRequested) {
    blockedReasons.push("production use is blocked until controlled promotion");
  }

  if (input.officialUseRequested) {
    blockedReasons.push(
      "official report, legal, financing, and program-use claims are blocked",
    );
  }

  if (input.legalAdviceRequested) {
    blockedReasons.push(
      "legal advice is blocked and must route to qualified review",
    );
  }

  if (input.guaranteedClaimRequested) {
    blockedReasons.push(
      "guaranteed revenue, program, or availability claims are blocked",
    );
  }

  return blockedReasons;
}

function envelope(
  action: string,
  input: RevenueSourceActionInput,
  result: Record<string, unknown>,
): RevenueDispatchResult {
  const blockedReasons = controlledBlocks(input);
  const claimEvaluation = evaluateContentClaims({
    text: [
      "Revenue intelligence is advisory planning support.",
      "Human review is pending.",
      "More information may be needed.",
      ADVISORY_ONLY_DISCLOSURE,
    ],
  });

  return {
    ok: blockedReasons.length === 0 && claimEvaluation.ok,
    action,
    result: {
      ...result,
      runtimeVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
      sourceDocuments: [...REVENUE_SOURCE_INTELLIGENCE_SOURCES],
      sourceCategories: [...REVENUE_SOURCE_CATEGORIES],
      productionRestrictions: [...REVENUE_PRODUCTION_RESTRICTIONS],
      claimEvaluation,
      candidateEvidenceOnly: true,
      advisoryOnly: true,
      reviewRequired: true,
      liveSourceRefreshAllowed: false,
    },
    blockedReasons: [
      ...blockedReasons,
      ...claimEvaluation.findings
        .filter((finding) => finding.severity === "BLOCK")
        .map((finding) => finding.code),
    ],
    disclosures: [...REVENUE_SOURCE_REQUIRED_DISCLOSURES],
    productionBlocked: true,
    replayRequired: true,
    humanReviewRequired: true,
  };
}

export function revenueOpportunities(input: RevenueSourceActionInput) {
  return envelope("revenue.opportunities", input, {
    opportunities: REVENUE_OPPORTUNITY_REGISTRY,
    requiredMappings: [
      "customer type",
      "geography",
      "source authority",
      "program fit basis",
      "operating requirements",
      "risk constraints",
    ],
  });
}

export function sellableCatalog(input: RevenueSourceActionInput) {
  return envelope("revenue.sellable-catalog", input, {
    catalog: SELLABLE_CATALOG,
    requiredWarnings: [
      "licensing review",
      "age and consent review",
      "animal handling review",
      "food safety review",
      "environmental and invasive restriction review",
    ],
  });
}

export function programGraph(input: RevenueSourceActionInput) {
  return envelope("revenue.program-graph", input, {
    programs: PROGRAM_GRAPH,
    graphControls: {
      stackingGovernedByRules: true,
      conflictRulesPreserved: true,
      deadlineRefreshRequired: true,
      aiInferenceAloneBlocked: true,
    },
  });
}

export function marketplaceIntel(input: RevenueSourceActionInput) {
  return envelope("revenue.marketplace-intel", input, {
    items: MARKETPLACE_ITEMS,
    pricingControls: [
      "list price",
      "estimated price",
      "used-market price",
      "quoted price",
      "price confidence",
    ],
  });
}

export function operatingCosts(input: RevenueSourceActionInput) {
  return envelope("revenue.operating-costs", input, {
    costSignals: OPERATING_COST_SIGNALS,
    uncertaintyControls: [
      "observed price",
      "estimated price",
      "forecasted price",
      "user-provided price",
    ],
  });
}

export function marketSignals(input: RevenueSourceActionInput) {
  return envelope("revenue.market-signals", input, {
    signals: MARKET_SIGNALS,
    marketControls: [
      "spot",
      "futures",
      "regional",
      "wholesale",
      "user-entered estimate",
    ],
  });
}

export function geospatialGovernance(input: RevenueSourceActionInput) {
  return envelope("revenue.geospatial-governance", input, {
    profiles: GEO_SUITABILITY_PROFILES,
    separationControls: [
      "soil",
      "weather",
      "climate",
      "water",
      "infrastructure",
    ],
  });
}

export function stateRegistry(input: RevenueSourceActionInput) {
  return envelope("revenue.state-registry", input, {
    records: STATE_REGULATORY_RECORDS,
    advisoryBoundary:
      "State regulatory findings are review-required orientation and are not legal advice.",
  });
}

export function customerTypeEligibility(input: RevenueSourceActionInput) {
  return envelope("revenue.customer-type-eligibility", input, {
    profiles: CUSTOMER_TYPE_ELIGIBILITY_PROFILES,
    fitControls: [
      "entity type",
      "age constraints",
      "geography",
      "use of proceeds",
      "documentation",
      "legal restrictions",
    ],
  });
}

export function advisoryFusion(input: RevenueSourceActionInput) {
  return envelope("revenue.data-fusion", input, {
    fusionResults: ADVISORY_FUSION_RESULTS,
    fusionControls: {
      sourceSeparability: true,
      conflictsPreserved: true,
      factsEstimatesForecastsAssumptionsSeparated: true,
      claimsValidationRequired: true,
    },
  });
}

export function revenueClaims(input: RevenueSourceActionInput) {
  return envelope("revenue.claims", input, {
    blockedClaimCategories: [...REVENUE_PRODUCTION_RESTRICTIONS],
    contentClaimsPolicy: "content-claims-policy-v0.1.0",
  });
}

export function customerRevenueModule(input: RevenueSourceActionInput) {
  return envelope("revenue.customer-module", input, {
    module: {
      route: "/customer-revenue",
      portalRoute: "/portal/revenue-opportunities",
      lenderRoute: "/lender/revenue-opportunities",
      sponsorRoute: "/sponsor/revenue-opportunities",
      boundaries: [
        "advisory opportunity intelligence only",
        "no guaranteed income claims",
        "no legal permissions",
        "no program approval claims",
        "no lender commitments",
      ],
      backendDependencies: [
        "REVENUE-INTEL-001",
        "SELLABLE-CATALOG-001",
        "PROGRAM-GRAPH-001",
        "MARKETPLACE-INTEL-001",
        "OPERATING-COST-GOV-001",
        "MARKET-SIGNAL-001",
        "GEOSPATIAL-GOV-001",
        "STATE-REGISTRY-001",
        "CUSTOMER-TYPE-ELIGIBILITY-001",
        "DATA-FUSION-001",
      ],
    },
    sampleFusion: ADVISORY_FUSION_RESULTS[0],
  });
}

export function dispatchRevenueSourceIntelligenceAction(
  action: string,
  input: RevenueSourceActionInput,
): RevenueDispatchResult {
  switch (action) {
    case "revenue.opportunities":
      return revenueOpportunities(input);
    case "revenue.sellable-catalog":
      return sellableCatalog(input);
    case "revenue.program-graph":
      return programGraph(input);
    case "revenue.marketplace-intel":
      return marketplaceIntel(input);
    case "revenue.operating-costs":
      return operatingCosts(input);
    case "revenue.market-signals":
      return marketSignals(input);
    case "revenue.geospatial-governance":
      return geospatialGovernance(input);
    case "revenue.state-registry":
      return stateRegistry(input);
    case "revenue.customer-type-eligibility":
      return customerTypeEligibility(input);
    case "revenue.data-fusion":
      return advisoryFusion(input);
    case "revenue.claims":
      return revenueClaims(input);
    case "revenue.customer-module":
      return customerRevenueModule(input);
    default:
      return envelope(action, input, {
        error: `Unknown revenue source intelligence action: ${action}`,
      });
  }
}
