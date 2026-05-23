import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Schema Source
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes one authoritative backend schema spine.
 *
 * - Vol II: Regulatory Governance
 *   Supports classification-aware data governance and controlled onboarding.
 *
 * - Vol III: Technical Infrastructure
 *   Prevents schema drift and duplicate infrastructure paths.
 *
 * - Vol IV: Operational Runbooks
 *   Enables predictable operational recovery and replay.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Supports canonical replay, versioning, observability, explainability,
 *   classification, and future simulation/sandbox controls.
 *
 * Build Rule:
 * This file is the ONLY public schema export surface.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  name: text("name"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  county: text("county"),
  country: text("country"),
  federalRegion: text("federal_region"),
  internalRegion: text("internal_region"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Canonical governance schema modules.
 */

export * from "./auditEvents";
export * from "./canonicalLedger";
export * from "./canonicalLedgerMeta";
export * from "./schemaRegistry";
export * from "./versionRegistry";
export * from "./dataClassificationRegistry";
export * from "./observabilityEvents";
export * from "./replayVerification";
