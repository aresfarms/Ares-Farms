import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Borrower Notice Provider Execution Schema
 *
 * Master Volume Governance:
 * - Vol I: Establishes accountable authority for notice provider execution.
 * - Vol II: Preserves adverse-action, appeal, borrower-disclosure, delivery,
 *   retry, failed-delivery, returned-mail, and dispute boundaries.
 * - Vol III: Provides durable replay-safe provider execution authorization
 *   state before any external delivery provider action.
 * - Vol IV: Supports operational runbooks, outage handling, retry handling,
 *   returned-mail handling, failed-delivery response, dispute intake,
 *   recovery, escalation, and audit preparation.
 * - Vol V: Supports classification, observability, replay, version lineage,
 *   controlled disclosure, schema contracts, consent, and isolation doctrine.
 */

export const borrowerNoticeProviderExecutions = pgTable(
  "borrower_notice_provider_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    deliveryId: uuid("delivery_id").notNull(),
    decisionNoticeId: uuid("decision_notice_id"),
    applicationId: text("application_id").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),

    providerId: text("provider_id").notNull(),
    providerType: text("provider_type").notNull(),
    deliveryChannel: text("delivery_channel").notNull(),
    executionStatus: text("execution_status")
      .notNull()
      .default("PROVIDER_EXECUTION_BLOCKED"),

    providerExecutionRef: text("provider_execution_ref"),
    providerEventId: text("provider_event_id"),
    providerResponseRef: text("provider_response_ref"),
    credentialRef: text("credential_ref"),
    retryPolicyRef: text("retry_policy_ref"),
    returnedMailPolicyRef: text("returned_mail_policy_ref"),
    failedDeliveryPolicyRef: text("failed_delivery_policy_ref"),
    disputeIntakeRef: text("dispute_intake_ref"),
    outagePolicyRef: text("outage_policy_ref"),
    replayPolicyRef: text("replay_policy_ref"),
    operationalRunbookRef: text("operational_runbook_ref"),
    schemaContractVersion: text("schema_contract_version"),
    consentRef: text("consent_ref"),
    isolationRef: text("isolation_ref"),

    deliveryAllowedSnapshot: boolean("delivery_allowed_snapshot")
      .notNull()
      .default(false),
    borrowerDisclosureAllowedSnapshot: boolean(
      "borrower_disclosure_allowed_snapshot"
    )
      .notNull()
      .default(false),
    deliveryProviderConfigured: boolean("delivery_provider_configured")
      .notNull()
      .default(false),
    providerAdapterApproved: boolean("provider_adapter_approved")
      .notNull()
      .default(false),
    credentialApproved: boolean("credential_approved")
      .notNull()
      .default(false),
    outagePolicyTested: boolean("outage_policy_tested")
      .notNull()
      .default(false),
    retryPolicyAttached: boolean("retry_policy_attached")
      .notNull()
      .default(false),
    returnedMailPolicyAttached: boolean("returned_mail_policy_attached")
      .notNull()
      .default(false),
    failedDeliveryPolicyAttached: boolean("failed_delivery_policy_attached")
      .notNull()
      .default(false),
    disputeIntakeAttached: boolean("dispute_intake_attached")
      .notNull()
      .default(false),
    replayPolicyVerified: boolean("replay_policy_verified")
      .notNull()
      .default(false),
    schemaContractVerified: boolean("schema_contract_verified")
      .notNull()
      .default(false),
    consentVerified: boolean("consent_verified").notNull().default(false),
    isolationVerified: boolean("isolation_verified").notNull().default(false),
    operationalRunbookApproved: boolean("operational_runbook_approved")
      .notNull()
      .default(false),
    providerExecutionAllowed: boolean("provider_execution_allowed")
      .notNull()
      .default(false),
    externalProviderActionPerformed: boolean(
      "external_provider_action_performed"
    )
      .notNull()
      .default(false),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),

    executionAuthorizedAt: timestamp("execution_authorized_at", {
      withTimezone: true,
    }),
    externalProviderActionAt: timestamp("external_provider_action_at", {
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
