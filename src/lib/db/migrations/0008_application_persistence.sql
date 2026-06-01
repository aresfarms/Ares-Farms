-- Canonical Application Persistence Migration
--
-- Master Volume Governance:
-- - Vol I: establishes governed borrower/application state authority.
-- - Vol II: preserves regulated application, property, and review context.
-- - Vol III: adds durable replay-safe application persistence.
-- - Vol IV: supports intake review, recovery, escalation, and operator workflows.
-- - Vol V: supports classification, versioning, replay, observability,
--   source authority, and evidence-preservation doctrine.

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  property_id UUID,
  status TEXT NOT NULL DEFAULT 'INTAKE_RECEIVED',
  review_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  decision_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  requested_amount TEXT,
  requested_programs JSONB,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  source TEXT,
  payload JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_user_id_idx
  ON applications (user_id);

CREATE INDEX IF NOT EXISTS applications_borrower_id_idx
  ON applications (borrower_id);

CREATE INDEX IF NOT EXISTS applications_tenant_id_idx
  ON applications (tenant_id);

CREATE INDEX IF NOT EXISTS applications_status_idx
  ON applications (status);

CREATE INDEX IF NOT EXISTS applications_replay_ref_idx
  ON applications (replay_ref);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS replay_ref TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS governance_version TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS classification TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE properties
SET
  governance_version = COALESCE(governance_version, 'master-volumes-runtime-v0.1.0'),
  classification = COALESCE(classification, 'CONFIDENTIAL'),
  updated_at = COALESCE(updated_at, now());

INSERT INTO schema_registry (
  schema_name,
  schema_version,
  schema_path,
  schema_domain,
  status,
  owner_module,
  governance_version,
  replay_ref,
  metadata,
  effective_at,
  created_at,
  updated_at
)
VALUES (
  'applications',
  'applications-v0.1.0',
  'src/db/schema/applications.ts',
  'borrower-application-persistence',
  'active',
  'application-persistence-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0008-application-persistence',
  '{"purpose":"canonical borrower application persistence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
