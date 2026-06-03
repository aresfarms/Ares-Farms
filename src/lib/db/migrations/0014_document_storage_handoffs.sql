-- Canonical Document Storage Handoff Migration
--
-- Master Volume Governance:
-- - Vol I: establishes governed storage intent authority before raw files move.
-- - Vol II: preserves regulated borrower document handling, consent,
--   controlled disclosure, and retention posture.
-- - Vol III: adds durable replay-safe upload handoff records without
--   accepting raw binary content into API runtime.
-- - Vol IV: supports document recovery, escalation, storage provider review,
--   chain-of-custody, and audit preparation.
-- - Vol V: supports classification, source authority, replayability,
--   observability, versioning, and evidence preservation.

CREATE TABLE IF NOT EXISTS document_storage_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  property_id UUID,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  byte_size INTEGER,
  checksum TEXT,
  storage_provider TEXT NOT NULL,
  storage_bucket TEXT,
  object_key TEXT NOT NULL,
  storage_uri TEXT NOT NULL,
  upload_method TEXT NOT NULL DEFAULT 'PUT',
  upload_url TEXT,
  upload_token_hash TEXT NOT NULL,
  handoff_status TEXT NOT NULL DEFAULT 'PENDING_PROVIDER_CONFIGURATION',
  raw_content_accepted BOOLEAN NOT NULL DEFAULT false,
  provider_configured BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_application_id_idx
  ON document_storage_handoffs (application_id);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_borrower_id_idx
  ON document_storage_handoffs (borrower_id);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_tenant_id_idx
  ON document_storage_handoffs (tenant_id);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_status_idx
  ON document_storage_handoffs (handoff_status);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_storage_uri_idx
  ON document_storage_handoffs (storage_uri);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_trace_id_idx
  ON document_storage_handoffs (trace_id);

CREATE INDEX IF NOT EXISTS document_storage_handoffs_replay_ref_idx
  ON document_storage_handoffs (replay_ref);

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
  'document_storage_handoffs',
  'document-storage-handoffs-v0.1.0',
  'src/db/schema/documentStorageHandoffs.ts',
  'borrower-document-storage',
  'active',
  'document-storage-handoff-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0014-document-storage-handoffs',
  '{"purpose":"canonical controlled object-storage handoff before raw document upload"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
