import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Missing Doctrine Governance Schema
 *
 * Master Volume Governance:
 * - Vol I: makes supplemental constitutional doctrines durable and traceable.
 * - Vol II: keeps claims, incidents, UX, configuration, and runtime state
 *   within regulated operational boundaries.
 * - Vol III: exposes canonical tables for deterministic runtime enforcement.
 * - Vol III-B: binds runtime state, feature activation, incidents,
 *   configuration, UX, and implementation traceability to replay evidence.
 * - Vol IV: supports emergency governance, rollback, escalation, and
 *   operational continuity.
 * - Vol V: preserves claims, classification, replay, observability,
 *   controlled disclosure, source authority, and implementation traceability.
 *
 * Supplemental governing input:
 * - Ares_Furlong_Missing_Doctrines_Implementation_Master.pdf
 */

function governanceColumns() {
  return {
    id: uuid("id").defaultRandom().primaryKey(),
    recordKey: text("record_key").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    governanceVersion: text("governance_version")
      .notNull()
      .default("master-volumes-runtime-v0.1.0"),
    classification: text("classification").notNull().default("INTERNAL"),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    replayRequired: boolean("replay_required").notNull().default(true),
    auditRequired: boolean("audit_required").notNull().default(true),
    productionAuthorized: boolean("production_authorized")
      .notNull()
      .default(false),
    humanReviewRequired: boolean("human_review_required")
      .notNull()
      .default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  };
}

export const runtimeStateRegistry = pgTable(
  "runtime_state_registry",
  governanceColumns
);
export const runtimeTransitionEvents = pgTable(
  "runtime_transition_events",
  governanceColumns
);
export const runtimeAuthorityRecords = pgTable(
  "runtime_authority_records",
  governanceColumns
);
export const runtimeRestrictionProfiles = pgTable(
  "runtime_restriction_profiles",
  governanceColumns
);
export const runtimeReplayRefs = pgTable(
  "runtime_replay_refs",
  governanceColumns
);

export const featureRegistry = pgTable("feature_registry", governanceColumns);
export const featureActivationEvents = pgTable(
  "feature_activation_events",
  governanceColumns
);
export const featureRolloutProfiles = pgTable(
  "feature_rollout_profiles",
  governanceColumns
);
export const featureKillSwitchEvents = pgTable(
  "feature_kill_switch_events",
  governanceColumns
);
export const featureReplayRefs = pgTable(
  "feature_replay_refs",
  governanceColumns
);

export const publicClaimRegistry = pgTable(
  "public_claim_registry",
  governanceColumns
);
export const claimValidationRecords = pgTable(
  "claim_validation_records",
  governanceColumns
);
export const claimEscalationEvents = pgTable(
  "claim_escalation_events",
  governanceColumns
);
export const claimReplayRefs = pgTable("claim_replay_refs", governanceColumns);

export const incidentRegistry = pgTable(
  "incident_registry",
  governanceColumns
);
export const incidentEscalationEvents = pgTable(
  "incident_escalation_events",
  governanceColumns
);
export const incidentReplayRefs = pgTable(
  "incident_replay_refs",
  governanceColumns
);
export const incidentResolutionRecords = pgTable(
  "incident_resolution_records",
  governanceColumns
);

export const configRegistry = pgTable("config_registry", governanceColumns);
export const configChangeEvents = pgTable(
  "config_change_events",
  governanceColumns
);
export const configReplayRefs = pgTable(
  "config_replay_refs",
  governanceColumns
);
export const configValidationRecords = pgTable(
  "config_validation_records",
  governanceColumns
);

export const uxGovernanceRegistry = pgTable(
  "ux_governance_registry",
  governanceColumns
);
export const uxDisclosureProfiles = pgTable(
  "ux_disclosure_profiles",
  governanceColumns
);
export const uxViolationEvents = pgTable(
  "ux_violation_events",
  governanceColumns
);
export const uxAccessibilityRecords = pgTable(
  "ux_accessibility_records",
  governanceColumns
);

export const implementationManifestRegistry = pgTable(
  "implementation_manifest_registry",
  governanceColumns
);
export const runtimeConformanceRecords = pgTable(
  "runtime_conformance_records",
  governanceColumns
);
export const governanceTraceabilityRefs = pgTable(
  "governance_traceability_refs",
  governanceColumns
);
export const deploymentValidationRefs = pgTable(
  "deployment_validation_refs",
  governanceColumns
);
export const constitutionalCoverageMatrix = pgTable(
  "constitutional_coverage_matrix",
  governanceColumns
);
