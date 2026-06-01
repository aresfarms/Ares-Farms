-- Canonical Rule and Overlay Registry Migration
--
-- Master Volume Governance:
-- - Vol I: establishes constitutional rule and overlay authority.
-- - Vol II: preserves regulated eligibility, review, fair-lending,
--   adverse-action, and human-review boundaries.
-- - Vol III: adds durable replay-safe rule and overlay evaluation state.
-- - Vol IV: supports operator review, escalation, amendment handling,
--   exception review, and audit preparation.
-- - Vol V: supports canonical rule versioning, overlay resolution,
--   explainability, classification, replay, observability, and source authority.

CREATE TABLE IF NOT EXISTS rule_definitions (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_domain TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  authority_level TEXT NOT NULL,
  decision_use TEXT NOT NULL,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  source TEXT,
  metadata JSONB,
  effective_at TIMESTAMPTZ DEFAULT now(),
  superseded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS overlay_definitions (
  id TEXT PRIMARY KEY,
  overlay_name TEXT NOT NULL,
  overlay_tier TEXT NOT NULL,
  overlay_scope TEXT NOT NULL,
  effect TEXT NOT NULL,
  priority INTEGER NOT NULL,
  overlay_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  rule_id TEXT,
  authority_level TEXT NOT NULL,
  rationale TEXT NOT NULL,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  source TEXT,
  metadata JSONB,
  effective_at TIMESTAMPTZ DEFAULT now(),
  superseded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rule_evaluation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  subject_id TEXT,
  application_id TEXT,
  borrower_id TEXT,
  tenant_id TEXT,
  actor_id TEXT,
  rule_ids JSONB,
  overlay_ids JSONB,
  applied_overlay_id TEXT,
  final_effect TEXT NOT NULL,
  result_status TEXT NOT NULL,
  advisory_only BOOLEAN NOT NULL DEFAULT true,
  human_review_required BOOLEAN NOT NULL DEFAULT true,
  input_snapshot JSONB,
  evaluation_result JSONB,
  governance_version TEXT NOT NULL DEFAULT 'master-volumes-runtime-v0.1.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  source TEXT,
  metadata JSONB,
  evaluated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rule_definitions_domain_status_idx
  ON rule_definitions (rule_domain, status);

CREATE INDEX IF NOT EXISTS overlay_definitions_tier_scope_idx
  ON overlay_definitions (overlay_tier, overlay_scope);

CREATE INDEX IF NOT EXISTS rule_evaluation_runs_application_id_idx
  ON rule_evaluation_runs (application_id);

CREATE INDEX IF NOT EXISTS rule_evaluation_runs_borrower_id_idx
  ON rule_evaluation_runs (borrower_id);

CREATE INDEX IF NOT EXISTS rule_evaluation_runs_tenant_id_idx
  ON rule_evaluation_runs (tenant_id);

CREATE INDEX IF NOT EXISTS rule_evaluation_runs_trace_id_idx
  ON rule_evaluation_runs (trace_id);

CREATE INDEX IF NOT EXISTS rule_evaluation_runs_replay_ref_idx
  ON rule_evaluation_runs (replay_ref);

INSERT INTO rule_definitions (
  id,
  rule_name,
  rule_domain,
  rule_type,
  rule_version,
  status,
  authority_level,
  decision_use,
  human_review_required,
  governance_version,
  classification,
  replay_ref,
  source,
  metadata,
  effective_at,
  created_at,
  updated_at
)
VALUES
  (
    'RULE-REGULATED-DECISION-HUMAN-REVIEW',
    'Regulated Decision Human Review Gate',
    'governance',
    'human_review_gate',
    'rule-regulated-decision-human-review-v0.1.0',
    'ACTIVE',
    'constitutional',
    'advisory_until_reviewed',
    true,
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"purpose":"all regulated decision outputs remain advisory until reviewed by authorized human workflow"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'RULE-USDA-REGION-VERIFICATION',
    'USDA Region Verification Gate',
    'usda',
    'source_verification',
    'rule-usda-region-verification-v0.1.0',
    'ACTIVE',
    'regulatory',
    'advisory_until_verified',
    true,
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"purpose":"USDA-related eligibility context requires governed region/source verification before reliance"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'RULE-SBA-AGRICULTURAL-SCALE-REVIEW',
    'SBA Agricultural Scale Review Gate',
    'sba',
    'program_review',
    'rule-sba-agricultural-scale-review-v0.1.0',
    'ACTIVE',
    'regulatory',
    'advisory_until_reviewed',
    true,
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"purpose":"SBA agricultural eligibility context requires program review before reliance"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'RULE-ADVERSE-ACTION-NOTICE-GATE',
    'Adverse Action Notice Gate',
    'adverse_action',
    'borrower_protection',
    'rule-adverse-action-notice-gate-v0.1.0',
    'ACTIVE',
    'regulatory',
    'blocked_until_workflow_exists',
    true,
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"purpose":"no output may be treated as adverse action until notice, reason-code, appeal, and human-review workflows exist"}'::jsonb,
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO overlay_definitions (
  id,
  overlay_name,
  overlay_tier,
  overlay_scope,
  effect,
  priority,
  overlay_version,
  status,
  rule_id,
  authority_level,
  rationale,
  governance_version,
  classification,
  replay_ref,
  source,
  metadata,
  effective_at,
  created_at,
  updated_at
)
VALUES
  (
    'OVERLAY-CONSTITUTIONAL-HUMAN-REVIEW',
    'Constitutional Human Review Overlay',
    'constitutional',
    'regulated_decisioning',
    'ESCALATE',
    1000,
    'overlay-constitutional-human-review-v0.1.0',
    'ACTIVE',
    'RULE-REGULATED-DECISION-HUMAN-REVIEW',
    'constitutional',
    'Regulated borrower-impacting outputs must remain advisory until reviewed through an authorized human workflow.',
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"humanReviewRequired":true,"advisoryOnly":true}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'OVERLAY-REGULATORY-SOURCE-VERIFICATION',
    'Regulatory Source Verification Overlay',
    'regulatory',
    'external_source_reliance',
    'CONSTRAIN',
    900,
    'overlay-regulatory-source-verification-v0.1.0',
    'ACTIVE',
    'RULE-USDA-REGION-VERIFICATION',
    'regulatory',
    'USDA, SBA, and property-source context must be verified through governed source authority before regulatory reliance.',
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"sourceVerificationRequired":true,"liveConnectorCertificationRequired":true}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'OVERLAY-REGULATORY-ADVERSE-ACTION-BLOCK',
    'Regulatory Adverse Action Workflow Block',
    'regulatory',
    'adverse_action',
    'ESCALATE',
    950,
    'overlay-regulatory-adverse-action-block-v0.1.0',
    'ACTIVE',
    'RULE-ADVERSE-ACTION-NOTICE-GATE',
    'regulatory',
    'Potential adverse-action outputs must escalate until notice, reason-code, appeal, and human-review persistence exists.',
    'master-volumes-runtime-v0.1.0',
    'CONFIDENTIAL',
    'migration-0011-rule-overlay-registry',
    'Master Volume Series',
    '{"adverseActionWorkflowRequired":true,"borrowerExplanationRequired":true}'::jsonb,
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

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
VALUES
  (
    'rule_definitions',
    'rule-definitions-v0.1.0',
    'src/db/schema/ruleOverlayRegistry.ts',
    'rule-overlay-governance',
    'active',
    'rule-overlay-registry-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0011-rule-overlay-registry',
    '{"purpose":"canonical rule definitions for governed eligibility and decision workflow boundaries"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'overlay_definitions',
    'overlay-definitions-v0.1.0',
    'src/db/schema/ruleOverlayRegistry.ts',
    'rule-overlay-governance',
    'active',
    'rule-overlay-registry-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0011-rule-overlay-registry',
    '{"purpose":"canonical overlay definitions for deterministic precedence and escalation"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    'rule_evaluation_runs',
    'rule-evaluation-runs-v0.1.0',
    'src/db/schema/ruleOverlayRegistry.ts',
    'rule-overlay-governance',
    'active',
    'rule-overlay-registry-runtime',
    'master-volumes-runtime-v0.1.0',
    'migration-0011-rule-overlay-registry',
    '{"purpose":"replay-safe rule and overlay evaluation run records"}'::jsonb,
    now(),
    now(),
    now()
  )
ON CONFLICT DO NOTHING;
