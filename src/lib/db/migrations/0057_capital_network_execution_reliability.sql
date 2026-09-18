-- 0057_capital_network_execution_reliability.sql
-- Durable, evidence-backed provider execution history for the Capital Network.
--
-- This is NOT a lead-auction, pricing, credit, or compensation table. It stores
-- case execution outcomes and milestone timestamps only. Personal credit,
-- income, DTI, net worth, liquidity, protected-class data, and compensation
-- MUST NOT be stored here or used in provider ranking.

CREATE TABLE IF NOT EXISTS capital_network_execution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  submission_case_id UUID,
  program TEXT,
  property_type TEXT,
  industry TEXT,
  location_state TEXT,
  selected_at TIMESTAMPTZ,
  consented_at TIMESTAMPTZ,
  provider_first_response_at TIMESTAMPTZ,
  provider_disposition_at TIMESTAMPTZ,
  closed_funded_at TIMESTAMPTZ,
  outcome TEXT NOT NULL,
  outcome_reason_category TEXT,
  verification_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_by TEXT NOT NULL,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT capital_network_execution_outcome_chk CHECK (
    outcome IN (
      'CLOSED_FUNDED',
      'PROVIDER_DECLINED',
      'PROVIDER_WITHDREW',
      'PROVIDER_NO_RESPONSE',
      'BORROWER_WITHDREW',
      'PROPERTY_OR_PROGRAM_BLOCKED',
      'THIRD_PARTY_OR_EXTERNAL_BLOCKED',
      'CANCELED'
    )
  ),
  CONSTRAINT capital_network_execution_verification_chk CHECK (
    verification_status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS capital_network_execution_case_provider_uq
  ON capital_network_execution_records (service_request_id, provider_id);
CREATE INDEX IF NOT EXISTS capital_network_execution_provider_idx
  ON capital_network_execution_records (provider_id, verification_status, outcome);
CREATE INDEX IF NOT EXISTS capital_network_execution_program_idx
  ON capital_network_execution_records (program, location_state, property_type);

COMMENT ON TABLE capital_network_execution_records IS
  'Evidence-backed Capital Network execution outcomes. No borrower personal-financial scoring, no compensation ranking, no lead auctioning.';
