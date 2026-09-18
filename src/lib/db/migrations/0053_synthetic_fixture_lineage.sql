-- SYNTHETIC-FIXTURE-LINEAGE-001
-- Human-visible names remain obvious clues. This immutable table is the actual
-- technical boundary for all synthetic/test records and provider test runs.

CREATE TABLE IF NOT EXISTS synthetic_fixture_lineage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synthetic_persona_id text NOT NULL,
  human_visible_name text NOT NULL,
  test_run_id text NOT NULL,
  fixture_version text NOT NULL,
  registry_version text NOT NULL,
  lineage_version text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('development','staging','sandbox','test')),
  operator_identity text NOT NULL,
  fixture_created_at timestamptz NOT NULL,
  scenario_id text NOT NULL,
  provider_targets jsonb NOT NULL DEFAULT '[]'::jsonb,
  record_type text NOT NULL,
  record_id text NOT NULL,
  lineage_sha256 text NOT NULL CHECK (lineage_sha256 ~ '^[a-f0-9]{64}$'),
  lineage_payload jsonb NOT NULL,
  governance_version text NOT NULL,
  classification text NOT NULL DEFAULT 'RESTRICTED',
  replay_ref text NOT NULL,
  trace_id text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(record_type, record_id),
  UNIQUE(lineage_sha256),
  CHECK ((lineage_payload->>'testOnly') = 'true'),
  CHECK ((lineage_payload->>'syntheticPersonaId') = synthetic_persona_id),
  CHECK ((lineage_payload->>'testRunId') = test_run_id),
  CHECK ((lineage_payload->>'environment') = environment)
);

CREATE INDEX IF NOT EXISTS synthetic_fixture_persona_idx
  ON synthetic_fixture_lineage_records(synthetic_persona_id, fixture_created_at DESC);
CREATE INDEX IF NOT EXISTS synthetic_fixture_test_run_idx
  ON synthetic_fixture_lineage_records(test_run_id, created_at ASC);

CREATE OR REPLACE FUNCTION reject_synthetic_fixture_lineage_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'synthetic fixture lineage is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthetic_fixture_lineage_immutable
  ON synthetic_fixture_lineage_records;
CREATE TRIGGER trg_synthetic_fixture_lineage_immutable
  BEFORE UPDATE OR DELETE ON synthetic_fixture_lineage_records
  FOR EACH ROW EXECUTE FUNCTION reject_synthetic_fixture_lineage_mutation();
