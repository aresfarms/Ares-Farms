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
 * Canonical Environmental Compliance Record Schema
 *
 * Master Volume Governance:
 * - Vol I: ROLE-ARCH-001 requires Environmental Engineering Spoke and Banker
 *   Spoke isolation before environmental clearance can inform financing work.
 * - Vol II: REG-NEPA-001 and USDA-ENV-001 require regulated environmental
 *   pathway review without turning the platform into an official authority.
 * - Vol III: TECH-CONN-001 v25.0 requires immutable
 *   environmental_compliance_records with audit anchors and replay lineage.
 * - Vol IV: OPS-BORROWER-JOURNEY-001 Steps 2.5-2.7 require trigger
 *   evaluation, provider selection, license verification, fee transparency,
 *   and lineage confirmation before pathway advancement.
 * - Vol V: CANON-ECON-001 and CANON-SOVEREIGNTY-001 require borrower fee
 *   protection and jurisdictional license verification.
 * - Vol VI: BACKEND-COVERAGE-001 and MODULE-READINESS-001 require the
 *   backend governance surface before modules depend on environmental state.
 */

export const borrowerProtectionFeeControls = pgTable(
  "borrower_protection_fee_controls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    feeControlId: text("fee_control_id").notNull().unique(),
    journeyId: text("journey_id").notNull(),
    applicationId: text("application_id"),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id").notNull(),
    actorId: text("actor_id"),
    feeType: text("fee_type").notNull(),
    feeAmount: integer("fee_amount").notNull().default(0),
    standardMarketRateAmount: integer("standard_market_rate_amount")
      .notNull()
      .default(0),
    advisoryDiscountPercent: integer("advisory_discount_percent")
      .notNull()
      .default(0),
    feeDisclosureRef: text("fee_disclosure_ref").notNull(),
    disclosureStatus: text("disclosure_status").notNull(),
    disclosedBeforeAssessment: boolean("disclosed_before_assessment")
      .notNull()
      .default(false),
    borrowerExternalFirmRightPreserved: boolean(
      "borrower_external_firm_right_preserved"
    )
      .notNull()
      .default(false),
    noSurchargeOrPreferenceIncentive: boolean(
      "no_surcharge_or_preference_incentive"
    )
      .notNull()
      .default(false),
    providerSelection: text("provider_selection"),
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

export const environmentalComplianceRecords = pgTable(
  "environmental_compliance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    complianceRecordId: text("compliance_record_id").notNull().unique(),
    journeyId: text("journey_id").notNull(),
    applicationId: text("application_id"),
    borrowerId: text("borrower_id"),
    tenantId: text("tenant_id").notNull(),
    actorId: text("actor_id"),
    pathwayType: text("pathway_type").notNull(),
    triggeringPathway: text("triggering_pathway").notNull(),
    assessmentRequirementStatus: text("assessment_requirement_status")
      .notNull()
      .default("ASSESSMENT_REQUIRED"),
    assessmentType: text("assessment_type").notNull(),
    assessmentProviderType: text("assessment_provider_type"),
    providerName: text("provider_name"),
    providerLicenseRef: text("provider_license_ref"),
    providerLicenseVerified: boolean("provider_license_verified")
      .notNull()
      .default(false),
    assessmentOutcome: text("assessment_outcome").notNull(),
    feeAmount: integer("fee_amount").notNull().default(0),
    feeDisclosureRef: text("fee_disclosure_ref"),
    borrowerProtectionFeeControlId: text(
      "borrower_protection_fee_control_id"
    ),
    feeDisclosedBeforeInitiation: boolean(
      "fee_disclosed_before_initiation"
    )
      .notNull()
      .default(false),
    borrowerExternalFirmRightPreserved: boolean(
      "borrower_external_firm_right_preserved"
    )
      .notNull()
      .default(false),
    noFeeSurchargeOrPreference: boolean(
      "no_fee_surcharge_or_preference"
    )
      .notNull()
      .default(false),
    spokeIsolationConfirmed: boolean("spoke_isolation_confirmed")
      .notNull()
      .default(false),
    bankerSpokeIsolated: boolean("banker_spoke_isolated")
      .notNull()
      .default(false),
    environmentalAssessmentTriggered: boolean(
      "environmental_assessment_triggered"
    )
      .notNull()
      .default(false),
    pathwayExemptionEventRef: text("pathway_exemption_event_ref"),
    escalationRef: text("escalation_ref"),
    auditAnchorRef: text("audit_anchor_ref"),
    loanPathwayAdvancementAllowed: boolean(
      "loan_pathway_advancement_allowed"
    )
      .notNull()
      .default(false),
    officialReportGenerated: boolean("official_report_generated")
      .notNull()
      .default(false),
    liveExternalActionPerformed: boolean("live_external_action_performed")
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
    assessmentTimestamp: timestamp("assessment_timestamp", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
