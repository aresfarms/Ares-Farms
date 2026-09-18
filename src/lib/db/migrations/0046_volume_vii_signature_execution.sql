-- FURLONG Volume VII / CANON-SIGNATURE-EXECUTION-001
-- Offline fixtures and mock execution only. Live signing and delivery remain blocked.

CREATE TABLE IF NOT EXISTS signature_execution_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id text NOT NULL, source_document_id uuid NOT NULL,
 purpose text NOT NULL, transaction_class text NOT NULL, jurisdiction text NOT NULL, state text NOT NULL DEFAULT 'DRAFT',
 aggregate_version integer NOT NULL DEFAULT 1, active_document_version_id uuid, active_placement_plan_id uuid,
 live_signing_blocked boolean NOT NULL DEFAULT true, closed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
 trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS execution_document_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 source_ref text NOT NULL, source_sha256 text NOT NULL, media_type text NOT NULL, page_count integer NOT NULL,
 page_boxes_hash text NOT NULL, pdf_profile text NOT NULL, form_analysis_ref text, existing_signature_status text NOT NULL,
 analysis_json jsonb NOT NULL, sealed_at timestamptz NOT NULL, supersedes_id uuid REFERENCES execution_document_versions(id),
 invalidated_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
 replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(case_id, source_sha256)
);

CREATE TABLE IF NOT EXISTS signature_placement_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_version_id uuid NOT NULL REFERENCES execution_document_versions(id),
 profile text NOT NULL, zone_refs jsonb NOT NULL, margin_regions jsonb NOT NULL, appended_page_template_version text,
 collision_report_hash text NOT NULL, plan_sha256 text NOT NULL, reviewer_id text, approved_at timestamptz,
 invalidated_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
 replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signature_case_active_document_fk' AND conrelid = 'signature_execution_cases'::regclass) THEN
  ALTER TABLE signature_execution_cases ADD CONSTRAINT signature_case_active_document_fk FOREIGN KEY (active_document_version_id) REFERENCES execution_document_versions(id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signature_case_active_plan_fk' AND conrelid = 'signature_execution_cases'::regclass) THEN
  ALTER TABLE signature_execution_cases ADD CONSTRAINT signature_case_active_plan_fk FOREIGN KEY (active_placement_plan_id) REFERENCES signature_placement_plans(id);
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS signer_authority_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id), signer_id text NOT NULL,
 identity_assurance_level text NOT NULL, identity_evidence_ref text NOT NULL, capacity text NOT NULL, represented_party_ref text,
 authority_basis text NOT NULL, evidence_refs jsonb NOT NULL, verified_by text NOT NULL, valid_from timestamptz NOT NULL,
 expires_at timestamptz NOT NULL, revoked_at timestamptz, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_electronic_consents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id), signer_id text NOT NULL,
 disclosure_version text NOT NULL, disclosure_sha256 text NOT NULL, locale text NOT NULL, accessibility_mode text NOT NULL,
 presentation_ref text NOT NULL, affirmative_action text NOT NULL, consented_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 withdrawn_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
 trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_intent_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 document_version_id uuid NOT NULL REFERENCES execution_document_versions(id), source_sha256 text NOT NULL, signer_id text NOT NULL,
 authority_id uuid NOT NULL REFERENCES signer_authority_records(id), consent_id uuid NOT NULL REFERENCES signature_electronic_consents(id),
 intent_statement_hash text NOT NULL, affirmative_action text NOT NULL, session_ref text NOT NULL, occurred_at timestamptz NOT NULL,
 revoked_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
 trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_execution_authorizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 document_version_id uuid NOT NULL REFERENCES execution_document_versions(id), intent_id uuid NOT NULL REFERENCES signature_intent_records(id),
 placement_plan_id uuid NOT NULL REFERENCES signature_placement_plans(id), gate_snapshot jsonb NOT NULL, gate_snapshot_hash text NOT NULL,
 idempotency_key text NOT NULL UNIQUE, decision text NOT NULL, blocker_codes jsonb NOT NULL, environment text NOT NULL,
 authorized_by text NOT NULL, expires_at timestamptz NOT NULL, consumed_at timestamptz, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_command_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 authorization_id uuid NOT NULL REFERENCES signature_execution_authorizations(id), command_type text NOT NULL,
 idempotency_key text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'PENDING', attempt_count integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz, locked_at timestamptz, completed_at timestamptz, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_webhook_inbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), adapter_id text NOT NULL, provider_event_id text NOT NULL,
 body_sha256 text NOT NULL, signature_verified boolean NOT NULL, replay_window_valid boolean NOT NULL,
 tenant_verified boolean NOT NULL, received_at timestamptz NOT NULL, normalized_event_type text, processed_at timestamptz,
 governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
 trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(adapter_id, provider_event_id)
);

CREATE TABLE IF NOT EXISTS signature_evidence_bundles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 authorization_id uuid NOT NULL REFERENCES signature_execution_authorizations(id), adapter_id text NOT NULL,
 provider_correlation_ref text NOT NULL, evidence_refs jsonb NOT NULL, evidence_sha256 text NOT NULL,
 signature_method text NOT NULL, captured_at timestamptz NOT NULL, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL,
 metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS executed_pdf_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 authorization_id uuid NOT NULL REFERENCES signature_execution_authorizations(id), source_sha256 text NOT NULL,
 executed_sha256 text NOT NULL, bytes_ref text NOT NULL, page_count integer NOT NULL,
 evidence_bundle_id uuid NOT NULL REFERENCES signature_evidence_bundles(id), validation_report_hash text NOT NULL,
 executed_at timestamptz NOT NULL, status text NOT NULL, supersedes_id uuid REFERENCES executed_pdf_versions(id),
 voided_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
 replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(case_id, executed_sha256)
);

CREATE TABLE IF NOT EXISTS signature_validation_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 executed_pdf_version_id uuid REFERENCES executed_pdf_versions(id), source_sha256 text NOT NULL, executed_sha256 text NOT NULL,
 structural_valid boolean NOT NULL, page_count_valid boolean NOT NULL, original_pages_preserved boolean NOT NULL,
 evidence_binding_valid boolean NOT NULL, accessibility_valid boolean NOT NULL, checks jsonb NOT NULL,
 report_sha256 text NOT NULL, validated_at timestamptz NOT NULL, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL,
 metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_failures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 stage text NOT NULL, failure_class text NOT NULL, blocker_code text NOT NULL, retryable boolean NOT NULL DEFAULT false,
 outcome_ambiguous boolean NOT NULL DEFAULT false, provider_code_sanitized text, next_action text NOT NULL, owner text NOT NULL,
 resolved_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
 replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_reconciliation_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 outbox_id uuid REFERENCES signature_command_outbox(id), determination text NOT NULL, evidence_refs jsonb NOT NULL,
 decided_by text NOT NULL, decided_at timestamptz NOT NULL, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL,
 metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signature_execution_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 aggregate_version integer NOT NULL, event_type text NOT NULL, actor_ref text NOT NULL, occurred_at timestamptz NOT NULL,
 payload_hash text NOT NULL, prior_event_hash text NOT NULL, event_hash text NOT NULL, correlation_ref text NOT NULL,
 causation_ref text, idempotency_key text UNIQUE, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL,
 metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(case_id, aggregate_version)
);

CREATE TABLE IF NOT EXISTS signature_replay_refs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES signature_execution_cases(id),
 event_range jsonb NOT NULL, policy_version text NOT NULL, overlay_version text NOT NULL, template_version text,
 provider_version text NOT NULL, reconstructed_state text NOT NULL, deterministic boolean NOT NULL,
 validation_result_hash text NOT NULL, verified_at timestamptz NOT NULL, governance_version text NOT NULL,
 classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL,
 metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signature_case_application_idx ON signature_execution_cases(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS signature_outbox_status_idx ON signature_command_outbox(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS signature_failure_case_idx ON signature_failures(case_id, created_at DESC);

CREATE OR REPLACE FUNCTION reject_signature_evidence_mutation() RETURNS trigger AS $$
BEGIN
 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'signer_authority_records' AND OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL
   AND (to_jsonb(OLD)-'revoked_at')=(to_jsonb(NEW)-'revoked_at') THEN RETURN NEW; END IF;
 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'signature_electronic_consents' AND OLD.withdrawn_at IS NULL AND NEW.withdrawn_at IS NOT NULL
   AND (to_jsonb(OLD)-'withdrawn_at')=(to_jsonb(NEW)-'withdrawn_at') THEN RETURN NEW; END IF;
 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'signature_intent_records' AND OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL
   AND (to_jsonb(OLD)-'revoked_at')=(to_jsonb(NEW)-'revoked_at') THEN RETURN NEW; END IF;
 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'signature_execution_authorizations' AND OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL
   AND (to_jsonb(OLD)-'consumed_at')=(to_jsonb(NEW)-'consumed_at') THEN RETURN NEW; END IF;
 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'executed_pdf_versions' AND OLD.voided_at IS NULL AND NEW.voided_at IS NOT NULL
   AND (to_jsonb(OLD)-'voided_at')=(to_jsonb(NEW)-'voided_at') THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'signature execution evidence is append-only';
END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['execution_document_versions','signature_placement_plans','signer_authority_records','signature_electronic_consents','signature_intent_records','signature_execution_authorizations','signature_webhook_inbox','signature_evidence_bundles','executed_pdf_versions','signature_validation_reports','signature_failures','signature_reconciliation_decisions','signature_execution_events','signature_replay_refs'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I','trg_'||t||'_immutable',t);
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_signature_evidence_mutation()','trg_'||t||'_immutable',t);
 END LOOP;
END $$;
