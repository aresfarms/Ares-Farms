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
 * Canonical Billing Event Schema
 *
 * Master Volume Governance:
 * - Vol I: Keeps billing authority separate from credit, financing,
 *   permitting, legal, or regulatory determinations.
 * - Vol II: Protects tenant, payment, entitlement, and regulated-service
 *   access metadata under controlled disclosure.
 * - Vol III: Provides durable, replay-safe billing event state before
 *   dashboards, entitlement workflows, or operational modules rely on it.
 * - Vol IV: Supports billing review, webhook recovery, incident triage,
 *   entitlement reconciliation, and audit preparation.
 * - Vol V: Enforces classification, observability, replay, version lineage,
 *   source authority, connector governance, and human-review doctrine.
 */

export const billingEvents = pgTable("billing_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  billingEventId: text("billing_event_id").notNull(),
  eventType: text("event_type").notNull(),
  eventStatus: text("event_status").notNull(),
  route: text("route").notNull(),

  tenantId: text("tenant_id"),
  actorId: text("actor_id"),
  userId: text("user_id"),
  reportId: text("report_id"),
  applicationId: text("application_id"),
  sessionId: text("session_id"),
  entitlementId: text("entitlement_id"),

  stripeEventType: text("stripe_event_type"),
  plan: text("plan"),
  productName: text("product_name"),
  amountTotal: integer("amount_total"),
  currency: text("currency"),

  checkoutSessionCreated: boolean("checkout_session_created")
    .notNull()
    .default(false),
  webhookReceived: boolean("webhook_received").notNull().default(false),
  entitlementGranted: boolean("entitlement_granted").notNull().default(false),
  paymentConnectorLiveMode: boolean("payment_connector_live_mode")
    .notNull()
    .default(false),
  stubSignatureVerification: boolean("stub_signature_verification")
    .notNull()
    .default(false),
  regulatedDecisionImpactAllowed: boolean("regulated_decision_impact_allowed")
    .notNull()
    .default(false),
  humanReviewRequired: boolean("human_review_required")
    .notNull()
    .default(true),

  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),

  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull(),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),

  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
