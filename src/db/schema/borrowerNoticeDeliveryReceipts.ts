import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Borrower Notice Delivery Receipt Schema
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for delivery receipt evidence.
 * - Vol II: Records borrower notice delivery, failure, return, retry, and
 *   dispute signals without weakening borrower protection controls.
 * - Vol III: Provides durable replay-safe receipt and lifecycle evidence.
 * - Vol IV: Supports operational monitoring, failed-delivery response,
 *   dispute intake, recovery, escalation, and audit preparation.
 * - Vol V: Supports classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

export const borrowerNoticeDeliveryReceipts = pgTable(
  "borrower_notice_delivery_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    deliveryId: uuid("delivery_id").notNull(),
    decisionNoticeId: uuid("decision_notice_id"),
    applicationId: text("application_id").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),

    receiptType: text("receipt_type").notNull(),
    deliveryChannel: text("delivery_channel").notNull(),
    deliveryOutcome: text("delivery_outcome").notNull(),
    receiptStatus: text("receipt_status")
      .notNull()
      .default("RECEIPT_BLOCKED"),
    providerStatus: text("provider_status"),
    failureReasonCode: text("failure_reason_code"),
    disputeStatus: text("dispute_status")
      .notNull()
      .default("NO_DISPUTE"),

    deliveryProviderRef: text("delivery_provider_ref"),
    providerEventId: text("provider_event_id"),
    receiptEvidenceRef: text("receipt_evidence_ref"),
    deliveryTrackingRef: text("delivery_tracking_ref"),
    retentionPolicyRef: text("retention_policy_ref"),
    disputeCaseRef: text("dispute_case_ref"),
    retryPolicyRef: text("retry_policy_ref"),

    receiptAccepted: boolean("receipt_accepted").notNull().default(false),
    providerDeliveryEventRecorded: boolean(
      "provider_delivery_event_recorded"
    )
      .notNull()
      .default(false),
    externalDeliveryPerformedByRuntime: boolean(
      "external_delivery_performed_by_runtime"
    )
      .notNull()
      .default(false),
    deliveryWasAllowed: boolean("delivery_was_allowed")
      .notNull()
      .default(false),
    borrowerDisclosureWasAllowed: boolean(
      "borrower_disclosure_was_allowed"
    )
      .notNull()
      .default(false),
    deliveryProviderWasConfigured: boolean(
      "delivery_provider_was_configured"
    )
      .notNull()
      .default(false),
    retryRequired: boolean("retry_required").notNull().default(false),
    operatorReviewRequired: boolean("operator_review_required")
      .notNull()
      .default(false),

    receiptReceivedAt: timestamp("receipt_received_at", {
      withTimezone: true,
    }),
    deliveryConfirmedAt: timestamp("delivery_confirmed_at", {
      withTimezone: true,
    }),
    failureRecordedAt: timestamp("failure_recorded_at", {
      withTimezone: true,
    }),
    returnedAt: timestamp("returned_at", { withTimezone: true }),

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
