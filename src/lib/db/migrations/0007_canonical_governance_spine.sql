-- Canonical Governance Spine Migration
--
-- Master Volume Governance:
-- - Vol I: establishes constitutional backend state authority.
-- - Vol II: preserves regulated data, entitlement, and evidence handling.
-- - Vol III: creates durable schema, version, replay, ledger, and runtime tables.
-- - Vol IV: supports operational recovery, repair, rollback, and runbooks.
-- - Vol V: implements classification, observability, replay, versioning, and source authority.
--
-- Purpose:
-- This migration creates and normalizes the durable backend tables required
-- before larger product modules are built on top of the Ares/Furlong backend.
--
-- Safety posture:
-- Existing ledger evidence is preserved. Legacy Option C ledger tables are
-- altered in place by adding missing governed columns rather than rebuilding
-- or dropping existing rows.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  tenant_id TEXT,
  governance_version TEXT,
  classification TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tenant_id TEXT,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  county TEXT,
  country TEXT,
  federal_region TEXT,
  internal_region TEXT,
  governance_version TEXT,
  classification TEXT,
  replay_ref TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  decision TEXT NOT NULL DEFAULT 'PENDING',
  composite_score NUMERIC NOT NULL DEFAULT 0,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB,
  prev_hash TEXT,
  hash TEXT,
  event_hash TEXT,
  classification TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS classification TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS event_hash TEXT;

CREATE TABLE IF NOT EXISTS canonical_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sequence INTEGER,
  user_id TEXT,
  event_type TEXT,
  entity_type TEXT,
  entity_id TEXT,
  decision TEXT,
  composite_score NUMERIC,
  risk_score NUMERIC,
  input JSONB,
  output JSONB,
  trace JSONB,
  payload JSONB,
  prev_hash TEXT,
  event_hash TEXT,
  version TEXT,
  classification TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_ledger_v2 (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sequence INTEGER,
  user_id TEXT,
  event_type TEXT,
  entity_type TEXT,
  entity_id TEXT,
  decision TEXT,
  composite_score NUMERIC,
  risk_score NUMERIC,
  input JSONB,
  output JSONB,
  trace JSONB,
  payload JSONB,
  prev_hash TEXT,
  event_hash TEXT,
  version TEXT,
  classification TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_ledger_staging (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sequence INTEGER,
  user_id TEXT,
  event_type TEXT,
  entity_type TEXT,
  entity_id TEXT,
  decision TEXT,
  composite_score NUMERIC,
  risk_score NUMERIC,
  input JSONB,
  output JSONB,
  trace JSONB,
  payload JSONB,
  prev_hash TEXT,
  event_hash TEXT,
  version TEXT,
  classification TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE canonical_ledger ADD COLUMN IF NOT EXISTS sequence INTEGER;
ALTER TABLE canonical_ledger ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE canonical_ledger ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE canonical_ledger ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE canonical_ledger ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE canonical_ledger ADD COLUMN IF NOT EXISTS classification TEXT;

ALTER TABLE canonical_ledger_v2 ADD COLUMN IF NOT EXISTS sequence INTEGER;
ALTER TABLE canonical_ledger_v2 ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE canonical_ledger_v2 ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE canonical_ledger_v2 ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE canonical_ledger_v2 ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE canonical_ledger_v2 ADD COLUMN IF NOT EXISTS classification TEXT;

ALTER TABLE canonical_ledger_staging ADD COLUMN IF NOT EXISTS sequence INTEGER;
ALTER TABLE canonical_ledger_staging ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE canonical_ledger_staging ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE canonical_ledger_staging ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE canonical_ledger_staging ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE canonical_ledger_staging ADD COLUMN IF NOT EXISTS classification TEXT;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id)::integer AS new_sequence
  FROM canonical_ledger
)
UPDATE canonical_ledger
SET sequence = ordered.new_sequence
FROM ordered
WHERE canonical_ledger.id = ordered.id
  AND canonical_ledger.sequence IS NULL;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id)::integer AS new_sequence
  FROM canonical_ledger_v2
)
UPDATE canonical_ledger_v2
SET sequence = ordered.new_sequence
FROM ordered
WHERE canonical_ledger_v2.id = ordered.id
  AND canonical_ledger_v2.sequence IS NULL;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id)::integer AS new_sequence
  FROM canonical_ledger_staging
)
UPDATE canonical_ledger_staging
SET sequence = ordered.new_sequence
FROM ordered
WHERE canonical_ledger_staging.id = ordered.id
  AND canonical_ledger_staging.sequence IS NULL;

CREATE TABLE IF NOT EXISTS canonical_ledger_meta (
  id TEXT PRIMARY KEY,
  active_version INTEGER,
  last_built_at TIMESTAMPTZ,
  last_hash TEXT,
  status TEXT,
  active_ledger_version TEXT,
  previous_ledger_version TEXT,
  promotion_status TEXT,
  source_table TEXT,
  target_table TEXT,
  promotion_trace_id TEXT,
  replay_ref TEXT,
  verification_ref TEXT,
  promoted_by TEXT,
  replay_verified BOOLEAN NOT NULL DEFAULT false,
  rollback_available BOOLEAN NOT NULL DEFAULT false,
  governance_version TEXT,
  metadata JSONB,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS active_ledger_version TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS previous_ledger_version TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS promotion_status TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS source_table TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS target_table TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS promotion_trace_id TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS replay_ref TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS verification_ref TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS promoted_by TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS replay_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS rollback_available BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS governance_version TEXT;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ;
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE canonical_ledger_meta ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE canonical_ledger_meta
SET
  active_ledger_version = COALESCE(active_ledger_version, active_version::text, '2'),
  promotion_status = COALESCE(promotion_status, status, 'active'),
  source_table = COALESCE(source_table, 'canonical_ledger_v2'),
  target_table = COALESCE(target_table, 'canonical_ledger'),
  promotion_trace_id = COALESCE(promotion_trace_id, 'legacy-option-c-promotion'),
  replay_ref = COALESCE(replay_ref, 'legacy-option-c-replay'),
  replay_verified = COALESCE(replay_verified, false),
  rollback_available = COALESCE(rollback_available, true),
  governance_version = COALESCE(governance_version, 'master-volumes-runtime-v0.1.0'),
  promoted_at = COALESCE(promoted_at, last_built_at, now()),
  created_at = COALESCE(created_at, now()),
  updated_at = now();

CREATE TABLE IF NOT EXISTS canonical_promotion_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  version_from INTEGER,
  version_to INTEGER,
  metadata JSONB,
  event_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_rebuild_lock (
  id TEXT PRIMARY KEY,
  locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by TEXT
);

CREATE TABLE IF NOT EXISTS schema_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  schema_path TEXT NOT NULL,
  schema_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  checksum TEXT,
  owner_module TEXT,
  governance_version TEXT NOT NULL,
  replay_ref TEXT,
  metadata JSONB,
  effective_at TIMESTAMPTZ DEFAULT now(),
  deprecated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS version_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_domain TEXT NOT NULL,
  version TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  effective_at TIMESTAMPTZ DEFAULT now(),
  superseded_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL,
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_classification_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  classification_level TEXT NOT NULL,
  sensitivity_scope TEXT NOT NULL,
  jurisdiction_scope JSONB,
  disclosure_audience JSONB,
  sharing_permissions JSONB,
  ai_usage_permissions JSONB,
  export_restrictions JSONB,
  redaction_requirements JSONB,
  consent_requirements JSONB,
  retention_requirement TEXT NOT NULL,
  legal_hold_status BOOLEAN NOT NULL DEFAULT false,
  vault_required BOOLEAN NOT NULL DEFAULT false,
  classification_source TEXT NOT NULL,
  classification_version TEXT NOT NULL,
  governance_version TEXT NOT NULL,
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  classified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS observability_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  replay_ref TEXT,
  actor_id TEXT,
  module TEXT,
  anomaly_candidate BOOLEAN NOT NULL DEFAULT false,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS replay_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  replay_ref TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  verification_status TEXT NOT NULL,
  deterministic BOOLEAN NOT NULL DEFAULT false,
  replay_safe BOOLEAN NOT NULL DEFAULT false,
  source_version TEXT NOT NULL,
  replay_version TEXT NOT NULL,
  governance_version TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  mismatch_count INTEGER NOT NULL DEFAULT 0,
  result JSONB,
  metadata JSONB,
  verified_by TEXT,
  verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  replay_ref TEXT NOT NULL,
  tenant_id TEXT,
  user_id TEXT,
  pipeline_version TEXT NOT NULL,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  final_decision TEXT,
  composite_score INTEGER,
  risk_score INTEGER,
  input JSONB,
  output JSONB,
  metadata JSONB,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  replay_ref TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  stage TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  classification TEXT NOT NULL,
  version_ref TEXT,
  governance_version TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  replay_ref TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  pipeline_version TEXT NOT NULL,
  governance_version TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  deterministic BOOLEAN NOT NULL DEFAULT false,
  mismatch_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_rule_trace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  replay_ref TEXT NOT NULL,
  layer TEXT NOT NULL,
  rule TEXT NOT NULL,
  impact TEXT NOT NULL,
  before TEXT,
  after TEXT,
  reason TEXT,
  source_version TEXT,
  governance_version TEXT NOT NULL,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'governed-runtime',
  source_ref TEXT,
  trace_id TEXT,
  replay_ref TEXT,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL,
  metadata JSONB,
  granted_by TEXT,
  revoked_by TEXT,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS entitlements_tenant_id_unique
  ON entitlements (tenant_id);

CREATE INDEX IF NOT EXISTS schema_registry_schema_name_idx
  ON schema_registry (schema_name);

CREATE INDEX IF NOT EXISTS version_registry_domain_version_idx
  ON version_registry (version_domain, version);

CREATE INDEX IF NOT EXISTS data_classification_resource_idx
  ON data_classification_registry (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS observability_events_trace_idx
  ON observability_events (trace_id);

CREATE INDEX IF NOT EXISTS replay_verification_trace_idx
  ON replay_verification (trace_id);

CREATE INDEX IF NOT EXISTS pipeline_runs_trace_idx
  ON pipeline_runs (trace_id);

CREATE INDEX IF NOT EXISTS pipeline_events_trace_idx
  ON pipeline_events (trace_id);

CREATE INDEX IF NOT EXISTS pipeline_replays_trace_idx
  ON pipeline_replays (trace_id);

CREATE INDEX IF NOT EXISTS pipeline_rule_trace_trace_idx
  ON pipeline_rule_trace (trace_id);

CREATE INDEX IF NOT EXISTS canonical_ledger_sequence_idx
  ON canonical_ledger (sequence);

CREATE INDEX IF NOT EXISTS canonical_ledger_event_hash_idx
  ON canonical_ledger (event_hash);

CREATE INDEX IF NOT EXISTS canonical_ledger_v2_sequence_idx
  ON canonical_ledger_v2 (sequence);

CREATE INDEX IF NOT EXISTS canonical_ledger_v2_event_hash_idx
  ON canonical_ledger_v2 (event_hash);
