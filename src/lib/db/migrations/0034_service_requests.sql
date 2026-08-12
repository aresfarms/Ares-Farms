-- Canonical Service Requests Migration (licensed-module order + intake record)
--
-- Master Volume Governance:
-- - Vol I (FACILITATION-001 §3.32): the platform facilitates but does not
--   decide — a service request records an order and routes it to the licensed
--   professional; never a determination, clearance, permit, or credit decision.
-- - Vol II (REG-NEPA-001 / USDA-ENV-001 §3.21): environmental requests record an
--   order and route to the determining authority. (CONST-PATHWAY-001): financing
--   requests route qualified interest to the licensed lender. Section 1071
--   firewall (§3.20): NO demographic columns exist on this table.
-- - Vol III / III-B: durable, replay-safe order state before any operator or
--   fulfillment surface relies on it.
-- - Vol V (CANON-CLASS-001): Level 4 RESTRICTED (contact PII + property).
--   (CANON-EXPL-001 / HITL-GOV-001): human review required. (CANON-TREASURY-001
--   §9.1): fee disclosed at intake, acknowledgement recorded. (CANON-CONSENT-001
--   §6): consent recorded before the record is acted on.

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  service_code TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED_PENDING_REVIEW',
  routed_to TEXT NOT NULL,
  tenant_id TEXT,
  actor_id TEXT,
  user_id TEXT,
  application_id TEXT,
  report_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  property_descriptor TEXT,
  location_state TEXT,
  location_county TEXT,
  scope_summary TEXT,
  estimated_value INTEGER,
  fee_disclosure_acknowledged BOOLEAN NOT NULL DEFAULT false,
  consent_acknowledged BOOLEAN NOT NULL DEFAULT false,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  determination_issued BOOLEAN NOT NULL DEFAULT false,
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

CREATE INDEX IF NOT EXISTS service_requests_service_request_id_idx
  ON service_requests (service_request_id);

CREATE INDEX IF NOT EXISTS service_requests_request_type_idx
  ON service_requests (request_type);

CREATE INDEX IF NOT EXISTS service_requests_status_idx
  ON service_requests (status);

CREATE INDEX IF NOT EXISTS service_requests_routed_to_idx
  ON service_requests (routed_to);

CREATE INDEX IF NOT EXISTS service_requests_tenant_id_idx
  ON service_requests (tenant_id);

CREATE INDEX IF NOT EXISTS service_requests_application_id_idx
  ON service_requests (application_id);

CREATE INDEX IF NOT EXISTS service_requests_trace_id_idx
  ON service_requests (trace_id);

CREATE INDEX IF NOT EXISTS service_requests_replay_ref_idx
  ON service_requests (replay_ref);

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
  'service_requests',
  'service-requests-v0.1.0',
  'src/db/schema/serviceRequests.ts',
  'governed-service-requests',
  'active',
  'service-request-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0034-service-requests',
  '{"purpose":"durable governed order/intake record for the licensed modules (environmental report orders + financing deal intakes); holds property+contact+scope only, routes to the licensed professional, never a determination or credit decision"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
