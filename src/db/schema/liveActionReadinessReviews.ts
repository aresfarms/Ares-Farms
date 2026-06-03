import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Live Action Readiness Review Schema
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before live external action
 *   promotion can be considered.
 * - Vol II: Preserves regulatory, borrower, tenant, billing, notice,
 *   and source-data boundaries before live action.
 * - Vol III: Provides deterministic, replay-safe readiness evidence before
 *   live connector calls, notice provider sends, or payment capture.
 * - Vol IV: Supports operational runbooks, rollback, incident response,
 *   monitoring, recovery, escalation, and audit preparation.
 * - Vol V: Enforces source authority, classification, observability, replay,
 *   version lineage, consent, isolation, controlled disclosure, and evidence
 *   preservation doctrine.
 */

export const liveActionReadinessReviews = pgTable(
  "live_action_readiness_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actionType: text("action_type").notNull(),
    readinessStatus: text("readiness_status")
      .notNull()
      .default("LIVE_ACTION_PROMOTION_BLOCKED"),

    targetExecutionId: uuid("target_execution_id").notNull(),
    targetAdapterId: text("target_adapter_id"),
    targetProviderId: text("target_provider_id"),
    targetSourceId: text("target_source_id"),
    targetTenantId: text("target_tenant_id"),
    targetApplicationId: text("target_application_id"),
    targetBorrowerId: text("target_borrower_id"),
    targetBillingEventId: text("target_billing_event_id"),
    targetSessionId: text("target_session_id"),
    actorId: text("actor_id"),

    productionCredentialVaultRef: text("production_credential_vault_ref"),
    liveAdapterImplementationRef: text("live_adapter_implementation_ref"),
    productionRunbookApprovalRef: text("production_runbook_approval_ref"),
    dryRunEvidenceRef: text("dry_run_evidence_ref"),
    rollbackPlanRef: text("rollback_plan_ref"),
    incidentResponsePlanRef: text("incident_response_plan_ref"),
    monitoringPlanRef: text("monitoring_plan_ref"),
    auditEvidenceExportRef: text("audit_evidence_export_ref"),
    humanApprovalRef: text("human_approval_ref"),

    executionAuthorizationFound: boolean(
      "execution_authorization_found"
    )
      .notNull()
      .default(false),
    executionAuthorizationAllowed: boolean(
      "execution_authorization_allowed"
    )
      .notNull()
      .default(false),
    liveActionNotPreviouslyPerformed: boolean(
      "live_action_not_previously_performed"
    )
      .notNull()
      .default(false),
    credentialApproved: boolean("credential_approved")
      .notNull()
      .default(false),
    outagePolicyTested: boolean("outage_policy_tested")
      .notNull()
      .default(false),
    replayPolicyVerified: boolean("replay_policy_verified")
      .notNull()
      .default(false),
    schemaContractVerified: boolean("schema_contract_verified")
      .notNull()
      .default(false),
    consentVerified: boolean("consent_verified").notNull().default(false),
    isolationVerified: boolean("isolation_verified")
      .notNull()
      .default(false),
    operationalRunbookApproved: boolean(
      "operational_runbook_approved"
    )
      .notNull()
      .default(false),
    productionCredentialVaultPresent: boolean(
      "production_credential_vault_present"
    )
      .notNull()
      .default(false),
    liveAdapterImplementationPresent: boolean(
      "live_adapter_implementation_present"
    )
      .notNull()
      .default(false),
    productionRunbookApprovalPresent: boolean(
      "production_runbook_approval_present"
    )
      .notNull()
      .default(false),
    dryRunEvidencePresent: boolean("dry_run_evidence_present")
      .notNull()
      .default(false),
    rollbackPlanPresent: boolean("rollback_plan_present")
      .notNull()
      .default(false),
    incidentResponsePlanPresent: boolean(
      "incident_response_plan_present"
    )
      .notNull()
      .default(false),
    monitoringPlanPresent: boolean("monitoring_plan_present")
      .notNull()
      .default(false),
    auditEvidenceExportPresent: boolean(
      "audit_evidence_export_present"
    )
      .notNull()
      .default(false),
    humanApprovalPresent: boolean("human_approval_present")
      .notNull()
      .default(false),
    domainSpecificControlsSatisfied: boolean(
      "domain_specific_controls_satisfied"
    )
      .notNull()
      .default(false),
    readyForLiveAction: boolean("ready_for_live_action")
      .notNull()
      .default(false),
    regulatedDecisionImpactAllowed: boolean(
      "regulated_decision_impact_allowed"
    )
      .notNull()
      .default(false),
    externalActionPerformed: boolean("external_action_performed")
      .notNull()
      .default(false),
    liveActionPerformed: boolean("live_action_performed")
      .notNull()
      .default(false),

    gateSnapshot: jsonb("gate_snapshot"),
    blockerReasons: jsonb("blocker_reasons"),

    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull(),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    source: text("source"),
    metadata: jsonb("metadata"),

    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
