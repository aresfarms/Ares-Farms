import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Furlong Case — one customer-controlled record from property idea
 * through diligence, capital coordination, closing, and later operating memory.
 *
 * The case stores snapshots and references, not hidden conclusions. Material
 * actions are appended to furlong_case_events; outcome learning is evidence-
 * backed and remains separate from provider ranking until governed thresholds
 * permit the narrow execution-reliability tie-break defined elsewhere.
 */
const evidence = {
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref").notNull(),
  traceId: text("trace_id").notNull(),
  metadata: jsonb("metadata"),
};

export const furlongCases = pgTable(
  "furlong_cases",
  {
    // 0058 deployed this primary key as TEXT. Keep that physical type and
    // use a UUID-shaped text default so the forward-only upgrade is non-destructive.
    id: text("id").default(sql`gen_random_uuid()::text`).primaryKey(),
    caseId: text("case_id").notNull(),
    ownerActorId: text("owner_actor_id"),
    customerId: text("customer_id"),
    propertyId: text("property_id"),
    propertyAddress: text("property_address"),
    customerGoal: text("customer_goal"),
    currentStage: text("current_stage").notNull().default("PROPERTY_ANALYSIS"),
    caseStatus: text("case_status").notNull().default("OPEN"),
    outcomeStatus: text("outcome_status").notNull().default("NOT_STARTED"),
    propertySnapshot: jsonb("property_snapshot").notNull().default({}),
    businessContext: jsonb("business_context").notNull().default({}),
    borrowerReadiness: jsonb("borrower_readiness").notNull().default({}),
    environmentalContext: jsonb("environmental_context").notNull().default({}),
    capitalContext: jsonb("capital_context").notNull().default({}),
    documentRefs: jsonb("document_refs").notNull().default([]),
    permissionState: jsonb("permission_state").notNull().default({}),
    providerSelections: jsonb("provider_selections").notNull().default([]),
    ...evidence,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("furlong_cases_case_id_uq").on(table.caseId)],
);

export const furlongCaseEvents = pgTable(
  "furlong_case_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: text("case_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    eventType: text("event_type").notNull(),
    eventStatus: text("event_status").notNull().default("RECORDED"),
    actorId: text("actor_id"),
    summary: text("summary").notNull(),
    detail: jsonb("detail"),
    evidenceRefs: jsonb("evidence_refs").notNull().default([]),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    ...evidence,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("furlong_case_event_idempotency_uq").on(table.idempotencyKey)],
);

export const furlongCaseOutcomeRecords = pgTable("furlong_case_outcome_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: text("case_id").notNull(),
  serviceRequestId: text("service_request_id"),
  providerId: text("provider_id"),
  executionRef: text("execution_ref"),
  outcomeType: text("outcome_type").notNull(),
  outcomeReasonCategory: text("outcome_reason_category"),
  conditions: jsonb("conditions").notNull().default([]),
  financingStructure: jsonb("financing_structure"),
  actualRateBps: integer("actual_rate_bps"),
  actualProjectCost: integer("actual_project_cost"),
  environmentalOutcome: text("environmental_outcome"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  providerRespondedAt: timestamp("provider_responded_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  verificationStatus: text("verification_status").notNull().default("PENDING_VERIFICATION"),
  evidenceRefs: jsonb("evidence_refs").notNull().default([]),
  recordedBy: text("recorded_by").notNull(),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...evidence,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FurlongCaseRow = typeof furlongCases.$inferSelect;
export type FurlongCaseEventRow = typeof furlongCaseEvents.$inferSelect;
export type FurlongCaseOutcomeRow = typeof furlongCaseOutcomeRecords.$inferSelect;
