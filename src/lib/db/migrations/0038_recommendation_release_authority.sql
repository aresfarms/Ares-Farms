-- Preserve the authenticated human authority behind each immutable recommendation release.
ALTER TABLE recommendation_release_records
  ADD COLUMN IF NOT EXISTS reviewer_actor_id TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_email TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_role TEXT,
  ADD COLUMN IF NOT EXISTS authority_basis TEXT,
  ADD COLUMN IF NOT EXISTS decision_context JSONB;

UPDATE recommendation_release_records
SET reviewer_actor_id = COALESCE(reviewer_actor_id, 'legacy-system'),
    reviewer_email = COALESCE(reviewer_email, 'legacy-system@invalid'),
    reviewer_role = COALESCE(reviewer_role, 'legacy-system'),
    authority_basis = COALESCE(authority_basis, 'legacy-record-before-authority-enforcement'),
    decision_context = COALESCE(decision_context, '{}'::jsonb);

ALTER TABLE recommendation_release_records
  ALTER COLUMN reviewer_actor_id SET NOT NULL,
  ALTER COLUMN reviewer_email SET NOT NULL,
  ALTER COLUMN reviewer_role SET NOT NULL,
  ALTER COLUMN authority_basis SET NOT NULL,
  ALTER COLUMN decision_context SET NOT NULL;

CREATE INDEX IF NOT EXISTS recommendation_release_reviewer_idx
  ON recommendation_release_records (reviewer_actor_id, created_at DESC);
