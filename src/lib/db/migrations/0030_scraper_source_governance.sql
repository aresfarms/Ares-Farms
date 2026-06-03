create table if not exists scraper_registry (
  id uuid primary key default gen_random_uuid(),
  scraper_id text not null unique,
  scraper_name text not null,
  source_id text not null,
  source_name text not null,
  source_category text not null,
  phase text not null,
  authority_tier text not null,
  connector_certification_status text not null default 'PENDING_CERTIFICATION',
  replay_supported boolean not null default true,
  live_fetch_allowed boolean not null default false,
  rate_limit_profile text not null,
  retry_governance_profile text not null,
  sovereign_restriction_profile text not null,
  claims_allowed jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scraper_run_events (
  id uuid primary key default gen_random_uuid(),
  scraper_id text not null,
  run_id text not null unique,
  run_status text not null,
  requested_by_actor_id text,
  requested_scope jsonb,
  live_fetch_attempted boolean not null default false,
  live_fetch_allowed boolean not null default false,
  human_review_required boolean not null default true,
  blocked_reasons jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scraper_fetch_records (
  id uuid primary key default gen_random_uuid(),
  fetch_record_id text not null unique,
  run_id text not null,
  scraper_id text not null,
  source_id text not null,
  source_name text not null,
  source_url text not null,
  source_version text,
  fetched_at timestamptz default now(),
  content_hash text not null,
  confidence_score integer not null default 0,
  jurisdiction_scope text,
  consent_scope text,
  connector_id text not null,
  scraper_version text not null,
  candidate_evidence_only boolean not null default true,
  operational_use_blocked boolean not null default true,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scraper_replay_refs (
  id uuid primary key default gen_random_uuid(),
  replay_id text not null unique,
  scraper_id text not null,
  run_id text,
  replay_mode text not null,
  deterministic_replay_required boolean not null default true,
  historical_reconstruction_supported boolean not null default true,
  replay_integrity_status text not null,
  lineage_refs jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scraper_integrity_reports (
  id uuid primary key default gen_random_uuid(),
  integrity_report_id text not null unique,
  scraper_id text not null,
  run_id text,
  integrity_status text not null,
  provenance_present boolean not null default false,
  classification_present boolean not null default false,
  replay_present boolean not null default false,
  source_authority_present boolean not null default false,
  findings jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scraper_classification_events (
  id uuid primary key default gen_random_uuid(),
  classification_event_id text not null unique,
  scraper_id text not null,
  source_id text not null,
  classification_profile text not null,
  ai_usage_tier text not null,
  redaction_requirements jsonb,
  export_restrictions jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scraper_escalation_events (
  id uuid primary key default gen_random_uuid(),
  escalation_id text not null unique,
  scraper_id text not null,
  source_id text not null,
  escalation_reason text not null,
  escalation_severity text not null,
  governance_queue text not null,
  human_review_required boolean not null default true,
  containment_actions jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists source_authority_registry (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,
  source_name text not null,
  source_authority_tier text not null,
  provenance_score integer not null,
  replayability_score integer not null,
  institutional_reliability text not null,
  claims_allowed jsonb,
  connector_certification_status text not null default 'PENDING_CERTIFICATION',
  jurisdiction_scope jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists source_ingestion_records (
  id uuid primary key default gen_random_uuid(),
  ingestion_record_id text not null unique,
  source_id text not null,
  source_name text not null,
  connector_id text not null,
  content_hash text not null,
  source_url text,
  ingestion_status text not null,
  candidate_evidence_only boolean not null default true,
  review_required boolean not null default true,
  scoring_use_blocked boolean not null default true,
  official_use_blocked boolean not null default true,
  provenance_envelope jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists source_review_records (
  id uuid primary key default gen_random_uuid(),
  review_record_id text not null unique,
  ingestion_record_id text not null,
  review_status text not null,
  reviewer_actor_id text,
  review_findings jsonb,
  next_required_action text not null,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists connector_certification_records (
  id uuid primary key default gen_random_uuid(),
  connector_certification_id text not null unique,
  connector_id text not null,
  source_id text not null,
  source_authority text not null,
  allowed_data_categories jsonb,
  jurisdiction_scope jsonb,
  rate_limit_profile text not null,
  authentication_type text not null,
  certification_status text not null,
  replay_supported boolean not null default true,
  fallback_connector text,
  classification_profile text not null,
  live_calls_allowed boolean not null default false,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_discovery_registry (
  id uuid primary key default gen_random_uuid(),
  discovery_source_id text not null unique,
  source_name text not null,
  source_category text not null,
  market_focus jsonb,
  authority_tier text not null,
  use_boundary text not null,
  public_surface_allowed boolean not null default true,
  official_use_blocked boolean not null default true,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_listing_records (
  id uuid primary key default gen_random_uuid(),
  listing_record_id text not null unique,
  discovery_source_id text not null,
  source_record_id text not null,
  canonical_property_id text,
  source_url text not null,
  listing_status text not null,
  content_hash text not null,
  authority_tier text not null,
  listing_history jsonb,
  advisory_only boolean not null default true,
  displayed_properties_are_not_approvals boolean not null default true,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists canonical_property_records (
  id uuid primary key default gen_random_uuid(),
  canonical_property_id text not null unique,
  source_records jsonb not null,
  source_authority_tier text not null,
  parcel_refs jsonb,
  geospatial_refs jsonb,
  provenance_chain jsonb not null,
  listing_status text not null,
  replay_refs jsonb not null,
  authority_scores jsonb,
  listing_history jsonb,
  confidence_score integer not null default 0,
  institutional_validation_status text not null default 'REVIEW_REQUIRED',
  official_collateral_certification_blocked boolean not null default true,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_source_authority_records (
  id uuid primary key default gen_random_uuid(),
  property_source_authority_id text not null unique,
  source_id text not null,
  source_authority_tier text not null,
  provenance_score integer not null,
  replayability_score integer not null,
  institutional_reliability text not null,
  claims_allowed jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_replay_refs (
  id uuid primary key default gen_random_uuid(),
  property_replay_id text not null unique,
  canonical_property_id text not null,
  source_record_refs jsonb not null,
  replay_integrity_status text not null,
  historical_listing_reconstruction_supported boolean not null default true,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_provenance_records (
  id uuid primary key default gen_random_uuid(),
  property_provenance_id text not null unique,
  canonical_property_id text not null,
  source_id text not null,
  source_url text not null,
  fetched_at timestamptz default now(),
  content_hash text not null,
  connector_id text not null,
  jurisdiction_scope text,
  provenance_chain jsonb not null,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_conflict_resolution_events (
  id uuid primary key default gen_random_uuid(),
  conflict_resolution_id text not null unique,
  canonical_property_id text not null,
  conflict_type text not null,
  conflicting_source_refs jsonb not null,
  resolution_status text not null,
  human_review_required boolean not null default true,
  selected_authority_basis text,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_classification_events (
  id uuid primary key default gen_random_uuid(),
  property_classification_id text not null unique,
  canonical_property_id text not null,
  classification_profile text not null,
  disclosure_audience jsonb,
  export_restrictions jsonb,
  claims_restrictions jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists property_review_events (
  id uuid primary key default gen_random_uuid(),
  property_review_id text not null unique,
  canonical_property_id text not null,
  review_status text not null,
  reviewer_actor_id text,
  institutional_validation_sources jsonb,
  review_findings jsonb,
  next_required_action text not null,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists classification_events (
  id uuid primary key default gen_random_uuid(),
  classification_event_id text not null unique,
  record_type text not null,
  record_id text not null,
  classification_profile text not null,
  classification_basis text not null,
  disclosure_audience jsonb,
  export_restrictions jsonb,
  redaction_requirements jsonb,
  governance_version text not null,
  classification_level text not null,
  replay_ref text not null,
  trace_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists scraper_registry_source_idx
  on scraper_registry (source_id);

create index if not exists scraper_run_events_scraper_idx
  on scraper_run_events (scraper_id);

create index if not exists scraper_fetch_records_run_idx
  on scraper_fetch_records (run_id);

create index if not exists source_authority_registry_tier_idx
  on source_authority_registry (source_authority_tier);

create index if not exists source_ingestion_records_source_idx
  on source_ingestion_records (source_id);

create index if not exists property_listing_records_canonical_idx
  on property_listing_records (canonical_property_id);

create index if not exists canonical_property_records_status_idx
  on canonical_property_records (institutional_validation_status);

create index if not exists property_replay_refs_canonical_idx
  on property_replay_refs (canonical_property_id);

create index if not exists property_provenance_records_canonical_idx
  on property_provenance_records (canonical_property_id);

create index if not exists classification_events_record_idx
  on classification_events (record_type, record_id);
