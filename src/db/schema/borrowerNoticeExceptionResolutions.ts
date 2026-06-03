import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Borrower Notice Exception Resolution Schema
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for closing notice exceptions.
 * - Vol II: Protects adverse-action, appeal, delivery, retry, dispute, and
 *   borrower-disclosure boundaries before exception closure.
 * - Vol III: Provides durable replay-safe resolution and queue lifecycle
 *   evidence for failed, returned, bounced, and disputed notices.
 * - Vol IV: Supports operator resolution, recovery, escalation, retention,
 *   failed-delivery response, and audit preparation.
 * - Vol V: Supports classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

export const borrowerNoticeExceptionResolutions = pgTable(
  "borrower_notice_exception_resolutions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    queueItemId: uuid("queue_item_id").notNull(),
    receiptId: uuid("receipt_id").notNull(),
    deliveryId: uuid("delivery_id").notNull(),
    decisionNoticeId: uuid("decision_notice_id"),
    applicationId: text("application_id").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),

    exceptionType: text("exception_type").notNull(),
    resolutionAction: text("resolution_action").notNull(),
    resolutionStatus: text("resolution_status")
      .notNull()
      .default("RESOLUTION_BLOCKED"),
    queueStatusBefore: text("queue_status_before"),
    queueStatusAfter: text("queue_status_after"),

    resolutionEvidenceRef: text("resolution_evidence_ref"),
    operatorAttestationRef: text("operator_attestation_ref"),
    borrowerContactRef: text("borrower_contact_ref"),
    retryPlanRef: text("retry_plan_ref"),
    disputeResolutionRef: text("dispute_resolution_ref"),
    retentionPolicyRef: text("retention_policy_ref"),

    resolutionAllowed: boolean("resolution_allowed").notNull().default(false),
    queueCompleted: boolean("queue_completed").notNull().default(false),
    retryAuthorized: boolean("retry_authorized").notNull().default(false),
    borrowerDisclosureAllowed: boolean("borrower_disclosure_allowed")
      .notNull()
      .default(false),
    externalProviderActionPerformed: boolean(
      "external_provider_action_performed"
    )
      .notNull()
      .default(false),
    humanReviewCompleted: boolean("human_review_completed")
      .notNull()
      .default(false),

    resolvedAt: timestamp("resolved_at", { withTimezone: true }),

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
