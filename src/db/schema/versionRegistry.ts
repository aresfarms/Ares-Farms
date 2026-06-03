import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Version Registry
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional amendment and doctrine lineage.
 * - Vol II: Tracks regulatory policy, eligibility, and compliance versions.
 * - Vol III: Provides versioned schema, rule, model, API, ledger, and runtime state.
 * - Vol IV: Supports rollback, recovery, release, and promotion procedures.
 * - Vol V: Implements canonical versioning and replay reconstruction doctrine.
 *
 * Purpose:
 * This table records the version references that governed runtime outputs cite.
 * It allows future replay and examination to prove which schema, runtime,
 * policy, overlay, model, connector, or ledger version produced an action.
 */

export const versionRegistry = pgTable("version_registry", {
  id: uuid("id").defaultRandom().primaryKey(),

  versionDomain: text("version_domain").notNull(),
  version: text("version").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("active"),

  effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow(),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),

  governanceVersion: text("governance_version").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
