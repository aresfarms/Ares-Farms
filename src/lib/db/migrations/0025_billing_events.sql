-- Canonical Billing Events Migration
--
-- Master Volume Governance:
-- - Vol I: keeps billing authority separate from credit, financing,
--   permitting, legal, or regulatory determinations.
-- - Vol II: protects tenant, payment, entitlement, and regulated-service
--   access metadata under controlled disclosure.
-- - Vol III: adds durable replay-safe billing event state before dashboards,
--   entitlement workflows, or operational modules rely on it.
-- - Vol IV: supports billing review, webhook recovery, incident triage,
--   entitlement reconciliation, and audit preparation.
-- - Vol V: supports classification, observability, replay, version lineage,
--   source authority, connector governance, and human-review doctrine.

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL,
  route TEXT NOT NULL,
  tenant_id TEXT,
  actor_id TEXT,
  user_id TEXT,
  report_id TEXT,
  application_id TEXT,
  session_id TEXT,
  entitlement_id TEXT,
  stripe_event_type TEXT,
  plan TEXT,
  product_name TEXT,
  amount_total INTEGER,
  currency TEXT,
  checkout_session_created BOOLEAN NOT NULL DEFAULT false,
  webhook_received BOOLEAN NOT NULL DEFAULT false,
  entitlement_granted BOOLEAN NOT NULL DEFAULT false,
  payment_connector_live_mode BOOLEAN NOT NULL DEFAULT false,
  stub_signature_verification BOOLEAN NOT NULL DEFAULT false,
  regulated_decision_impact_allowed BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  request_payload JSONB,
  response_payload JSONB,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_billing_event_id_idx
  ON billing_events (billing_event_id);

CREATE INDEX IF NOT EXISTS billing_events_event_type_idx
  ON billing_events (event_type);

CREATE INDEX IF NOT EXISTS billing_events_event_status_idx
  ON billing_events (event_status);

CREATE INDEX IF NOT EXISTS billing_events_tenant_id_idx
  ON billing_events (tenant_id);

CREATE INDEX IF NOT EXISTS billing_events_session_id_idx
  ON billing_events (session_id);

CREATE INDEX IF NOT EXISTS billing_events_entitlement_id_idx
  ON billing_events (entitlement_id);

CREATE INDEX IF NOT EXISTS billing_events_trace_id_idx
  ON billing_events (trace_id);

CREATE INDEX IF NOT EXISTS billing_events_replay_ref_idx
  ON billing_events (replay_ref);

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
  'billing_events',
  'billing-events-v0.1.0',
  'src/db/schema/billingEvents.ts',
  'governed-billing-events',
  'active',
  'billing-event-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0025-billing-events',
  '{"purpose":"canonical durable billing event records before dashboards, entitlement workflows, or operational modules rely on billing state"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
