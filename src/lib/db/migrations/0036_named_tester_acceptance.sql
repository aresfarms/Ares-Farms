-- Durable named-tester acceptance evidence. Cloud Run local files are ephemeral
-- and MUST NOT be used to close a governed acceptance blocker.
CREATE TABLE IF NOT EXISTS named_tester_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_revision TEXT NOT NULL,
  target_image_digest TEXT NOT NULL,
  target_application_id TEXT NOT NULL,
  tester_email TEXT NOT NULL,
  tester_name TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('PASS', 'PASS_WITH_FINDINGS', 'FAIL')),
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  statement TEXT NOT NULL,
  attested_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  UNIQUE (target_revision, tester_email)
);
CREATE INDEX IF NOT EXISTS named_tester_attestations_target_idx ON named_tester_attestations (target_revision, attested_at_utc);
