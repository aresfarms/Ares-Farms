-- Canonical External Data Connector Governance Migration
--
-- Master Volume Governance:
-- - Vol I: establishes governed source authority for external data.
-- - Vol II: preserves regulatory boundaries for USDA, SBA, property,
--   borrower, and institutional data use.
-- - Vol III: adds replay-safe connector request persistence before live
--   connector execution is allowed.
-- - Vol IV: supports connector review, escalation, outage handling,
--   certification, and audit preparation.
-- - Vol V: supports source authority, classification, consent, replay,
--   observability, version lineage, and evidence preservation.

CREATE TABLE IF NOT EXISTS external_data_sources (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  authority_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  live_calls_allowed BOOLEAN NOT NULL DEFAULT false,
  base_url TEXT,
  source_version TEXT NOT NULL,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_data_connector_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  query_type TEXT NOT NULL,
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  property_id UUID,
  actor_id TEXT,
  status TEXT NOT NULL,
  live_call_performed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  request_payload JSONB,
  normalized_result JSONB,
  source_version TEXT NOT NULL,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS external_data_connector_runs_source_id_idx
  ON external_data_connector_runs (source_id);

CREATE INDEX IF NOT EXISTS external_data_connector_runs_application_id_idx
  ON external_data_connector_runs (application_id);

CREATE INDEX IF NOT EXISTS external_data_connector_runs_borrower_id_idx
  ON external_data_connector_runs (borrower_id);

CREATE INDEX IF NOT EXISTS external_data_connector_runs_tenant_id_idx
  ON external_data_connector_runs (tenant_id);

CREATE INDEX IF NOT EXISTS external_data_connector_runs_trace_id_idx
  ON external_data_connector_runs (trace_id);

CREATE INDEX IF NOT EXISTS external_data_connector_runs_replay_ref_idx
  ON external_data_connector_runs (replay_ref);

INSERT INTO external_data_sources (
  id,
  source_name,
  source_type,
  authority_level,
  status,
  live_calls_allowed,
  source_version,
  governance_version,
  classification,
  replay_ref,
  metadata,
  created_at,
  updated_at
)
VALUES
  (
    'usda-fsa',
    'USDA Farm Service Agency',
    'USDA',
    'official-reference-required',
    'ACTIVE',
    false,
    'usda-fsa-connector-governance-v0.1.0',
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0010-external-data-connectors',
    '{"allowedQueryTypes":["program_reference","farm_service_context"],"liveDataStatus":"not-configured"}'::jsonb,
    now(),
    now()
  ),
  (
    'sba',
    'Small Business Administration',
    'SBA',
    'official-reference-required',
    'ACTIVE',
    false,
    'sba-connector-governance-v0.1.0',
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0010-external-data-connectors',
    '{"allowedQueryTypes":["program_reference","small_business_context"],"liveDataStatus":"not-configured"}'::jsonb,
    now(),
    now()
  ),
  (
    'property-records',
    'Property Records Source',
    'PROPERTY',
    'jurisdictional-source-required',
    'ACTIVE',
    false,
    'property-records-connector-governance-v0.1.0',
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0010-external-data-connectors',
    '{"allowedQueryTypes":["property_record","parcel_context"],"liveDataStatus":"not-configured"}'::jsonb,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

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
    'external_data_sources',
    'external-data-sources-v0.1.0',
    'src/db/schema/externalDataConnectors.ts',
    'external-data-source-governance',
    'active',
    'external-data-connector-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0010-external-data-connectors',
    '{"purpose":"canonical registry for governed external data source authority"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'external_data_connector_runs',
    'external-data-connector-runs-v0.1.0',
    'src/db/schema/externalDataConnectors.ts',
    'external-data-connector-governance',
    'active',
    'external-data-connector-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0010-external-data-connectors',
    '{"purpose":"canonical request log for replay-safe external connector governance"}'::jsonb,
    now(),
    now(),
    now()
  )
ON CONFLICT DO NOTHING;
