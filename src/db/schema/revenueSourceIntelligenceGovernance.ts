import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Revenue Source Intelligence Governance Schema
 *
 * Master Volume Governance:
 * - Vol I: Keeps revenue, program, catalog, market, and regional intelligence
 *   subordinate to constitutional source authority and review boundaries.
 * - Vol II: Prevents advisory revenue planning from becoming legal advice,
 *   program approval, underwriting evidence, guaranteed revenue, or financeable
 *   certainty without governed review.
 * - Vol III: Preserves replay-safe registries, source lineage, assumptions,
 *   conflict records, jurisdiction, customer type constraints, and program
 *   compatibility for every advisory output.
 * - Vol III-B: Carries runtime, classification, observability, claims,
 *   and human-review controls into revenue intelligence workflows.
 * - Vol IV: Supports escalation, review, refresh, and remediation runbooks for
 *   stale, conflicting, or sensitive source intelligence.
 * - Vol V: Enforces source authority, classification, claims governance,
 *   replayability, disclosure, canonicalization, and controlled use.
 *
 * Supplemental governing input:
 * - Ares Furlong Revenue Source Intelligence Doctrines.docx
 */

function governanceFields() {
  return {
    governanceVersion: text("governance_version").notNull(),
    classificationLevel: text("classification_level").notNull(),
    replayRef: text("replay_ref").notNull(),
    traceId: text("trace_id"),
    sourceRefs: jsonb("source_refs"),
    replayRefs: jsonb("replay_refs"),
    claimsProfile: text("claims_profile").notNull().default("advisory-only"),
    humanReviewRequired: boolean("human_review_required").notNull().default(true),
    productionBlocked: boolean("production_blocked").notNull().default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  };
}

export const customerRevenueOpportunityRegistry = pgTable(
  "customer_revenue_opportunity_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revenueOpportunityId: text("revenue_opportunity_id").notNull().unique(),
    customerType: text("customer_type").notNull(),
    geographyScope: text("geography_scope").notNull(),
    eligibleEntityTypes: jsonb("eligible_entity_types").notNull(),
    productOrServiceCategory: text("product_or_service_category").notNull(),
    programRefs: jsonb("program_refs").notNull(),
    estimatedRevenueRange: text("estimated_revenue_range"),
    estimatedCostRange: text("estimated_cost_range"),
    seasonalityProfile: text("seasonality_profile"),
    complianceConstraints: jsonb("compliance_constraints").notNull(),
    ageRestrictions: jsonb("age_restrictions"),
    licensingRequirements: jsonb("licensing_requirements"),
    confidenceScore: integer("confidence_score").notNull().default(0),
    projectionBasis: text("projection_basis").notNull().default("assumption"),
    ...governanceFields(),
  }
);

export const sellableCatalogItems = pgTable("sellable_catalog_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: text("item_id").notNull().unique(),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name"),
  category: text("category").notNull(),
  allowedRegions: jsonb("allowed_regions").notNull(),
  restrictedRegions: jsonb("restricted_regions").notNull(),
  suitableClimateZones: jsonb("suitable_climate_zones").notNull(),
  soilRequirements: jsonb("soil_requirements"),
  waterRequirements: jsonb("water_requirements"),
  growingSeason: text("growing_season"),
  productionCycle: text("production_cycle"),
  licensingRequirements: jsonb("licensing_requirements").notNull(),
  programEligibilityRefs: jsonb("program_eligibility_refs").notNull(),
  prohibitedCustomerTypes: jsonb("prohibited_customer_types"),
  minorOperatorConstraints: jsonb("minor_operator_constraints"),
  marketPriceRefs: jsonb("market_price_refs").notNull(),
  confidenceScore: integer("confidence_score").notNull().default(0),
  ...governanceFields(),
});

export const programGraphNodes = pgTable("program_graph_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: text("program_id").notNull().unique(),
  programName: text("program_name").notNull(),
  sponsorType: text("sponsor_type").notNull(),
  geographyScope: jsonb("geography_scope").notNull(),
  eligibleCustomerTypes: jsonb("eligible_customer_types").notNull(),
  eligibleUses: jsonb("eligible_uses").notNull(),
  prohibitedUses: jsonb("prohibited_uses").notNull(),
  ageConstraints: jsonb("age_constraints"),
  entityConstraints: jsonb("entity_constraints"),
  stackingRules: jsonb("stacking_rules").notNull(),
  conflictRules: jsonb("conflict_rules").notNull(),
  deadlineProfile: text("deadline_profile"),
  reviewStatus: text("review_status").notNull().default("REVIEW_REQUIRED"),
  ...governanceFields(),
});

export const programGraphEdges = pgTable("program_graph_edges", {
  id: uuid("id").defaultRandom().primaryKey(),
  edgeId: text("edge_id").notNull().unique(),
  fromProgramId: text("from_program_id").notNull(),
  toRef: text("to_ref").notNull(),
  edgeType: text("edge_type").notNull(),
  compatibilityStatus: text("compatibility_status").notNull(),
  conflictRefs: jsonb("conflict_refs"),
  ...governanceFields(),
});

export const programStackingRules = pgTable("program_stacking_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  stackingRuleId: text("stacking_rule_id").notNull().unique(),
  programId: text("program_id").notNull(),
  compatibleProgramRefs: jsonb("compatible_program_refs").notNull(),
  prohibitedProgramRefs: jsonb("prohibited_program_refs").notNull(),
  ruleBasis: text("rule_basis").notNull(),
  ...governanceFields(),
});

export const programConflictRules = pgTable("program_conflict_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  conflictRuleId: text("conflict_rule_id").notNull().unique(),
  programId: text("program_id").notNull(),
  conflictType: text("conflict_type").notNull(),
  conflictSummary: text("conflict_summary").notNull(),
  conflictSourceRefs: jsonb("conflict_source_refs").notNull(),
  ...governanceFields(),
});

export const marketplaceItems = pgTable("marketplace_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketplaceItemId: text("marketplace_item_id").notNull().unique(),
  category: text("category").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  condition: text("condition"),
  priceRange: text("price_range"),
  availabilityRegion: jsonb("availability_region").notNull(),
  vendorRefs: jsonb("vendor_refs").notNull(),
  programUseRefs: jsonb("program_use_refs").notNull(),
  revenueOpportunityRefs: jsonb("revenue_opportunity_refs").notNull(),
  priceBasis: text("price_basis").notNull().default("estimated-price"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  confidenceScore: integer("confidence_score").notNull().default(0),
  ...governanceFields(),
});

export const supplierRegistry = pgTable("supplier_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: text("supplier_id").notNull().unique(),
  supplierName: text("supplier_name").notNull(),
  supplierCategory: text("supplier_category").notNull(),
  availabilityRegion: jsonb("availability_region").notNull(),
  certificationStatus: text("certification_status").notNull(),
  liveAvailabilityBlocked: boolean("live_availability_blocked")
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const marketplacePriceSnapshots = pgTable(
  "marketplace_price_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    priceSnapshotId: text("price_snapshot_id").notNull().unique(),
    marketplaceItemId: text("marketplace_item_id").notNull(),
    priceRange: text("price_range").notNull(),
    priceBasis: text("price_basis").notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow(),
    freshnessStatus: text("freshness_status").notNull(),
    ...governanceFields(),
  }
);

export const operatingCostSignals = pgTable("operating_cost_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  costSignalId: text("cost_signal_id").notNull().unique(),
  category: text("category").notNull(),
  geographyScope: text("geography_scope").notNull(),
  customerType: text("customer_type").notNull(),
  priceRange: text("price_range").notNull(),
  priceBasis: text("price_basis").notNull().default("estimated-price"),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow(),
  freshnessStatus: text("freshness_status").notNull(),
  volatilityScore: integer("volatility_score"),
  uncertaintyClassification: text("uncertainty_classification")
    .notNull()
    .default("ESTIMATE"),
  ...governanceFields(),
});

export const marketSignalRegistry = pgTable("market_signal_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketSignalId: text("market_signal_id").notNull().unique(),
  commodityOrCategory: text("commodity_or_category").notNull(),
  geographyScope: text("geography_scope").notNull(),
  marketType: text("market_type").notNull(),
  currentPrice: integer("current_price"),
  priceUnit: text("price_unit"),
  trendDirection: text("trend_direction"),
  volatilityScore: integer("volatility_score"),
  signalBasis: text("signal_basis").notNull().default("market-snapshot"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
  ...governanceFields(),
});

export const marketSignalSnapshots = pgTable("market_signal_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketSnapshotId: text("market_snapshot_id").notNull().unique(),
  marketSignalId: text("market_signal_id").notNull(),
  snapshotType: text("snapshot_type").notNull(),
  priceValue: integer("price_value"),
  priceUnit: text("price_unit"),
  sourceCadence: text("source_cadence").notNull(),
  ...governanceFields(),
});

export const geospatialSourceRegistry = pgTable("geospatial_source_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  geoSourceId: text("geo_source_id").notNull().unique(),
  geoSourceName: text("geo_source_name").notNull(),
  dataLayer: text("data_layer").notNull(),
  authorityTier: text("authority_tier").notNull(),
  updateCadence: text("update_cadence").notNull(),
  jurisdictionScope: jsonb("jurisdiction_scope").notNull(),
  ...governanceFields(),
});

export const geoSuitabilityProfiles = pgTable("geo_suitability_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  geoProfileId: text("geo_profile_id").notNull().unique(),
  geographyScope: text("geography_scope").notNull(),
  parcelRefs: jsonb("parcel_refs"),
  soilRefs: jsonb("soil_refs").notNull(),
  weatherRefs: jsonb("weather_refs").notNull(),
  climateRefs: jsonb("climate_refs").notNull(),
  waterRefs: jsonb("water_refs").notNull(),
  infrastructureRefs: jsonb("infrastructure_refs").notNull(),
  suitabilityScores: jsonb("suitability_scores").notNull(),
  weightingAssumptions: jsonb("weighting_assumptions").notNull(),
  ...governanceFields(),
});

export const stateRegulatoryRecords = pgTable("state_regulatory_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  stateRecordId: text("state_record_id").notNull().unique(),
  jurisdiction: text("jurisdiction").notNull(),
  regulatoryDomain: text("regulatory_domain").notNull(),
  affectedCustomerTypes: jsonb("affected_customer_types").notNull(),
  affectedProductsOrServices: jsonb("affected_products_or_services").notNull(),
  requirementSummary: text("requirement_summary").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  expirationOrReviewDate: timestamp("expiration_or_review_date", {
    withTimezone: true,
  }),
  legalAdviceBlocked: boolean("legal_advice_blocked").notNull().default(true),
  conflictReviewRequired: boolean("conflict_review_required")
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const customerTypeEligibilityProfiles = pgTable(
  "customer_type_eligibility_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: text("profile_id").notNull().unique(),
    customerType: text("customer_type").notNull(),
    eligiblePrograms: jsonb("eligible_programs").notNull(),
    eligibleRevenueCategories: jsonb("eligible_revenue_categories").notNull(),
    prohibitedOrRestrictedCategories: jsonb(
      "prohibited_or_restricted_categories"
    ).notNull(),
    requiredDocuments: jsonb("required_documents").notNull(),
    licensingConstraints: jsonb("licensing_constraints").notNull(),
    ageConstraints: jsonb("age_constraints"),
    geographyConstraints: jsonb("geography_constraints").notNull(),
    preliminaryOnly: boolean("preliminary_only").notNull().default(true),
    ...governanceFields(),
  }
);

export const advisoryFusionResults = pgTable("advisory_fusion_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  fusionResultId: text("fusion_result_id").notNull().unique(),
  customerId: text("customer_id"),
  customerType: text("customer_type").notNull(),
  geographyScope: text("geography_scope").notNull(),
  opportunityRefs: jsonb("opportunity_refs").notNull(),
  conflictRefs: jsonb("conflict_refs").notNull(),
  assumptions: jsonb("assumptions").notNull(),
  confidenceScore: integer("confidence_score").notNull().default(0),
  requiredHumanReview: boolean("required_human_review").notNull().default(true),
  factsEstimatesForecastsAssumptions: jsonb(
    "facts_estimates_forecasts_assumptions"
  ).notNull(),
  ...governanceFields(),
});

export const revenueClaimValidationEvents = pgTable(
  "revenue_claim_validation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    claimValidationId: text("claim_validation_id").notNull().unique(),
    subjectRef: text("subject_ref").notNull(),
    claimText: text("claim_text").notNull(),
    validationStatus: text("validation_status").notNull(),
    blockedReasons: jsonb("blocked_reasons").notNull(),
    ...governanceFields(),
  }
);

export const revenueHumanReviewEvents = pgTable("revenue_human_review_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewEventId: text("review_event_id").notNull().unique(),
  subjectRef: text("subject_ref").notNull(),
  reviewQueue: text("review_queue").notNull(),
  reviewReason: text("review_reason").notNull(),
  reviewStatus: text("review_status").notNull(),
  ...governanceFields(),
});

export const revenueSourceLineageRecords = pgTable(
  "revenue_source_lineage_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lineageRecordId: text("lineage_record_id").notNull().unique(),
    subjectRef: text("subject_ref").notNull(),
    sourceAuthorityRefs: jsonb("source_authority_refs").notNull(),
    pricingRefs: jsonb("pricing_refs"),
    programRuleRefs: jsonb("program_rule_refs"),
    assumptionRefs: jsonb("assumption_refs"),
    conflictRefs: jsonb("conflict_refs"),
    ...governanceFields(),
  }
);
