CREATE TABLE IF NOT EXISTS source_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL UNIQUE,
  source_name text NOT NULL,
  source_category text NOT NULL,
  source_authority_tier text NOT NULL,
  jurisdiction_scope jsonb NOT NULL,
  licensing_restrictions jsonb NOT NULL,
  provenance_score integer NOT NULL,
  replayability_score integer NOT NULL,
  freshness_cadence text NOT NULL,
  live_fetch_allowed boolean NOT NULL DEFAULT false,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS connector_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id text NOT NULL UNIQUE,
  source_id text NOT NULL,
  connector_type text NOT NULL,
  certification_status text NOT NULL,
  queue_profile text NOT NULL,
  retry_governance_profile text NOT NULL,
  proxy_handling_profile text NOT NULL,
  failover_source_refs jsonb,
  live_calls_allowed boolean NOT NULL DEFAULT false,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_entity_id text NOT NULL UNIQUE,
  entity_type text NOT NULL,
  canonical_ref text NOT NULL,
  source_record_refs jsonb NOT NULL,
  source_weighting jsonb NOT NULL,
  lineage jsonb NOT NULL,
  historical_snapshots jsonb NOT NULL,
  conflict_refs jsonb,
  canonicalization_status text NOT NULL,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_conflict_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_event_id text NOT NULL UNIQUE,
  entity_type text NOT NULL,
  entity_ref text NOT NULL,
  conflict_type text NOT NULL,
  conflicting_source_refs jsonb NOT NULL,
  conflict_summary text NOT NULL,
  arbitration_status text NOT NULL,
  escalation_queue text NOT NULL,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS geo_intelligence_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geo_intelligence_id text NOT NULL UNIQUE,
  geography_scope text NOT NULL,
  layer_type text NOT NULL,
  source_id text NOT NULL,
  source_authority_tier text NOT NULL,
  freshness_status text NOT NULL,
  postgis_ready boolean NOT NULL DEFAULT false,
  vector_tile_ready boolean NOT NULL DEFAULT false,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text NOT NULL UNIQUE,
  category text NOT NULL,
  marketplace_source_refs jsonb NOT NULL,
  price_snapshot_refs jsonb NOT NULL,
  program_use_refs jsonb,
  canonical_equipment_ref text,
  availability_region jsonb NOT NULL,
  financeability_claim_blocked boolean NOT NULL DEFAULT true,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_freshness_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freshness_record_id text NOT NULL UNIQUE,
  source_id text NOT NULL,
  freshness_status text NOT NULL,
  last_checked_at timestamptz,
  next_check_due_at timestamptz,
  stale_source_detected boolean NOT NULL DEFAULT false,
  remediation_required boolean NOT NULL DEFAULT true,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_failover_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  failover_event_id text NOT NULL UNIQUE,
  primary_source_id text NOT NULL,
  fallback_source_id text NOT NULL,
  failover_reason text NOT NULL,
  failover_status text NOT NULL,
  live_fetch_performed boolean NOT NULL DEFAULT false,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_queue_health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_health_event_id text NOT NULL UNIQUE,
  queue_name text NOT NULL,
  queue_status text NOT NULL,
  pending_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  retry_count integer NOT NULL DEFAULT 0,
  anomaly_detected boolean NOT NULL DEFAULT false,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_canonicalization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonicalization_event_id text NOT NULL UNIQUE,
  entity_type text NOT NULL,
  source_record_ref text NOT NULL,
  canonical_entity_ref text NOT NULL,
  deduplication_status text NOT NULL,
  fuzzy_match_score integer NOT NULL DEFAULT 0,
  conflict_preserved boolean NOT NULL DEFAULT true,
  governance_version text NOT NULL,
  classification_level text NOT NULL,
  replay_ref text NOT NULL,
  trace_id text,
  source_refs jsonb,
  replay_refs jsonb,
  claims_restrictions jsonb,
  human_review_required boolean NOT NULL DEFAULT true,
  production_blocked boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_registry_tier_idx
  ON source_registry (source_authority_tier);

CREATE INDEX IF NOT EXISTS source_registry_category_idx
  ON source_registry (source_category);

CREATE INDEX IF NOT EXISTS connector_registry_source_idx
  ON connector_registry (source_id);

CREATE INDEX IF NOT EXISTS canonical_entities_type_idx
  ON canonical_entities (entity_type);

CREATE INDEX IF NOT EXISTS source_conflict_events_entity_idx
  ON source_conflict_events (entity_type, entity_ref);

CREATE INDEX IF NOT EXISTS geo_intelligence_registry_source_idx
  ON geo_intelligence_registry (source_id);

CREATE INDEX IF NOT EXISTS equipment_registry_category_idx
  ON equipment_registry (category);

CREATE INDEX IF NOT EXISTS source_freshness_records_source_idx
  ON source_freshness_records (source_id);

CREATE INDEX IF NOT EXISTS source_failover_events_primary_idx
  ON source_failover_events (primary_source_id);

CREATE INDEX IF NOT EXISTS source_queue_health_events_queue_idx
  ON source_queue_health_events (queue_name);

CREATE INDEX IF NOT EXISTS source_canonicalization_events_entity_idx
  ON source_canonicalization_events (entity_type, canonical_entity_ref);
