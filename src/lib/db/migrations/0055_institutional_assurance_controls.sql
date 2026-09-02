-- Master Volume mirror: examiner-facing institutional assurance controls.
CREATE TABLE IF NOT EXISTS fair_lending_review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  subject_ref TEXT NOT NULL, reason_codes_complete BOOLEAN NOT NULL DEFAULT FALSE, proxy_feature_review_complete BOOLEAN NOT NULL DEFAULT FALSE, disparate_impact_review_complete BOOLEAN NOT NULL DEFAULT FALSE, demographic_data_separated BOOLEAN NOT NULL DEFAULT FALSE, reviewer_approved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS model_risk_governance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  model_id TEXT NOT NULL, model_version TEXT NOT NULL, model_card_ref TEXT, independent_validation_ref TEXT, challenger_comparison_ref TEXT, drift_metric_basis_points INTEGER, drift_threshold_basis_points INTEGER, validation_current BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS third_party_risk_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  vendor_id TEXT NOT NULL, service_scope TEXT NOT NULL, dpa_review_status TEXT NOT NULL DEFAULT 'PENDING', data_residency_review_status TEXT NOT NULL DEFAULT 'PENDING', security_review_status TEXT NOT NULL DEFAULT 'PENDING', termination_plan_status TEXT NOT NULL DEFAULT 'PENDING', certification_status TEXT NOT NULL DEFAULT 'PENDING'
);
CREATE TABLE IF NOT EXISTS disaster_recovery_test_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  test_ref TEXT NOT NULL, rpo_minutes INTEGER, rto_minutes INTEGER, backup_verified BOOLEAN NOT NULL DEFAULT FALSE, restore_drill_passed BOOLEAN NOT NULL DEFAULT FALSE, runbook_approved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS service_reliability_objective_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  service_id TEXT NOT NULL, slo_target_basis_points INTEGER NOT NULL, alerting_configured BOOLEAN NOT NULL DEFAULT FALSE, on_call_assigned BOOLEAN NOT NULL DEFAULT FALSE, error_budget_tracked BOOLEAN NOT NULL DEFAULT FALSE, incident_escalation_linked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS breach_notification_governance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  incident_id TEXT NOT NULL, incident_classified BOOLEAN NOT NULL DEFAULT FALSE, notification_clock_started_at TIMESTAMPTZ, jurisdiction_assessment_ref TEXT, counsel_review_ref TEXT, notification_decision_ref TEXT, evidence_preserved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS succession_stewardship_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), control_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'OPEN', owner_actor_id TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb, findings JSONB NOT NULL DEFAULT '[]'::jsonb, governance_version TEXT NOT NULL DEFAULT 'master-volume-mirror-v1.0.0', classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE, production_authorized BOOLEAN NOT NULL DEFAULT FALSE, metadata JSONB, effective_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  stewardship_domain TEXT NOT NULL, primary_actor_ref TEXT NOT NULL, successor_actor_ref TEXT, emergency_delegate_ref TEXT, mission_protection_ref TEXT, activation_tested BOOLEAN NOT NULL DEFAULT FALSE
);
