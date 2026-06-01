-- Canonical Borrower Notice Delivery Receipt Migration
--
-- Master Volume Governance:
-- - Vol I: preserves accountable authority for delivery receipt evidence.
-- - Vol II: records borrower notice delivery, failure, return, retry, and
--   dispute signals without weakening borrower protection controls.
-- - Vol III: adds durable replay-safe receipt and lifecycle evidence.
-- - Vol IV: supports operational monitoring, failed-delivery response,
--   dispute intake, recovery, escalation, and audit preparation.
-- - Vol V: supports classification, explainability, observability, replay,
--   version lineage, controlled disclosure, and evidence preservation.

CREATE TABLE IF NOT EXISTS borrower_notice_delivery_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL,
  decision_notice_id UUID,
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  receipt_type TEXT NOT NULL,
  delivery_channel TEXT NOT NULL,
  delivery_outcome TEXT NOT NULL,
  receipt_status TEXT NOT NULL DEFAULT 'RECEIPT_BLOCKED',
  provider_status TEXT,
  failure_reason_code TEXT,
  dispute_status TEXT NOT NULL DEFAULT 'NO_DISPUTE',
  delivery_provider_ref TEXT,
  provider_event_id TEXT,
  receipt_evidence_ref TEXT,
  delivery_tracking_ref TEXT,
  retention_policy_ref TEXT,
  dispute_case_ref TEXT,
  retry_policy_ref TEXT,
  receipt_accepted BOOLEAN NOT NULL DEFAULT false,
  provider_delivery_event_recorded BOOLEAN NOT NULL DEFAULT false,
  external_delivery_performed_by_runtime BOOLEAN NOT NULL DEFAULT false,
  delivery_was_allowed BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_was_allowed BOOLEAN NOT NULL DEFAULT false,
  delivery_provider_was_configured BOOLEAN NOT NULL DEFAULT false,
  retry_required BOOLEAN NOT NULL DEFAULT false,
  operator_review_required BOOLEAN NOT NULL DEFAULT false,
  receipt_received_at TIMESTAMPTZ,
  delivery_confirmed_at TIMESTAMPTZ,
  failure_recorded_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_delivery_id_idx
  ON borrower_notice_delivery_receipts (delivery_id);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_decision_notice_id_idx
  ON borrower_notice_delivery_receipts (decision_notice_id);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_application_id_idx
  ON borrower_notice_delivery_receipts (application_id);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_borrower_id_idx
  ON borrower_notice_delivery_receipts (borrower_id);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_tenant_id_idx
  ON borrower_notice_delivery_receipts (tenant_id);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_receipt_status_idx
  ON borrower_notice_delivery_receipts (receipt_status);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_delivery_outcome_idx
  ON borrower_notice_delivery_receipts (delivery_outcome);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_trace_id_idx
  ON borrower_notice_delivery_receipts (trace_id);

CREATE INDEX IF NOT EXISTS borrower_notice_delivery_receipts_replay_ref_idx
  ON borrower_notice_delivery_receipts (replay_ref);

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
  'borrower_notice_delivery_receipts',
  'borrower-notice-delivery-receipts-v0.1.0',
  'src/db/schema/borrowerNoticeDeliveryReceipts.ts',
  'controlled-borrower-notice-receipt-intake',
  'active',
  'borrower-notice-delivery-receipt-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0020-borrower-notice-delivery-receipts',
  '{"purpose":"canonical controlled borrower notice delivery receipt, failure, return, retry, and dispute evidence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
