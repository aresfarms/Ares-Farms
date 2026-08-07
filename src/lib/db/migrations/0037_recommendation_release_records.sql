CREATE TABLE IF NOT EXISTS recommendation_release_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  release_id TEXT NOT NULL UNIQUE,
  previous_release_id TEXT,
  evidence_version TEXT NOT NULL,
  release_state TEXT NOT NULL CHECK (release_state IN ('withheld', 'eligible')),
  finality TEXT NOT NULL CHECK (finality IN ('blocked', 'provisional', 'conditionally-final', 'final')),
  approved_recommendation_text TEXT NOT NULL,
  reviewer_record_count INTEGER NOT NULL DEFAULT 0,
  condition_count INTEGER NOT NULL DEFAULT 0,
  material_change_count INTEGER NOT NULL DEFAULT 0,
  supersession_required BOOLEAN NOT NULL DEFAULT FALSE,
  release_payload JSONB NOT NULL,
  change_control_payload JSONB NOT NULL,
  history_payload JSONB NOT NULL,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT NOT NULL DEFAULT 'recommendation-release-store',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recommendation_release_subject_idx
  ON recommendation_release_records (subject_type, subject_key, created_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_release_previous_idx
  ON recommendation_release_records (previous_release_id);

CREATE OR REPLACE FUNCTION prevent_recommendation_release_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'recommendation_release_records is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recommendation_release_no_update ON recommendation_release_records;
CREATE TRIGGER recommendation_release_no_update
BEFORE UPDATE OR DELETE ON recommendation_release_records
FOR EACH ROW EXECUTE FUNCTION prevent_recommendation_release_mutation();
