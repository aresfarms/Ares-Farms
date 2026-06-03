import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Schema Registry
 *
 * Master Volume Governance:
 * - Vol I: Establishes constitutional schema authority and amendment lineage.
 * - Vol II: Preserves regulated schema provenance and compliance review context.
 * - Vol III: Enforces schema singularity, schema versioning, and deterministic replay.
 * - Vol IV: Supports migration runbooks, rollback, recovery, and operational review.
 * - Vol V: Supports canonical source control, versioning, replay, and observability.
 *
 * Purpose:
 * This table records every governed schema surface that is allowed to define
 * institutional state. It is the durable registry used to prevent hidden or
 * duplicate schema paths from becoming authoritative.
 */

export const schemaRegistry = pgTable("schema_registry", {
  id: uuid("id").defaultRandom().primaryKey(),

  schemaName: text("schema_name").notNull(),
  schemaVersion: text("schema_version").notNull(),
  schemaPath: text("schema_path").notNull(),
  schemaDomain: text("schema_domain").notNull(),

  status: text("status").notNull().default("active"),
  checksum: text("checksum"),
  ownerModule: text("owner_module"),

  governanceVersion: text("governance_version").notNull(),
  replayRef: text("replay_ref"),

  metadata: jsonb("metadata"),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow(),
  deprecatedAt: timestamp("deprecated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
