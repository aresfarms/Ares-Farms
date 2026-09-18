-- 0058_furlong_case_lifecycle.sql
-- Customer-controlled structured continuity for Furlong Cases.
--
-- HARD BOUNDARY: these tables do not authorize storage of an anonymous
-- Navigator transcript and do not create credit/eligibility/provider authority.
-- A durable case is created only by an authenticated actor after an explicit
-- save action. Provider access remains governed by the separate Capital Network
-- recipient-consent and case-room controls.

CREATE TABLE IF NOT EXISTS furlong_cases (
  id TEXT PRIMARY KEY,
  source_preview_id TEXT,
  owner_actor_id TEXT NOT NULL,
  tenant_id TEXT,
  display_name TEXT NOT NULL,
  goal TEXT,
  state_code TEXT,
  property_ref TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'ACTIVE',
  structured_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_cases_lifecycle_status_chk CHECK (
    lifecycle_status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS furlong_cases_owner_preview_uq
  ON furlong_cases(owner_actor_id, source_preview_id);
CREATE INDEX IF NOT EXISTS furlong_cases_owner_status_idx
  ON furlong_cases(owner_actor_id, lifecycle_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS furlong_case_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES furlong_cases(id),
  link_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LINKED',
  metadata JSONB,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_case_links_type_chk CHECK (
    link_type IN ('PROPERTY', 'REPORT', 'SERVICE_REQUEST', 'PROVIDER', 'DEAL_ROOM', 'DOCUMENT', 'STATUS', 'OUTCOME')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS furlong_case_links_case_type_ref_uq
  ON furlong_case_links(case_id, link_type, reference_id);
CREATE INDEX IF NOT EXISTS furlong_case_links_case_idx
  ON furlong_case_links(case_id, link_type);

CREATE TABLE IF NOT EXISTS furlong_case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES furlong_cases(id),
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS furlong_case_events_case_created_idx
  ON furlong_case_events(case_id, created_at DESC);

COMMENT ON TABLE furlong_cases IS
  'Authenticated customer-controlled structured continuity record. Not a stored anonymous Navigator transcript, underwriting decision, or provider case room.';
COMMENT ON TABLE furlong_case_events IS
  'Append-only Furlong Case lifecycle evidence. Serving runtime receives INSERT/SELECT only via runtime grants.';
