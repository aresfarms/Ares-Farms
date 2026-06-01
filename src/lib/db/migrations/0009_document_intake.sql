-- Canonical Document Intake Migration
--
-- Master Volume Governance:
-- - Vol I: establishes governed document submission authority.
-- - Vol II: preserves regulated borrower document handling and review posture.
-- - Vol III: adds durable replay-safe document metadata persistence.
-- - Vol IV: supports document review, escalation, recovery, and audit prep.
-- - Vol V: supports classification, consent, source authority,
--   replayability, observability, and evidence-preservation doctrine.

CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  property_id UUID,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  byte_size INTEGER,
  checksum TEXT,
  storage_uri TEXT,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  review_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  retention_status TEXT NOT NULL DEFAULT 'RETAIN_PER_POLICY',
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  source TEXT,
  metadata JSONB,
  received_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_documents_application_id_idx
  ON application_documents (application_id);

CREATE INDEX IF NOT EXISTS application_documents_borrower_id_idx
  ON application_documents (borrower_id);

CREATE INDEX IF NOT EXISTS application_documents_tenant_id_idx
  ON application_documents (tenant_id);

CREATE INDEX IF NOT EXISTS application_documents_status_idx
  ON application_documents (status);

CREATE INDEX IF NOT EXISTS application_documents_review_status_idx
  ON application_documents (review_status);

CREATE INDEX IF NOT EXISTS application_documents_replay_ref_idx
  ON application_documents (replay_ref);

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
  'application_documents',
  'application-documents-v0.1.0',
  'src/db/schema/applicationDocuments.ts',
  'borrower-document-intake',
  'active',
  'document-intake-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0009-document-intake',
  '{"purpose":"canonical borrower application document metadata persistence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
