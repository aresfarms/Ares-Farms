ALTER TABLE "audit_events" ALTER COLUMN "event_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "ledger_version" numeric DEFAULT 2 NOT NULL;