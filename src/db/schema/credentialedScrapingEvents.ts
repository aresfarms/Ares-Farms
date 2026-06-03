import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Credentialed Scraping Event Schema
 *
 * Master Volume Governance:
 * - Vol I §3.37: preserves Credentialed Agency Ingestion authorization,
 *   scope, ToS attestation, isolation, provenance, and circuit-breaker state.
 * - Vol II §3.25: enforces ToS compliance, license governance, data
 *   isolation/residency, and anti-bulk-acquisition controls.
 * - Vol III TECH-CONN-001: implements credentialed_scraping_events as the
 *   immutable connector event for authenticated external acquisition.
 * - Vol IV OPS-CONN-002: supports pre-session checks and mandatory SEV-2
 *   circuit-breaker escalation.
 * - Vol V CANON-EXTSOURCE-001: preserves source type, source trust,
 *   provenance, replayability, and AI tier constraints.
 */

export const credentialedScrapingEvents = pgTable(
  "credentialed_scraping_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    scrapingEventId: text("scraping_event_id").notNull().unique(),
    initiatingActorId: text("initiating_actor_id").notNull(),
    externalTargetDomain: text("external_target_domain").notNull(),
    licenseIdentifierRef: text("license_identifier_ref").notNull(),
    applicationIdScope: text("application_id_scope").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),

    acquisitionMethod: text("acquisition_method").notNull(),
    sourceType: text("source_type").notNull(),
    sourceTrustClassification: text("source_trust_classification")
      .notNull()
      .default("ADVISORY"),
    requestedDataCategories: jsonb("requested_data_categories"),
    humanAuthorizationRef: text("human_authorization_ref"),
    sourceAuthorityRef: text("source_authority_ref"),
    dataResidencyZone: text("data_residency_zone"),
    sovereigntyClassification: text("sovereignty_classification"),

    ingestedPayloadHash: text("ingested_payload_hash"),
    provenanceEnvelopeRef: text("provenance_envelope_ref"),
    tosComplianceAttestation: boolean("tos_compliance_attestation")
      .notNull()
      .default(false),
    tosComplianceAttestationRef: text("tos_compliance_attestation_ref"),
    licenseBoundaryConfirmed: boolean("license_boundary_confirmed")
      .notNull()
      .default(false),
    whitelistVerified: boolean("whitelist_verified")
      .notNull()
      .default(false),
    baselineSyncLogged: boolean("baseline_sync_logged")
      .notNull()
      .default(false),
    isolationBoundaryConfirmed: boolean(
      "isolation_boundary_confirmed"
    )
      .notNull()
      .default(false),
    credentialValid: boolean("credential_valid").notNull().default(false),
    credentialExpired: boolean("credential_expired")
      .notNull()
      .default(false),
    credentialRevoked: boolean("credential_revoked")
      .notNull()
      .default(false),
    circuitBreakerTriggered: boolean("circuit_breaker_triggered")
      .notNull()
      .default(false),
    sev2EventRef: text("sev2_event_ref"),

    sessionOutcome: text("session_outcome")
      .notNull()
      .default("ABORTED"),
    readyForSession: boolean("ready_for_session").notNull().default(false),
    externalRequestTransmitted: boolean("external_request_transmitted")
      .notNull()
      .default(false),
    dataProcessedByEngine: boolean("data_processed_by_engine")
      .notNull()
      .default(false),
    bulkAcquisitionRequested: boolean("bulk_acquisition_requested")
      .notNull()
      .default(false),
    antiBulkAcquisitionSatisfied: boolean(
      "anti_bulk_acquisition_satisfied"
    )
      .notNull()
      .default(false),
    aiTier: text("ai_tier").notNull().default("TIER_1_ADVISORY"),

    gateSnapshot: jsonb("gate_snapshot"),
    blockerReasons: jsonb("blocker_reasons"),

    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull(),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    source: text("source"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
