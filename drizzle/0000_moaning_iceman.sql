CREATE TABLE "audit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"decision" text NOT NULL,
	"composite_score" text,
	"risk_score" text,
	"policy" jsonb,
	"explanation" jsonb,
	"trace" jsonb,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
