-- Canonical Lender and Sponsor Workflow Migration
--
-- Master Volume Governance:
-- - Vol I: establishes governed institutional workflow authority.
-- - Vol II: preserves borrower protection, controlled disclosure, lender,
--   sponsor, and regulated-finance workflow boundaries.
-- - Vol III: adds durable replay-safe partner workflow persistence before
--   lender or sponsor portals expose sensitive records.
-- - Vol IV: supports operational queues, due diligence, escalation,
--   assignment, recovery, and audit preparation.
-- - Vol V: supports classification, observability, replay, source authority,
--   version lineage, and controlled disclosure.

CREATE TABLE IF NOT EXISTS partner_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type TEXT NOT NULL,
  partner_id TEXT NOT NULL,
  partner_name TEXT,
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  workflow_type TEXT NOT NULL,
  workflow_stage TEXT NOT NULL DEFAULT 'INTAKE',
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  requested_amount TEXT,
  program_type TEXT,
  commitment_status TEXT NOT NULL DEFAULT 'NOT_COMMITTED',
  due_diligence_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  disclosure_status TEXT NOT NULL DEFAULT 'DISCLOSURE_REVIEW_REQUIRED',
  certification_status TEXT NOT NULL DEFAULT 'NOT_CERTIFIED',
  advisory_only BOOLEAN NOT NULL DEFAULT true,
  final_action_allowed BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  assigned_to TEXT,
  escalation_status TEXT NOT NULL DEFAULT 'NOT_ESCALATED',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  due_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_workflows_partner_type_idx
  ON partner_workflows (partner_type);

CREATE INDEX IF NOT EXISTS partner_workflows_partner_id_idx
  ON partner_workflows (partner_id);

CREATE INDEX IF NOT EXISTS partner_workflows_application_id_idx
  ON partner_workflows (application_id);

CREATE INDEX IF NOT EXISTS partner_workflows_borrower_id_idx
  ON partner_workflows (borrower_id);

CREATE INDEX IF NOT EXISTS partner_workflows_tenant_id_idx
  ON partner_workflows (tenant_id);

CREATE INDEX IF NOT EXISTS partner_workflows_status_idx
  ON partner_workflows (status);

CREATE INDEX IF NOT EXISTS partner_workflows_trace_id_idx
  ON partner_workflows (trace_id);

CREATE INDEX IF NOT EXISTS partner_workflows_replay_ref_idx
  ON partner_workflows (replay_ref);

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
  'partner_workflows',
  'partner-workflows-v0.1.0',
  'src/db/schema/partnerWorkflows.ts',
  'lender-sponsor-workflow-governance',
  'active',
  'partner-workflow-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0015-partner-workflows',
  '{"purpose":"canonical lender and sponsor workflow persistence before partner portals expose sensitive records"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
