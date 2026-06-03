import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Payment Connector Adapter Schema
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional authority over payment connector
 *   promotion and keeps payment state separate from regulated decisions.
 * - Vol II: Protects tenant, billing, credential, refund, dispute, and
 *   entitlement metadata under controlled disclosure.
 * - Vol III: Provides replay-safe, schema-aware certification state before
 *   any live payment processor promotion.
 * - Vol IV: Supports credential review, outage handling, dispute response,
 *   refund controls, reconciliation, recovery, and audit preparation.
 * - Vol V: Enforces source authority, classification, observability, replay,
 *   version lineage, connector governance, consent, and isolation doctrine.
 */

export const paymentConnectorAdapters = pgTable(
  "payment_connector_adapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adapterId: text("adapter_id").notNull(),
    adapterName: text("adapter_name").notNull(),
    processorName: text("processor_name").notNull(),
    processorType: text("processor_type").notNull(),
    processorEnvironment: text("processor_environment")
      .notNull()
      .default("TEST"),
    paymentAuthorityRef: text("payment_authority_ref"),

    certificationStatus: text("certification_status")
      .notNull()
      .default("PENDING_CERTIFICATION"),
    livePaymentsAllowed: boolean("live_payments_allowed")
      .notNull()
      .default(false),

    credentialRef: text("credential_ref"),
    credentialStatus: text("credential_status").notNull().default("MISSING"),
    credentialVaultRequired: boolean("credential_vault_required")
      .notNull()
      .default(true),

    webhookSecretRef: text("webhook_secret_ref"),
    webhookSignatureStatus: text("webhook_signature_status")
      .notNull()
      .default("NOT_VERIFIED"),

    outagePolicyRef: text("outage_policy_ref"),
    outageStatus: text("outage_status").notNull().default("NOT_TESTED"),

    replayPolicyRef: text("replay_policy_ref"),
    replayStatus: text("replay_status").notNull().default("NOT_VERIFIED"),

    schemaContractVersion: text("schema_contract_version"),
    refundPolicyRef: text("refund_policy_ref"),
    refundPolicyStatus: text("refund_policy_status")
      .notNull()
      .default("NOT_APPROVED"),
    disputePolicyRef: text("dispute_policy_ref"),
    disputePolicyStatus: text("dispute_policy_status")
      .notNull()
      .default("NOT_APPROVED"),
    reconciliationPolicyRef: text("reconciliation_policy_ref"),
    reconciliationPolicyStatus: text("reconciliation_policy_status")
      .notNull()
      .default("NOT_APPROVED"),

    consentRequired: boolean("consent_required").notNull().default(true),
    isolationRequired: boolean("isolation_required").notNull().default(true),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),
    livePaymentCaptured: boolean("live_payment_captured")
      .notNull()
      .default(false),

    lastCertifiedAt: timestamp("last_certified_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

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
