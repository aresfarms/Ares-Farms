CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"decision" text,
	"composite_score" numeric(10, 6),
	"risk_score" numeric(10, 6),
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"trace" jsonb DEFAULT '{}'::jsonb,
	"prev_hash" text,
	"hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "audit_ledger" CASCADE;