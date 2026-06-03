-- Canonical Review Transition Control Migration
--
-- Master Volume Governance:
-- - Vol I: establishes accountable authority for human-review transitions.
-- - Vol II: preserves adverse-action, borrower explanation, appeal,
--   disclosure, fair-lending, and final-action approval boundaries.
-- - Vol III: adds durable replay-safe review transition state.
-- - Vol IV: supports operator escalation, underwriter approval,
--   revision handling, recovery, and audit preparation.
-- - Vol V: supports classification, explainability, observability, replay,
--   version lineage, controlled disclosure, and evidence preservation.

CREATE TABLE IF NOT EXISTS review_transition_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  human_review_workflow_id UUID NOT NULL,
  adverse_action_review_id UUID,
  transition_type TEXT NOT NULL,
  requested_status TEXT NOT NULL,
  transition_status TEXT NOT NULL DEFAULT 'TRANSITION_BLOCKED',
  review_outcome TEXT NOT NULL,
  reviewer_role TEXT,
  reviewer_attestation_ref TEXT,
  approval_authority_ref TEXT,
  reason_codes JSONB,
  explanation_summary TEXT,
  transition_gates JSONB,
  disclosure_review_completed BOOLEAN NOT NULL DEFAULT false,
  appeal_rights_prepared BOOLEAN NOT NULL DEFAULT false,
  final_action_allowed BOOLEAN NOT NULL DEFAULT false,
  final_notice_allowed BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed BOOLEAN NOT NULL DEFAULT false,
  adverse_action_required BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  transitioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_transition_controls_application_id_idx
  ON review_transition_controls (application_id);

CREATE INDEX IF NOT EXISTS review_transition_controls_borrower_id_idx
  ON review_transition_controls (borrower_id);

CREATE INDEX IF NOT EXISTS review_transition_controls_tenant_id_idx
  ON review_transition_controls (tenant_id);

CREATE INDEX IF NOT EXISTS review_transition_controls_human_review_workflow_id_idx
  ON review_transition_controls (human_review_workflow_id);

CREATE INDEX IF NOT EXISTS review_transition_controls_adverse_action_review_id_idx
  ON review_transition_controls (adverse_action_review_id);

CREATE INDEX IF NOT EXISTS review_transition_controls_transition_status_idx
  ON review_transition_controls (transition_status);

CREATE INDEX IF NOT EXISTS review_transition_controls_trace_id_idx
  ON review_transition_controls (trace_id);

CREATE INDEX IF NOT EXISTS review_transition_controls_replay_ref_idx
  ON review_transition_controls (replay_ref);

INSERT INTO schema_registry (
  schema_name,
  schema_version,
  schema_path,
  schema_domain,
  status,
  owner_module,
  governance_version,
  replay_ref,
  metadata,
  effective_at,
  created_at,
  updated_at
)
VALUES (
  'review_transition_controls',
  'review-transition-controls-v0.1.0',
  'src/db/schema/reviewTransitionControls.ts',
  'human-review-transition-governance',
  'active',
  'review-transition-control-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0018-review-transition-controls',
  '{"purpose":"canonical approval, rejection, and revision transition records for governed human review workflows before final regulated action"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
