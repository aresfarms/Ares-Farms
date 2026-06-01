create table if not exists credential_vault_refs (
  id uuid primary key default gen_random_uuid(),

  vault_ref_id text not null unique,
  credential_type text not null,
  external_platform text not null,
  holding_actor_id text not null,
  license_type text not null,
  license_scope jsonb,
  expiry_timestamp timestamptz,
  last_validated_timestamp timestamptz,
  renewal_status text not null,
  revocation_event_ref text,

  governance_version text not null,
  classification text not null,
  replay_ref text,
  trace_id text,
  source text,
  metadata jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists credentialed_scraping_events (
  id uuid primary key default gen_random_uuid(),

  scraping_event_id text not null unique,
  initiating_actor_id text not null,
  external_target_domain text not null,
  license_identifier_ref text not null,
  application_id_scope text not null,
  borrower_id text,
  tenant_id text,

  acquisition_method text not null,
  source_type text not null,
  source_trust_classification text not null default 'ADVISORY',
  requested_data_categories jsonb,
  human_authorization_ref text,
  source_authority_ref text,
  data_residency_zone text,
  sovereignty_classification text,

  ingested_payload_hash text,
  provenance_envelope_ref text,
  tos_compliance_attestation boolean not null default false,
  tos_compliance_attestation_ref text,
  license_boundary_confirmed boolean not null default false,
  whitelist_verified boolean not null default false,
  baseline_sync_logged boolean not null default false,
  isolation_boundary_confirmed boolean not null default false,
  credential_valid boolean not null default false,
  credential_expired boolean not null default false,
  credential_revoked boolean not null default false,
  circuit_breaker_triggered boolean not null default false,
  sev2_event_ref text,

  session_outcome text not null default 'ABORTED',
  ready_for_session boolean not null default false,
  external_request_transmitted boolean not null default false,
  data_processed_by_engine boolean not null default false,
  bulk_acquisition_requested boolean not null default false,
  anti_bulk_acquisition_satisfied boolean not null default false,
  ai_tier text not null default 'TIER_1_ADVISORY',

  gate_snapshot jsonb,
  blocker_reasons jsonb,

  governance_version text not null,
  classification text not null,
  replay_ref text,
  trace_id text,
  source text,
  metadata jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists credential_vault_refs_vault_ref_idx
  on credential_vault_refs (vault_ref_id);

create index if not exists credential_vault_refs_holding_actor_idx
  on credential_vault_refs (holding_actor_id);

create index if not exists credentialed_scraping_events_application_idx
  on credentialed_scraping_events (application_id_scope);

create index if not exists credentialed_scraping_events_tenant_idx
  on credentialed_scraping_events (tenant_id);

create index if not exists credentialed_scraping_events_trace_idx
  on credentialed_scraping_events (trace_id);
