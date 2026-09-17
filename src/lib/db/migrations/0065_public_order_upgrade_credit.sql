-- One-time, same-property credit from a completed automated Property Report
-- to one Property Decision Report. REG-TREASURY-001; CANON-CONSENT-001.
ALTER TABLE furlong_public_orders
  ADD COLUMN IF NOT EXISTS credit_source_order_id UUID,
  ADD COLUMN IF NOT EXISTS credit_amount_cents INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_orders_credit_source_uq
  ON furlong_public_orders (credit_source_order_id)
  WHERE credit_source_order_id IS NOT NULL;

ALTER TABLE furlong_public_orders
  DROP CONSTRAINT IF EXISTS furlong_public_orders_credit_amount_ck;

ALTER TABLE furlong_public_orders
  ADD CONSTRAINT furlong_public_orders_credit_amount_ck
  CHECK (
    credit_amount_cents >= 0
    AND credit_amount_cents <= unit_amount_cents
    AND amount_total_cents = unit_amount_cents - credit_amount_cents
  );
