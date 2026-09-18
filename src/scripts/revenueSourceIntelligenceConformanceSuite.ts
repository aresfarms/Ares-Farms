import fs from "fs";
import path from "path";

import {
  ADVISORY_FUSION_RESULTS,
  CUSTOMER_TYPE_ELIGIBILITY_PROFILES,
  GEO_SUITABILITY_PROFILES,
  MARKETPLACE_ITEMS,
  MARKET_SIGNALS,
  OPERATING_COST_SIGNALS,
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_REQUIRED_SCHEMA_TABLES,
  REVENUE_SOURCE_CATEGORIES,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
  SELLABLE_CATALOG,
  STATE_REGULATORY_RECORDS,
  customerRevenueModule,
  dispatchRevenueSourceIntelligenceAction,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Revenue Source Intelligence Conformance Suite
 *
 * Verifies the supplemental revenue/source intelligence doctrine as a governed
 * Master Volume input. These checks intentionally preserve advisory-only,
 * review-required, replay-safe, and production-blocked posture.
 */

const repoRoot = process.cwd();
const mode = process.argv[2] ?? "all";

const requiredRuntimeFiles = [
  "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
  "src/lib/revenue-intelligence/revenueSourceIntelligenceApi.ts",
  "src/lib/customer-revenue/index.ts",
  "src/lib/program-graph/index.ts",
  "src/lib/sellable-catalog/index.ts",
  "src/lib/ag-products/index.ts",
  "src/lib/livestock/index.ts",
  "src/lib/regional-eligibility/index.ts",
  "src/lib/marketplace-intel/index.ts",
  "src/lib/operating-costs/index.ts",
  "src/lib/market-signals/index.ts",
  "src/lib/geospatial-governance/index.ts",
  "src/lib/data-fusion/index.ts",
  "src/db/schema/revenueSourceIntelligenceGovernance.ts",
  "src/lib/db/migrations/0031_revenue_source_intelligence_governance.sql",
];

const requiredApiRoutes = [
  "src/app/api/revenue-intelligence/opportunities/route.ts",
  "src/app/api/revenue-intelligence/catalog/route.ts",
  "src/app/api/revenue-intelligence/programs/route.ts",
  "src/app/api/revenue-intelligence/marketplace/route.ts",
  "src/app/api/revenue-intelligence/operating-costs/route.ts",
  "src/app/api/revenue-intelligence/market-signals/route.ts",
  "src/app/api/revenue-intelligence/geospatial/route.ts",
  "src/app/api/revenue-intelligence/state-registry/route.ts",
  "src/app/api/revenue-intelligence/customer-eligibility/route.ts",
  "src/app/api/revenue-intelligence/fusion/route.ts",
  "src/app/api/revenue-intelligence/claims/route.ts",
  "src/app/api/customer-revenue/advisory/route.ts",
];

const requiredModuleRoutes = [
  "src/app/customer-revenue/page.tsx",
  "src/app/portal/revenue-opportunities/page.tsx",
  "src/app/lender/revenue-opportunities/page.tsx",
  "src/app/sponsor/revenue-opportunities/page.tsx",
  "src/components/revenue/RevenueIntelligenceSurface.tsx",
];

function file(pathname: string): string {
  return path.join(repoRoot, pathname);
}

function exists(pathname: string): boolean {
  return fs.existsSync(file(pathname));
}

function read(pathname: string): string {
  return fs.readFileSync(file(pathname), "utf8");
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function packageScripts(): Record<string, string> {
  return JSON.parse(read("package.json")).scripts ?? {};
}

function assertAllFiles(pathnames: string[]): void {
  const missing = pathnames.filter((pathname) => !exists(pathname));

  assert(missing.length === 0, `Missing files: ${missing.join(", ")}`);
}

function assertSchema(): void {
  const schema = read("src/db/schema/revenueSourceIntelligenceGovernance.ts");
  const migration = read(
    "src/lib/db/migrations/0031_revenue_source_intelligence_governance.sql"
  );
  const barrel = read("src/db/schema/index.ts");

  for (const table of REVENUE_REQUIRED_SCHEMA_TABLES) {
    assert(schema.includes(`"${table}"`), `Missing schema table ${table}.`);
    assert(migration.includes(table), `Missing migration table ${table}.`);
  }

  assert(
    barrel.includes("./revenueSourceIntelligenceGovernance"),
    "Canonical schema barrel must export revenueSourceIntelligenceGovernance."
  );
}

function assertRuntimeCore(): void {
  assertAllFiles(requiredRuntimeFiles);
  assertAllFiles(requiredApiRoutes);
  assertAllFiles(requiredModuleRoutes);
  assertSchema();
  assert(
    REVENUE_SOURCE_CATEGORIES.length >= 8,
    "Revenue source categories must cover source intelligence domains."
  );
  assert(
    REVENUE_SOURCE_REQUIRED_DISCLOSURES.includes("Human review is pending."),
    "Required human review disclosure missing."
  );
  assert(
    REVENUE_PRODUCTION_RESTRICTIONS.includes("no guaranteed revenue claims"),
    "Guaranteed revenue claims must be blocked."
  );
}

function verifyRevenueIntelligence(): void {
  assertRuntimeCore();
  assert(
    REVENUE_OPPORTUNITY_REGISTRY.length >= 3,
    "Revenue opportunity registry requires representative opportunities."
  );
  assert(
    REVENUE_OPPORTUNITY_REGISTRY.every(
      (opportunity) =>
        opportunity.source_refs.length > 0 &&
        opportunity.program_refs.length > 0 &&
        opportunity.replay_refs.length > 0 &&
        opportunity.compliance_constraints.length > 0
    ),
    "Every revenue opportunity must preserve source, program, replay, and constraints."
  );
}

function verifySellableCatalog(): void {
  assert(
    SELLABLE_CATALOG.length >= 3,
    "Sellable catalog must contain governed representative items."
  );
  assert(
    SELLABLE_CATALOG.every(
      (item) =>
        item.allowed_regions.length > 0 &&
        item.restricted_regions.length > 0 &&
        item.program_eligibility_refs.length > 0 &&
        item.market_price_refs.length > 0 &&
        item.replay_refs.length > 0
    ),
    "Every sellable catalog item must preserve region, program, price, and replay posture."
  );
}

function verifyProgramGraph(): void {
  assert(PROGRAM_GRAPH.length >= 3, "Program graph must contain program nodes.");
  assert(
    PROGRAM_GRAPH.every(
      (program) =>
        program.geography_scope.length > 0 &&
        program.eligible_customer_types.length > 0 &&
        program.eligible_uses.length > 0 &&
        program.prohibited_uses.length > 0 &&
        program.stacking_rules.length > 0 &&
        program.conflict_rules.length > 0
    ),
    "Program graph nodes must preserve jurisdiction, use, stacking, and conflict rules."
  );
}

function verifyMarketplaceIntel(): void {
  assert(MARKETPLACE_ITEMS.length >= 2, "Marketplace item registry missing.");
  assert(
    MARKETPLACE_ITEMS.every(
      (item) =>
        item.vendor_refs.length > 0 &&
        item.program_use_refs.length > 0 &&
        item.revenue_opportunity_refs.length > 0 &&
        item.replay_refs.length > 0
    ),
    "Marketplace items must connect vendors, programs, opportunities, and replay."
  );
}

function verifyOperatingCosts(): void {
  assert(OPERATING_COST_SIGNALS.length >= 2, "Operating cost signals missing.");
  assert(
    OPERATING_COST_SIGNALS.every(
      (signal) =>
        signal.source_refs.length > 0 &&
        signal.freshness_status.length > 0 &&
        signal.uncertainty_classification.length > 0 &&
        signal.replay_refs.length > 0
    ),
    "Operating cost signals must preserve source freshness, uncertainty, and replay."
  );
}

function verifyMarketSignals(): void {
  assert(MARKET_SIGNALS.length >= 2, "Market signals missing.");
  assert(
    MARKET_SIGNALS.every(
      (signal) =>
        signal.source_refs.length > 0 &&
        signal.signal_basis.length > 0 &&
        signal.replay_refs.length > 0
    ),
    "Market signals must preserve source, signal basis, and replay."
  );
}

function verifyGeospatialGovernance(): void {
  assert(
    GEO_SUITABILITY_PROFILES.length >= 1,
    "Geospatial suitability profiles missing."
  );
  assert(
    GEO_SUITABILITY_PROFILES.every(
      (profile) =>
        profile.soil_refs.length > 0 &&
        profile.weather_refs.length > 0 &&
        profile.climate_refs.length > 0 &&
        profile.water_refs.length > 0 &&
        profile.weighting_assumptions.length > 0
    ),
    "Geospatial profiles must keep soil, weather, climate, water, and assumptions separate."
  );
}

function verifyStateRegistry(): void {
  assert(
    STATE_REGULATORY_RECORDS.length >= 2,
    "State regulatory registry missing."
  );
  assert(
    STATE_REGULATORY_RECORDS.every(
      (record) =>
        record.source_refs.length > 0 &&
        record.affected_customer_types.length > 0 &&
        record.affected_products_or_services.length > 0 &&
        record.replay_refs.length > 0
    ),
    "State regulatory records must preserve jurisdiction, affected categories, source, and replay."
  );
}

function verifyCustomerTypeEligibility(): void {
  assert(
    CUSTOMER_TYPE_ELIGIBILITY_PROFILES.length >= 2,
    "Customer type eligibility profiles missing."
  );
  assert(
    CUSTOMER_TYPE_ELIGIBILITY_PROFILES.every(
      (profile) =>
        profile.eligible_programs.length > 0 &&
        profile.eligible_revenue_categories.length > 0 &&
        profile.prohibited_or_restricted_categories.length > 0 &&
        profile.required_documents.length > 0 &&
        profile.replay_refs.length > 0
    ),
    "Customer type profiles must preserve programs, categories, restrictions, documents, and replay."
  );
}

function verifyDataFusion(): void {
  assert(ADVISORY_FUSION_RESULTS.length >= 1, "Advisory fusion result missing.");
  assert(
    ADVISORY_FUSION_RESULTS.every(
      (result) =>
        result.source_refs.length > 0 &&
        result.conflict_refs.length > 0 &&
        result.assumptions.length > 0 &&
        result.required_human_review &&
        result.replay_refs.length > 0
    ),
    "Fusion outputs must preserve source lineage, conflicts, assumptions, review, and replay."
  );
}

function verifyCustomerRevenueModule(): void {
  const revenueModule = customerRevenueModule({});
  const serialized = JSON.stringify(revenueModule);

  assert(revenueModule.ok, "Customer revenue module should pass advisory runtime.");
  assert(
    serialized.includes("/customer-revenue") &&
      serialized.includes("/portal/revenue-opportunities") &&
      serialized.includes("/lender/revenue-opportunities") &&
      serialized.includes("/sponsor/revenue-opportunities"),
    "Customer revenue module routes missing."
  );
  assert(
    serialized.includes("REVENUE-INTEL-001") &&
      serialized.includes("DATA-FUSION-001"),
    "Customer revenue module dependencies missing."
  );
}

function verifyClaimsAndBlocks(): void {
  const blocked = dispatchRevenueSourceIntelligenceAction("revenue.opportunities", {
    liveSourceRefreshRequested: true,
    productionUseRequested: true,
    officialUseRequested: true,
    legalAdviceRequested: true,
    guaranteedClaimRequested: true,
  });

  assert(!blocked.ok, "Controlled production/live request must be blocked.");
  assert(
    blocked.blockedReasons.length >= 5,
    "Controlled block reasons are incomplete."
  );
  assert(
    blocked.disclosures.includes("Program fit is preliminary and review-required."),
    "Program fit disclosure missing."
  );
}

function verifyCommands(): void {
  const scripts = packageScripts();
  const requiredScripts = [
    "verify:revenue-intelligence",
    "verify:sellable-catalog",
    "verify:program-graph",
    "verify:marketplace-intel",
    "verify:operating-costs",
    "verify:market-signals",
    "verify:geospatial-governance",
    "verify:state-registry",
    "verify:customer-type-eligibility",
    "verify:data-fusion",
    "verify:customer-revenue-module",
    "verify:revenue-source-intelligence",
    "smoke:customer-revenue",
    "smoke:program-revenue-matching",
    "smoke:revenue-claims",
    "smoke:regional-product-matching",
    "smoke:minor-operator-constraints",
    "smoke:program-product-eligibility",
    "smoke:program-stacking",
    "smoke:program-conflicts",
    "smoke:grant-deadline-refresh",
    "smoke:equipment-price-refresh",
    "smoke:program-equipment-compatibility",
    "smoke:supplier-region-matching",
    "smoke:input-price-refresh",
    "smoke:cost-revenue-model",
    "smoke:forecast-disclosures",
    "smoke:commodity-price-refresh",
    "smoke:market-signal-replay",
    "smoke:forecast-labeling",
    "smoke:soil-map-ingestion",
    "smoke:weather-climate-refresh",
    "smoke:geo-suitability-replay",
    "smoke:state-rule-refresh",
    "smoke:licensing-constraint-matching",
    "smoke:regulatory-claims",
    "smoke:minor-eligibility",
    "smoke:industry-revenue-matching",
    "smoke:customer-program-fit",
    "smoke:fusion-source-lineage",
    "smoke:fusion-conflict-detection",
    "smoke:advisory-output-claims",
    "smoke:customer-revenue-module",
    "smoke:customer-revenue-route",
    "smoke:public-revenue-disclosures",
    "smoke:revenue-opportunity-replay",
    "smoke:revenue-source-apis",
  ];

  for (const script of requiredScripts) {
    assert(Boolean(scripts[script]), `Missing package script ${script}.`);
  }
}

const checks: Record<string, () => void> = {
  "revenue-intelligence": verifyRevenueIntelligence,
  "sellable-catalog": verifySellableCatalog,
  "program-graph": verifyProgramGraph,
  "marketplace-intel": verifyMarketplaceIntel,
  "operating-costs": verifyOperatingCosts,
  "market-signals": verifyMarketSignals,
  "geospatial-governance": verifyGeospatialGovernance,
  "state-registry": verifyStateRegistry,
  "customer-type-eligibility": verifyCustomerTypeEligibility,
  "data-fusion": verifyDataFusion,
  "customer-revenue-module": verifyCustomerRevenueModule,
  "revenue-claims": verifyClaimsAndBlocks,
  commands: verifyCommands,
  all: () => {
    verifyRevenueIntelligence();
    verifySellableCatalog();
    verifyProgramGraph();
    verifyMarketplaceIntel();
    verifyOperatingCosts();
    verifyMarketSignals();
    verifyGeospatialGovernance();
    verifyStateRegistry();
    verifyCustomerTypeEligibility();
    verifyDataFusion();
    verifyCustomerRevenueModule();
    verifyClaimsAndBlocks();
    verifyCommands();
  },
};

const check = checks[mode] ?? checks.all;

check();

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedAt: new Date().toISOString(),
      mode,
      opportunities: REVENUE_OPPORTUNITY_REGISTRY.length,
      sellableCatalogItems: SELLABLE_CATALOG.length,
      programNodes: PROGRAM_GRAPH.length,
      marketplaceItems: MARKETPLACE_ITEMS.length,
      operatingCostSignals: OPERATING_COST_SIGNALS.length,
      marketSignals: MARKET_SIGNALS.length,
      geospatialProfiles: GEO_SUITABILITY_PROFILES.length,
      stateRegulatoryRecords: STATE_REGULATORY_RECORDS.length,
      customerTypeProfiles: CUSTOMER_TYPE_ELIGIBILITY_PROFILES.length,
      fusionResults: ADVISORY_FUSION_RESULTS.length,
      schemaTables: REVENUE_REQUIRED_SCHEMA_TABLES.length,
      message: "Revenue source intelligence conformance passed.",
    },
    null,
    2
  )
);
