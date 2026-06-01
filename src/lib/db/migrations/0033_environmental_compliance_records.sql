CREATE TABLE IF NOT EXISTS borrower_protection_fee_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_control_id text NOT NULL UNIQUE,
  journey_id text NOT NULL,
  application_id text,
  borrower_id text,
  tenant_id text NOT NULL,
  actor_id text,
  fee_type text NOT NULL,
  fee_amount integer NOT NULL DEFAULT 0,
  standard_market_rate_amount integer NOT NULL DEFAULT 0,
  advisory_discount_percent integer NOT NULL DEFAULT 0,
  fee_disclosure_ref text NOT NULL,
  disclosure_status text NOT NULL,
  disclosed_before_assessment boolean NOT NULL DEFAULT false,
  borrower_external_firm_right_preserved boolean NOT NULL DEFAULT false,
  no_surcharge_or_preference_incentive boolean NOT NULL DEFAULT false,
  provider_selection text,
  governance_version text NOT NULL,
  classification text NOT NULL,
  replay_ref text,
  trace_id text,
  source text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environmental_compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_record_id text NOT NULL UNIQUE,
  journey_id text NOT NULL,
  application_id text,
  borrower_id text,
  tenant_id text NOT NULL,
  actor_id text,
  pathway_type text NOT NULL,
  triggering_pathway text NOT NULL,
  assessment_requirement_status text NOT NULL DEFAULT 'ASSESSMENT_REQUIRED',
  assessment_type text NOT NULL,
  assessment_provider_type text,
  provider_name text,
  provider_license_ref text,
  provider_license_verified boolean NOT NULL DEFAULT false,
  assessment_outcome text NOT NULL,
  fee_amount integer NOT NULL DEFAULT 0,
  fee_disclosure_ref text,
  borrower_protection_fee_control_id text,
  fee_disclosed_before_initiation boolean NOT NULL DEFAULT false,
  borrower_external_firm_right_preserved boolean NOT NULL DEFAULT false,
  no_fee_surcharge_or_preference boolean NOT NULL DEFAULT false,
  spoke_isolation_confirmed boolean NOT NULL DEFAULT false,
  banker_spoke_isolated boolean NOT NULL DEFAULT false,
  environmental_assessment_triggered boolean NOT NULL DEFAULT false,
  pathway_exemption_event_ref text,
  escalation_ref text,
  audit_anchor_ref text,
  loan_pathway_advancement_allowed boolean NOT NULL DEFAULT false,
  official_report_generated boolean NOT NULL DEFAULT false,
  live_external_action_performed boolean NOT NULL DEFAULT false,
  gate_snapshot jsonb,
  blocker_reasons jsonb,
  governance_version text NOT NULL,
  classification text NOT NULL,
  replay_ref text,
  trace_id text,
  source text,
  metadata jsonb,
  assessment_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS environmental_compliance_records_tenant_idx
  ON environmental_compliance_records (tenant_id);

CREATE INDEX IF NOT EXISTS environmental_compliance_records_application_idx
  ON environmental_compliance_records (application_id);

CREATE INDEX IF NOT EXISTS environmental_compliance_records_journey_idx
  ON environmental_compliance_records (journey_id);

CREATE INDEX IF NOT EXISTS environmental_compliance_records_trace_idx
  ON environmental_compliance_records (trace_id);

CREATE INDEX IF NOT EXISTS borrower_protection_fee_controls_tenant_idx
  ON borrower_protection_fee_controls (tenant_id);

CREATE INDEX IF NOT EXISTS borrower_protection_fee_controls_journey_idx
  ON borrower_protection_fee_controls (journey_id);
