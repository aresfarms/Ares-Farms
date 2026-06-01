import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Observability Events Schema
 *
 * Master Volume Governance:
 * - Vol I: Supports audit openness and operational accountability.
 * - Vol II: Provides compliance evidence and examination-ready event context.
 * - Vol III: Captures replay-safe runtime telemetry and anomaly signals.
 * - Vol IV: Supports incident response, escalation, monitoring, and recovery.
 * - Vol V: Implements observability, anomaly detection, and replay doctrine.
 *
 * Purpose:
 * This table stores material runtime and operational events emitted by governed
 * backend routes and services. It is the durable counterpart to the in-memory
 * observability objects returned by API responses during stabilization.
 */

export const observabilityEvents = pgTable("observability_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventType: text("event_type").notNull(),
  domain: text("domain").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),

  traceId: text("trace_id").notNull(),
  replayRef: text("replay_ref"),
  actorId: text("actor_id"),
  module: text("module"),

  anomalyCandidate: boolean("anomaly_candidate").notNull().default(false),
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),

  governanceVersion: text("governance_version").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
