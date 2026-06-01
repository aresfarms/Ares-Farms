import {
  bigint,
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Ledger Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes governed canonical ledger authority.
 * - Vol II: Supports regulated evidentiary records and classification metadata.
 * - Vol III: Represents Option C canonical ledger promotion/version switching.
 * - Vol IV: Enables operational ledger inspection, recovery, rebuild, and rollback.
 * - Vol V: Supports replayability, versioning, observability, explainability,
 *   anomaly review, and future simulation/sandbox equivalence.
 *
 * Purpose:
 * These tables reflect the durable ledger reality in the backend:
 * - `canonical_ledger` is the promoted canonical read surface.
 * - `canonical_ledger_v2` is the current cryptographic write path.
 * - `canonical_ledger_staging` supports controlled promotion.
 * - promotion and rebuild lock tables support operational safety.
 */

function canonicalLedgerColumns() {
  return {
    id: text("id").primaryKey(),

    sequence: integer("sequence"),

    userId: text("user_id"),
    eventType: text("event_type"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    decision: text("decision"),

    compositeScore: numeric("composite_score"),
    riskScore: numeric("risk_score"),

    input: jsonb("input"),
    output: jsonb("output"),
    trace: jsonb("trace"),
    payload: jsonb("payload"),

    prevHash: text("prev_hash"),
    eventHash: text("event_hash"),

    version: text("version"),
    classification: text("classification"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  };
}

export const canonicalLedger = pgTable(
  "canonical_ledger",
  canonicalLedgerColumns()
);

export const ledger = canonicalLedger;

export const canonicalLedgerV2 = pgTable(
  "canonical_ledger_v2",
  canonicalLedgerColumns()
);

export const canonicalLedgerStaging = pgTable(
  "canonical_ledger_staging",
  canonicalLedgerColumns()
);

export const canonicalPromotionEvents = pgTable("canonical_promotion_events", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  eventType: text("event_type").notNull(),
  status: text("status").notNull(),
  versionFrom: integer("version_from"),
  versionTo: integer("version_to"),
  metadata: jsonb("metadata"),
  eventHash: text("event_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const canonicalRebuildLock = pgTable("canonical_rebuild_lock", {
  id: text("id").primaryKey(),
  locked: boolean("locked").notNull().default(false),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: text("locked_by"),
});
