import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical External Data Connector Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes governed source authority for external data.
 * - Vol II: Preserves regulatory boundaries for USDA, SBA, property,
 *   borrower, and institutional data use.
 * - Vol III: Provides replay-safe connector request persistence before live
 *   connector execution is allowed.
 * - Vol IV: Supports connector review, escalation, outage handling,
 *   certification, and audit preparation.
 * - Vol V: Supports source authority, classification, consent, replay,
 *   observability, version lineage, and evidence preservation.
 */

export const externalDataSources = pgTable("external_data_sources", {
  id: text("id").primaryKey(),
  sourceName: text("source_name").notNull(),
  sourceType: text("source_type").notNull(),
  authorityLevel: text("authority_level").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  liveCallsAllowed: boolean("live_calls_allowed").notNull().default(false),
  baseUrl: text("base_url"),
  sourceVersion: text("source_version").notNull(),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const externalDataConnectorRuns = pgTable("external_data_connector_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: text("source_id").notNull(),
  sourceName: text("source_name").notNull(),
  connectorType: text("connector_type").notNull(),
  queryType: text("query_type").notNull(),

  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  propertyId: uuid("property_id"),
  actorId: text("actor_id"),

  status: text("status").notNull(),
  liveCallPerformed: boolean("live_call_performed").notNull().default(false),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),

  requestPayload: jsonb("request_payload"),
  normalizedResult: jsonb("normalized_result"),

  sourceVersion: text("source_version").notNull(),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  metadata: jsonb("metadata"),

  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
