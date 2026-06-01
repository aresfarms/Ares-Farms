import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Canonical Pipeline Schema
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional traceability for decision-adjacent workflows.
 * - Vol II: Supports regulated scoring, eligibility, and adverse-action review.
 * - Vol III: Captures deterministic pipeline execution, stage events, and replay.
 * - Vol IV: Supports operational inspection, repair, rollback, and escalation.
 * - Vol V: Supports explainability, observability, versioning, replay, and classification.
 *
 * Purpose:
 * These tables record governed pipeline runs, stage events, replay snapshots,
 * and rule traces. Runtime trace identifiers are text because the platform uses
 * semantic replay IDs such as `decision-...`, `rank-...`, and `checkout-...`.
 */

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").defaultRandom().primaryKey(),

  traceId: text("trace_id").notNull(),
  replayRef: text("replay_ref").notNull(),
  tenantId: text("tenant_id"),
  userId: text("user_id"),

  pipelineVersion: text("pipeline_version").notNull(),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),

  status: text("status").notNull().default("pending"),
  finalDecision: text("final_decision"),
  compositeScore: integer("composite_score"),
  riskScore: integer("risk_score"),

  input: jsonb("input"),
  output: jsonb("output"),
  metadata: jsonb("metadata"),

  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const pipelineEvents = pgTable("pipeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  traceId: text("trace_id").notNull(),
  replayRef: text("replay_ref").notNull(),
  sequence: integer("sequence").notNull(),
  stage: text("stage").notNull(),
  eventType: text("event_type").notNull(),

  payload: jsonb("payload").notNull(),
  classification: text("classification").notNull(),
  versionRef: text("version_ref"),
  governanceVersion: text("governance_version").notNull(),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const pipelineReplays = pgTable("pipeline_replays", {
  id: uuid("id").defaultRandom().primaryKey(),

  traceId: text("trace_id").notNull(),
  replayRef: text("replay_ref").notNull(),
  snapshot: jsonb("snapshot").notNull(),

  pipelineVersion: text("pipeline_version").notNull(),
  governanceVersion: text("governance_version").notNull(),
  verificationStatus: text("verification_status").notNull().default("pending"),
  deterministic: boolean("deterministic").notNull().default(false),
  mismatchCount: integer("mismatch_count").notNull().default(0),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const pipelineRuleTrace = pgTable("pipeline_rule_trace", {
  id: uuid("id").defaultRandom().primaryKey(),

  traceId: text("trace_id").notNull(),
  replayRef: text("replay_ref").notNull(),
  layer: text("layer").notNull(),
  rule: text("rule").notNull(),
  impact: text("impact").notNull(),

  before: text("before"),
  after: text("after"),
  reason: text("reason"),
  sourceVersion: text("source_version"),
  governanceVersion: text("governance_version").notNull(),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
