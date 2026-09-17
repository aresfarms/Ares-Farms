import {
  index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

import { furlongCases } from "./furlongCases";

const lineage = {
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref").notNull(),
  traceId: text("trace_id").notNull(),
  metadata: jsonb("metadata"),
};

export const furlongPropertyComparisons = pgTable("furlong_property_comparisons", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: text("case_id").notNull().references(() => furlongCases.caseId),
  ownerActorId: text("owner_actor_id"),
  accessTokenHash: text("access_token_hash").notNull(),
  requestedResultCount: integer("requested_result_count").notNull(),
  status: text("status").notNull().default("QUEUED"),
  propertyCount: integer("property_count").notNull(),
  completedCount: integer("completed_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  ...lineage,
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("furlong_property_comparisons_case_uq").on(table.caseId),
  uniqueIndex("furlong_property_comparisons_token_uq").on(table.accessTokenHash),
  index("furlong_property_comparisons_owner_idx").on(table.ownerActorId, table.updatedAt),
  index("furlong_property_comparisons_queue_idx").on(table.status, table.createdAt),
]);

export const furlongPropertyComparisonItems = pgTable("furlong_property_comparison_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  comparisonId: uuid("comparison_id").notNull().references(() => furlongPropertyComparisons.id),
  ordinal: integer("ordinal").notNull(),
  submittedAddress: text("submitted_address").notNull(),
  normalizedAddress: text("normalized_address"),
  status: text("status").notNull().default("QUEUED"),
  propertyId: text("property_id"),
  childCaseId: text("child_case_id").references(() => furlongCases.caseId),
  resultSnapshot: jsonb("result_snapshot"),
  failureCode: text("failure_code"),
  evidenceRefs: jsonb("evidence_refs").notNull().default([]),
  ...lineage,
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("furlong_property_comparison_item_ordinal_uq").on(table.comparisonId, table.ordinal),
  index("furlong_property_comparison_items_queue_idx").on(table.status, table.createdAt),
  index("furlong_property_comparison_items_comparison_idx").on(table.comparisonId, table.ordinal),
]);

export type FurlongPropertyComparisonRow = typeof furlongPropertyComparisons.$inferSelect;
export type FurlongPropertyComparisonItemRow = typeof furlongPropertyComparisonItems.$inferSelect;
