import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Sovereign Consent Gateway Record Schema
 *
 * Master Volume Governance:
 * - Vol II §3.21: tribal sovereign land workflows must preserve Level 5
 *   sovereign defaults unless a valid Gateway exists.
 * - Vol V CANON-CONSENT-001 v7.0: ConsentGatewayRecords are Level 5
 *   immutable artifacts for scoped, time-bound operational exceptions.
 * - Vol V CANON-SOVEREIGNTY-001: tribal sovereign nation data remains
 *   sovereign-controlled by default even when a bounded Level 4 operational
 *   exception is active.
 */

export const sovereignConsentGatewayRecords = pgTable(
  "sovereign_consent_gateway_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    gatewayRecordId: text("gateway_record_id").notNull().unique(),
    gatewayId: text("gateway_id").notNull(),
    initiatingAuthorityId: text("initiating_authority_id").notNull(),
    initiatingAuthorityType: text("initiating_authority_type").notNull(),
    initiatingAuthorityRole: text("initiating_authority_role").notNull(),
    verifiedIdentityEventRef: text("verified_identity_event_ref"),
    affirmativeInitiationRef: text("affirmative_initiation_ref"),
    tribalNation: text("tribal_nation"),

    applicationIdScope: text("application_id_scope").notNull(),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id"),

    authorizedDataElements: jsonb("authorized_data_elements"),
    authorizedWorkflowPhases: jsonb("authorized_workflow_phases"),
    underwritingWindowClosesAt: timestamp("underwriting_window_closes_at", {
      withTimezone: true,
    }),
    initiationTimestamp: timestamp("initiation_timestamp", {
      withTimezone: true,
    }).notNull(),
    expirationTimestamp: timestamp("expiration_timestamp", {
      withTimezone: true,
    }).notNull(),
    revocationEventRef: text("revocation_event_ref"),

    gatewayStatus: text("gateway_status").notNull(),
    expirationReason: text("expiration_reason"),
    gatewayActive: boolean("gateway_active").notNull().default(false),
    level5BaselineConfirmed: boolean("level5_baseline_confirmed")
      .notNull()
      .default(true),
    level4OperationalExceptionAuthorized: boolean(
      "level4_operational_exception_authorized"
    )
      .notNull()
      .default(false),
    sovereigntyClassification: text("sovereignty_classification")
      .notNull()
      .default("SOVEREIGN_CONTROLLED"),
    operationalClassification: text("operational_classification")
      .notNull()
      .default("SOVEREIGN_CONTROLLED"),

    nonProprietaryOnlyConfirmed: boolean(
      "non_proprietary_only_confirmed"
    )
      .notNull()
      .default(false),
    publiclyAccessibleRegistryOnly: boolean(
      "publicly_accessible_registry_only"
    )
      .notNull()
      .default(false),
    applicationScopeConfirmed: boolean("application_scope_confirmed")
      .notNull()
      .default(false),
    workflowScopeConfirmed: boolean("workflow_scope_confirmed")
      .notNull()
      .default(false),
    noBulkDataAcquisition: boolean("no_bulk_data_acquisition")
      .notNull()
      .default(false),
    noCrossTransactionSharing: boolean("no_cross_transaction_sharing")
      .notNull()
      .default(false),
    noCompetitiveIntelligence: boolean("no_competitive_intelligence")
      .notNull()
      .default(false),
    noAiTrainingAccess: boolean("no_ai_training_access")
      .notNull()
      .default(false),
    noProprietarySovereignRecords: boolean(
      "no_proprietary_sovereign_records"
    )
      .notNull()
      .default(false),
    platformInitiated: boolean("platform_initiated").notNull().default(false),

    externalLegalFrameworkReviewed: boolean(
      "external_legal_framework_reviewed"
    )
      .notNull()
      .default(false),
    complianceOfficerId: text("compliance_officer_id"),
    complianceReviewRef: text("compliance_review_ref"),
    complianceOfficerVerified: boolean("compliance_officer_verified")
      .notNull()
      .default(false),

    dataAccessEvents: jsonb("data_access_events"),
    dataAccessPerformed: boolean("data_access_performed")
      .notNull()
      .default(false),
    scoringUseAllowed: boolean("scoring_use_allowed")
      .notNull()
      .default(false),
    underwritingUseAllowed: boolean("underwriting_use_allowed")
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

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
