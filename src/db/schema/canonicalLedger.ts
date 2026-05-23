import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Canonical Ledger Schema
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes the governed canonical ledger table authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulated evidentiary records and classification-aware metadata.
 *
 * - Vol III: Technical Infrastructure
 *   Provides a deterministic Drizzle schema surface for canonical replay.
 *
 * - Vol IV: Operational Runbooks
 *   Enables operational ledger inspection, recovery, and validation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Supports replayability, versioning, observability, explainability,
 *   anomaly review, and future simulation/sandbox equivalence.
 *
 * Purpose:
 * This table represents the canonical replayable ledger view.
 */

export const ledger = pgTable("canonical_ledger", {
  id: uuid("id").primaryKey(),
  sequence: integer("sequence").notNull(),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  payload: jsonb("payload"),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  version: text("version"),
  classification: text("classification"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const canonicalLedger = ledger;
