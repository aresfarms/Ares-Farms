CREATE TABLE IF NOT EXISTS document_authenticity_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artifact_ref text NOT NULL, artifact_sha256 text NOT NULL,
  source_type text NOT NULL, source_institution text, source_reference text,
  customer_identity_verification_ref text NOT NULL, account_ownership_verification_ref text,
  forensic_run_id text, fraud_provider_result_ref text, institution_corroboration_ref text,
  corroboration_fields_checked jsonb NOT NULL DEFAULT '[]'::jsonb,
  forensic_signals jsonb NOT NULL DEFAULT '[]'::jsonb, material_discrepancies jsonb NOT NULL DEFAULT '[]'::jsonb,
  human_review_ref text, authenticity_classification text NOT NULL,
  eligible_for_external_package boolean NOT NULL DEFAULT false, evidence_sha256 text NOT NULL,
  verified_at timestamptz NOT NULL, governance_version text NOT NULL, replay_ref text NOT NULL,
  trace_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_authenticity_sha256_ck CHECK (artifact_sha256 ~ '^[a-f0-9]{64}$' AND evidence_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT document_authenticity_class_ck CHECK (authenticity_classification IN ('DIRECT_SOURCE_VERIFIED','CORROBORATED','FORENSICALLY_CONSISTENT','REVIEW_REQUIRED','MATERIAL_DISCREPANCY','REJECTED_FROM_PACKAGE')),
  CONSTRAINT document_authenticity_external_ck CHECK (eligible_for_external_package = false OR authenticity_classification IN ('DIRECT_SOURCE_VERIFIED','CORROBORATED'))
);

CREATE OR REPLACE FUNCTION prevent_document_authenticity_mutation() RETURNS trigger AS $$ BEGIN
  RAISE EXCEPTION 'document_authenticity_evidence is append-only';
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS document_authenticity_append_only ON document_authenticity_evidence;
CREATE TRIGGER document_authenticity_append_only BEFORE UPDATE OR DELETE ON document_authenticity_evidence
FOR EACH ROW EXECUTE FUNCTION prevent_document_authenticity_mutation();

ALTER TABLE submission_package_items ADD COLUMN IF NOT EXISTS authenticity_evidence_ref text;
ALTER TABLE submission_package_items ADD COLUMN IF NOT EXISTS authenticity_classification text;
ALTER TABLE submission_package_items DROP CONSTRAINT IF EXISTS submission_package_authenticity_ck;
ALTER TABLE submission_package_items ADD CONSTRAINT submission_package_authenticity_ck CHECK (
  authenticity_classification IS NULL OR authenticity_classification IN ('DIRECT_SOURCE_VERIFIED','CORROBORATED')
);
