import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Human Review and Adverse Action Workflow Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes accountable human review authority before regulated
 *   outcomes can become final.
 * - Vol II: Preserves borrower protection, adverse-action, explanation,
 *   appeal, and fair-lending review boundaries.
 * - Vol III: Provides durable replay-safe review workflow persistence.
 * - Vol IV: Supports operator queues, escalation, review assignment,
 *   recovery, and audit preparation.
 * - Vol V: Supports explainability, classification, observability, replay,
 *   source authority, versioning, and evidence preservation.
 */

export const humanReviewWorkflows = pgTable("human_review_workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  actorId: text("actor_id"),

  reviewType: text("review_type").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  sourceTraceId: text("source_trace_id"),

  status: text("status").notNull().default("QUEUED_FOR_HUMAN_REVIEW"),
  priority: text("priority").notNull().default("NORMAL"),
  requiredReviewerRole: text("required_reviewer_role").notNull(),
  assignedTo: text("assigned_to"),
  escalationStatus: text("escalation_status").notNull().default("NOT_ESCALATED"),

  candidateOutcome: text("candidate_outcome").notNull().default("REVIEW_REQUIRED"),
  advisoryOnly: boolean("advisory_only").notNull().default(true),
  finalActionAllowed: boolean("final_action_allowed").notNull().default(false),
  adverseActionCandidate: boolean("adverse_action_candidate").notNull().default(false),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  dueAt: timestamp("due_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const adverseActionReviews = pgTable("adverse_action_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  humanReviewWorkflowId: uuid("human_review_workflow_id").notNull(),
  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  actorId: text("actor_id"),

  candidateOutcome: text("candidate_outcome").notNull(),
  adverseActionStatus: text("adverse_action_status")
    .notNull()
    .default("CANDIDATE_REVIEW_PENDING"),
  noticeStatus: text("notice_status").notNull().default("NOT_A_NOTICE"),
  reasonCodes: jsonb("reason_codes"),
  explanationSummary: text("explanation_summary"),
  appealStatus: text("appeal_status").notNull().default("APPEAL_RIGHTS_PENDING"),

  advisoryOnly: boolean("advisory_only").notNull().default(true),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  finalActionAllowed: boolean("final_action_allowed").notNull().default(false),
  finalNoticeAllowed: boolean("final_notice_allowed").notNull().default(false),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
