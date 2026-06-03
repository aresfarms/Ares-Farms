import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Applications Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes governed borrower/application state authority.
 * - Vol II: Preserves regulated application context and review posture.
 * - Vol III: Provides durable replay-safe application persistence.
 * - Vol IV: Supports intake review, escalation, recovery, and operator workflows.
 * - Vol V: Supports classification, versioning, source authority,
 *   replayability, observability, and evidence preservation.
 */

export const applications = pgTable("applications", {
  id: text("id").primaryKey(),

  userId: text("user_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  propertyId: uuid("property_id"),

  status: text("status").notNull().default("INTAKE_RECEIVED"),
  reviewStatus: text("review_status").notNull().default("REVIEW_REQUIRED"),
  decisionStatus: text("decision_status").notNull().default("PENDING_REVIEW"),

  requestedAmount: text("requested_amount"),
  requestedPrograms: jsonb("requested_programs"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  source: text("source"),

  payload: jsonb("payload"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
