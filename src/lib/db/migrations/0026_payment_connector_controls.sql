-- Canonical Payment Connector Controls Migration
--
-- Master Volume Governance:
-- - Vol I: preserves constitutional authority over payment connector
--   promotion and payment execution authorization.
-- - Vol II: protects tenant, billing, credential, refund, dispute, and
--   entitlement metadata under controlled disclosure.
-- - Vol III: adds replay-safe certification and execution authorization
--   state before any live payment processor promotion.
-- - Vol IV: supports credential review, outage handling, dispute response,
--   refund controls, reconciliation, recovery, and audit preparation.
-- - Vol V: supports classification, observability, replay, version lineage,
--   connector governance, source authority, consent, and isolation doctrine.

CREATE TABLE IF NOT EXISTS payment_connector_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter_id TEXT NOT NULL,
  adapter_name TEXT NOT NULL,
  processor_name TEXT NOT NULL,
  processor_type TEXT NOT NULL,
  processor_environment TEXT NOT NULL DEFAULT 'TEST',
  payment_authority_ref TEXT,
  certification_status TEXT NOT NULL DEFAULT 'PENDING_CERTIFICATION',
  live_payments_allowed BOOLEAN NOT NULL DEFAULT false,
  credential_ref TEXT,
  credential_status TEXT NOT NULL DEFAULT 'MISSING',
  credential_vault_required BOOLEAN NOT NULL DEFAULT true,
  webhook_secret_ref TEXT,
  webhook_signature_status TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
  outage_policy_ref TEXT,
  outage_status TEXT NOT NULL DEFAULT 'NOT_TESTED',
  replay_policy_ref TEXT,
  replay_status TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
  schema_contract_version TEXT,
  refund_policy_ref TEXT,
  refund_policy_status TEXT NOT NULL DEFAULT 'NOT_APPROVED',
  dispute_policy_ref TEXT,
  dispute_policy_status TEXT NOT NULL DEFAULT 'NOT_APPROVED',
  reconciliation_policy_ref TEXT,
  reconciliation_policy_status TEXT NOT NULL DEFAULT 'NOT_APPROVED',
  consent_required BOOLEAN NOT NULL DEFAULT true,
  isolation_required BOOLEAN NOT NULL DEFAULT true,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  live_payment_captured BOOLEAN NOT NULL DEFAULT false,
  last_certified_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_connector_adapters_adapter_id_idx
  ON payment_connector_adapters (adapter_id);

CREATE INDEX IF NOT EXISTS payment_connector_adapters_processor_type_idx
  ON payment_connector_adapters (processor_type);

CREATE INDEX IF NOT EXISTS payment_connector_adapters_certification_status_idx
  ON payment_connector_adapters (certification_status);

CREATE INDEX IF NOT EXISTS payment_connector_adapters_trace_id_idx
  ON payment_connector_adapters (trace_id);

CREATE INDEX IF NOT EXISTS payment_connector_adapters_replay_ref_idx
  ON payment_connector_adapters (replay_ref);

CREATE TABLE IF NOT EXISTS payment_connector_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter_id TEXT NOT NULL,
  billing_event_id TEXT,
  session_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  user_id TEXT,
  plan TEXT,
  amount_total INTEGER,
  currency TEXT,
  execution_status TEXT NOT NULL DEFAULT 'PAYMENT_EXECUTION_BLOCKED',
  execution_ref TEXT,
  payment_processor_ref TEXT,
  payment_authority_ref TEXT,
  credential_ref TEXT,
  webhook_secret_ref TEXT,
  outage_policy_ref TEXT,
  replay_policy_ref TEXT,
  operational_runbook_ref TEXT,
  schema_contract_version TEXT,
  consent_ref TEXT,
  isolation_ref TEXT,
  refund_policy_ref TEXT,
  dispute_policy_ref TEXT,
  reconciliation_policy_ref TEXT,
  adapter_found BOOLEAN NOT NULL DEFAULT false,
  adapter_certified BOOLEAN NOT NULL DEFAULT false,
  live_payments_allowed BOOLEAN NOT NULL DEFAULT false,
  payment_authority_present BOOLEAN NOT NULL DEFAULT false,
  credential_ref_present BOOLEAN NOT NULL DEFAULT false,
  credential_approved BOOLEAN NOT NULL DEFAULT false,
  webhook_secret_present BOOLEAN NOT NULL DEFAULT false,
  webhook_signature_verified BOOLEAN NOT NULL DEFAULT false,
  outage_policy_present BOOLEAN NOT NULL DEFAULT false,
  outage_policy_tested BOOLEAN NOT NULL DEFAULT false,
  replay_policy_present BOOLEAN NOT NULL DEFAULT false,
  replay_policy_verified BOOLEAN NOT NULL DEFAULT false,
  schema_contract_present BOOLEAN NOT NULL DEFAULT false,
  schema_contract_verified BOOLEAN NOT NULL DEFAULT false,
  consent_ref_present BOOLEAN NOT NULL DEFAULT false,
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  isolation_ref_present BOOLEAN NOT NULL DEFAULT false,
  isolation_verified BOOLEAN NOT NULL DEFAULT false,
  operational_runbook_present BOOLEAN NOT NULL DEFAULT false,
  operational_runbook_approved BOOLEAN NOT NULL DEFAULT false,
  refund_policy_present BOOLEAN NOT NULL DEFAULT false,
  refund_policy_approved BOOLEAN NOT NULL DEFAULT false,
  dispute_policy_present BOOLEAN NOT NULL DEFAULT false,
  dispute_policy_approved BOOLEAN NOT NULL DEFAULT false,
  reconciliation_policy_present BOOLEAN NOT NULL DEFAULT false,
  reconciliation_policy_approved BOOLEAN NOT NULL DEFAULT false,
  execution_allowed BOOLEAN NOT NULL DEFAULT false,
  payment_processor_action_performed BOOLEAN NOT NULL DEFAULT false,
  live_payment_captured BOOLEAN NOT NULL DEFAULT false,
  regulated_decision_impact_allowed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  execution_authorized_at TIMESTAMPTZ,
  payment_captured_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_connector_executions_adapter_id_idx
  ON payment_connector_executions (adapter_id);

CREATE INDEX IF NOT EXISTS payment_connector_executions_billing_event_id_idx
  ON payment_connector_executions (billing_event_id);

CREATE INDEX IF NOT EXISTS payment_connector_executions_session_id_idx
  ON payment_connector_executions (session_id);

CREATE INDEX IF NOT EXISTS payment_connector_executions_tenant_id_idx
  ON payment_connector_executions (tenant_id);

CREATE INDEX IF NOT EXISTS payment_connector_executions_execution_status_idx
  ON payment_connector_executions (execution_status);

CREATE INDEX IF NOT EXISTS payment_connector_executions_trace_id_idx
  ON payment_connector_executions (trace_id);

CREATE INDEX IF NOT EXISTS payment_connector_executions_replay_ref_idx
  ON payment_connector_executions (replay_ref);

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
  'payment_connector_adapters',
  'payment-connector-adapters-v0.1.0',
  'src/db/schema/paymentConnectorAdapters.ts',
  'governed-payment-connector-controls',
  'active',
  'payment-connector-control-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0026-payment-connector-adapters',
  '{"purpose":"canonical durable payment connector certification records before live payment processor promotion"}'::jsonb,
  now(),
  now(),
  now()
),
(
  'payment_connector_executions',
  'payment-connector-executions-v0.1.0',
  'src/db/schema/paymentConnectorExecutions.ts',
  'governed-payment-connector-controls',
  'active',
  'payment-connector-control-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0026-payment-connector-executions',
  '{"purpose":"canonical durable payment connector execution authorization records without live payment processor capture"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
