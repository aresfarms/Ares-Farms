import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Lender and Sponsor Workflow Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes governed institutional workflow authority.
 * - Vol II: Preserves borrower protection, controlled disclosure, lender,
 *   sponsor, and regulated-finance workflow boundaries.
 * - Vol III: Provides durable replay-safe partner workflow persistence before
 *   lender or sponsor portals expose sensitive records.
 * - Vol IV: Supports operational queues, due diligence, escalation,
 *   assignment, recovery, and audit preparation.
 * - Vol V: Supports classification, observability, replay, source authority,
 *   version lineage, and controlled disclosure.
 */

export const partnerWorkflows = pgTable("partner_workflows", {
  id: uuid("id").defaultRandom().primaryKey(),

  partnerType: text("partner_type").notNull(),
  partnerId: text("partner_id").notNull(),
  partnerName: text("partner_name"),

  applicationId: text("application_id"),
  borrowerId: text("borrower_id"),
  tenantId: text("tenant_id"),
  actorId: text("actor_id"),

  workflowType: text("workflow_type").notNull(),
  workflowStage: text("workflow_stage").notNull().default("INTAKE"),
  status: text("status").notNull().default("OPEN"),
  priority: text("priority").notNull().default("NORMAL"),

  requestedAmount: text("requested_amount"),
  programType: text("program_type"),
  commitmentStatus: text("commitment_status")
    .notNull()
    .default("NOT_COMMITTED"),
  dueDiligenceStatus: text("due_diligence_status")
    .notNull()
    .default("REVIEW_REQUIRED"),
  disclosureStatus: text("disclosure_status")
    .notNull()
    .default("DISCLOSURE_REVIEW_REQUIRED"),
  certificationStatus: text("certification_status")
    .notNull()
    .default("NOT_CERTIFIED"),

  advisoryOnly: boolean("advisory_only").notNull().default(true),
  finalActionAllowed: boolean("final_action_allowed").notNull().default(false),
  borrowerDisclosureAllowed: boolean("borrower_disclosure_allowed")
    .notNull()
    .default(false),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),

  assignedTo: text("assigned_to"),
  escalationStatus: text("escalation_status")
    .notNull()
    .default("NOT_ESCALATED"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  dueAt: timestamp("due_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
