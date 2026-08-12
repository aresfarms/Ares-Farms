CREATE TABLE IF NOT EXISTS stripe_connect_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id text NOT NULL UNIQUE,
  evidence_sha256 text NOT NULL UNIQUE,
  payment_ref text NOT NULL,
  source_transaction_ref text,
  transfer_group text NOT NULL,
  gross_amount integer NOT NULL CHECK (gross_amount >= 0),
  currency text NOT NULL,
  revenue_class text NOT NULL,
  rule_id text NOT NULL,
  rule_version integer NOT NULL CHECK (rule_version > 0),
  rule_status text NOT NULL,
  caitlin_basis_points integer NOT NULL DEFAULT 0 CHECK (caitlin_basis_points BETWEEN 0 AND 10000),
  stuart_basis_points integer NOT NULL DEFAULT 0 CHECK (stuart_basis_points BETWEEN 0 AND 10000),
  caitlin_amount integer NOT NULL DEFAULT 0 CHECK (caitlin_amount >= 0),
  stuart_amount integer NOT NULL DEFAULT 0 CHECK (stuart_amount >= 0),
  furlong_retained_amount integer NOT NULL CHECK (furlong_retained_amount >= 0),
  caitlin_connected_account_ref text,
  stuart_connected_account_ref text,
  caitlin_recipient_certified boolean NOT NULL DEFAULT false,
  stuart_recipient_certified boolean NOT NULL DEFAULT false,
  transfer_promotion_active boolean NOT NULL DEFAULT false,
  transfer_execution_performed boolean NOT NULL DEFAULT false,
  approved_by_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  allocation_payload jsonb NOT NULL,
  governance_version text NOT NULL,
  classification text NOT NULL DEFAULT 'RESTRICTED',
  replay_ref text,
  trace_id text,
  generated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (caitlin_basis_points + stuart_basis_points <= 10000),
  CHECK (caitlin_amount + stuart_amount + furlong_retained_amount = gross_amount)
);

CREATE OR REPLACE FUNCTION block_stripe_connect_allocation_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'stripe_connect_allocations is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stripe_connect_allocations_immutable ON stripe_connect_allocations;
CREATE TRIGGER stripe_connect_allocations_immutable
BEFORE UPDATE OR DELETE ON stripe_connect_allocations
FOR EACH ROW EXECUTE FUNCTION block_stripe_connect_allocation_mutation();
