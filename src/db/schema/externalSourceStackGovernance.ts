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
 * External Source Stack Governance Schema
 *
 * Master Volume Governance:
 * - Vol I: Keeps all external source discovery subordinate to constitutional
 *   source authority and module boundaries.
 * - Vol II: Prevents source discovery, marketplace data, programs, equipment,
 *   geospatial data, or pricing signals from becoming regulated truth,
 *   underwriting evidence, legal advice, or public certainty claims.
 * - Vol III: Preserves source tiering, connector certification, deterministic
 *   replay, canonicalization, conflict preservation, freshness, and lineage.
 * - Vol III-B: Provides durable runtime, classification, observability, queue,
 *   retry, and escalation evidence for source stack operations.
 * - Vol IV: Supports degraded-source handling, stale-source remediation,
 *   failover, human review, and incident runbooks.
 * - Vol V: Enforces source authority, replayability, claims restrictions,
 *   public DTO safety, controlled disclosure, and canonicalization doctrine.
 *
 * Supplemental governing inputs:
 * - SOURCE_STACK_001_Canonical_External_Source_Discovery_Architecture.docx
 * - IMPLEMENTATION_WORKPACKAGES_Revenue_Intelligence_Runtime_Build.docx
 */

function governanceFields() {
  return {
    governanceVersion: text("governance_version").notNull(),
    classificationLevel: text("classification_level").notNull(),
    replayRef: text("replay_ref").notNull(),
    traceId: text("trace_id"),
    sourceRefs: jsonb("source_refs"),
    replayRefs: jsonb("replay_refs"),
    claimsRestrictions: jsonb("claims_restrictions"),
    humanReviewRequired: boolean("human_review_required").notNull().default(true),
    productionBlocked: boolean("production_blocked").notNull().default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  };
}

export const sourceRegistry = pgTable("source_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: text("source_id").notNull().unique(),
  sourceName: text("source_name").notNull(),
  sourceCategory: text("source_category").notNull(),
  sourceAuthorityTier: text("source_authority_tier").notNull(),
  jurisdictionScope: jsonb("jurisdiction_scope").notNull(),
  licensingRestrictions: jsonb("licensing_restrictions").notNull(),
  provenanceScore: integer("provenance_score").notNull(),
  replayabilityScore: integer("replayability_score").notNull(),
  freshnessCadence: text("freshness_cadence").notNull(),
  liveFetchAllowed: boolean("live_fetch_allowed").notNull().default(false),
  ...governanceFields(),
});

export const connectorRegistry = pgTable("connector_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectorId: text("connector_id").notNull().unique(),
  sourceId: text("source_id").notNull(),
  connectorType: text("connector_type").notNull(),
  certificationStatus: text("certification_status").notNull(),
  queueProfile: text("queue_profile").notNull(),
  retryGovernanceProfile: text("retry_governance_profile").notNull(),
  proxyHandlingProfile: text("proxy_handling_profile").notNull(),
  failoverSourceRefs: jsonb("failover_source_refs"),
  liveCallsAllowed: boolean("live_calls_allowed").notNull().default(false),
  ...governanceFields(),
});

export const canonicalEntities = pgTable("canonical_entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  canonicalEntityId: text("canonical_entity_id").notNull().unique(),
  entityType: text("entity_type").notNull(),
  canonicalRef: text("canonical_ref").notNull(),
  sourceRecordRefs: jsonb("source_record_refs").notNull(),
  sourceWeighting: jsonb("source_weighting").notNull(),
  lineage: jsonb("lineage").notNull(),
  historicalSnapshots: jsonb("historical_snapshots").notNull(),
  conflictRefs: jsonb("conflict_refs"),
  canonicalizationStatus: text("canonicalization_status").notNull(),
  ...governanceFields(),
});

export const sourceConflictEvents = pgTable("source_conflict_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  conflictEventId: text("conflict_event_id").notNull().unique(),
  entityType: text("entity_type").notNull(),
  entityRef: text("entity_ref").notNull(),
  conflictType: text("conflict_type").notNull(),
  conflictingSourceRefs: jsonb("conflicting_source_refs").notNull(),
  conflictSummary: text("conflict_summary").notNull(),
  arbitrationStatus: text("arbitration_status").notNull(),
  escalationQueue: text("escalation_queue").notNull(),
  ...governanceFields(),
});

export const geoIntelligenceRegistry = pgTable("geo_intelligence_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  geoIntelligenceId: text("geo_intelligence_id").notNull().unique(),
  geographyScope: text("geography_scope").notNull(),
  layerType: text("layer_type").notNull(),
  sourceId: text("source_id").notNull(),
  sourceAuthorityTier: text("source_authority_tier").notNull(),
  freshnessStatus: text("freshness_status").notNull(),
  postgisReady: boolean("postgis_ready").notNull().default(false),
  vectorTileReady: boolean("vector_tile_ready").notNull().default(false),
  ...governanceFields(),
});

export const equipmentRegistry = pgTable("equipment_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  equipmentId: text("equipment_id").notNull().unique(),
  category: text("category").notNull(),
  marketplaceSourceRefs: jsonb("marketplace_source_refs").notNull(),
  priceSnapshotRefs: jsonb("price_snapshot_refs").notNull(),
  programUseRefs: jsonb("program_use_refs"),
  canonicalEquipmentRef: text("canonical_equipment_ref"),
  availabilityRegion: jsonb("availability_region").notNull(),
  financeabilityClaimBlocked: boolean("financeability_claim_blocked")
    .notNull()
    .default(true),
  ...governanceFields(),
});

export const sourceFreshnessRecords = pgTable("source_freshness_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  freshnessRecordId: text("freshness_record_id").notNull().unique(),
  sourceId: text("source_id").notNull(),
  freshnessStatus: text("freshness_status").notNull(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  nextCheckDueAt: timestamp("next_check_due_at", { withTimezone: true }),
  staleSourceDetected: boolean("stale_source_detected").notNull().default(false),
  remediationRequired: boolean("remediation_required").notNull().default(true),
  ...governanceFields(),
});

export const sourceFailoverEvents = pgTable("source_failover_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  failoverEventId: text("failover_event_id").notNull().unique(),
  primarySourceId: text("primary_source_id").notNull(),
  fallbackSourceId: text("fallback_source_id").notNull(),
  failoverReason: text("failover_reason").notNull(),
  failoverStatus: text("failover_status").notNull(),
  liveFetchPerformed: boolean("live_fetch_performed").notNull().default(false),
  ...governanceFields(),
});

export const sourceQueueHealthEvents = pgTable("source_queue_health_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  queueHealthEventId: text("queue_health_event_id").notNull().unique(),
  queueName: text("queue_name").notNull(),
  queueStatus: text("queue_status").notNull(),
  pendingCount: integer("pending_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  retryCount: integer("retry_count").notNull().default(0),
  anomalyDetected: boolean("anomaly_detected").notNull().default(false),
  ...governanceFields(),
});

export const sourceCanonicalizationEvents = pgTable(
  "source_canonicalization_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    canonicalizationEventId: text("canonicalization_event_id")
      .notNull()
      .unique(),
    entityType: text("entity_type").notNull(),
    sourceRecordRef: text("source_record_ref").notNull(),
    canonicalEntityRef: text("canonical_entity_ref").notNull(),
    deduplicationStatus: text("deduplication_status").notNull(),
    fuzzyMatchScore: integer("fuzzy_match_score").notNull().default(0),
    conflictPreserved: boolean("conflict_preserved").notNull().default(true),
    ...governanceFields(),
  }
);
