import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Borrower Notice Delivery Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes constitutional authority for borrower notice delivery.
 * - Vol II: Preserves adverse-action, explanation, appeal, disclosure,
 *   delivery tracking, retention, and fair-lending notice boundaries.
 * - Vol III: Provides durable replay-safe notice packet and delivery state.
 * - Vol IV: Supports operational notice preparation, delivery monitoring,
 *   dispute handling, recovery, and audit preparation.
 * - Vol V: Supports classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

export const borrowerNoticeDeliveries = pgTable(
  "borrower_notice_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    decisionNoticeId: uuid("decision_notice_id").notNull(),
    applicationId: text("application_id").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),

    noticeType: text("notice_type").notNull(),
    deliveryChannel: text("delivery_channel").notNull(),
    deliveryStatus: text("delivery_status")
      .notNull()
      .default("DELIVERY_BLOCKED"),
    noticePacketStatus: text("notice_packet_status")
      .notNull()
      .default("PACKET_BLOCKED"),
    redactionStatus: text("redaction_status")
      .notNull()
      .default("REDACTION_REQUIRED"),
    appealPacketStatus: text("appeal_packet_status")
      .notNull()
      .default("APPEAL_PACKET_REQUIRED"),
    retentionStatus: text("retention_status")
      .notNull()
      .default("RETENTION_POLICY_REQUIRED"),

    noticePacketRef: text("notice_packet_ref"),
    redactionProfileRef: text("redaction_profile_ref"),
    appealPacketRef: text("appeal_packet_ref"),
    retentionPolicyRef: text("retention_policy_ref"),
    deliveryTrackingRef: text("delivery_tracking_ref"),
    deliveryProviderRef: text("delivery_provider_ref"),

    deliveryAllowed: boolean("delivery_allowed").notNull().default(false),
    borrowerDisclosureAllowed: boolean("borrower_disclosure_allowed")
      .notNull()
      .default(false),
    externalDeliveryPerformed: boolean("external_delivery_performed")
      .notNull()
      .default(false),
    deliveryProviderConfigured: boolean("delivery_provider_configured")
      .notNull()
      .default(false),
    appealRightsIncluded: boolean("appeal_rights_included")
      .notNull()
      .default(false),
    redactionCompleted: boolean("redaction_completed")
      .notNull()
      .default(false),
    retentionPolicyAttached: boolean("retention_policy_attached")
      .notNull()
      .default(false),

    deliveryPreparedAt: timestamp("delivery_prepared_at", {
      withTimezone: true,
    }),
    externalDeliveredAt: timestamp("external_delivered_at", {
      withTimezone: true,
    }),

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
