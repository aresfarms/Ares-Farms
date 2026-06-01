-- Canonical Borrower Notice Provider Execution Migration
--
-- Master Volume Governance:
-- - Vol I: preserves accountable authority for notice provider execution.
-- - Vol II: protects adverse-action, appeal, borrower-disclosure, delivery,
--   retry, returned-mail, failed-delivery, and dispute boundaries.
-- - Vol III: adds durable replay-safe provider execution authorization state
--   before any external delivery provider action.
-- - Vol IV: supports provider runbooks, outage handling, retry handling,
--   returned-mail handling, failed-delivery response, dispute intake,
--   recovery, escalation, and audit preparation.
-- - Vol V: supports classification, observability, replay, version lineage,
--   controlled disclosure, schema contracts, consent, and isolation doctrine.

CREATE TABLE IF NOT EXISTS borrower_notice_provider_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL,
  decision_notice_id UUID,
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  provider_id TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  delivery_channel TEXT NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'PROVIDER_EXECUTION_BLOCKED',
  provider_execution_ref TEXT,
  provider_event_id TEXT,
  provider_response_ref TEXT,
  credential_ref TEXT,
  retry_policy_ref TEXT,
  returned_mail_policy_ref TEXT,
  failed_delivery_policy_ref TEXT,
  dispute_intake_ref TEXT,
  outage_policy_ref TEXT,
  replay_policy_ref TEXT,
  operational_runbook_ref TEXT,
  schema_contract_version TEXT,
  consent_ref TEXT,
  isolation_ref TEXT,
  delivery_allowed_snapshot BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed_snapshot BOOLEAN NOT NULL DEFAULT false,
  delivery_provider_configured BOOLEAN NOT NULL DEFAULT false,
  provider_adapter_approved BOOLEAN NOT NULL DEFAULT false,
  credential_approved BOOLEAN NOT NULL DEFAULT false,
  outage_policy_tested BOOLEAN NOT NULL DEFAULT false,
  retry_policy_attached BOOLEAN NOT NULL DEFAULT false,
  returned_mail_policy_attached BOOLEAN NOT NULL DEFAULT false,
  failed_delivery_policy_attached BOOLEAN NOT NULL DEFAULT false,
  dispute_intake_attached BOOLEAN NOT NULL DEFAULT false,
  replay_policy_verified BOOLEAN NOT NULL DEFAULT false,
  schema_contract_verified BOOLEAN NOT NULL DEFAULT false,
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  isolation_verified BOOLEAN NOT NULL DEFAULT false,
  operational_runbook_approved BOOLEAN NOT NULL DEFAULT false,
  provider_execution_allowed BOOLEAN NOT NULL DEFAULT false,
  external_provider_action_performed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  execution_authorized_at TIMESTAMPTZ,
  external_provider_action_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_delivery_id_idx
  ON borrower_notice_provider_executions (delivery_id);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_application_id_idx
  ON borrower_notice_provider_executions (application_id);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_borrower_id_idx
  ON borrower_notice_provider_executions (borrower_id);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_tenant_id_idx
  ON borrower_notice_provider_executions (tenant_id);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_provider_id_idx
  ON borrower_notice_provider_executions (provider_id);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_execution_status_idx
  ON borrower_notice_provider_executions (execution_status);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_trace_id_idx
  ON borrower_notice_provider_executions (trace_id);

CREATE INDEX IF NOT EXISTS borrower_notice_provider_executions_replay_ref_idx
  ON borrower_notice_provider_executions (replay_ref);

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
  'borrower_notice_provider_executions',
  'borrower-notice-provider-executions-v0.1.0',
  'src/db/schema/borrowerNoticeProviderExecutions.ts',
  'controlled-borrower-notice-provider-execution',
  'active',
  'borrower-notice-provider-execution-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0022-borrower-notice-provider-executions',
  '{"purpose":"canonical controlled borrower notice provider execution authorization evidence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
