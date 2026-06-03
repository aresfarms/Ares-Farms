import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Replay Verification Schema
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional auditability and decision reconstruction.
 * - Vol II: Supports regulated examination, adverse action review, and evidence.
 * - Vol III: Makes replay verification a deployment gate, not a later audit task.
 * - Vol IV: Supports recovery, repair, rollback, and operational runbooks.
 * - Vol V: Implements replayability, versioning, observability, and lineage doctrine.
 *
 * Purpose:
 * This table stores replay verification results for ledgers, decisions, reports,
 * ranking outputs, exports, connectors, and other governed runtime artifacts.
 */

export const replayVerification = pgTable("replay_verification", {
  id: uuid("id").defaultRandom().primaryKey(),

  traceId: text("trace_id").notNull(),
  replayRef: text("replay_ref").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),

  verificationStatus: text("verification_status").notNull(),
  deterministic: boolean("deterministic").notNull().default(false),
  replaySafe: boolean("replay_safe").notNull().default(false),

  sourceVersion: text("source_version").notNull(),
  replayVersion: text("replay_version").notNull(),
  governanceVersion: text("governance_version").notNull(),

  eventCount: integer("event_count").notNull().default(0),
  mismatchCount: integer("mismatch_count").notNull().default(0),
  result: jsonb("result"),
  metadata: jsonb("metadata"),

  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
