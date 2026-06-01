-- Canonical Borrower Notice Exception Resolution Migration
--
-- Master Volume Governance:
-- - Vol I: preserves accountable authority for closing notice exceptions.
-- - Vol II: protects adverse-action, appeal, delivery, retry, dispute, and
--   borrower-disclosure boundaries before exception closure.
-- - Vol III: adds durable replay-safe resolution and queue lifecycle evidence
--   for failed, returned, bounced, and disputed notices.
-- - Vol IV: supports operator resolution, recovery, escalation, retention,
--   failed-delivery response, and audit preparation.
-- - Vol V: supports classification, explainability, observability, replay,
--   version lineage, controlled disclosure, and evidence preservation.

CREATE TABLE IF NOT EXISTS borrower_notice_exception_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL,
  receipt_id UUID NOT NULL,
  delivery_id UUID NOT NULL,
  decision_notice_id UUID,
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  exception_type TEXT NOT NULL,
  resolution_action TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'RESOLUTION_BLOCKED',
  queue_status_before TEXT,
  queue_status_after TEXT,
  resolution_evidence_ref TEXT,
  operator_attestation_ref TEXT,
  borrower_contact_ref TEXT,
  retry_plan_ref TEXT,
  dispute_resolution_ref TEXT,
  retention_policy_ref TEXT,
  resolution_allowed BOOLEAN NOT NULL DEFAULT false,
  queue_completed BOOLEAN NOT NULL DEFAULT false,
  retry_authorized BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed BOOLEAN NOT NULL DEFAULT false,
  external_provider_action_performed BOOLEAN NOT NULL DEFAULT false,
  human_review_completed BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_queue_item_id_idx
  ON borrower_notice_exception_resolutions (queue_item_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_receipt_id_idx
  ON borrower_notice_exception_resolutions (receipt_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_delivery_id_idx
  ON borrower_notice_exception_resolutions (delivery_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_application_id_idx
  ON borrower_notice_exception_resolutions (application_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_borrower_id_idx
  ON borrower_notice_exception_resolutions (borrower_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_tenant_id_idx
  ON borrower_notice_exception_resolutions (tenant_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_resolution_status_idx
  ON borrower_notice_exception_resolutions (resolution_status);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_exception_type_idx
  ON borrower_notice_exception_resolutions (exception_type);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_trace_id_idx
  ON borrower_notice_exception_resolutions (trace_id);

CREATE INDEX IF NOT EXISTS borrower_notice_exception_resolutions_replay_ref_idx
  ON borrower_notice_exception_resolutions (replay_ref);

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
  'borrower_notice_exception_resolutions',
  'borrower-notice-exception-resolutions-v0.1.0',
  'src/db/schema/borrowerNoticeExceptionResolutions.ts',
  'controlled-borrower-notice-exception-resolution',
  'active',
  'borrower-notice-exception-resolution-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0021-borrower-notice-exception-resolutions',
  '{"purpose":"canonical controlled borrower notice failed-delivery, returned-notice, retry, and dispute resolution evidence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
