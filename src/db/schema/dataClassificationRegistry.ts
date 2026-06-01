import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Data Classification Registry
 *
 * Master Volume Governance:
 * - Vol I: Enforces privacy, source authority, and data-handling boundaries.
 * - Vol II: Supports GLBA, ECOA, regulated disclosure, and retention controls.
 * - Vol III: Provides classification metadata for schemas, records, and replay.
 * - Vol IV: Supports operational review, export handling, and incident response.
 * - Vol V: Implements CANON-CLASS-001 classification and sensitivity doctrine.
 *
 * Purpose:
 * This table is the durable classification authority for governed data objects.
 * Runtime classification metadata can point here when records, reports, exports,
 * replay outputs, or connector payloads need persistent sensitivity context.
 */

export const dataClassificationRegistry = pgTable(
  "data_classification_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),

    classificationLevel: text("classification_level").notNull(),
    sensitivityScope: text("sensitivity_scope").notNull(),
    jurisdictionScope: jsonb("jurisdiction_scope"),
    disclosureAudience: jsonb("disclosure_audience"),
    sharingPermissions: jsonb("sharing_permissions"),
    aiUsagePermissions: jsonb("ai_usage_permissions"),
    exportRestrictions: jsonb("export_restrictions"),
    redactionRequirements: jsonb("redaction_requirements"),
    consentRequirements: jsonb("consent_requirements"),

    retentionRequirement: text("retention_requirement").notNull(),
    legalHoldStatus: boolean("legal_hold_status").notNull().default(false),
    vaultRequired: boolean("vault_required").notNull().default(false),

    classificationSource: text("classification_source").notNull(),
    classificationVersion: text("classification_version").notNull(),
    governanceVersion: text("governance_version").notNull(),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),

    metadata: jsonb("metadata"),
    classifiedAt: timestamp("classified_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
