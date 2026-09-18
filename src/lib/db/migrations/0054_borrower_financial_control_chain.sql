-- Borrower Financial Control Chain / Master Volume Mirror Reconciliation
-- Advance scope acceptance -> BorrowerProtectionFeeControl -> actual-work evidence
-- -> module-attributed revenue/payment/refund -> treasury reconciliation.
-- This migration creates records only; it does NOT activate live payment capture.

ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS service_code TEXT;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS scope_acceptance_id TEXT;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS maximum_fee_amount INTEGER;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS fee_rate_amount INTEGER;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS disclosure_version TEXT;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS regulatory_basis TEXT;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS waiver_conditions JSONB;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS enforcement_mechanism TEXT;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS scope_accepted_before_work BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS disclosure_at TIMESTAMPTZ;
ALTER TABLE borrower_protection_fee_controls ADD COLUMN IF NOT EXISTS borrower_accepted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS engagement_scope_acceptances (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scope_acceptance_id TEXT NOT NULL UNIQUE,
 borrower_id TEXT, customer_subject_ref TEXT, tenant_id TEXT NOT NULL, module_id TEXT NOT NULL,
 service_code TEXT NOT NULL, scope_version TEXT NOT NULL, scope_summary TEXT NOT NULL,
 scope_hash TEXT NOT NULL, quoted_amount NUMERIC(20,2), quoted_rate NUMERIC(20,2),
 currency TEXT NOT NULL DEFAULT 'USD', accepted_by TEXT NOT NULL, acceptance_method TEXT NOT NULL,
 fee_control_id TEXT, status TEXT NOT NULL DEFAULT 'accepted', governance_version TEXT NOT NULL,
 classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL', replay_ref TEXT, trace_id TEXT, source TEXT,
 metadata JSONB, accepted_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS engagement_scope_acceptances_module_idx ON engagement_scope_acceptances(module_id);
CREATE INDEX IF NOT EXISTS engagement_scope_acceptances_fee_control_idx ON engagement_scope_acceptances(fee_control_id);

CREATE TABLE IF NOT EXISTS service_delivery_evidence_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), evidence_id TEXT NOT NULL UNIQUE,
 scope_acceptance_id TEXT NOT NULL, fee_control_id TEXT NOT NULL, module_id TEXT NOT NULL,
 service_code TEXT NOT NULL, work_type TEXT NOT NULL, actual_work_summary TEXT NOT NULL,
 performed_by TEXT NOT NULL, evidence_refs JSONB NOT NULL, billable_units NUMERIC(20,4),
 amount_eligible NUMERIC(20,2), currency TEXT NOT NULL DEFAULT 'USD', verified BOOLEAN NOT NULL DEFAULT false,
 verified_by TEXT, governance_version TEXT NOT NULL, classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
 replay_ref TEXT, trace_id TEXT, source TEXT, metadata JSONB, work_started_at TIMESTAMPTZ,
 work_completed_at TIMESTAMPTZ, verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_delivery_evidence_scope_idx ON service_delivery_evidence_records(scope_acceptance_id);
CREATE INDEX IF NOT EXISTS service_delivery_evidence_module_idx ON service_delivery_evidence_records(module_id);

CREATE TABLE IF NOT EXISTS governed_payment_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_record_id TEXT NOT NULL UNIQUE,
 provider TEXT NOT NULL, provider_payment_ref TEXT NOT NULL, billing_event_id TEXT,
 scope_acceptance_id TEXT, fee_control_id TEXT, actual_work_evidence_id TEXT, module_attribution TEXT NOT NULL,
 amount NUMERIC(20,2) NOT NULL, currency TEXT NOT NULL DEFAULT 'USD', payment_purpose TEXT NOT NULL,
 status TEXT NOT NULL, live_capture BOOLEAN NOT NULL DEFAULT false, treasury_ledger_ref TEXT,
 revenue_event_ref TEXT, governance_version TEXT NOT NULL, classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
 replay_ref TEXT, trace_id TEXT, source TEXT, metadata JSONB, authorized_at TIMESTAMPTZ,
 captured_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS governed_payment_records_module_idx ON governed_payment_records(module_attribution);
CREATE INDEX IF NOT EXISTS governed_payment_records_scope_idx ON governed_payment_records(scope_acceptance_id);

CREATE TABLE IF NOT EXISTS module_revenue_attribution_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), attribution_id TEXT NOT NULL UNIQUE,
 payment_record_id TEXT NOT NULL, revenue_event_id TEXT, module_id TEXT NOT NULL, service_code TEXT NOT NULL,
 provider_entity TEXT NOT NULL, gross_amount NUMERIC(20,2) NOT NULL, refund_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
 net_amount NUMERIC(20,2) NOT NULL, contributor_share NUMERIC(20,2) NOT NULL DEFAULT 0,
 platform_overhead NUMERIC(20,2) NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', restrictions JSONB,
 tax_posture TEXT, related_party BOOLEAN NOT NULL DEFAULT false, related_party_review_ref TEXT,
 governance_version TEXT NOT NULL, classification TEXT NOT NULL DEFAULT 'RESTRICTED', replay_ref TEXT, trace_id TEXT,
 source TEXT, metadata JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS module_revenue_attribution_payment_idx ON module_revenue_attribution_records(payment_record_id);
CREATE INDEX IF NOT EXISTS module_revenue_attribution_module_idx ON module_revenue_attribution_records(module_id);

CREATE TABLE IF NOT EXISTS governed_refund_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), refund_record_id TEXT NOT NULL UNIQUE,
 payment_record_id TEXT NOT NULL, provider_refund_ref TEXT, amount NUMERIC(20,2) NOT NULL,
 currency TEXT NOT NULL DEFAULT 'USD', reason TEXT NOT NULL, status TEXT NOT NULL,
 treasury_ledger_ref TEXT, approval_id TEXT, governance_version TEXT NOT NULL,
 classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL', replay_ref TEXT, trace_id TEXT, source TEXT,
 metadata JSONB, requested_at TIMESTAMPTZ DEFAULT now(), completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS governed_refund_records_payment_idx ON governed_refund_records(payment_record_id);

CREATE TABLE IF NOT EXISTS treasury_reconciliation_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reconciliation_id TEXT NOT NULL UNIQUE,
 period_start TIMESTAMPTZ NOT NULL, period_end TIMESTAMPTZ NOT NULL,
 internal_ledger_total NUMERIC(20,2) NOT NULL, provider_settlement_total NUMERIC(20,2) NOT NULL,
 custody_statement_total NUMERIC(20,2) NOT NULL, accounting_system_total NUMERIC(20,2) NOT NULL, recognized_revenue_total NUMERIC(20,2) NOT NULL,
 refund_total NUMERIC(20,2) NOT NULL DEFAULT 0, variance NUMERIC(20,2) NOT NULL,
 variance_disposition TEXT, source_refs JSONB NOT NULL, reconciler_actor TEXT NOT NULL, attestation_actor TEXT NOT NULL,
 separation_of_duties_confirmed BOOLEAN NOT NULL DEFAULT false, distribution_allowed BOOLEAN NOT NULL DEFAULT false, approval_id TEXT, status TEXT NOT NULL DEFAULT 'pending', exception_ref TEXT,
 governance_version TEXT NOT NULL, classification TEXT NOT NULL DEFAULT 'RESTRICTED',
 replay_ref TEXT, trace_id TEXT, source TEXT, metadata JSONB, completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_reconciliation_period_idx ON treasury_reconciliation_records(period_start, period_end);
