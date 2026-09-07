-- 0060_furlong_case_living_record_upgrade.sql
-- Evolves the already-deployed 0058 Furlong Case lifecycle tables into the
-- customer-controlled living record without dropping legacy rows or reusing
-- an applied migration number. Idempotent because the canonical migrator
-- replays the full ordered DDL set on every governed promotion.

-- Keep the deployed TEXT primary key. New records receive UUID-shaped text,
-- which preserves existing 0058 links while avoiding a destructive type swap.
ALTER TABLE furlong_cases
  ALTER COLUMN id SET DEFAULT (gen_random_uuid()::text),
  ALTER COLUMN display_name DROP NOT NULL;

ALTER TABLE furlong_cases
  ADD COLUMN IF NOT EXISTS case_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_id TEXT,
  ADD COLUMN IF NOT EXISTS property_id TEXT,
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_goal TEXT,
  ADD COLUMN IF NOT EXISTS current_stage TEXT NOT NULL DEFAULT 'PROPERTY_ANALYSIS',
  ADD COLUMN IF NOT EXISTS case_status TEXT NOT NULL DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS outcome_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS property_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS business_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS borrower_readiness JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS environmental_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS capital_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS permission_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provider_selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Upgrade only legacy rows. Once case_id exists, later replays leave customer
-- stage/status/snapshots untouched.
UPDATE furlong_cases
SET
  case_id = id,
  property_id = COALESCE(property_id, property_ref),
  customer_goal = COALESCE(customer_goal, goal),
  case_status = CASE lifecycle_status
    WHEN 'PAUSED' THEN 'PAUSED'
    WHEN 'ARCHIVED' THEN 'ARCHIVED'
    ELSE 'OPEN'
  END,
  property_snapshot = CASE
    WHEN property_snapshot = '{}'::jsonb AND structured_context IS NOT NULL
      THEN structured_context
    ELSE property_snapshot
  END,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'legacyLifecycleUpgraded', true,
    'sourcePreviewId', source_preview_id,
    'legacyStateCode', state_code
  ))
WHERE case_id IS NULL;

ALTER TABLE furlong_cases
  ALTER COLUMN case_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS furlong_cases_case_id_uq
  ON furlong_cases(case_id);
CREATE INDEX IF NOT EXISTS furlong_cases_customer_idx
  ON furlong_cases(customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS furlong_cases_property_idx
  ON furlong_cases(property_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS furlong_cases_stage_idx
  ON furlong_cases(current_stage, case_status, updated_at DESC);

-- Expand the 0058 event spine rather than replacing it. Legacy event payloads
-- are retained; new structured columns become the append-oriented API surface.
ALTER TABLE furlong_case_events
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS event_status TEXT NOT NULL DEFAULT 'RECORDED',
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS detail JSONB,
  ADD COLUMN IF NOT EXISTS evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

UPDATE furlong_case_events
SET
  idempotency_key = 'legacy-event:' || id::text,
  summary = COALESCE(summary, event_type),
  detail = COALESCE(detail, payload),
  occurred_at = COALESCE(occurred_at, created_at),
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"legacyLifecycleUpgraded":true}'::jsonb
WHERE idempotency_key IS NULL;

ALTER TABLE furlong_case_events
  ALTER COLUMN idempotency_key SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN occurred_at SET DEFAULT NOW(),
  ALTER COLUMN occurred_at SET NOT NULL,
  ALTER COLUMN actor_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS furlong_case_event_idempotency_uq
  ON furlong_case_events(idempotency_key);
CREATE INDEX IF NOT EXISTS furlong_case_events_case_idx
  ON furlong_case_events(case_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS furlong_case_events_type_idx
  ON furlong_case_events(event_type, occurred_at DESC);

-- 0058 referenced the opaque row id. Living-record events name the stable
-- customer case_id instead, so move only this FK; the legacy link table keeps
-- its original id reference for backward-compatible evidence replay.
ALTER TABLE furlong_case_events
  DROP CONSTRAINT IF EXISTS furlong_case_events_case_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'furlong_case_events_case_id_case_id_fkey'
      AND conrelid = 'furlong_case_events'::regclass
  ) THEN
    ALTER TABLE furlong_case_events
      ADD CONSTRAINT furlong_case_events_case_id_case_id_fkey
      FOREIGN KEY (case_id) REFERENCES furlong_cases(case_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS furlong_case_outcome_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES furlong_cases(case_id),
  service_request_id TEXT,
  provider_id TEXT,
  execution_ref TEXT,
  outcome_type TEXT NOT NULL,
  outcome_reason_category TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  financing_structure JSONB,
  actual_rate_bps INTEGER,
  actual_project_cost INTEGER,
  environmental_outcome TEXT,
  submitted_at TIMESTAMPTZ,
  provider_responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_by TEXT NOT NULL,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_case_outcome_verification_chk CHECK (
    verification_status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')
  )
);
CREATE INDEX IF NOT EXISTS furlong_case_outcome_case_idx
  ON furlong_case_outcome_records(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS furlong_case_outcome_provider_idx
  ON furlong_case_outcome_records(provider_id, verification_status, outcome_type);

COMMENT ON TABLE furlong_cases IS
  'Customer-controlled living Furlong Case. The deployed 0058 lifecycle lineage is preserved and upgraded in place.';
COMMENT ON TABLE furlong_case_events IS
  'Append-oriented material case timeline with idempotency, evidence references, replay and classification lineage.';
COMMENT ON TABLE furlong_case_outcome_records IS
  'Evidence-backed actual outcomes; no hidden credit authority and no compensation-based provider ranking.';
