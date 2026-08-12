import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Stripe Connect governed revenue allocation evidence.
 * Records are append-only at the migration layer. Percentages are expressed
 * in basis points so historical rules remain deterministic and replayable.
 */
export const stripeConnectAllocations = pgTable("stripe_connect_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceId: text("evidence_id").notNull().unique(),
  evidenceSha256: text("evidence_sha256").notNull().unique(),
  paymentRef: text("payment_ref").notNull(),
  sourceTransactionRef: text("source_transaction_ref"),
  transferGroup: text("transfer_group").notNull(),
  grossAmount: integer("gross_amount").notNull(),
  currency: text("currency").notNull(),
  revenueClass: text("revenue_class").notNull(),
  ruleId: text("rule_id").notNull(),
  ruleVersion: integer("rule_version").notNull(),
  ruleStatus: text("rule_status").notNull(),
  caitlinBasisPoints: integer("caitlin_basis_points").notNull().default(0),
  stuartBasisPoints: integer("stuart_basis_points").notNull().default(0),
  caitlinAmount: integer("caitlin_amount").notNull().default(0),
  stuartAmount: integer("stuart_amount").notNull().default(0),
  furlongRetainedAmount: integer("furlong_retained_amount").notNull(),
  caitlinConnectedAccountRef: text("caitlin_connected_account_ref"),
  stuartConnectedAccountRef: text("stuart_connected_account_ref"),
  caitlinRecipientCertified: boolean("caitlin_recipient_certified").notNull().default(false),
  stuartRecipientCertified: boolean("stuart_recipient_certified").notNull().default(false),
  transferPromotionActive: boolean("transfer_promotion_active").notNull().default(false),
  transferExecutionPerformed: boolean("transfer_execution_performed").notNull().default(false),
  approvedByRefs: jsonb("approved_by_refs").notNull().default([]),
  allocationPayload: jsonb("allocation_payload").notNull(),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
