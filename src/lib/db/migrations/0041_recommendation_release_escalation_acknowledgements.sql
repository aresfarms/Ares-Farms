-- Immutable acknowledgement ledger for critical recommendation-release escalations.
CREATE TABLE IF NOT EXISTS recommendation_release_escalation_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id TEXT NOT NULL,
  attestation_cycle_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_name TEXT,
  actor_role TEXT NOT NULL,
  acknowledgement_statement TEXT NOT NULL,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recommendation_release_escalation_ack_actor_uniq UNIQUE (release_id, attestation_cycle_id, actor_id)
);
CREATE INDEX IF NOT EXISTS recommendation_release_escalation_ack_cycle_idx
  ON recommendation_release_escalation_acknowledgements (release_id, attestation_cycle_id, created_at ASC);
CREATE OR REPLACE FUNCTION prevent_recommendation_release_escalation_ack_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'recommendation release escalation acknowledgements are immutable'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS recommendation_release_escalation_ack_immutable_update ON recommendation_release_escalation_acknowledgements;
CREATE TRIGGER recommendation_release_escalation_ack_immutable_update BEFORE UPDATE OR DELETE ON recommendation_release_escalation_acknowledgements
FOR EACH ROW EXECUTE FUNCTION prevent_recommendation_release_escalation_ack_mutation();
