ALTER TABLE access_security_states
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_salt text,
  ADD COLUMN IF NOT EXISTS password_set_at timestamptz;
