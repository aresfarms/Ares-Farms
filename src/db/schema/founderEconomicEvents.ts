import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Immutable founder/platform economic allocation evidence. */
export const founderEconomicEvents = pgTable("founder_economic_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceId: text("evidence_id").notNull().unique(),
  evidenceSha256: text("evidence_sha256").notNull().unique(),
  paymentRef: text("payment_ref").notNull(),
  sourceTransactionRef: text("source_transaction_ref"),
  revenueClass: text("revenue_class").notNull(),
  grossAmount: integer("gross_amount").notNull(),
  externalDeductions: integer("external_deductions").notNull().default(0),
  operatingExpenses: integer("operating_expenses").notNull().default(0),
  stewardshipEntitlement: integer("stewardship_entitlement").notNull().default(0),
  stewardshipPaid: integer("stewardship_paid").notNull().default(0),
  stewardshipAccrued: integer("stewardship_accrued").notNull().default(0),
  founderExpenseReimbursement: integer("founder_expense_reimbursement").notNull().default(0),
  buildRecoveryPaid: integer("build_recovery_paid").notNull().default(0),
  caitlinGeneralDistribution: integer("caitlin_general_distribution").notNull().default(0),
  stuartGeneralDistribution: integer("stuart_general_distribution").notNull().default(0),
  platformReserveRetained: integer("platform_reserve_retained").notNull().default(0),
  allocationPayload: jsonb("allocation_payload").notNull(),
  governanceVersion: text("governance_version").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
