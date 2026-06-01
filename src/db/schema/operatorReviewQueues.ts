import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Operator Review Queue Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes accountable operational review authority.
 * - Vol II: Preserves regulated workflow boundaries before borrower,
 *   lender, sponsor, or agency-facing reliance.
 * - Vol III: Provides durable replay-safe queue state for backend workflows.
 * - Vol IV: Supports operator queues, escalation, assignment, recovery,
 *   backlog review, and audit preparation.
 * - Vol V: Supports classification, observability, replay, source authority,
 *   controlled disclosure, and version lineage.
 */

export const operatorReviewQueueItems = pgTable("operator_review_queue_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  queueType: text("queue_type").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  sourceTraceId: text("source_trace_id"),

  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  actorId: text("actor_id"),

  status: text("status").notNull().default("OPEN"),
  priority: text("priority").notNull().default("NORMAL"),
  escalationStatus: text("escalation_status")
    .notNull()
    .default("NOT_ESCALATED"),
  reviewReason: text("review_reason").notNull(),

  requiredRole: text("required_role").notNull().default("operator"),
  assignedTo: text("assigned_to"),
  lockedBy: text("locked_by"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  dueAt: timestamp("due_at", { withTimezone: true }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
