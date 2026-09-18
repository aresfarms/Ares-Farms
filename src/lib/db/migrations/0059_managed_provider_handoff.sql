-- 0059_managed_provider_handoff.sql
-- Provider-specific expiring case rooms, structured provider response, and
-- borrower-visible closing milestones. This extends migration 0056 without
-- changing the exact-recipient consent and recipient-verification gates.
ALTER TABLE capital_network_deal_rooms
  ADD COLUMN IF NOT EXISTS case_room_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_response_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_response_summary TEXT,
  ADD COLUMN IF NOT EXISTS provider_response_details JSONB,
  ADD COLUMN IF NOT EXISTS provider_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closing_milestones JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS capital_network_room_expiry_idx
  ON capital_network_deal_rooms (case_room_expires_at, provider_access_allowed);
CREATE INDEX IF NOT EXISTS capital_network_room_response_idx
  ON capital_network_deal_rooms (provider_id, provider_response_status, provider_responded_at);

COMMENT ON COLUMN capital_network_deal_rooms.case_room_expires_at IS
  'Provider-specific case-room access expiry. Access still requires exact-package customer consent and verified recipient authority.';
COMMENT ON COLUMN capital_network_deal_rooms.closing_milestones IS
  'Borrower-visible progression from lender response through conditions, diligence, closing, and keys/logbook. Not a credit decision.';
