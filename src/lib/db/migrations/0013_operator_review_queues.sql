-- Canonical Operator Review Queue Migration
--
-- Master Volume Governance:
-- - Vol I: establishes accountable operational review authority.
-- - Vol II: preserves regulated workflow review before borrower, lender,
--   sponsor, or agency-facing reliance.
-- - Vol III: adds durable replay-safe queue state for backend workflows.
-- - Vol IV: supports operator queues, escalation, assignment, recovery,
--   backlog review, and audit preparation.
-- - Vol V: supports classification, observability, replay, source authority,
--   controlled disclosure, and version lineage.

CREATE TABLE IF NOT EXISTS operator_review_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  source_trace_id TEXT,
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  escalation_status TEXT NOT NULL DEFAULT 'NOT_ESCALATED',
  review_reason TEXT NOT NULL,
  required_role TEXT NOT NULL DEFAULT 'operator',
  assigned_to TEXT,
  locked_by TEXT,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  due_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_queue_type_idx
  ON operator_review_queue_items (queue_type);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_status_idx
  ON operator_review_queue_items (status);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_priority_idx
  ON operator_review_queue_items (priority);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_application_id_idx
  ON operator_review_queue_items (application_id);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_borrower_id_idx
  ON operator_review_queue_items (borrower_id);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_tenant_id_idx
  ON operator_review_queue_items (tenant_id);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_source_idx
  ON operator_review_queue_items (source_type, source_id);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_trace_id_idx
  ON operator_review_queue_items (trace_id);

CREATE INDEX IF NOT EXISTS operator_review_queue_items_replay_ref_idx
  ON operator_review_queue_items (replay_ref);

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
  'operator_review_queue_items',
  'operator-review-queue-items-v0.1.0',
  'src/db/schema/operatorReviewQueues.ts',
  'operator-review-governance',
  'active',
  'operator-review-queue-runtime',
  'master-volumes-runtime-v0.1.0',
  'migration-0013-operator-review-queues',
  '{"purpose":"canonical operator queue for governed review, escalation, assignment, and audit preparation"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
