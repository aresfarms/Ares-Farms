CREATE TABLE IF NOT EXISTS plaid_secure_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_ref text NOT NULL,
  data_category text NOT NULL,
  ciphertext_b64 text NOT NULL,
  iv_b64 text NOT NULL,
  auth_tag_b64 text NOT NULL,
  wrapped_dek_b64 text NOT NULL,
  wrap_iv_b64 text NOT NULL,
  wrap_auth_tag_b64 text NOT NULL,
  key_version text NOT NULL,
  algorithm text NOT NULL DEFAULT 'AES-256-GCM-envelope-v1',
  consent_ref text NOT NULL,
  retention_class text NOT NULL,
  expires_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plaid_secure_records_subject_idx ON plaid_secure_records(subject_ref);
CREATE INDEX IF NOT EXISTS plaid_secure_records_expiry_idx ON plaid_secure_records(expires_at) WHERE deleted_at IS NULL;
