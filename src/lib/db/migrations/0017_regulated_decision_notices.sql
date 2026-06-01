-- Canonical Regulated Decision and Notice Migration
--
-- Master Volume Governance:
-- - Vol I: establishes constitutional authority for final regulated action.
-- - Vol II: preserves adverse-action, borrower explanation, appeal,
--   disclosure, fair-lending, and official-notice boundaries.
-- - Vol III: adds durable replay-safe final-action control state.
-- - Vol IV: supports operational review, escalation, notice preparation,
--   dispute handling, recovery, and audit preparation.
-- - Vol V: supports classification, explainability, observability, replay,
--   version lineage, controlled disclosure, and evidence preservation.

CREATE TABLE IF NOT EXISTS regulated_decision_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  human_review_workflow_id UUID,
  adverse_action_review_id UUID,
  decision_type TEXT NOT NULL,
  requested_outcome TEXT NOT NULL,
  final_decision_status TEXT NOT NULL DEFAULT 'FINAL_ACTION_BLOCKED',
  notice_status TEXT NOT NULL DEFAULT 'FINAL_NOTICE_BLOCKED',
  disclosure_status TEXT NOT NULL DEFAULT 'DISCLOSURE_REVIEW_REQUIRED',
  appeal_status TEXT NOT NULL DEFAULT 'APPEAL_RIGHTS_PENDING',
  reason_codes JSONB,
  explanation_summary TEXT,
  notice_summary TEXT,
  final_action_requested BOOLEAN NOT NULL DEFAULT true,
  final_action_allowed BOOLEAN NOT NULL DEFAULT false,
  final_notice_allowed BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  adverse_action_required BOOLEAN NOT NULL DEFAULT false,
  appeal_rights_included BOOLEAN NOT NULL DEFAULT false,
  effective_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_application_id_idx
  ON regulated_decision_notices (application_id);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_borrower_id_idx
  ON regulated_decision_notices (borrower_id);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_tenant_id_idx
  ON regulated_decision_notices (tenant_id);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_human_review_workflow_id_idx
  ON regulated_decision_notices (human_review_workflow_id);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_adverse_action_review_id_idx
  ON regulated_decision_notices (adverse_action_review_id);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_final_decision_status_idx
  ON regulated_decision_notices (final_decision_status);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_notice_status_idx
  ON regulated_decision_notices (notice_status);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_trace_id_idx
  ON regulated_decision_notices (trace_id);

CREATE INDEX IF NOT EXISTS regulated_decision_notices_replay_ref_idx
  ON regulated_decision_notices (replay_ref);

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
  'regulated_decision_notices',
  'regulated-decision-notices-v0.1.0',
  'src/db/schema/regulatedDecisionNotices.ts',
  'regulated-final-action-and-notice-governance',
  'active',
  'regulated-decision-notice-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0017-regulated-decision-notices',
  '{"purpose":"canonical final regulated decision and notice control records with human-review, adverse-action, disclosure, appeal, and replay gates"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
