-- CANON-LENDER-SUBMISSION-001 / TECH-LENDER-DELIVERY-001
-- Sandbox delivery only. Production delivery remains blocked until a separate
-- reviewed promotion record enables it.

CREATE TABLE IF NOT EXISTS lender_submission_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id text NOT NULL,
  customer_id text NOT NULL, state text NOT NULL DEFAULT 'DRAFT',
  active_package_version_id uuid, production_delivery_blocked boolean NOT NULL DEFAULT true,
  closed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
  replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submission_package_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES lender_submission_cases(id),
  version integer NOT NULL, manifest_json jsonb NOT NULL, manifest_sha256 text NOT NULL,
  byte_length integer NOT NULL, frozen_at timestamptz NOT NULL, invalidated_at timestamptz,
  invalidation_reason text, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
  replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(case_id, version)
);

ALTER TABLE lender_submission_cases DROP CONSTRAINT IF EXISTS lender_submission_cases_active_package_version_id_fkey;
ALTER TABLE lender_submission_cases ADD CONSTRAINT lender_submission_cases_active_package_version_id_fkey
  FOREIGN KEY (active_package_version_id) REFERENCES submission_package_versions(id);

CREATE TABLE IF NOT EXISTS submission_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), package_version_id uuid NOT NULL REFERENCES submission_package_versions(id),
  ordinal integer NOT NULL, canonical_name text NOT NULL, source_ref text NOT NULL, source_version text NOT NULL,
  sha256 text NOT NULL, byte_length integer NOT NULL, media_type text NOT NULL, data_category text NOT NULL,
  item_classification text NOT NULL, malware_scan_status text NOT NULL, redaction_status text NOT NULL,
  overlay_version text NOT NULL,
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(package_version_id, ordinal)
);

CREATE TABLE IF NOT EXISTS customer_submission_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES lender_submission_cases(id),
  package_version_id uuid NOT NULL REFERENCES submission_package_versions(id), manifest_sha256 text NOT NULL,
  customer_id text NOT NULL, lender_id text NOT NULL, recipient_scope text NOT NULL, purpose text NOT NULL,
  channel text NOT NULL, data_categories jsonb NOT NULL, disclosure_version text NOT NULL,
  disclosure_sha256 text NOT NULL, consented_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
  revoked_at timestamptz, governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED',
  replay_ref text NOT NULL, trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipient_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lender_id text NOT NULL, channel text NOT NULL,
  destination_fingerprint text NOT NULL, verification_level text NOT NULL, verified_by text,
  verified_at timestamptz, expires_at timestamptz NOT NULL, revoked_at timestamptz,
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispatch_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES lender_submission_cases(id),
  package_version_id uuid NOT NULL REFERENCES submission_package_versions(id),
  consent_id uuid NOT NULL REFERENCES customer_submission_consents(id),
  recipient_verification_id uuid NOT NULL REFERENCES recipient_verifications(id), adapter_id text NOT NULL,
  environment text NOT NULL, allowed boolean NOT NULL, gate_results jsonb NOT NULL, authorization_sha256 text NOT NULL,
  authorized_by text NOT NULL, expires_at timestamptz NOT NULL, consumed_at timestamptz,
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES lender_submission_cases(id),
  authorization_id uuid NOT NULL REFERENCES dispatch_authorizations(id), idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING', attempt_count integer NOT NULL DEFAULT 0, next_attempt_at timestamptz,
  locked_at timestamptz, completed_at timestamptz, governance_version text NOT NULL,
  classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL, trace_id text NOT NULL,
  metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), outbox_id uuid NOT NULL REFERENCES delivery_outbox(id),
  attempt_number integer NOT NULL, status text NOT NULL, provider_reference text, request_sha256 text NOT NULL,
  transient_safe boolean NOT NULL DEFAULT false, started_at timestamptz NOT NULL, completed_at timestamptz,
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(outbox_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS delivery_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), outbox_id uuid NOT NULL REFERENCES delivery_outbox(id),
  attempt_id uuid REFERENCES delivery_attempts(id), provider_event_id text NOT NULL UNIQUE, truth_status text NOT NULL,
  payload_sha256 text NOT NULL, signature_verified boolean NOT NULL DEFAULT false, occurred_at timestamptz NOT NULL,
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submission_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES lender_submission_cases(id),
  outbox_id uuid REFERENCES delivery_outbox(id), code text NOT NULL, severity text NOT NULL,
  retryable boolean NOT NULL DEFAULT false, reconciliation_required boolean NOT NULL DEFAULT false,
  safe_message text NOT NULL, details_sha256 text NOT NULL, resolved_at timestamptz,
  governance_version text NOT NULL, classification text NOT NULL DEFAULT 'RESTRICTED', replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lender_submission_cases_application_idx ON lender_submission_cases(application_id);
CREATE INDEX IF NOT EXISTS lender_submission_consents_case_idx ON customer_submission_consents(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lender_delivery_outbox_status_idx ON delivery_outbox(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS lender_delivery_receipts_outbox_idx ON delivery_receipts(outbox_id, occurred_at);

-- Payload evidence is append-only. Operational columns are updated through
-- governed services; immutable package/consent/attempt/receipt rows reject updates/deletes.
CREATE OR REPLACE FUNCTION reject_lender_submission_evidence_mutation() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'customer_submission_consents'
    AND OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL
    AND (to_jsonb(OLD) - 'revoked_at') = (to_jsonb(NEW) - 'revoked_at') THEN RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'dispatch_authorizations'
    AND OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL
    AND (to_jsonb(OLD) - 'consumed_at') = (to_jsonb(NEW) - 'consumed_at') THEN RETURN NEW;
  END IF;
  RAISE EXCEPTION 'lender submission evidence is append-only';
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['submission_package_items','customer_submission_consents','dispatch_authorizations','delivery_attempts','delivery_receipts','submission_failures']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'trg_' || t || '_immutable', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_lender_submission_evidence_mutation()', 'trg_' || t || '_immutable', t);
  END LOOP;
END $$;
