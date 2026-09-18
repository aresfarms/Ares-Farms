-- Identity verification outcomes (Stripe Identity). The only thing that can
-- raise a subject to the `identity-verified` assurance tier.
--
-- HOLDS NO IDENTITY DATA BY DESIGN: no document image, no selfie, no ID
-- number, no date of birth, no address. Stripe retains those; this table
-- records the OUTCOME and a pointer. Every column below could appear in a
-- breach report without harming the person it describes.
CREATE TABLE IF NOT EXISTS identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_ref text NOT NULL,
  subject_email text,
  provider text NOT NULL DEFAULT 'stripe-identity',
  provider_session_id text NOT NULL,
  status text NOT NULL DEFAULT 'requires_input',
  verified boolean NOT NULL DEFAULT false,
  name_matched_request boolean,
  consent_ref text NOT NULL,
  last_error_code text,
  mode text NOT NULL DEFAULT 'test',
  trace_id text,
  replay_ref text,
  classification_level text NOT NULL DEFAULT 'RESTRICTED',
  verified_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The gate reads by subject, newest first, on every financial upload attempt.
CREATE INDEX IF NOT EXISTS identity_verifications_subject_idx
  ON identity_verifications(subject_ref, created_at DESC);

-- The webhook resolves an outcome by provider session id. UNIQUE because
-- Stripe can deliver the same event more than once, and a duplicate delivery
-- must update the existing row rather than create a second, divergent one.
CREATE UNIQUE INDEX IF NOT EXISTS identity_verifications_provider_session_idx
  ON identity_verifications(provider_session_id);

-- Retention sweep support: a verification outcome is not kept forever.
CREATE INDEX IF NOT EXISTS identity_verifications_expiry_idx
  ON identity_verifications(expires_at) WHERE deleted_at IS NULL;
