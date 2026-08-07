import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Canonical Audit Events Schema
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes the canonical audit event authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports evidentiary records, classification metadata,
 *   compliance posture, and regulated audit review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides a deterministic Drizzle table surface for audit events.
 *
 * - Vol IV: Operational Runbooks
 *   Supports inspection, repair, recovery, and replay workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, observability, explainability, anomaly detection,
 *   version governance, and future citation lineage.
 */

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey(),

  userId: uuid("user_id").notNull(),

  eventType: text("event_type"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),

  decision: text("decision"),
  compositeScore: integer("composite_score"),
  riskScore: integer("risk_score"),

  input: jsonb("input"),
  output: jsonb("output").notNull(),
  trace: jsonb("trace"),

  payload: jsonb("payload"),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash"),

  /**
   * Legacy compatibility alias.
   * Some repair routes/scripts still write `hash`.
   * Canonical future field is `eventHash`.
   */
  hash: text("hash"),

  classification: text("classification"),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});
