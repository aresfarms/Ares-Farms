create table if not exists sovereign_consent_gateway_records (
  id uuid primary key default gen_random_uuid(),

  gateway_record_id text not null unique,
  gateway_id text not null,
  initiating_authority_id text not null,
  initiating_authority_type text not null,
  initiating_authority_role text not null,
  verified_identity_event_ref text,
  affirmative_initiation_ref text,
  tribal_nation text,

  application_id_scope text not null,
  borrower_id text,
  tenant_id text,

  authorized_data_elements jsonb,
  authorized_workflow_phases jsonb,
  underwriting_window_closes_at timestamptz,
  initiation_timestamp timestamptz not null,
  expiration_timestamp timestamptz not null,
  revocation_event_ref text,

  gateway_status text not null,
  expiration_reason text,
  gateway_active boolean not null default false,
  level5_baseline_confirmed boolean not null default true,
  level4_operational_exception_authorized boolean not null default false,
  sovereignty_classification text not null default 'SOVEREIGN_CONTROLLED',
  operational_classification text not null default 'SOVEREIGN_CONTROLLED',

  non_proprietary_only_confirmed boolean not null default false,
  publicly_accessible_registry_only boolean not null default false,
  application_scope_confirmed boolean not null default false,
  workflow_scope_confirmed boolean not null default false,
  no_bulk_data_acquisition boolean not null default false,
  no_cross_transaction_sharing boolean not null default false,
  no_competitive_intelligence boolean not null default false,
  no_ai_training_access boolean not null default false,
  no_proprietary_sovereign_records boolean not null default false,
  platform_initiated boolean not null default false,

  external_legal_framework_reviewed boolean not null default false,
  compliance_officer_id text,
  compliance_review_ref text,
  compliance_officer_verified boolean not null default false,

  data_access_events jsonb,
  data_access_performed boolean not null default false,
  scoring_use_allowed boolean not null default false,
  underwriting_use_allowed boolean not null default false,
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

create index if not exists sovereign_consent_gateway_records_gateway_idx
  on sovereign_consent_gateway_records (gateway_id);

create index if not exists sovereign_consent_gateway_records_application_idx
  on sovereign_consent_gateway_records (application_id_scope);

create index if not exists sovereign_consent_gateway_records_tenant_idx
  on sovereign_consent_gateway_records (tenant_id);

create index if not exists sovereign_consent_gateway_records_trace_idx
  on sovereign_consent_gateway_records (trace_id);
