ALTER TABLE "audit_events" ALTER COLUMN "event_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "hash" text;--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "prev_hash" text;