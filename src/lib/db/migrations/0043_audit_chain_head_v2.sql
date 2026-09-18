-- Canonical Audit Chain v2: transactional singleton head.
-- Historical v1 rows remain immutable and are anchored into v2 at first write.
CREATE TABLE IF NOT EXISTS audit_chain_heads (
  chain_name text PRIMARY KEY,
  head_event_id uuid NULL,
  head_hash text NOT NULL,
  chain_version text NOT NULL,
  anchor_manifest_hash text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE UPDATE, DELETE, TRUNCATE ON audit_chain_heads FROM PUBLIC;

COMMENT ON TABLE audit_chain_heads IS
  'Transactional singleton head for canonical audit-chain v2. Historical audit rows remain append-only.';
