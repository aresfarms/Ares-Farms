ALTER TABLE "capital_network_deal_rooms"
  ADD COLUMN IF NOT EXISTS "case_room_expires_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "provider_response_status" text,
  ADD COLUMN IF NOT EXISTS "provider_response_summary" text,
  ADD COLUMN IF NOT EXISTS "provider_response_details" jsonb,
  ADD COLUMN IF NOT EXISTS "provider_responded_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "closing_milestones" jsonb DEFAULT '[]'::jsonb NOT NULL;
