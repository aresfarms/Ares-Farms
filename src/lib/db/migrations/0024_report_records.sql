-- Canonical Report Records Migration
--
-- Master Volume Governance:
-- - Vol I: establishes accountable authority for report generation records.
-- - Vol II: preserves borrower, application, disclosure, advisory-only,
--   human-review, and regulatory-use boundaries.
-- - Vol III: adds durable replay-safe report state before reports are exposed
--   through dashboards, borrower portals, or export workflows.
-- - Vol IV: supports reporting review, escalation, retention, audit
--   preparation, and operational evidence preservation.
-- - Vol V: supports classification, explainability, observability, replay,
--   version lineage, controlled disclosure, and export governance.

CREATE TABLE IF NOT EXISTS report_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_status TEXT NOT NULL DEFAULT 'GENERATED_ADVISORY_REVIEW_REQUIRED',
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  report_title TEXT,
  advisory TEXT,
  advisory_only BOOLEAN NOT NULL DEFAULT true,
  official_use_allowed BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  external_report_generated BOOLEAN NOT NULL DEFAULT false,
  request_payload JSONB,
  report_payload JSONB,
  output_summary JSONB,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_records_report_id_idx
  ON report_records (report_id);

CREATE INDEX IF NOT EXISTS report_records_application_id_idx
  ON report_records (application_id);

CREATE INDEX IF NOT EXISTS report_records_borrower_id_idx
  ON report_records (borrower_id);

CREATE INDEX IF NOT EXISTS report_records_tenant_id_idx
  ON report_records (tenant_id);

CREATE INDEX IF NOT EXISTS report_records_report_type_idx
  ON report_records (report_type);

CREATE INDEX IF NOT EXISTS report_records_report_status_idx
  ON report_records (report_status);

CREATE INDEX IF NOT EXISTS report_records_trace_id_idx
  ON report_records (trace_id);

CREATE INDEX IF NOT EXISTS report_records_replay_ref_idx
  ON report_records (replay_ref);

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
  'report_records',
  'report-records-v0.1.0',
  'src/db/schema/reportRecords.ts',
  'governed-report-records',
  'active',
  'report-record-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0024-report-records',
  '{"purpose":"canonical durable report records before reports are exposed through dashboards, borrower portals, or export workflows"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
