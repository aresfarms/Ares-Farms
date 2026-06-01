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
 * Canonical Payment Connector Execution Schema
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authorization before payment processor
 *   execution and blocks payment state from becoming a regulated decision.
 * - Vol II: Protects tenant, billing, entitlement, refund, dispute, and
 *   payment metadata under controlled disclosure.
 * - Vol III: Provides durable replay-safe execution authorization state
 *   before any live processor action can be promoted.
 * - Vol IV: Supports outage handling, reconciliation, refund/dispute review,
 *   recovery, escalation, and audit preparation.
 * - Vol V: Enforces classification, observability, replay, version lineage,
 *   connector governance, schema contracts, consent, and isolation doctrine.
 */

export const paymentConnectorExecutions = pgTable(
  "payment_connector_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adapterId: text("adapter_id").notNull(),
    billingEventId: text("billing_event_id"),
    sessionId: text("session_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),
    userId: text("user_id"),
    plan: text("plan"),
    amountTotal: integer("amount_total"),
    currency: text("currency"),

    executionStatus: text("execution_status")
      .notNull()
      .default("PAYMENT_EXECUTION_BLOCKED"),
    executionRef: text("execution_ref"),
    paymentProcessorRef: text("payment_processor_ref"),

    paymentAuthorityRef: text("payment_authority_ref"),
    credentialRef: text("credential_ref"),
    webhookSecretRef: text("webhook_secret_ref"),
    outagePolicyRef: text("outage_policy_ref"),
    replayPolicyRef: text("replay_policy_ref"),
    operationalRunbookRef: text("operational_runbook_ref"),
    schemaContractVersion: text("schema_contract_version"),
    consentRef: text("consent_ref"),
    isolationRef: text("isolation_ref"),
    refundPolicyRef: text("refund_policy_ref"),
    disputePolicyRef: text("dispute_policy_ref"),
    reconciliationPolicyRef: text("reconciliation_policy_ref"),

    adapterFound: boolean("adapter_found").notNull().default(false),
    adapterCertified: boolean("adapter_certified").notNull().default(false),
    livePaymentsAllowed: boolean("live_payments_allowed")
      .notNull()
      .default(false),
    paymentAuthorityPresent: boolean("payment_authority_present")
      .notNull()
      .default(false),
    credentialRefPresent: boolean("credential_ref_present")
      .notNull()
      .default(false),
    credentialApproved: boolean("credential_approved")
      .notNull()
      .default(false),
    webhookSecretPresent: boolean("webhook_secret_present")
      .notNull()
      .default(false),
    webhookSignatureVerified: boolean("webhook_signature_verified")
      .notNull()
      .default(false),
    outagePolicyPresent: boolean("outage_policy_present")
      .notNull()
      .default(false),
    outagePolicyTested: boolean("outage_policy_tested")
      .notNull()
      .default(false),
    replayPolicyPresent: boolean("replay_policy_present")
      .notNull()
      .default(false),
    replayPolicyVerified: boolean("replay_policy_verified")
      .notNull()
      .default(false),
    schemaContractPresent: boolean("schema_contract_present")
      .notNull()
      .default(false),
    schemaContractVerified: boolean("schema_contract_verified")
      .notNull()
      .default(false),
    consentRefPresent: boolean("consent_ref_present")
      .notNull()
      .default(false),
    consentVerified: boolean("consent_verified").notNull().default(false),
    isolationRefPresent: boolean("isolation_ref_present")
      .notNull()
      .default(false),
    isolationVerified: boolean("isolation_verified").notNull().default(false),
    operationalRunbookPresent: boolean("operational_runbook_present")
      .notNull()
      .default(false),
    operationalRunbookApproved: boolean("operational_runbook_approved")
      .notNull()
      .default(false),
    refundPolicyPresent: boolean("refund_policy_present")
      .notNull()
      .default(false),
    refundPolicyApproved: boolean("refund_policy_approved")
      .notNull()
      .default(false),
    disputePolicyPresent: boolean("dispute_policy_present")
      .notNull()
      .default(false),
    disputePolicyApproved: boolean("dispute_policy_approved")
      .notNull()
      .default(false),
    reconciliationPolicyPresent: boolean("reconciliation_policy_present")
      .notNull()
      .default(false),
    reconciliationPolicyApproved: boolean("reconciliation_policy_approved")
      .notNull()
      .default(false),

    executionAllowed: boolean("execution_allowed").notNull().default(false),
    paymentProcessorActionPerformed: boolean(
      "payment_processor_action_performed"
    )
      .notNull()
      .default(false),
    livePaymentCaptured: boolean("live_payment_captured")
      .notNull()
      .default(false),
    regulatedDecisionImpactAllowed: boolean(
      "regulated_decision_impact_allowed"
    )
      .notNull()
      .default(false),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),

    executionAuthorizedAt: timestamp("execution_authorized_at", {
      withTimezone: true,
    }),
    paymentCapturedAt: timestamp("payment_captured_at", {
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
