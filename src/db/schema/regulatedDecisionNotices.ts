import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Regulated Decision and Notice Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes constitutional authority for final regulated action.
 * - Vol II: Preserves adverse-action, borrower explanation, appeal,
 *   disclosure, fair-lending, and official-notice boundaries.
 * - Vol III: Provides durable replay-safe final-action control state.
 * - Vol IV: Supports operational review, escalation, notice preparation,
 *   dispute handling, recovery, and audit preparation.
 * - Vol V: Supports classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

export const regulatedDecisionNotices = pgTable(
  "regulated_decision_notices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    applicationId: text("application_id").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),

    humanReviewWorkflowId: uuid("human_review_workflow_id"),
    adverseActionReviewId: uuid("adverse_action_review_id"),

    decisionType: text("decision_type").notNull(),
    requestedOutcome: text("requested_outcome").notNull(),
    finalDecisionStatus: text("final_decision_status")
      .notNull()
      .default("FINAL_ACTION_BLOCKED"),
    noticeStatus: text("notice_status").notNull().default("FINAL_NOTICE_BLOCKED"),
    disclosureStatus: text("disclosure_status")
      .notNull()
      .default("DISCLOSURE_REVIEW_REQUIRED"),
    appealStatus: text("appeal_status")
      .notNull()
      .default("APPEAL_RIGHTS_PENDING"),

    reasonCodes: jsonb("reason_codes"),
    explanationSummary: text("explanation_summary"),
    noticeSummary: text("notice_summary"),

    finalActionRequested: boolean("final_action_requested")
      .notNull()
      .default(true),
    finalActionAllowed: boolean("final_action_allowed")
      .notNull()
      .default(false),
    finalNoticeAllowed: boolean("final_notice_allowed")
      .notNull()
      .default(false),
    borrowerDisclosureAllowed: boolean("borrower_disclosure_allowed")
      .notNull()
      .default(false),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),
    adverseActionRequired: boolean("adverse_action_required")
      .notNull()
      .default(false),
    appealRightsIncluded: boolean("appeal_rights_included")
      .notNull()
      .default(false),

    effectiveAt: timestamp("effective_at", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }),

    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull(),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    source: text("source"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
