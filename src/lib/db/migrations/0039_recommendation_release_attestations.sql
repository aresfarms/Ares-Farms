-- Independent human attestation ledger for governed recommendation releases.
CREATE TABLE IF NOT EXISTS recommendation_release_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  reviewer_actor_id TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT,
  reviewer_role TEXT NOT NULL,
  authority_basis TEXT NOT NULL,
  attestation_statement TEXT NOT NULL,
  decision_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recommendation_release_attestation_reviewer_uniq UNIQUE (release_id, reviewer_actor_id)
);
CREATE INDEX IF NOT EXISTS recommendation_release_attestation_release_idx
  ON recommendation_release_attestations (release_id, created_at ASC);
CREATE OR REPLACE FUNCTION prevent_recommendation_release_attestation_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'recommendation release attestations are immutable'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS recommendation_release_attestation_immutable_update ON recommendation_release_attestations;
CREATE TRIGGER recommendation_release_attestation_immutable_update BEFORE UPDATE OR DELETE ON recommendation_release_attestations
FOR EACH ROW EXECUTE FUNCTION prevent_recommendation_release_attestation_mutation();
