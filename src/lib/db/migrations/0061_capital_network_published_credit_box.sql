-- 0061_capital_network_published_credit_box.sql
-- Governed provider-published box evidence. These fields improve provider-fit
-- explanations but never authorize Furlong to make a credit decision.
ALTER TABLE capital_network_providers
  ADD COLUMN IF NOT EXISTS published_credit_box JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS collateral_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS environmental_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS typical_first_response_days INTEGER,
  ADD COLUMN IF NOT EXISTS typical_closing_days INTEGER,
  ADD COLUMN IF NOT EXISTS credit_box_source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS credit_box_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS capital_network_credit_box_verified_idx
  ON capital_network_providers (credit_box_verified_at, status, matching_enabled);

COMMENT ON COLUMN capital_network_providers.published_credit_box IS
  'Provider-published criteria preserved with source references. Furlong may compare documented box fit but does not make or imply a credit decision.';
COMMENT ON COLUMN capital_network_providers.credit_box_source_refs IS
  'Published policy, program guide, term sheet, provider page, or verified provider-attestation references supporting the displayed box.';
COMMENT ON COLUMN capital_network_providers.typical_closing_days IS
  'Provider-published or provider-attested expectation, never represented as Furlong-measured performance. Verified Furlong execution history is stored separately.';
