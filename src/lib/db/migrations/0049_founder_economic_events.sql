CREATE TABLE IF NOT EXISTS founder_economic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id text NOT NULL UNIQUE,
  evidence_sha256 text NOT NULL UNIQUE,
  payment_ref text NOT NULL,
  source_transaction_ref text,
  revenue_class text NOT NULL,
  gross_amount integer NOT NULL,
  external_deductions integer NOT NULL DEFAULT 0,
  operating_expenses integer NOT NULL DEFAULT 0,
  stewardship_entitlement integer NOT NULL DEFAULT 0,
  stewardship_paid integer NOT NULL DEFAULT 0,
  stewardship_accrued integer NOT NULL DEFAULT 0,
  founder_expense_reimbursement integer NOT NULL DEFAULT 0,
  build_recovery_paid integer NOT NULL DEFAULT 0,
  caitlin_general_distribution integer NOT NULL DEFAULT 0,
  stuart_general_distribution integer NOT NULL DEFAULT 0,
  platform_reserve_retained integer NOT NULL DEFAULT 0,
  allocation_payload jsonb NOT NULL,
  governance_version text NOT NULL,
  generated_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION block_founder_economic_event_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'founder_economic_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS founder_economic_events_immutable ON founder_economic_events;
CREATE TRIGGER founder_economic_events_immutable
BEFORE UPDATE OR DELETE ON founder_economic_events
FOR EACH ROW EXECUTE FUNCTION block_founder_economic_event_mutation();
