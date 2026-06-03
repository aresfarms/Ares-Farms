import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Certified Connector Adapter Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes constitutional authority for connector promotion.
 * - Vol II: Prevents unapproved USDA, SBA, property, borrower, or
 *   institutional source reliance in regulated workflows.
 * - Vol III: Provides replay-safe, schema-aware adapter certification state.
 * - Vol IV: Supports credential review, outage handling, escalation,
 *   isolation, and operational audit preparation.
 * - Vol V: Supports source authority, consent, classification, replay,
 *   observability, version lineage, and evidence preservation.
 */

export const certifiedConnectorAdapters = pgTable(
  "certified_connector_adapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adapterId: text("adapter_id").notNull(),
    adapterName: text("adapter_name").notNull(),
    adapterType: text("adapter_type").notNull(),

    sourceId: text("source_id").notNull(),
    sourceName: text("source_name").notNull(),
    sourceType: text("source_type").notNull(),
    sourceAuthorityRef: text("source_authority_ref"),

    certificationStatus: text("certification_status")
      .notNull()
      .default("PENDING_CERTIFICATION"),
    liveCallsAllowed: boolean("live_calls_allowed").notNull().default(false),

    credentialRef: text("credential_ref"),
    credentialStatus: text("credential_status").notNull().default("MISSING"),
    credentialVaultRequired: boolean("credential_vault_required")
      .notNull()
      .default(true),

    outagePolicyRef: text("outage_policy_ref"),
    outageStatus: text("outage_status").notNull().default("NOT_TESTED"),

    replayPolicyRef: text("replay_policy_ref"),
    replayStatus: text("replay_status").notNull().default("NOT_VERIFIED"),

    schemaContractVersion: text("schema_contract_version"),
    connectorConsentRequired: boolean("connector_consent_required")
      .notNull()
      .default(true),
    isolationRequired: boolean("isolation_required").notNull().default(true),
    humanReviewRequired: boolean("human_review_required").notNull().default(true),

    lastCertifiedAt: timestamp("last_certified_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

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
