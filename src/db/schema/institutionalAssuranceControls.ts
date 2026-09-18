import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

function evidenceColumns() {
  return {
    id: uuid("id").defaultRandom().primaryKey(),
    controlId: text("control_id").notNull().unique(),
    status: text("status").notNull().default("OPEN"),
    ownerActorId: text("owner_actor_id"),
    evidenceRefs: jsonb("evidence_refs").notNull().default([]),
    findings: jsonb("findings").notNull().default([]),
    governanceVersion: text("governance_version")
      .notNull()
      .default("master-volume-mirror-v1.0.0"),
    classification: text("classification").notNull().default("RESTRICTED"),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),
    productionAuthorized: boolean("production_authorized")
      .notNull()
      .default(false),
    metadata: jsonb("metadata"),
    effectiveAt: timestamp("effective_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  };
}

export const fairLendingReviewRecords = pgTable("fair_lending_review_records", {
  ...evidenceColumns(),
  subjectRef: text("subject_ref").notNull(),
  reasonCodesComplete: boolean("reason_codes_complete")
    .notNull()
    .default(false),
  proxyFeatureReviewComplete: boolean("proxy_feature_review_complete")
    .notNull()
    .default(false),
  disparateImpactReviewComplete: boolean("disparate_impact_review_complete")
    .notNull()
    .default(false),
  demographicDataSeparated: boolean("demographic_data_separated")
    .notNull()
    .default(false),
  reviewerApproved: boolean("reviewer_approved").notNull().default(false),
});

export const modelRiskGovernanceRecords = pgTable(
  "model_risk_governance_records",
  {
    ...evidenceColumns(),
    modelId: text("model_id").notNull(),
    modelVersion: text("model_version").notNull(),
    modelCardRef: text("model_card_ref"),
    independentValidationRef: text("independent_validation_ref"),
    challengerComparisonRef: text("challenger_comparison_ref"),
    driftMetricBasisPoints: integer("drift_metric_basis_points"),
    driftThresholdBasisPoints: integer("drift_threshold_basis_points"),
    validationCurrent: boolean("validation_current").notNull().default(false),
  },
);

export const thirdPartyRiskRecords = pgTable("third_party_risk_records", {
  ...evidenceColumns(),
  vendorId: text("vendor_id").notNull(),
  serviceScope: text("service_scope").notNull(),
  dpaReviewStatus: text("dpa_review_status").notNull().default("PENDING"),
  dataResidencyReviewStatus: text("data_residency_review_status")
    .notNull()
    .default("PENDING"),
  securityReviewStatus: text("security_review_status")
    .notNull()
    .default("PENDING"),
  terminationPlanStatus: text("termination_plan_status")
    .notNull()
    .default("PENDING"),
  certificationStatus: text("certification_status")
    .notNull()
    .default("PENDING"),
});

export const disasterRecoveryTestRecords = pgTable(
  "disaster_recovery_test_records",
  {
    ...evidenceColumns(),
    testRef: text("test_ref").notNull(),
    rpoMinutes: integer("rpo_minutes"),
    rtoMinutes: integer("rto_minutes"),
    backupVerified: boolean("backup_verified").notNull().default(false),
    restoreDrillPassed: boolean("restore_drill_passed")
      .notNull()
      .default(false),
    runbookApproved: boolean("runbook_approved").notNull().default(false),
  },
);

export const serviceReliabilityObjectiveRecords = pgTable(
  "service_reliability_objective_records",
  {
    ...evidenceColumns(),
    serviceId: text("service_id").notNull(),
    sloTargetBasisPoints: integer("slo_target_basis_points").notNull(),
    alertingConfigured: boolean("alerting_configured").notNull().default(false),
    onCallAssigned: boolean("on_call_assigned").notNull().default(false),
    errorBudgetTracked: boolean("error_budget_tracked")
      .notNull()
      .default(false),
    incidentEscalationLinked: boolean("incident_escalation_linked")
      .notNull()
      .default(false),
  },
);

export const breachNotificationGovernanceRecords = pgTable(
  "breach_notification_governance_records",
  {
    ...evidenceColumns(),
    incidentId: text("incident_id").notNull(),
    incidentClassified: boolean("incident_classified").notNull().default(false),
    notificationClockStartedAt: timestamp("notification_clock_started_at", {
      withTimezone: true,
    }),
    jurisdictionAssessmentRef: text("jurisdiction_assessment_ref"),
    counselReviewRef: text("counsel_review_ref"),
    notificationDecisionRef: text("notification_decision_ref"),
    evidencePreserved: boolean("evidence_preserved").notNull().default(false),
  },
);

export const successionStewardshipRecords = pgTable(
  "succession_stewardship_records",
  {
    ...evidenceColumns(),
    stewardshipDomain: text("stewardship_domain").notNull(),
    primaryActorRef: text("primary_actor_ref").notNull(),
    successorActorRef: text("successor_actor_ref"),
    emergencyDelegateRef: text("emergency_delegate_ref"),
    missionProtectionRef: text("mission_protection_ref"),
    activationTested: boolean("activation_tested").notNull().default(false),
  },
);
