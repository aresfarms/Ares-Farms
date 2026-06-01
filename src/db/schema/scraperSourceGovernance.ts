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
 * Scraper, Source Intelligence, and Property Discovery Governance Schema
 *
 * Master Volume Governance:
 * - Vol I: Keeps scraper/source activity constitutionally subordinate to
 *   governed source authority, review, and production-promotion controls.
 * - Vol II: Prevents scraped or marketplace data from becoming regulated
 *   truth, underwriting evidence, public verification, or official collateral
 *   certification without review.
 * - Vol III: Defines replay-safe source ingestion, provenance, canonical
 *   property governance, connector certification, and deterministic lineage.
 * - Vol III-B: Preserves runtime state, observability, classification, and
 *   escalation records for every source-intelligence workflow.
 * - Vol IV: Supports source review, degraded connectors, retries, escalation,
 *   incident response, and evidence-packet preparation.
 * - Vol V: Enforces source authority, replay, classification, claims,
 *   disclosure, version lineage, canonicalization, and controlled use.
 *
 * Supplemental governing inputs:
 * - Ares_Furlong_Scraper_Connector_Source_Ingestion_Governance_Doctrine.pdf
 * - Ares_Furlong_Property_Discovery_Scraper_Governance_Integration_Master.pdf
 * - Ares_Furlong_Institutional_Scraper_Source_Intelligence_Implementation_Master.pdf
 */

function governanceFields() {
  return {
  governanceVersion: text("governance_version").notNull(),
  classificationLevel: text("classification_level").notNull(),
  replayRef: text("replay_ref").notNull(),
  traceId: text("trace_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  };
}

export const scraperRegistry = pgTable("scraper_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  scraperId: text("scraper_id").notNull().unique(),
  scraperName: text("scraper_name").notNull(),
  sourceId: text("source_id").notNull(),
  sourceName: text("source_name").notNull(),
  sourceCategory: text("source_category").notNull(),
  phase: text("phase").notNull(),
  authorityTier: text("authority_tier").notNull(),
  connectorCertificationStatus: text("connector_certification_status")
    .notNull()
    .default("PENDING_CERTIFICATION"),
  replaySupported: boolean("replay_supported").notNull().default(true),
  liveFetchAllowed: boolean("live_fetch_allowed").notNull().default(false),
  rateLimitProfile: text("rate_limit_profile").notNull(),
  retryGovernanceProfile: text("retry_governance_profile").notNull(),
  sovereignRestrictionProfile: text("sovereign_restriction_profile").notNull(),
  claimsAllowed: jsonb("claims_allowed"),
  ...governanceFields(),
});

export const scraperRunEvents = pgTable("scraper_run_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  scraperId: text("scraper_id").notNull(),
  runId: text("run_id").notNull().unique(),
  runStatus: text("run_status").notNull(),
  requestedByActorId: text("requested_by_actor_id"),
  requestedScope: jsonb("requested_scope"),
  liveFetchAttempted: boolean("live_fetch_attempted").notNull().default(false),
  liveFetchAllowed: boolean("live_fetch_allowed").notNull().default(false),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  blockedReasons: jsonb("blocked_reasons"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...governanceFields(),
});

export const scraperFetchRecords = pgTable("scraper_fetch_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  fetchRecordId: text("fetch_record_id").notNull().unique(),
  runId: text("run_id").notNull(),
  scraperId: text("scraper_id").notNull(),
  sourceId: text("source_id").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceVersion: text("source_version"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
  contentHash: text("content_hash").notNull(),
  confidenceScore: integer("confidence_score").notNull().default(0),
  jurisdictionScope: text("jurisdiction_scope"),
  consentScope: text("consent_scope"),
  connectorId: text("connector_id").notNull(),
  scraperVersion: text("scraper_version").notNull(),
  candidateEvidenceOnly: boolean("candidate_evidence_only")
    .notNull()
    .default(true),
  operationalUseBlocked: boolean("operational_use_blocked")
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const scraperReplayRefs = pgTable("scraper_replay_refs", {
  id: uuid("id").defaultRandom().primaryKey(),
  replayId: text("replay_id").notNull().unique(),
  scraperId: text("scraper_id").notNull(),
  runId: text("run_id"),
  replayMode: text("replay_mode").notNull(),
  deterministicReplayRequired: boolean("deterministic_replay_required")
    .notNull()
    .default(true),
  historicalReconstructionSupported: boolean(
    "historical_reconstruction_supported"
  )
    .notNull()
    .default(true),
  replayIntegrityStatus: text("replay_integrity_status").notNull(),
  lineageRefs: jsonb("lineage_refs"),
  ...governanceFields(),
});

export const scraperIntegrityReports = pgTable("scraper_integrity_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  integrityReportId: text("integrity_report_id").notNull().unique(),
  scraperId: text("scraper_id").notNull(),
  runId: text("run_id"),
  integrityStatus: text("integrity_status").notNull(),
  provenancePresent: boolean("provenance_present").notNull().default(false),
  classificationPresent: boolean("classification_present")
    .notNull()
    .default(false),
  replayPresent: boolean("replay_present").notNull().default(false),
  sourceAuthorityPresent: boolean("source_authority_present")
    .notNull()
    .default(false),
  findings: jsonb("findings"),
  ...governanceFields(),
});

export const scraperClassificationEvents = pgTable(
  "scraper_classification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classificationEventId: text("classification_event_id").notNull().unique(),
    scraperId: text("scraper_id").notNull(),
    sourceId: text("source_id").notNull(),
    classificationProfile: text("classification_profile").notNull(),
    aiUsageTier: text("ai_usage_tier").notNull(),
    redactionRequirements: jsonb("redaction_requirements"),
    exportRestrictions: jsonb("export_restrictions"),
    ...governanceFields(),
  }
);

export const scraperEscalationEvents = pgTable("scraper_escalation_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  escalationId: text("escalation_id").notNull().unique(),
  scraperId: text("scraper_id").notNull(),
  sourceId: text("source_id").notNull(),
  escalationReason: text("escalation_reason").notNull(),
  escalationSeverity: text("escalation_severity").notNull(),
  governanceQueue: text("governance_queue").notNull(),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  containmentActions: jsonb("containment_actions"),
  ...governanceFields(),
});

export const sourceAuthorityRegistry = pgTable("source_authority_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: text("source_id").notNull().unique(),
  sourceName: text("source_name").notNull(),
  sourceAuthorityTier: text("source_authority_tier").notNull(),
  provenanceScore: integer("provenance_score").notNull(),
  replayabilityScore: integer("replayability_score").notNull(),
  institutionalReliability: text("institutional_reliability").notNull(),
  claimsAllowed: jsonb("claims_allowed"),
  connectorCertificationStatus: text("connector_certification_status")
    .notNull()
    .default("PENDING_CERTIFICATION"),
  jurisdictionScope: jsonb("jurisdiction_scope"),
  ...governanceFields(),
});

export const sourceIngestionRecords = pgTable("source_ingestion_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  ingestionRecordId: text("ingestion_record_id").notNull().unique(),
  sourceId: text("source_id").notNull(),
  sourceName: text("source_name").notNull(),
  connectorId: text("connector_id").notNull(),
  contentHash: text("content_hash").notNull(),
  sourceUrl: text("source_url"),
  ingestionStatus: text("ingestion_status").notNull(),
  candidateEvidenceOnly: boolean("candidate_evidence_only")
    .notNull()
    .default(true),
  reviewRequired: boolean("review_required").notNull().default(true),
  scoringUseBlocked: boolean("scoring_use_blocked").notNull().default(true),
  officialUseBlocked: boolean("official_use_blocked").notNull().default(true),
  provenanceEnvelope: jsonb("provenance_envelope"),
  ...governanceFields(),
});

export const sourceReviewRecords = pgTable("source_review_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewRecordId: text("review_record_id").notNull().unique(),
  ingestionRecordId: text("ingestion_record_id").notNull(),
  reviewStatus: text("review_status").notNull(),
  reviewerActorId: text("reviewer_actor_id"),
  reviewFindings: jsonb("review_findings"),
  nextRequiredAction: text("next_required_action").notNull(),
  ...governanceFields(),
});

export const connectorCertificationRecords = pgTable(
  "connector_certification_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    connectorCertificationId: text("connector_certification_id")
      .notNull()
      .unique(),
    connectorId: text("connector_id").notNull(),
    sourceId: text("source_id").notNull(),
    sourceAuthority: text("source_authority").notNull(),
    allowedDataCategories: jsonb("allowed_data_categories"),
    jurisdictionScope: jsonb("jurisdiction_scope"),
    rateLimitProfile: text("rate_limit_profile").notNull(),
    authenticationType: text("authentication_type").notNull(),
    certificationStatus: text("certification_status").notNull(),
    replaySupported: boolean("replay_supported").notNull().default(true),
    fallbackConnector: text("fallback_connector"),
    classificationProfile: text("classification_profile").notNull(),
    liveCallsAllowed: boolean("live_calls_allowed").notNull().default(false),
    ...governanceFields(),
  }
);

export const propertyDiscoveryRegistry = pgTable(
  "property_discovery_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discoverySourceId: text("discovery_source_id").notNull().unique(),
    sourceName: text("source_name").notNull(),
    sourceCategory: text("source_category").notNull(),
    marketFocus: jsonb("market_focus"),
    authorityTier: text("authority_tier").notNull(),
    useBoundary: text("use_boundary").notNull(),
    publicSurfaceAllowed: boolean("public_surface_allowed")
      .notNull()
      .default(true),
    officialUseBlocked: boolean("official_use_blocked").notNull().default(true),
    ...governanceFields(),
  }
);

export const propertyListingRecords = pgTable("property_listing_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingRecordId: text("listing_record_id").notNull().unique(),
  discoverySourceId: text("discovery_source_id").notNull(),
  sourceRecordId: text("source_record_id").notNull(),
  canonicalPropertyId: text("canonical_property_id"),
  sourceUrl: text("source_url").notNull(),
  listingStatus: text("listing_status").notNull(),
  contentHash: text("content_hash").notNull(),
  authorityTier: text("authority_tier").notNull(),
  listingHistory: jsonb("listing_history"),
  advisoryOnly: boolean("advisory_only").notNull().default(true),
  displayedPropertiesAreNotApprovals: boolean(
    "displayed_properties_are_not_approvals"
  )
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const canonicalPropertyRecords = pgTable("canonical_property_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  canonicalPropertyId: text("canonical_property_id").notNull().unique(),
  sourceRecords: jsonb("source_records").notNull(),
  sourceAuthorityTier: text("source_authority_tier").notNull(),
  parcelRefs: jsonb("parcel_refs"),
  geospatialRefs: jsonb("geospatial_refs"),
  provenanceChain: jsonb("provenance_chain").notNull(),
  listingStatus: text("listing_status").notNull(),
  replayRefs: jsonb("replay_refs").notNull(),
  authorityScores: jsonb("authority_scores"),
  listingHistory: jsonb("listing_history"),
  confidenceScore: integer("confidence_score").notNull().default(0),
  institutionalValidationStatus: text("institutional_validation_status")
    .notNull()
    .default("REVIEW_REQUIRED"),
  officialCollateralCertificationBlocked: boolean(
    "official_collateral_certification_blocked"
  )
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const propertySourceAuthorityRecords = pgTable(
  "property_source_authority_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertySourceAuthorityId: text("property_source_authority_id")
      .notNull()
      .unique(),
    sourceId: text("source_id").notNull(),
    sourceAuthorityTier: text("source_authority_tier").notNull(),
    provenanceScore: integer("provenance_score").notNull(),
    replayabilityScore: integer("replayability_score").notNull(),
    institutionalReliability: text("institutional_reliability").notNull(),
    claimsAllowed: jsonb("claims_allowed"),
    ...governanceFields(),
  }
);

export const propertyReplayRefs = pgTable("property_replay_refs", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyReplayId: text("property_replay_id").notNull().unique(),
  canonicalPropertyId: text("canonical_property_id").notNull(),
  sourceRecordRefs: jsonb("source_record_refs").notNull(),
  replayIntegrityStatus: text("replay_integrity_status").notNull(),
  historicalListingReconstructionSupported: boolean(
    "historical_listing_reconstruction_supported"
  )
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const propertyProvenanceRecords = pgTable(
  "property_provenance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyProvenanceId: text("property_provenance_id").notNull().unique(),
    canonicalPropertyId: text("canonical_property_id").notNull(),
    sourceId: text("source_id").notNull(),
    sourceUrl: text("source_url").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
    contentHash: text("content_hash").notNull(),
    connectorId: text("connector_id").notNull(),
    jurisdictionScope: text("jurisdiction_scope"),
    provenanceChain: jsonb("provenance_chain").notNull(),
    ...governanceFields(),
  }
);

export const propertyConflictResolutionEvents = pgTable(
  "property_conflict_resolution_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conflictResolutionId: text("conflict_resolution_id").notNull().unique(),
    canonicalPropertyId: text("canonical_property_id").notNull(),
    conflictType: text("conflict_type").notNull(),
    conflictingSourceRefs: jsonb("conflicting_source_refs").notNull(),
    resolutionStatus: text("resolution_status").notNull(),
    humanReviewRequired: boolean("human_review_required").notNull().default(true),
    selectedAuthorityBasis: text("selected_authority_basis"),
    ...governanceFields(),
  }
);

export const propertyClassificationEvents = pgTable(
  "property_classification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyClassificationId: text("property_classification_id")
      .notNull()
      .unique(),
    canonicalPropertyId: text("canonical_property_id").notNull(),
    classificationProfile: text("classification_profile").notNull(),
    disclosureAudience: jsonb("disclosure_audience"),
    exportRestrictions: jsonb("export_restrictions"),
    claimsRestrictions: jsonb("claims_restrictions"),
    ...governanceFields(),
  }
);

export const propertyReviewEvents = pgTable("property_review_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyReviewId: text("property_review_id").notNull().unique(),
  canonicalPropertyId: text("canonical_property_id").notNull(),
  reviewStatus: text("review_status").notNull(),
  reviewerActorId: text("reviewer_actor_id"),
  institutionalValidationSources: jsonb("institutional_validation_sources"),
  reviewFindings: jsonb("review_findings"),
  nextRequiredAction: text("next_required_action").notNull(),
  ...governanceFields(),
});

export const classificationEvents = pgTable("classification_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  classificationEventId: text("classification_event_id").notNull().unique(),
  recordType: text("record_type").notNull(),
  recordId: text("record_id").notNull(),
  classificationProfile: text("classification_profile").notNull(),
  classificationBasis: text("classification_basis").notNull(),
  disclosureAudience: jsonb("disclosure_audience"),
  exportRestrictions: jsonb("export_restrictions"),
  redactionRequirements: jsonb("redaction_requirements"),
  ...governanceFields(),
});
