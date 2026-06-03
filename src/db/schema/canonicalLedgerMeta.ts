import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Ledger Metadata Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes constitutional ledger authority and promotion control.
 * - Vol II: Preserves evidentiary review context for regulated records.
 * - Vol III: Supports Option C promotion, replay, version switching, and recovery.
 * - Vol IV: Supports operational promotion, rollback, repair, and incident runbooks.
 * - Vol V: Supports canonical versioning, replayability, observability, and lineage.
 *
 * Purpose:
 * This table records canonical ledger promotion state and active ledger lineage.
 * It preserves the legacy Option C metadata columns already present in the
 * database while adding governed promotion/replay fields for the backend spine.
 */

export const canonicalLedgerMeta = pgTable("canonical_ledger_meta", {
  id: text("id").primaryKey(),

  activeVersion: integer("active_version"),
  lastBuiltAt: timestamp("last_built_at", { withTimezone: true }),
  lastHash: text("last_hash"),
  status: text("status"),

  activeLedgerVersion: text("active_ledger_version"),
  previousLedgerVersion: text("previous_ledger_version"),
  promotionStatus: text("promotion_status"),
  sourceTable: text("source_table"),
  targetTable: text("target_table"),

  promotionTraceId: text("promotion_trace_id"),
  replayRef: text("replay_ref"),
  verificationRef: text("verification_ref"),
  promotedBy: text("promoted_by"),

  replayVerified: boolean("replay_verified").notNull().default(false),
  rollbackAvailable: boolean("rollback_available").notNull().default(false),

  governanceVersion: text("governance_version"),
  metadata: jsonb("metadata"),
  promotedAt: timestamp("promoted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
