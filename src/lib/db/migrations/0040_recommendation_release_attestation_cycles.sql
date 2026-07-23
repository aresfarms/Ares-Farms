-- Expiring attestation cycles preserve stale review history while allowing a fresh independent review cycle.
ALTER TABLE recommendation_release_attestations
  ADD COLUMN IF NOT EXISTS attestation_cycle_id TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE recommendation_release_attestations
SET attestation_cycle_id = COALESCE(attestation_cycle_id, release_id || ':legacy-cycle'),
    expires_at = COALESCE(expires_at, created_at + interval '24 hours');

ALTER TABLE recommendation_release_attestations
  ALTER COLUMN attestation_cycle_id SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL;

ALTER TABLE recommendation_release_attestations
  DROP CONSTRAINT IF EXISTS recommendation_release_attestation_reviewer_uniq;

ALTER TABLE recommendation_release_attestations
  ADD CONSTRAINT recommendation_release_attestation_reviewer_uniq
  UNIQUE (release_id, attestation_cycle_id, reviewer_actor_id);

CREATE INDEX IF NOT EXISTS recommendation_release_attestation_active_cycle_idx
  ON recommendation_release_attestations (release_id, expires_at DESC, created_at ASC);
