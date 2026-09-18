-- Audit search/index hardening and durable reconciliation spool.
CREATE INDEX IF NOT EXISTS audit_events_created_at_brin_idx ON audit_events USING brin (created_at);
CREATE INDEX IF NOT EXISTS audit_events_event_type_created_at_idx ON audit_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_events_trace_id_idx ON audit_events ((trace->>'traceId'));
CREATE INDEX IF NOT EXISTS audit_events_module_id_idx ON audit_events ((trace->>'moduleId'));
CREATE INDEX IF NOT EXISTS audit_events_anonymous_id_idx ON audit_events ((trace->>'anonymousId'));
CREATE INDEX IF NOT EXISTS audit_events_actor_ref_idx ON audit_events ((trace->>'actorRef'));
CREATE TABLE IF NOT EXISTS audit_reconciliation_spool (
  id uuid PRIMARY KEY, idempotency_key text NOT NULL UNIQUE, event_envelope jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING', attempt_count integer NOT NULL DEFAULT 0,
  last_error text, accepted_at timestamptz NOT NULL DEFAULT now(), reconciled_at timestamptz
);
CREATE INDEX IF NOT EXISTS audit_reconciliation_spool_status_idx ON audit_reconciliation_spool (status, accepted_at);
