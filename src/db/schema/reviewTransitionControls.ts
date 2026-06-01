import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Review Transition Control Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes accountable authority for human-review transitions.
 * - Vol II: Preserves adverse-action, borrower explanation, appeal,
 *   disclosure, fair-lending, and final-action approval boundaries.
 * - Vol III: Provides durable replay-safe review transition state.
 * - Vol IV: Supports operator escalation, underwriter approval,
 *   revision handling, recovery, and audit preparation.
 * - Vol V: Supports classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

export const reviewTransitionControls = pgTable(
  "review_transition_controls",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    applicationId: text("application_id"),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),

    humanReviewWorkflowId: uuid("human_review_workflow_id").notNull(),
    adverseActionReviewId: uuid("adverse_action_review_id"),

    transitionType: text("transition_type").notNull(),
    requestedStatus: text("requested_status").notNull(),
    transitionStatus: text("transition_status")
      .notNull()
      .default("TRANSITION_BLOCKED"),
    reviewOutcome: text("review_outcome").notNull(),
    reviewerRole: text("reviewer_role"),
    reviewerAttestationRef: text("reviewer_attestation_ref"),
    approvalAuthorityRef: text("approval_authority_ref"),

    reasonCodes: jsonb("reason_codes"),
    explanationSummary: text("explanation_summary"),
    transitionGates: jsonb("transition_gates"),

    disclosureReviewCompleted: boolean("disclosure_review_completed")
      .notNull()
      .default(false),
    appealRightsPrepared: boolean("appeal_rights_prepared")
      .notNull()
      .default(false),
    finalActionAllowed: boolean("final_action_allowed")
      .notNull()
      .default(false),
    finalNoticeAllowed: boolean("final_notice_allowed")
      .notNull()
      .default(false),
    borrowerDisclosureAllowed: boolean("borrower_disclosure_allowed")
      .notNull()
      .default(false),
    adverseActionRequired: boolean("adverse_action_required")
      .notNull()
      .default(false),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),

    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull(),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    source: text("source"),
    metadata: jsonb("metadata"),

    transitionedAt: timestamp("transitioned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
