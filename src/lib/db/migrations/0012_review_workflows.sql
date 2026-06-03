-- Canonical Human Review and Adverse Action Workflow Migration
--
-- Master Volume Governance:
-- - Vol I: establishes accountable human review authority before regulated
--   outcomes can become final.
-- - Vol II: preserves borrower protection, adverse-action, explanation,
--   appeal, and fair-lending review boundaries.
-- - Vol III: adds durable replay-safe review workflow persistence.
-- - Vol IV: supports operator queues, escalation, review assignment,
--   recovery, and audit preparation.
-- - Vol V: supports explainability, classification, observability, replay,
--   source authority, versioning, and evidence preservation.

CREATE TABLE IF NOT EXISTS human_review_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  review_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  source_trace_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED_FOR_HUMAN_REVIEW',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  required_reviewer_role TEXT NOT NULL,
  assigned_to TEXT,
  escalation_status TEXT NOT NULL DEFAULT 'NOT_ESCALATED',
  candidate_outcome TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  advisory_only BOOLEAN NOT NULL DEFAULT true,
  final_action_allowed BOOLEAN NOT NULL DEFAULT false,
  adverse_action_candidate BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  due_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adverse_action_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  human_review_workflow_id UUID NOT NULL,
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  candidate_outcome TEXT NOT NULL,
  adverse_action_status TEXT NOT NULL DEFAULT 'CANDIDATE_REVIEW_PENDING',
  notice_status TEXT NOT NULL DEFAULT 'NOT_A_NOTICE',
  reason_codes JSONB,
  explanation_summary TEXT,
  appeal_status TEXT NOT NULL DEFAULT 'APPEAL_RIGHTS_PENDING',
  advisory_only BOOLEAN NOT NULL DEFAULT true,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  final_action_allowed BOOLEAN NOT NULL DEFAULT false,
  final_notice_allowed BOOLEAN NOT NULL DEFAULT false,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_review_workflows_application_id_idx
  ON human_review_workflows (application_id);

CREATE INDEX IF NOT EXISTS human_review_workflows_borrower_id_idx
  ON human_review_workflows (borrower_id);

CREATE INDEX IF NOT EXISTS human_review_workflows_tenant_id_idx
  ON human_review_workflows (tenant_id);

CREATE INDEX IF NOT EXISTS human_review_workflows_status_idx
  ON human_review_workflows (status);

CREATE INDEX IF NOT EXISTS human_review_workflows_trace_id_idx
  ON human_review_workflows (trace_id);

CREATE INDEX IF NOT EXISTS human_review_workflows_replay_ref_idx
  ON human_review_workflows (replay_ref);

CREATE INDEX IF NOT EXISTS adverse_action_reviews_workflow_id_idx
  ON adverse_action_reviews (human_review_workflow_id);

CREATE INDEX IF NOT EXISTS adverse_action_reviews_application_id_idx
  ON adverse_action_reviews (application_id);

CREATE INDEX IF NOT EXISTS adverse_action_reviews_borrower_id_idx
  ON adverse_action_reviews (borrower_id);

CREATE INDEX IF NOT EXISTS adverse_action_reviews_status_idx
  ON adverse_action_reviews (adverse_action_status);

CREATE INDEX IF NOT EXISTS adverse_action_reviews_trace_id_idx
  ON adverse_action_reviews (trace_id);

CREATE INDEX IF NOT EXISTS adverse_action_reviews_replay_ref_idx
  ON adverse_action_reviews (replay_ref);

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
VALUES
  (
    'human_review_workflows',
    'human-review-workflows-v0.1.0',
    'src/db/schema/reviewWorkflows.ts',
    'human-review-governance',
    'active',
    'human-review-workflow-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0012-review-workflows',
    '{"purpose":"canonical queue for human review before regulated outcomes become final"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'adverse_action_reviews',
    'adverse-action-reviews-v0.1.0',
    'src/db/schema/reviewWorkflows.ts',
    'adverse-action-governance',
    'active',
    'human-review-workflow-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0012-review-workflows',
    '{"purpose":"canonical candidate adverse-action review records that are not final notices"}'::jsonb,
    now(),
    now(),
    now()
  )
ON CONFLICT DO NOTHING;
