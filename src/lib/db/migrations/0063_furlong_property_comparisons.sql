-- 0063_furlong_property_comparisons.sql
-- Vol I / Vol III / Vol III-B / Vol V: durable parent comparison cases and
-- independently replayable child-property queue records.
CREATE TABLE IF NOT EXISTS furlong_property_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES furlong_cases(case_id),
  owner_actor_id TEXT,
  access_token_hash TEXT NOT NULL,
  requested_result_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  property_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_property_comparisons_result_count_chk
    CHECK (requested_result_count BETWEEN 1 AND 5),
  CONSTRAINT furlong_property_comparisons_count_chk
    CHECK (property_count BETWEEN 1 AND 1000),
  CONSTRAINT furlong_property_comparisons_status_chk
    CHECK (status IN ('QUEUED','VERIFYING','ANALYZING','AWAITING_EVIDENCE','RANKING','COMPLETED','PARTIAL','FAILED','HELD'))
);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_property_comparisons_case_uq
  ON furlong_property_comparisons(case_id);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_property_comparisons_token_uq
  ON furlong_property_comparisons(access_token_hash);
CREATE INDEX IF NOT EXISTS furlong_property_comparisons_owner_idx
  ON furlong_property_comparisons(owner_actor_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS furlong_property_comparisons_queue_idx
  ON furlong_property_comparisons(status, created_at);

CREATE TABLE IF NOT EXISTS furlong_property_comparison_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID NOT NULL REFERENCES furlong_property_comparisons(id),
  ordinal INTEGER NOT NULL,
  submitted_address TEXT NOT NULL,
  normalized_address TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  property_id TEXT,
  child_case_id TEXT REFERENCES furlong_cases(case_id),
  result_snapshot JSONB,
  failure_code TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  governance_version TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  metadata JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT furlong_property_comparison_item_status_chk
    CHECK (status IN ('QUEUED','VERIFYING','VERIFIED','UNVERIFIABLE','ANALYZING','NEEDS_EVIDENCE','COMPLETED','FAILED','EXCLUDED','HELD')),
  CONSTRAINT furlong_property_comparison_item_ordinal_chk CHECK (ordinal >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS furlong_property_comparison_item_ordinal_uq
  ON furlong_property_comparison_items(comparison_id, ordinal);
CREATE INDEX IF NOT EXISTS furlong_property_comparison_items_queue_idx
  ON furlong_property_comparison_items(status, created_at);
CREATE INDEX IF NOT EXISTS furlong_property_comparison_items_comparison_idx
  ON furlong_property_comparison_items(comparison_id, ordinal);

COMMENT ON TABLE furlong_property_comparisons IS
  'Customer-controlled parent comparison case. Opaque recovery tokens are stored only as hashes.';
COMMENT ON TABLE furlong_property_comparison_items IS
  'Child-property verification and analysis queue. A submitted address is never treated as a ranked result.';
