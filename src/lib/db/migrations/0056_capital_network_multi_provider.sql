-- Furlong Capital Network: multi-provider onboarding, matching, borrower selection,
-- provider-specific deal rooms, and lender-submission provider binding.
CREATE TABLE IF NOT EXISTS capital_network_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL UNIQUE,
  organization_name TEXT NOT NULL,
  provider_role TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPLICANT',
  affiliation TEXT NOT NULL DEFAULT 'INDEPENDENT',
  primary_contact_email TEXT NOT NULL,
  website TEXT,
  states JSONB NOT NULL DEFAULT '[]'::jsonb,
  programs JSONB NOT NULL DEFAULT '[]'::jsonb,
  purposes JSONB NOT NULL DEFAULT '[]'::jsonb,
  property_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  borrower_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_deal_amount INTEGER,
  max_deal_amount INTEGER,
  accepts_brokered_deals BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_direct_borrower BOOLEAN NOT NULL DEFAULT FALSE,
  matching_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  explicit_assignment_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  live_routing_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  credential_status TEXT NOT NULL DEFAULT 'PENDING',
  connector_status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  participation_terms_status TEXT NOT NULL DEFAULT 'PENDING',
  data_agreement_status TEXT NOT NULL DEFAULT 'PENDING',
  compensation_status TEXT NOT NULL DEFAULT 'UNSET',
  profile_version INTEGER NOT NULL DEFAULT 1,
  verified_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'capital-network-v1.0.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capital_network_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_profile_version INTEGER NOT NULL,
  score INTEGER NOT NULL,
  eligible BOOLEAN NOT NULL DEFAULT FALSE,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_status TEXT NOT NULL DEFAULT 'CANDIDATE',
  selected_by TEXT,
  selected_at TIMESTAMPTZ,
  last_matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_shared BOOLEAN NOT NULL DEFAULT FALSE,
  governance_version TEXT NOT NULL DEFAULT 'capital-network-v1.0.0',
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT capital_network_match_case_provider_uq UNIQUE (service_request_id, provider_id)
);

CREATE TABLE IF NOT EXISTS capital_network_deal_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  match_id UUID,
  submission_case_id UUID,
  room_status TEXT NOT NULL DEFAULT 'AWAITING_PACKAGE_AND_CONSENT',
  provider_access_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  data_shared BOOLEAN NOT NULL DEFAULT FALSE,
  selected_at TIMESTAMPTZ,
  consented_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  governance_version TEXT NOT NULL DEFAULT 'capital-network-v1.0.0',
  classification TEXT NOT NULL DEFAULT 'RESTRICTED',
  replay_ref TEXT,
  trace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT capital_network_room_case_provider_uq UNIQUE (service_request_id, provider_id)
);

ALTER TABLE lender_submission_cases ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE lender_submission_cases ADD COLUMN IF NOT EXISTS service_request_id TEXT;
CREATE INDEX IF NOT EXISTS lender_submission_cases_provider_idx ON lender_submission_cases(provider_id);
CREATE INDEX IF NOT EXISTS lender_submission_cases_service_request_idx ON lender_submission_cases(service_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS lender_submission_case_service_provider_uq ON lender_submission_cases(service_request_id, provider_id);
CREATE INDEX IF NOT EXISTS capital_network_room_provider_idx ON capital_network_deal_rooms(provider_id, provider_access_allowed);
CREATE INDEX IF NOT EXISTS capital_network_match_case_idx ON capital_network_matches(service_request_id, eligible);

-- Retain the existing external broker workspace as the first provider instance,
-- but do not auto-match, publicly list, or activate live routing from this seed.
INSERT INTO capital_network_providers (
  provider_id, organization_name, provider_role, provider_type, status,
  affiliation, primary_contact_email, states, programs, purposes,
  property_types, industries, borrower_types, accepts_brokered_deals,
  accepts_direct_borrower, matching_enabled, explicit_assignment_allowed,
  live_routing_allowed, credential_status, connector_status,
  participation_terms_status, data_agreement_status, compensation_status,
  profile_version, governance_version, classification, metadata
) VALUES (
  'retained-external-broker', 'Retained external commercial debt broker',
  'BROKER', 'COMMERCIAL_BROKER', 'TRANSITION_ACTIVE', 'INDEPENDENT',
  'sfraas@aresfarmsinc.com', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, TRUE, TRUE, FALSE, TRUE,
  FALSE, 'PENDING_REVERIFY', 'NOT_CONFIGURED', 'TRANSITION_REVIEW',
  'TRANSITION_REVIEW', 'NO_AUTOMATIC_ENTITLEMENT', 1,
  'capital-network-v1.0.0', 'CONFIDENTIAL',
  '{"transitionOnly":true,"autoMatch":false,"publicListing":false}'::jsonb
) ON CONFLICT (provider_id) DO NOTHING;
