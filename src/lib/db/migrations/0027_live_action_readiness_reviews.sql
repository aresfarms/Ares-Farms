create table if not exists live_action_readiness_reviews (
  id uuid primary key default gen_random_uuid(),

  action_type text not null,
  readiness_status text not null default 'LIVE_ACTION_PROMOTION_BLOCKED',

  target_execution_id uuid not null,
  target_adapter_id text,
  target_provider_id text,
  target_source_id text,
  target_tenant_id text,
  target_application_id text,
  target_borrower_id text,
  target_billing_event_id text,
  target_session_id text,
  actor_id text,

  production_credential_vault_ref text,
  live_adapter_implementation_ref text,
  production_runbook_approval_ref text,
  dry_run_evidence_ref text,
  rollback_plan_ref text,
  incident_response_plan_ref text,
  monitoring_plan_ref text,
  audit_evidence_export_ref text,
  human_approval_ref text,

  execution_authorization_found boolean not null default false,
  execution_authorization_allowed boolean not null default false,
  live_action_not_previously_performed boolean not null default false,
  credential_approved boolean not null default false,
  outage_policy_tested boolean not null default false,
  replay_policy_verified boolean not null default false,
  schema_contract_verified boolean not null default false,
  consent_verified boolean not null default false,
  isolation_verified boolean not null default false,
  operational_runbook_approved boolean not null default false,
  production_credential_vault_present boolean not null default false,
  live_adapter_implementation_present boolean not null default false,
  production_runbook_approval_present boolean not null default false,
  dry_run_evidence_present boolean not null default false,
  rollback_plan_present boolean not null default false,
  incident_response_plan_present boolean not null default false,
  monitoring_plan_present boolean not null default false,
  audit_evidence_export_present boolean not null default false,
  human_approval_present boolean not null default false,
  domain_specific_controls_satisfied boolean not null default false,
  ready_for_live_action boolean not null default false,
  regulated_decision_impact_allowed boolean not null default false,
  external_action_performed boolean not null default false,
  live_action_performed boolean not null default false,

  gate_snapshot jsonb,
  blocker_reasons jsonb,

  governance_version text not null,
  classification text not null,
  replay_ref text,
  trace_id text,
  source text,
  metadata jsonb,

  reviewed_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists live_action_readiness_reviews_action_type_idx
  on live_action_readiness_reviews (action_type);

create index if not exists live_action_readiness_reviews_target_execution_idx
  on live_action_readiness_reviews (target_execution_id);

create index if not exists live_action_readiness_reviews_tenant_idx
  on live_action_readiness_reviews (target_tenant_id);

create index if not exists live_action_readiness_reviews_trace_idx
  on live_action_readiness_reviews (trace_id);
