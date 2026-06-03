-- Canonical Borrower Notice Delivery Migration
--
-- Master Volume Governance:
-- - Vol I: establishes constitutional authority for borrower notice delivery.
-- - Vol II: preserves adverse-action, explanation, appeal, disclosure,
--   delivery tracking, retention, and fair-lending notice boundaries.
-- - Vol III: adds durable replay-safe notice packet and delivery state.
-- - Vol IV: supports operational notice preparation, delivery monitoring,
--   dispute handling, recovery, and audit preparation.
-- - Vol V: supports classification, explainability, observability, replay,
--   version lineage, controlled disclosure, and evidence preservation.

CREATE TABLE IF NOT EXISTS borrower_notice_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_notice_id UUID NOT NULL,
  application_id TEXT NOT NULL,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  notice_type TEXT NOT NULL,
  delivery_channel TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'DELIVERY_BLOCKED',
  notice_packet_status TEXT NOT NULL DEFAULT 'PACKET_BLOCKED',
  redaction_status TEXT NOT NULL DEFAULT 'REDACTION_REQUIRED',
  appeal_packet_status TEXT NOT NULL DEFAULT 'APPEAL_PACKET_REQUIRED',
  retention_status TEXT NOT NULL DEFAULT 'RETENTION_POLICY_REQUIRED',
  notice_packet_ref TEXT,
  redaction_profile_ref TEXT,
  appeal_packet_ref TEXT,
  retention_policy_ref TEXT,
  delivery_tracking_ref TEXT,
  delivery_provider_ref TEXT,
  delivery_allowed BOOLEAN NOT NULL DEFAULT false,
  borrower_disclosure_allowed BOOLEAN NOT NULL DEFAULT false,
  external_delivery_performed BOOLEAN NOT NULL DEFAULT false,
  delivery_provider_configured BOOLEAN NOT NULL DEFAULT false,
  appeal_rights_included BOOLEAN NOT NULL DEFAULT false,
  redaction_completed BOOLEAN NOT NULL DEFAULT false,
  retention_policy_attached BOOLEAN NOT NULL DEFAULT false,
  delivery_prepared_at TIMESTAMPTZ,
  external_delivered_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_decision_notice_id_idx
  ON borrower_notice_deliveries (decision_notice_id);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_application_id_idx
  ON borrower_notice_deliveries (application_id);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_borrower_id_idx
  ON borrower_notice_deliveries (borrower_id);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_tenant_id_idx
  ON borrower_notice_deliveries (tenant_id);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_delivery_status_idx
  ON borrower_notice_deliveries (delivery_status);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_delivery_allowed_idx
  ON borrower_notice_deliveries (delivery_allowed);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_trace_id_idx
  ON borrower_notice_deliveries (trace_id);

CREATE INDEX IF NOT EXISTS borrower_notice_deliveries_replay_ref_idx
  ON borrower_notice_deliveries (replay_ref);

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
  'borrower_notice_deliveries',
  'borrower-notice-deliveries-v0.1.0',
  'src/db/schema/borrowerNoticeDeliveries.ts',
  'controlled-borrower-notice-delivery',
  'active',
  'borrower-notice-delivery-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0019-borrower-notice-deliveries',
  '{"purpose":"canonical controlled borrower notice packet, delivery tracking, appeal, redaction, and retention evidence"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
