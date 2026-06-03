-- Canonical Certified Connector Adapter Migration
--
-- Master Volume Governance:
-- - Vol I: establishes constitutional connector-promotion authority.
-- - Vol II: prevents unapproved USDA, SBA, property, borrower, or
--   institutional source reliance in regulated workflows.
-- - Vol III: adds replay-safe, schema-aware adapter certification state.
-- - Vol IV: supports credential review, outage handling, escalation,
--   isolation, and operational audit preparation.
-- - Vol V: supports source authority, consent, classification, replay,
--   observability, version lineage, and evidence preservation.

CREATE TABLE IF NOT EXISTS certified_connector_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter_id TEXT NOT NULL,
  adapter_name TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_authority_ref TEXT,
  certification_status TEXT NOT NULL DEFAULT 'PENDING_CERTIFICATION',
  live_calls_allowed BOOLEAN NOT NULL DEFAULT false,
  credential_ref TEXT,
  credential_status TEXT NOT NULL DEFAULT 'MISSING',
  credential_vault_required BOOLEAN NOT NULL DEFAULT true,
  outage_policy_ref TEXT,
  outage_status TEXT NOT NULL DEFAULT 'NOT_TESTED',
  replay_policy_ref TEXT,
  replay_status TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
  schema_contract_version TEXT,
  connector_consent_required BOOLEAN NOT NULL DEFAULT true,
  isolation_required BOOLEAN NOT NULL DEFAULT true,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
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

CREATE UNIQUE INDEX IF NOT EXISTS certified_connector_adapters_adapter_id_uidx
  ON certified_connector_adapters (adapter_id);

CREATE INDEX IF NOT EXISTS certified_connector_adapters_source_id_idx
  ON certified_connector_adapters (source_id);

CREATE INDEX IF NOT EXISTS certified_connector_adapters_certification_status_idx
  ON certified_connector_adapters (certification_status);

CREATE INDEX IF NOT EXISTS certified_connector_adapters_live_calls_allowed_idx
  ON certified_connector_adapters (live_calls_allowed);

CREATE INDEX IF NOT EXISTS certified_connector_adapters_trace_id_idx
  ON certified_connector_adapters (trace_id);

CREATE INDEX IF NOT EXISTS certified_connector_adapters_replay_ref_idx
  ON certified_connector_adapters (replay_ref);

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
  'certified_connector_adapters',
  'certified-connector-adapters-v0.1.0',
  'src/db/schema/certifiedConnectorAdapters.ts',
  'certified-live-connector-governance',
  'active',
  'certified-connector-adapter-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0016-certified-connector-adapters',
  '{"purpose":"canonical certification registry for governed live external connector adapters"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
