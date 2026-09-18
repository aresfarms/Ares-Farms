-- 0064_furlong_public_orders.sql
-- Vol I CONST-CONSENT-001 / CONST-DATA-001; Vol III TECH-LEDGER-001,
-- TECH-UX-001; Vol III-B runtime enforcement; Vol V CANON-CONSENT-001,
-- CANON-TREASURY-001: server-priced, resource-scoped public orders with
-- versioned disclosure evidence, immutable replay-safe provider events, and
-- independently revocable grants.
CREATE TABLE IF NOT EXISTS furlong_public_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id TEXT NOT NULL,
  buyer_actor_id TEXT,
  access_token_hash TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_catalog_version TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  target_snapshot JSONB NOT NULL,
  fulfillment_mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED',
  unit_amount_cents INTEGER NOT NULL,
  amount_total_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  amount_refunded_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  quantity INTEGER NOT NULL DEFAULT 1,
  report_credits INTEGER NOT NULL DEFAULT 0,
  checkout_session_id TEXT,
  payment_intent_id TEXT,
  subscription_id TEXT,
  provider TEXT NOT NULL DEFAULT 'stripe',
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  checkout_created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  fulfillment_started_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_public_orders_target_type_chk
    CHECK (target_type IN ('PROPERTY','PROPERTY_COMPARISON')),
  CONSTRAINT furlong_public_orders_fulfillment_mode_chk
    CHECK (fulfillment_mode IN ('INSTANT','AUTOMATED','SUPERVISED','METERED','MEMBERSHIP')),
  CONSTRAINT furlong_public_orders_status_chk
    CHECK (status IN (
      'CREATED','CHECKOUT_CREATED','PAYMENT_PENDING','PAID',
      'FULFILLMENT_PENDING','IN_FULFILLMENT','FULFILLED',
      'REFUND_PENDING','CANCELED','FAILED','HELD','REFUNDED','DISPUTED',
      'DISPUTE_WON','DISPUTE_LOST'
    )),
  CONSTRAINT furlong_public_orders_amounts_chk CHECK (
    unit_amount_cents >= 0
    AND amount_total_cents >= 0
    AND amount_paid_cents >= 0
    AND amount_refunded_cents >= 0
  ),
  CONSTRAINT furlong_public_orders_quantity_chk CHECK (quantity >= 1),
  CONSTRAINT furlong_public_orders_credits_chk CHECK (report_credits >= 0),
  CONSTRAINT furlong_public_orders_currency_chk CHECK (currency = LOWER(currency))
);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_orders_checkout_request_uq
  ON furlong_public_orders(checkout_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_orders_access_token_uq
  ON furlong_public_orders(access_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_orders_checkout_session_uq
  ON furlong_public_orders(checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_orders_payment_intent_uq
  ON furlong_public_orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS furlong_public_orders_buyer_idx
  ON furlong_public_orders(buyer_actor_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS furlong_public_orders_target_idx
  ON furlong_public_orders(target_type, target_ref, updated_at DESC);
CREATE INDEX IF NOT EXISTS furlong_public_orders_status_idx
  ON furlong_public_orders(status, updated_at);

CREATE TABLE IF NOT EXISTS furlong_public_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES furlong_public_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  amount_cents INTEGER,
  currency TEXT,
  payment_status TEXT,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_public_order_events_amount_chk
    CHECK (amount_cents IS NULL OR amount_cents >= 0),
  CONSTRAINT furlong_public_order_events_digest_chk
    CHECK (payload_digest ~ '^[a-f0-9]{64}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_order_events_provider_event_uq
  ON furlong_public_order_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS furlong_public_order_events_order_idx
  ON furlong_public_order_events(order_id, occurred_at);

CREATE OR REPLACE FUNCTION block_furlong_public_order_event_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'furlong_public_order_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS furlong_public_order_events_immutable
  ON furlong_public_order_events;
CREATE TRIGGER furlong_public_order_events_immutable
BEFORE UPDATE OR DELETE ON furlong_public_order_events
FOR EACH ROW
EXECUTE FUNCTION block_furlong_public_order_event_mutation();

CREATE TABLE IF NOT EXISTS furlong_public_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES furlong_public_orders(id) ON DELETE CASCADE,
  buyer_actor_id TEXT,
  access_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_ref TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  units_granted INTEGER NOT NULL DEFAULT 1,
  units_remaining INTEGER NOT NULL DEFAULT 1,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_public_access_grants_units_chk CHECK (
    units_granted >= 0
    AND units_remaining >= 0
    AND units_remaining <= units_granted
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_public_access_grants_scope_uq
  ON furlong_public_access_grants(
    order_id, access_type, resource_type, resource_ref
  );
CREATE INDEX IF NOT EXISTS furlong_public_access_grants_resource_idx
  ON furlong_public_access_grants(resource_type, resource_ref, active);
CREATE INDEX IF NOT EXISTS furlong_public_access_grants_buyer_idx
  ON furlong_public_access_grants(buyer_actor_id, active);

COMMENT ON TABLE furlong_public_orders IS
  'Server-priced public orders bound to a specific property or comparison.';
COMMENT ON TABLE furlong_public_order_events IS
  'Idempotent, digest-retaining Stripe event lineage for public orders.';
COMMENT ON TABLE furlong_public_access_grants IS
  'Resource-scoped access. Never a tenant-wide institutional entitlement.';

CREATE TABLE IF NOT EXISTS furlong_public_product_price_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  product_catalog_version TEXT NOT NULL,
  unit_amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  direct_data_cost_cents INTEGER NOT NULL,
  compute_cost_cents INTEGER NOT NULL,
  review_labor_minutes INTEGER NOT NULL,
  review_labor_rate_cents_hourly INTEGER NOT NULL,
  support_reserve_cents INTEGER NOT NULL,
  overhead_allocation_cents INTEGER NOT NULL,
  payment_fee_basis_points INTEGER NOT NULL,
  payment_fee_fixed_cents INTEGER NOT NULL,
  refund_reserve_basis_points INTEGER NOT NULL,
  fully_loaded_cost_cents INTEGER NOT NULL,
  contribution_margin_cents INTEGER NOT NULL,
  contribution_margin_basis_points INTEGER NOT NULL,
  minimum_margin_basis_points INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'DRAFT',
  reviewed_by TEXT,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  effective_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_public_product_price_reviews_status_chk
    CHECK (review_status IN ('DRAFT','APPROVED','REJECTED','EXPIRED')),
  CONSTRAINT furlong_public_product_price_reviews_cost_chk CHECK (
    unit_amount_cents > 0
    AND direct_data_cost_cents >= 0
    AND compute_cost_cents >= 0
    AND review_labor_minutes >= 0
    AND review_labor_rate_cents_hourly >= 0
    AND support_reserve_cents >= 0
    AND overhead_allocation_cents >= 0
    AND payment_fee_basis_points BETWEEN 0 AND 10000
    AND payment_fee_fixed_cents >= 0
    AND refund_reserve_basis_points BETWEEN 0 AND 10000
    AND fully_loaded_cost_cents >= 0
    AND minimum_margin_basis_points BETWEEN 0 AND 10000
  ),
  CONSTRAINT furlong_public_product_price_reviews_margin_chk CHECK (
    contribution_margin_cents =
      unit_amount_cents - fully_loaded_cost_cents
    AND contribution_margin_basis_points BETWEEN -100000 AND 10000
  ),
  CONSTRAINT furlong_public_product_price_reviews_period_chk
    CHECK (expires_at > effective_at),
  CONSTRAINT furlong_public_product_price_reviews_currency_chk
    CHECK (currency = LOWER(currency))
);
CREATE UNIQUE INDEX IF NOT EXISTS
  furlong_public_product_price_reviews_period_uq
  ON furlong_public_product_price_reviews(
    product_code, product_catalog_version, effective_at
  );
CREATE INDEX IF NOT EXISTS
  furlong_public_product_price_reviews_active_idx
  ON furlong_public_product_price_reviews(
    product_code, product_catalog_version, review_status,
    effective_at, expires_at
  );

COMMENT ON TABLE furlong_public_product_price_reviews IS
  'Time-bounded approved unit-cost and margin evidence required before a public product can be sold.';