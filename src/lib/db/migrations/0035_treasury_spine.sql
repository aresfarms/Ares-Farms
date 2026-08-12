-- Canonical Treasury Spine Migration (REG-TREASURY-001 / CANON-TREASURY-001)
--
-- The governed financial-stewardship substrate: the 14 canonical treasury
-- objects, an append-only immutable ledger, versioned policy, and the six
-- reserve types each with a governed floor. BACKEND GOVERNANCE SPINE ONLY —
-- NO live payment capture, NO tier prices, NO membership checkout (those ride on
-- top and stay gated to the founders + counsel session; membership economics
-- shelved).
--
-- Master Volume Governance:
-- - Vol II (REG-TREASURY-001, Batch 27): no capital received/allocated/
--   transferred/distributed/reserved/spent outside governed treasury controls;
--   Treasury Account Registry (bank/payment/reserve/restricted/escrow + custody),
--   revenue classification + attribution, revenue waterfall, operating + a
--   SEPARATE emergency reserve, spending-authority separation of powers,
--   related-party review + reconciliation.
-- - Vol V (CANON-TREASURY-001): 14 canonical objects; append-only immutable
--   ledger (corrections create new events, never overwrite); six reserve types
--   with governed floors (breach requires TreasuryApproval); overlay + version
--   governance; classification; anomaly observability; dispute resolution.
-- - Vol V (CANON-CLASS-001 §4): treasury min Level 3 CONFIDENTIAL; compensation/
--   reserve/dispute Level 4 RESTRICTED; continuity/sovereign Level 5 SOVEREIGN.

CREATE TABLE IF NOT EXISTS treasury_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  account_type TEXT NOT NULL,
  reserve_type TEXT,
  custody_location TEXT,
  jurisdiction_scope TEXT,
  industry_partition TEXT,
  balance NUMERIC(20,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_accounts_account_id_idx ON treasury_accounts (account_id);
CREATE INDEX IF NOT EXISTS treasury_accounts_account_type_idx ON treasury_accounts (account_type);
CREATE INDEX IF NOT EXISTS treasury_accounts_reserve_type_idx ON treasury_accounts (reserve_type);

CREATE TABLE IF NOT EXISTS treasury_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id TEXT NOT NULL,
  from_account_id TEXT,
  to_account_id TEXT,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  allocation_basis TEXT,
  program_attribution TEXT,
  overlay_basis TEXT,
  approval_id TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_allocations_allocation_id_idx ON treasury_allocations (allocation_id);

CREATE TABLE IF NOT EXISTS treasury_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserve_id TEXT NOT NULL,
  reserve_type TEXT NOT NULL,
  purpose TEXT,
  floor_level NUMERIC(20,2) NOT NULL DEFAULT 0,
  current_level NUMERIC(20,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  replenishment_rules JSONB,
  policy_id TEXT,
  sovereign_authority TEXT,
  status TEXT NOT NULL DEFAULT 'pending-governance-approval',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_reserves_reserve_id_idx ON treasury_reserves (reserve_id);
CREATE INDEX IF NOT EXISTS treasury_reserves_reserve_type_idx ON treasury_reserves (reserve_type);

CREATE TABLE IF NOT EXISTS treasury_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_event_id TEXT NOT NULL,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  revenue_source TEXT,
  module_attribution TEXT,
  program_attribution TEXT,
  restriction_basis TEXT,
  tax_basis TEXT,
  overlay_basis TEXT,
  recognition_status TEXT NOT NULL DEFAULT 'recorded',
  account_id TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_revenue_events_revenue_event_id_idx ON treasury_revenue_events (revenue_event_id);
CREATE INDEX IF NOT EXISTS treasury_revenue_events_module_attribution_idx ON treasury_revenue_events (module_attribution);

CREATE TABLE IF NOT EXISTS treasury_compensation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compensation_event_id TEXT NOT NULL,
  recipient_id TEXT,
  recipient_role TEXT,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  compensation_basis TEXT,
  approval_id TEXT,
  dispute_id TEXT,
  related_party_review BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'recorded',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_compensation_events_compensation_event_id_idx ON treasury_compensation_events (compensation_event_id);

CREATE TABLE IF NOT EXISTS treasury_expense_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_event_id TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  authorization_id TEXT,
  overlay_basis TEXT,
  allocation_lineage TEXT,
  account_id TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_expense_events_expense_event_id_idx ON treasury_expense_events (expense_event_id);

CREATE TABLE IF NOT EXISTS treasury_distribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_event_id TEXT NOT NULL,
  recipient_id TEXT,
  recipient_type TEXT,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  distribution_basis TEXT,
  approval_id TEXT,
  overlay_basis TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_distribution_events_distribution_event_id_idx ON treasury_distribution_events (distribution_event_id);

CREATE TABLE IF NOT EXISTS treasury_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_entry_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  account_id TEXT,
  amount NUMERIC(20,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  corrects_event_id TEXT,
  correction_rationale TEXT,
  approving_actor TEXT,
  governance_basis TEXT,
  policy_version TEXT,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_ledger_ledger_entry_id_idx ON treasury_ledger (ledger_entry_id);
CREATE INDEX IF NOT EXISTS treasury_ledger_event_type_idx ON treasury_ledger (event_type);
CREATE INDEX IF NOT EXISTS treasury_ledger_corrects_event_id_idx ON treasury_ledger (corrects_event_id);

CREATE TABLE IF NOT EXISTS treasury_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  title TEXT,
  reserve_floors JSONB,
  compensation_structures JSONB,
  allocation_logic JSONB,
  revenue_waterfall JSONB,
  spending_authority JSONB,
  effective_start TIMESTAMPTZ,
  effective_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  approval_id TEXT,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_policies_policy_id_idx ON treasury_policies (policy_id);
CREATE INDEX IF NOT EXISTS treasury_policies_policy_version_idx ON treasury_policies (policy_version);

CREATE TABLE IF NOT EXISTS treasury_audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_record_id TEXT NOT NULL,
  event_type TEXT,
  event_id TEXT,
  approval_id TEXT,
  oversight_actor TEXT,
  oversight_basis TEXT,
  reconciliation_ref TEXT,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_audit_records_audit_record_id_idx ON treasury_audit_records (audit_record_id);

CREATE TABLE IF NOT EXISTS treasury_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id TEXT NOT NULL,
  as_of TIMESTAMPTZ NOT NULL,
  policy_version TEXT,
  state_digest TEXT,
  account_balances JSONB,
  reserve_levels JSONB,
  purpose TEXT,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_snapshots_snapshot_id_idx ON treasury_snapshots (snapshot_id);

CREATE TABLE IF NOT EXISTS treasury_replay_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_state_id TEXT NOT NULL,
  target_as_of TIMESTAMPTZ NOT NULL,
  policy_version TEXT,
  reconstructed_digest TEXT,
  source_snapshot_id TEXT,
  ledger_range_start TEXT,
  ledger_range_end TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_replay_states_replay_state_id_idx ON treasury_replay_states (replay_state_id);

CREATE TABLE IF NOT EXISTS treasury_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id TEXT NOT NULL,
  approval_type TEXT NOT NULL,
  subject_ref TEXT,
  approver_actor TEXT,
  approval_basis TEXT,
  decision TEXT NOT NULL DEFAULT 'pending',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_approvals_approval_id_idx ON treasury_approvals (approval_id);
CREATE INDEX IF NOT EXISTS treasury_approvals_approval_type_idx ON treasury_approvals (approval_type);

CREATE TABLE IF NOT EXISTS treasury_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id TEXT NOT NULL,
  disputed_event_type TEXT,
  disputed_event_id TEXT,
  disputing_actor TEXT,
  dispute_basis TEXT,
  assigned_reviewer TEXT,
  resolution_record TEXT,
  escalation_history JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treasury_disputes_dispute_id_idx ON treasury_disputes (dispute_id);
CREATE INDEX IF NOT EXISTS treasury_disputes_status_idx ON treasury_disputes (status);

-- Seed the six canonical reserve-type reference rows (CANON-TREASURY-001 §3).
-- Floors are 0 and status pending-governance-approval: the spine registers the
-- reserve architecture; live floors require a board-approved TreasuryPolicy +
-- TreasuryApproval (never self-approved by the build).
INSERT INTO treasury_reserves (reserve_id, reserve_type, purpose, status, classification, governance_version, replay_ref, metadata)
VALUES
  ('reserve-operational-genesis','operational','Funds required for ongoing platform operations','pending-governance-approval','RESTRICTED','master-volumes-runtime-v0.1.0','migration-0035-treasury-spine','{"canonical":true}'::jsonb),
  ('reserve-regulatory-genesis','regulatory','Funds required by regulatory program requirements','pending-governance-approval','RESTRICTED','master-volumes-runtime-v0.1.0','migration-0035-treasury-spine','{"canonical":true}'::jsonb),
  ('reserve-dispute-genesis','dispute','Funds held pending resolution of contested treasury events (refund/dispute holdback)','pending-governance-approval','RESTRICTED','master-volumes-runtime-v0.1.0','migration-0035-treasury-spine','{"canonical":true}'::jsonb),
  ('reserve-continuity-genesis','continuity','Funds ensuring institutional continuity under adverse conditions','pending-governance-approval','SOVEREIGN','master-volumes-runtime-v0.1.0','migration-0035-treasury-spine','{"canonical":true}'::jsonb),
  ('reserve-partner-genesis','partner','Funds designated for partner program participation','pending-governance-approval','RESTRICTED','master-volumes-runtime-v0.1.0','migration-0035-treasury-spine','{"canonical":true}'::jsonb),
  ('reserve-expansion-genesis','expansion','Funds designated for industry expansion deployment','pending-governance-approval','RESTRICTED','master-volumes-runtime-v0.1.0','migration-0035-treasury-spine','{"canonical":true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Seed a genesis TreasuryPolicy (draft, pending governance). Real reserve floors,
-- compensation structures, allocation logic, revenue waterfall, and spending
-- authority are populated by a board-approved policy version + TreasuryApproval.
INSERT INTO treasury_policies (policy_id, policy_version, title, status, classification, governance_version, replay_ref, metadata)
VALUES (
  'treasury-policy-genesis',
  'treasury-policy-v0.1.0',
  'Genesis Treasury Policy (spine substrate — pending governance)',
  'draft',
  'CONFIDENTIAL',
  'master-volumes-runtime-v0.1.0',
  'migration-0035-treasury-spine',
  '{"note":"spine substrate only; reserve floors + waterfall + spending authority + compensation structures require board-approved policy version + TreasuryApproval; no live billing"}'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO schema_registry (
  schema_name, schema_version, schema_path, schema_domain, status, owner_module,
  governance_version, replay_ref, metadata, effective_at, created_at, updated_at
)
VALUES (
  'treasury_spine',
  'treasury-spine-v0.1.0',
  'src/db/schema/treasury.ts',
  'governed-treasury',
  'active',
  'treasury-governance-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0035-treasury-spine',
  '{"purpose":"REG-TREASURY-001 / CANON-TREASURY-001 governance spine: 14 canonical treasury objects, append-only immutable ledger, versioned policy, six reserve types with governed floors; backend substrate only, NO live payment capture or membership pricing (gated to founders+counsel)"}'::jsonb,
  now(), now(), now()
)
ON CONFLICT DO NOTHING;
