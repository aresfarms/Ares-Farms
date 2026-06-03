import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Report Record Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes accountable authority for report generation records.
 * - Vol II: Preserves borrower, application, disclosure, advisory-only,
 *   human-review, and regulatory-use boundaries.
 * - Vol III: Provides durable replay-safe report state before reports are
 *   exposed through dashboards, borrower portals, or export workflows.
 * - Vol IV: Supports reporting review, escalation, retention, audit
 *   preparation, and operational evidence preservation.
 * - Vol V: Supports classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and export governance.
 */

export const reportRecords = pgTable("report_records", {
  id: uuid("id").defaultRandom().primaryKey(),

  reportId: text("report_id").notNull(),
  reportType: text("report_type").notNull(),
  reportStatus: text("report_status")
    .notNull()
    .default("GENERATED_ADVISORY_REVIEW_REQUIRED"),

  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  actorId: text("actor_id"),

  reportTitle: text("report_title"),
  advisory: text("advisory"),
  advisoryOnly: boolean("advisory_only").notNull().default(true),
  officialUseAllowed: boolean("official_use_allowed").notNull().default(false),
  borrowerDisclosureAllowed: boolean("borrower_disclosure_allowed")
    .notNull()
    .default(false),
  humanReviewRequired: boolean("human_review_required")
    .notNull()
    .default(true),
  externalReportGenerated: boolean("external_report_generated")
    .notNull()
    .default(false),

  requestPayload: jsonb("request_payload"),
  reportPayload: jsonb("report_payload"),
  outputSummary: jsonb("output_summary"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  exportedAt: timestamp("exported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
