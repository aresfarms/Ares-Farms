ALTER TABLE "audit_events" ALTER COLUMN "decision" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "composite_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "composite_score" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "risk_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "risk_score" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "input" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "output" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "trace" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "event_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" DROP COLUMN "prev_hash";--> statement-breakpoint
ALTER TABLE "audit_events" DROP COLUMN "hash";