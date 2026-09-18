import { ADVISORY_ONLY_DISCLOSURE } from "@/lib/governance/contentClaimsPolicy";

/**
 * Neutral source/program catalog contract shared by independently deployable
 * Source Intelligence and Financing Intelligence modules. This file owns only
 * replay-safe catalog data and DTO types; it performs no module orchestration.
 */

const FIXED_RUNTIME_AT = "2026-05-25T00:00:00.000Z";

export const REVENUE_SOURCE_REQUIRED_DISCLOSURES = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "Revenue intelligence is advisory planning support.",
  "Program fit is preliminary and review-required.",
  "Pricing, market, weather, and cost signals may change.",
  "Regional legal and licensing questions require qualified review.",
  ADVISORY_ONLY_DISCLOSURE,
] as const;

export type RevenueOpportunity = {
  revenue_opportunity_id: string;
  customer_type: string;
  geography_scope: string;
  eligible_entity_types: string[];
  product_or_service_category: string;
  program_refs: string[];
  source_refs: string[];
  estimated_revenue_range?: string;
  estimated_cost_range?: string;
  seasonality_profile?: string;
  compliance_constraints: string[];
  age_restrictions?: string[];
  licensing_requirements?: string[];
  confidence_score: number;
  classification_level: string;
  replay_refs: string[];
  projection_basis:
    "verified-data" | "inferred-estimate" | "forecast" | "assumption";
};

export type ProgramNode = {
  program_id: string;
  program_name: string;
  sponsor_type:
    | "federal"
    | "state"
    | "county"
    | "municipal"
    | "philanthropic"
    | "private"
    | "nonprofit";
  geography_scope: string[];
  eligible_customer_types: string[];
  eligible_uses: string[];
  prohibited_uses: string[];
  age_constraints?: string[];
  entity_constraints?: string[];
  stacking_rules: string[];
  conflict_rules: string[];
  deadline_profile?: string;
  source_refs: string[];
  replay_refs: string[];
};

export type MarketSignal = {
  market_signal_id: string;
  commodity_or_category: string;
  geography_scope: string;
  market_type: string;
  current_price?: number;
  price_unit?: string;
  trend_direction?: string;
  volatility_score?: number;
  source_refs: string[];
  fetched_at: string;
  replay_refs: string[];
  signal_basis:
    "spot" | "futures" | "regional" | "wholesale" | "user-entered-estimate";
};

export type GeoSuitabilityProfile = {
  geo_profile_id: string;
  geography_scope: string;
  parcel_refs?: string[];
  soil_refs: string[];
  weather_refs: string[];
  climate_refs: string[];
  water_refs: string[];
  infrastructure_refs: string[];
  suitability_scores: Record<string, number>;
  source_refs: string[];
  replay_refs: string[];
  weighting_assumptions: string[];
};

export const REVENUE_PRODUCTION_RESTRICTIONS = [
  "no guaranteed revenue claims",
  "no program approval claims",
  "no legal permission claims",
  "no lender commitment claims",
  "no underwriting reliance",
  "no autonomous recommendation without review",
  "no live source fetch before connector promotion",
  "no official report publication",
] as const;

export const REVENUE_OPPORTUNITY_REGISTRY: RevenueOpportunity[] = [
  {
    revenue_opportunity_id: "rev-specialty-crop-market-garden",
    customer_type: "beginning farmer",
    geography_scope: "state/county",
    eligible_entity_types: ["individual operator", "farm entity"],
    product_or_service_category: "specialty crops",
    program_refs: ["prog-usda-specialty-crop", "prog-state-ag-grant"],
    source_refs: [
      "usda-specialty-crop",
      "state-ag-crop-list",
      "extension-crop-guide",
    ],
    estimated_revenue_range: "review-required planning range",
    estimated_cost_range: "review-required input range",
    seasonality_profile: "spring through fall production cycle",
    compliance_constraints: ["food safety review", "local market rule review"],
    age_restrictions: ["minor operators require guardian/consent review"],
    licensing_requirements: ["state and local requirements must be reviewed"],
    confidence_score: 72,
    classification_level: "CONFIDENTIAL",
    replay_refs: ["replay-rev-specialty-crop-market-garden-v0.1.0"],
    projection_basis: "inferred-estimate",
  },
  {
    revenue_opportunity_id: "rev-rural-laundry-efficiency",
    customer_type: "laundromat owner",
    geography_scope: "state/utility territory",
    eligible_entity_types: ["small business", "commercial operator"],
    product_or_service_category: "energy efficiency add-on",
    program_refs: ["prog-energy-rebate", "prog-sba-small-business"],
    source_refs: ["utility-rebate-source", "sba-program-source"],
    estimated_revenue_range: "advisory operating improvement range",
    estimated_cost_range: "equipment and utility cost review required",
    compliance_constraints: [
      "utility eligibility review",
      "equipment compatibility review",
    ],
    licensing_requirements: ["business license review"],
    confidence_score: 68,
    classification_level: "CONFIDENTIAL",
    replay_refs: ["replay-rev-rural-laundry-efficiency-v0.1.0"],
    projection_basis: "assumption",
  },
  {
    revenue_opportunity_id: "rev-agritourism-farm-experience",
    customer_type: "agritourism operator",
    geography_scope: "state/county/municipal",
    eligible_entity_types: ["farm entity", "rural business"],
    product_or_service_category: "farm experiences",
    program_refs: ["prog-rural-tourism", "prog-state-economic-development"],
    source_refs: ["state-tourism-source", "county-zoning-source"],
    estimated_revenue_range: "advisory seasonal range",
    estimated_cost_range:
      "insurance, permitting, and site-readiness review required",
    seasonality_profile: "seasonal event calendar",
    compliance_constraints: [
      "zoning review",
      "insurance review",
      "public safety review",
    ],
    licensing_requirements: ["local permit review"],
    confidence_score: 64,
    classification_level: "CONFIDENTIAL",
    replay_refs: ["replay-rev-agritourism-farm-experience-v0.1.0"],
    projection_basis: "forecast",
  },
];

export const PROGRAM_GRAPH: ProgramNode[] = [
  {
    program_id: "prog-usda-specialty-crop",
    program_name: "USDA specialty crop program source",
    sponsor_type: "federal",
    geography_scope: ["federal", "state-administered"],
    eligible_customer_types: ["farmer", "beginning farmer", "nursery operator"],
    eligible_uses: [
      "specialty crop planning",
      "marketing",
      "production support",
    ],
    prohibited_uses: [
      "unreviewed restricted products",
      "unverified legal claims",
    ],
    age_constraints: ["minor/youth posture requires program-specific review"],
    entity_constraints: ["entity and documentation review required"],
    stacking_rules: ["stacking must be checked against active program rules"],
    conflict_rules: ["conflicts route to human review"],
    deadline_profile: "deadline refresh required before presentation",
    source_refs: ["usda-program-page", "state-administered-program-source"],
    replay_refs: ["replay-prog-usda-specialty-crop-v0.1.0"],
  },
  {
    program_id: "prog-energy-rebate",
    program_name: "Energy efficiency rebate source",
    sponsor_type: "state",
    geography_scope: ["state", "utility territory"],
    eligible_customer_types: [
      "laundromat owner",
      "hospitality operator",
      "energy project operator",
    ],
    eligible_uses: ["equipment efficiency", "utility demand reduction"],
    prohibited_uses: ["unreviewed equipment claims"],
    stacking_rules: ["utility and state stacking review required"],
    conflict_rules: ["rebate conflict rules must be preserved"],
    deadline_profile: "active period review required",
    source_refs: ["state-energy-source", "utility-rebate-source"],
    replay_refs: ["replay-prog-energy-rebate-v0.1.0"],
  },
  {
    program_id: "prog-rural-tourism",
    program_name: "Rural tourism program source",
    sponsor_type: "state",
    geography_scope: ["state", "county"],
    eligible_customer_types: [
      "agritourism operator",
      "hospitality operator",
      "rural business owner",
    ],
    eligible_uses: [
      "tourism readiness",
      "site improvement",
      "marketing support",
    ],
    prohibited_uses: ["unreviewed public safety or zoning claims"],
    stacking_rules: ["state and local compatibility review required"],
    conflict_rules: ["zoning and insurance conflicts require human review"],
    deadline_profile: "seasonal grant window review required",
    source_refs: ["state-tourism-source", "county-development-source"],
    replay_refs: ["replay-prog-rural-tourism-v0.1.0"],
  },
];

export const MARKET_SIGNALS: MarketSignal[] = [
  {
    market_signal_id: "market-specialty-crop-regional",
    commodity_or_category: "specialty crops",
    geography_scope: "regional",
    market_type: "regional wholesale/advisory",
    trend_direction: "review-required",
    volatility_score: 61,
    source_refs: ["regional-market-source", "extension-market-source"],
    fetched_at: FIXED_RUNTIME_AT,
    replay_refs: ["replay-market-specialty-crop-regional-v0.1.0"],
    signal_basis: "regional",
  },
  {
    market_signal_id: "market-energy-cost",
    commodity_or_category: "energy",
    geography_scope: "state/utility",
    market_type: "utility tariff/advisory",
    trend_direction: "review-required",
    volatility_score: 58,
    source_refs: ["state-energy-source", "utility-rate-source"],
    fetched_at: FIXED_RUNTIME_AT,
    replay_refs: ["replay-market-energy-cost-v0.1.0"],
    signal_basis: "regional",
  },
];

export const GEO_SUITABILITY_PROFILES: GeoSuitabilityProfile[] = [
  {
    geo_profile_id: "geo-specialty-crop-suitability",
    geography_scope: "state/county",
    soil_refs: ["nrcs-soil-source"],
    weather_refs: ["weather-history-source"],
    climate_refs: ["climate-normals-source"],
    water_refs: ["water-availability-source"],
    infrastructure_refs: ["road-logistics-source", "broadband-source"],
    suitability_scores: {
      specialty_crops: 68,
      greenhouse_products: 72,
    },
    source_refs: ["nrcs-soil-source", "climate-source", "water-source"],
    replay_refs: ["replay-geo-specialty-crop-suitability-v0.1.0"],
    weighting_assumptions: [
      "soil, water, climate, and logistics are separated and reviewable",
    ],
  },
];
