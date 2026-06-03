import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Rule and Overlay Registry Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes constitutional rule and overlay authority.
 * - Vol II: Preserves regulated eligibility, review, fair-lending,
 *   adverse-action, and human-review boundaries.
 * - Vol III: Provides durable replay-safe rule and overlay evaluation state.
 * - Vol IV: Supports operator review, escalation, amendment handling,
 *   exception review, and audit preparation.
 * - Vol V: Supports canonical rule versioning, overlay resolution,
 *   explainability, classification, replay, observability, and source authority.
 */

export const ruleDefinitions = pgTable("rule_definitions", {
  id: text("id").primaryKey(),
  ruleName: text("rule_name").notNull(),
  ruleDomain: text("rule_domain").notNull(),
  ruleType: text("rule_type").notNull(),
  ruleVersion: text("rule_version").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  authorityLevel: text("authority_level").notNull(),
  decisionUse: text("decision_use").notNull(),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  source: text("source"),
  metadata: jsonb("metadata"),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow(),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const overlayDefinitions = pgTable("overlay_definitions", {
  id: text("id").primaryKey(),
  overlayName: text("overlay_name").notNull(),
  overlayTier: text("overlay_tier").notNull(),
  overlayScope: text("overlay_scope").notNull(),
  effect: text("effect").notNull(),
  priority: integer("priority").notNull(),
  overlayVersion: text("overlay_version").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  ruleId: text("rule_id"),
  authorityLevel: text("authority_level").notNull(),
  rationale: text("rationale").notNull(),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  source: text("source"),
  metadata: jsonb("metadata"),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow(),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const ruleEvaluationRuns = pgTable("rule_evaluation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  operation: text("operation").notNull(),
  subjectId: text("subject_id"),
  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  actorId: text("actor_id"),
  ruleIds: jsonb("rule_ids"),
  overlayIds: jsonb("overlay_ids"),
  appliedOverlayId: text("applied_overlay_id"),
  finalEffect: text("final_effect").notNull(),
  resultStatus: text("result_status").notNull(),
  advisoryOnly: boolean("advisory_only").notNull().default(true),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  inputSnapshot: jsonb("input_snapshot"),
  evaluationResult: jsonb("evaluation_result"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
