-- Canonical External Connector Execution Migration
--
-- Master Volume Governance:
-- - Vol I: preserves accountable authority for external connector execution.
-- - Vol II: prevents USDA, SBA, property, borrower, or institutional source
--   data from becoming regulated fact without certified execution controls.
-- - Vol III: adds durable replay-safe execution authorization state before
--   any live external connector call or official data fetch.
-- - Vol IV: supports credential review, outage handling, recovery, retry,
--   isolation, escalation, and audit preparation.
-- - Vol V: supports source authority, classification, observability, replay,
--   version lineage, schema contracts, consent, and isolation doctrine.

CREATE TABLE IF NOT EXISTS external_connector_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_run_id UUID NOT NULL,
  adapter_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  query_type TEXT NOT NULL,
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  execution_status TEXT NOT NULL DEFAULT 'LIVE_CONNECTOR_EXECUTION_BLOCKED',
  execution_ref TEXT,
  source_authority_ref TEXT,
  credential_ref TEXT,
  outage_policy_ref TEXT,
  replay_policy_ref TEXT,
  operational_runbook_ref TEXT,
  schema_contract_version TEXT,
  consent_ref TEXT,
  isolation_ref TEXT,
  connector_run_found BOOLEAN NOT NULL DEFAULT false,
  application_matches BOOLEAN NOT NULL DEFAULT false,
  source_matches BOOLEAN NOT NULL DEFAULT false,
  connector_run_not_previously_live BOOLEAN NOT NULL DEFAULT false,
  source_live_calls_allowed BOOLEAN NOT NULL DEFAULT false,
  adapter_found BOOLEAN NOT NULL DEFAULT false,
  adapter_source_matches BOOLEAN NOT NULL DEFAULT false,
  adapter_certified BOOLEAN NOT NULL DEFAULT false,
  adapter_live_calls_allowed BOOLEAN NOT NULL DEFAULT false,
  source_authority_present BOOLEAN NOT NULL DEFAULT false,
  credential_approved BOOLEAN NOT NULL DEFAULT false,
  outage_policy_tested BOOLEAN NOT NULL DEFAULT false,
  replay_policy_verified BOOLEAN NOT NULL DEFAULT false,
  schema_contract_verified BOOLEAN NOT NULL DEFAULT false,
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  isolation_verified BOOLEAN NOT NULL DEFAULT false,
  operational_runbook_approved BOOLEAN NOT NULL DEFAULT false,
  execution_allowed BOOLEAN NOT NULL DEFAULT false,
  live_call_performed BOOLEAN NOT NULL DEFAULT false,
  official_data_fetched BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  execution_authorized_at TIMESTAMPTZ,
  live_call_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS external_connector_executions_connector_run_id_idx
  ON external_connector_executions (connector_run_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_adapter_id_idx
  ON external_connector_executions (adapter_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_source_id_idx
  ON external_connector_executions (source_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_application_id_idx
  ON external_connector_executions (application_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_borrower_id_idx
  ON external_connector_executions (borrower_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_tenant_id_idx
  ON external_connector_executions (tenant_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_execution_status_idx
  ON external_connector_executions (execution_status);

CREATE INDEX IF NOT EXISTS external_connector_executions_trace_id_idx
  ON external_connector_executions (trace_id);

CREATE INDEX IF NOT EXISTS external_connector_executions_replay_ref_idx
  ON external_connector_executions (replay_ref);

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
  'external_connector_executions',
  'external-connector-executions-v0.1.0',
  'src/db/schema/externalConnectorExecutions.ts',
  'controlled-external-connector-execution',
  'active',
  'external-connector-execution-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0023-external-connector-executions',
  '{"purpose":"canonical controlled external connector execution authorization evidence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
