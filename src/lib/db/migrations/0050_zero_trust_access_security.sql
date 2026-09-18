CREATE TABLE IF NOT EXISTS access_security_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_status text NOT NULL DEFAULT 'ACTIVE',
  employment_status text NOT NULL DEFAULT 'ACTIVE',
  session_version integer NOT NULL DEFAULT 1,
  mfa_required text NOT NULL DEFAULT 'POLICY',
  last_access_review_at timestamptz,
  deprovisioned_at timestamptz,
  deprovision_reason text,
  governance_version text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key_b64 text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports jsonb,
  device_type text,
  backed_up text,
  label text,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webauthn_credentials_user_id_idx
  ON webauthn_credentials(user_id);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  challenge text NOT NULL,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webauthn_challenges_user_id_idx
  ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS webauthn_challenges_expiry_idx
  ON webauthn_challenges(expires_at);