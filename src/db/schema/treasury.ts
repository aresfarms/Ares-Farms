import {
  boolean,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Canonical Treasury Spine Schema (REG-TREASURY-001 / CANON-TREASURY-001)
 *
 * The durable, governed financial-stewardship substrate: accounts, allocations,
 * reserves, revenue, compensation, expense, distribution, an immutable ledger,
 * versioned policy, audit, snapshot/replay, approvals, and disputes. This is the
 * BACKEND GOVERNANCE SPINE ONLY — it carries NO live payment capture, NO tier
 * prices, and NO membership checkout. Those ride on top of this substrate and
 * stay gated to the founders + counsel session (membership economics shelved).
 *
 * Master Volume Governance:
 * - Vol II (REG-TREASURY-001, Batch 27): no capital may be received, allocated,
 *   transferred, distributed, reserved, or spent outside governed treasury
 *   controls. Required controls: (1) Treasury Account Registry of all
 *   bank/payment/reserve/restricted/escrow accounts + custody; (2) revenue
 *   classification; (3) module revenue attribution; (4) revenue waterfall;
 *   (5) operating + a SEPARATE emergency reserve; (6) spending-authority matrix
 *   with separation of powers; (7) related-party review + monthly reconciliation.
 * - Vol V (CANON-TREASURY-001): the 14 canonical treasury objects, an
 *   append-only immutable ledger (financial truth never silently overwritten —
 *   corrections create new events), six reserve types each with a governed
 *   floor, overlay governance, version governance, classification, anomaly
 *   observability, and dispute resolution.
 * - Vol V (CANON-CLASS-001 §4): treasury records are min Level 3 CONFIDENTIAL;
 *   compensation, reserve, and dispute records are Level 4 RESTRICTED; continuity
 *   and sovereign-authority records are Level 5 SOVEREIGN. Defaults below encode
 *   this floor per table.
 *
 * Replay-safety: corrections are new rows referencing the corrected event
 * (correctsEventId + correctionRationale) — never in-place mutation of financial
 * truth.
 */

/**
 * The six canonical reserve types (CANON-TREASURY-001 §3). Documented here as the
 * governing vocabulary; each live reserve designation is a `treasuryReserves`
 * row carrying a governed floor + TreasuryPolicy basis.
 */
export const TREASURY_RESERVE_TYPES = [
  "operational", // funds required for ongoing platform operations
  "regulatory", // funds required by regulatory program requirements
  "dispute", // funds held pending resolution of contested treasury events
  "continuity", // funds ensuring institutional continuity under adverse conditions
  "partner", // funds designated for partner program participation
  "expansion", // funds designated for industry expansion deployment
] as const;

export type TreasuryReserveType = (typeof TREASURY_RESERVE_TYPES)[number];

/** 1. TreasuryAccount — authoritative account record + Registry (REG-TREASURY-001 #1). */
export const treasuryAccounts = pgTable("treasury_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: text("account_id").notNull(),
  // "operating" | "reserve" | "restricted" | "escrow" | "payment" | "custody"
  accountType: text("account_type").notNull(),
  // reserve designation when accountType = "reserve" (one of TREASURY_RESERVE_TYPES)
  reserveType: text("reserve_type"),
  custodyLocation: text("custody_location"),
  jurisdictionScope: text("jurisdiction_scope"),
  industryPartition: text("industry_partition"),
  balance: numeric("balance", { precision: 20, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("active"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 2. TreasuryAllocation — a governed allocation event across accounts/programs/units. */
export const treasuryAllocations = pgTable("treasury_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  allocationId: text("allocation_id").notNull(),
  fromAccountId: text("from_account_id"),
  toAccountId: text("to_account_id"),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  allocationBasis: text("allocation_basis"),
  programAttribution: text("program_attribution"),
  overlayBasis: text("overlay_basis"),
  approvalId: text("approval_id"),
  status: text("status").notNull().default("recorded"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 3. TreasuryReserve — a governed reserve designation with floor + replenishment. */
export const treasuryReserves = pgTable("treasury_reserves", {
  id: uuid("id").defaultRandom().primaryKey(),
  reserveId: text("reserve_id").notNull(),
  // one of TREASURY_RESERVE_TYPES
  reserveType: text("reserve_type").notNull(),
  purpose: text("purpose"),
  floorLevel: numeric("floor_level", { precision: 20, scale: 2 })
    .notNull()
    .default("0"),
  currentLevel: numeric("current_level", { precision: 20, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("USD"),
  replenishmentRules: jsonb("replenishment_rules"),
  policyId: text("policy_id"),
  sovereignAuthority: text("sovereign_authority"),
  // reserve records are Level 4 RESTRICTED (continuity → SOVEREIGN, set per-row)
  status: text("status").notNull().default("pending-governance-approval"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 4. RevenueEvent — canonical record of recognized revenue. */
export const treasuryRevenueEvents = pgTable("treasury_revenue_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  revenueEventId: text("revenue_event_id").notNull(),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  // "institutional_subscription" | "professional_engagement" | "certification" | ...
  revenueSource: text("revenue_source"),
  moduleAttribution: text("module_attribution"),
  programAttribution: text("program_attribution"),
  restrictionBasis: text("restriction_basis"),
  taxBasis: text("tax_basis"),
  overlayBasis: text("overlay_basis"),
  // recognition posture — governed, NOT swept to operating cash silently
  recognitionStatus: text("recognition_status").notNull().default("recorded"),
  accountId: text("account_id"),
  status: text("status").notNull().default("recorded"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 5. CompensationEvent — canonical record of compensation paid (Level 4 RESTRICTED). */
export const treasuryCompensationEvents = pgTable(
  "treasury_compensation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    compensationEventId: text("compensation_event_id").notNull(),
    recipientId: text("recipient_id"),
    recipientRole: text("recipient_role"),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    compensationBasis: text("compensation_basis"),
    approvalId: text("approval_id"),
    disputeId: text("dispute_id"),
    relatedPartyReview: boolean("related_party_review").notNull().default(false),
    status: text("status").notNull().default("recorded"),
    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull().default("RESTRICTED"),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    source: text("source"),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

/** 6. ExpenseEvent — canonical record of an operational expense. */
export const treasuryExpenseEvents = pgTable("treasury_expense_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  expenseEventId: text("expense_event_id").notNull(),
  category: text("category"),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  authorizationId: text("authorization_id"),
  overlayBasis: text("overlay_basis"),
  allocationLineage: text("allocation_lineage"),
  accountId: text("account_id"),
  status: text("status").notNull().default("recorded"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 7. DistributionEvent — canonical record of a distribution to participants/partners. */
export const treasuryDistributionEvents = pgTable(
  "treasury_distribution_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    distributionEventId: text("distribution_event_id").notNull(),
    recipientId: text("recipient_id"),
    recipientType: text("recipient_type"),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    distributionBasis: text("distribution_basis"),
    approvalId: text("approval_id"),
    overlayBasis: text("overlay_basis"),
    status: text("status").notNull().default("recorded"),
    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull().default("RESTRICTED"),
    replayRef: text("replay_ref"),
    traceId: text("trace_id"),
    source: text("source"),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

/**
 * 8. TreasuryLedger — the immutable, append-only ledger of all treasury events.
 * Corrections NEVER overwrite: a correction is a new row referencing the prior
 * event via correctsEventId + correctionRationale (CANON-TREASURY-001 §2).
 */
export const treasuryLedger = pgTable("treasury_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  ledgerEntryId: text("ledger_entry_id").notNull(),
  // "allocation" | "revenue" | "compensation" | "expense" | "distribution" | "reserve" | "correction"
  eventType: text("event_type").notNull(),
  eventId: text("event_id"),
  accountId: text("account_id"),
  amount: numeric("amount", { precision: 20, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  // append-only correction lineage — prior financial truth is preserved
  correctsEventId: text("corrects_event_id"),
  correctionRationale: text("correction_rationale"),
  approvingActor: text("approving_actor"),
  governanceBasis: text("governance_basis"),
  policyVersion: text("policy_version"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** 9. TreasuryPolicy — governed, versioned policy (rules, floors, formulas). */
export const treasuryPolicies = pgTable("treasury_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  policyId: text("policy_id").notNull(),
  policyVersion: text("policy_version").notNull(),
  title: text("title"),
  reserveFloors: jsonb("reserve_floors"),
  compensationStructures: jsonb("compensation_structures"),
  allocationLogic: jsonb("allocation_logic"),
  revenueWaterfall: jsonb("revenue_waterfall"),
  spendingAuthority: jsonb("spending_authority"),
  effectiveStart: timestamp("effective_start", { withTimezone: true }),
  effectiveEnd: timestamp("effective_end", { withTimezone: true }),
  status: text("status").notNull().default("draft"),
  approvalId: text("approval_id"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 10. TreasuryAuditRecord — links treasury events to their audit + oversight trail. */
export const treasuryAuditRecords = pgTable("treasury_audit_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditRecordId: text("audit_record_id").notNull(),
  eventType: text("event_type"),
  eventId: text("event_id"),
  approvalId: text("approval_id"),
  oversightActor: text("oversight_actor"),
  oversightBasis: text("oversight_basis"),
  reconciliationRef: text("reconciliation_ref"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** 11. TreasurySnapshot — point-in-time treasury state capture for replay/audit/dispute. */
export const treasurySnapshots = pgTable("treasury_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotId: text("snapshot_id").notNull(),
  asOf: timestamp("as_of", { withTimezone: true }).notNull(),
  policyVersion: text("policy_version"),
  stateDigest: text("state_digest"),
  accountBalances: jsonb("account_balances"),
  reserveLevels: jsonb("reserve_levels"),
  purpose: text("purpose"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** 12. TreasuryReplayState — canonical replay artifact reconstructing prior state. */
export const treasuryReplayStates = pgTable("treasury_replay_states", {
  id: uuid("id").defaultRandom().primaryKey(),
  replayStateId: text("replay_state_id").notNull(),
  targetAsOf: timestamp("target_as_of", { withTimezone: true }).notNull(),
  policyVersion: text("policy_version"),
  reconstructedDigest: text("reconstructed_digest"),
  sourceSnapshotId: text("source_snapshot_id"),
  ledgerRangeStart: text("ledger_range_start"),
  ledgerRangeEnd: text("ledger_range_end"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** 13. TreasuryApproval — governance approval authorizing a treasury action/policy/exception. */
export const treasuryApprovals = pgTable("treasury_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  approvalId: text("approval_id").notNull(),
  // "action" | "policy_change" | "reserve_floor_breach" | "cross_industry_transfer" | "exception"
  approvalType: text("approval_type").notNull(),
  subjectRef: text("subject_ref"),
  // separation of powers: approver ≠ executor ≠ reconciler ≠ attester
  approverActor: text("approver_actor"),
  approvalBasis: text("approval_basis"),
  decision: text("decision").notNull().default("pending"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 14. TreasuryDispute — canonical dispute record for a contested treasury event. */
export const treasuryDisputes = pgTable("treasury_disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  disputeId: text("dispute_id").notNull(),
  disputedEventType: text("disputed_event_type"),
  disputedEventId: text("disputed_event_id"),
  disputingActor: text("disputing_actor"),
  disputeBasis: text("dispute_basis"),
  assignedReviewer: text("assigned_reviewer"),
  resolutionRecord: text("resolution_record"),
  escalationHistory: jsonb("escalation_history"),
  // no dispute may be silently closed without a documented resolution event
  status: text("status").notNull().default("open"),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("RESTRICTED"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type TreasuryAccountRow = typeof treasuryAccounts.$inferSelect;
export type TreasuryAccountInsert = typeof treasuryAccounts.$inferInsert;
export type TreasuryAllocationRow = typeof treasuryAllocations.$inferSelect;
export type TreasuryAllocationInsert = typeof treasuryAllocations.$inferInsert;
export type TreasuryReserveRow = typeof treasuryReserves.$inferSelect;
export type TreasuryReserveInsert = typeof treasuryReserves.$inferInsert;
export type TreasuryRevenueEventRow = typeof treasuryRevenueEvents.$inferSelect;
export type TreasuryRevenueEventInsert = typeof treasuryRevenueEvents.$inferInsert;
export type TreasuryCompensationEventRow = typeof treasuryCompensationEvents.$inferSelect;
export type TreasuryCompensationEventInsert = typeof treasuryCompensationEvents.$inferInsert;
export type TreasuryExpenseEventRow = typeof treasuryExpenseEvents.$inferSelect;
export type TreasuryExpenseEventInsert = typeof treasuryExpenseEvents.$inferInsert;
export type TreasuryDistributionEventRow = typeof treasuryDistributionEvents.$inferSelect;
export type TreasuryDistributionEventInsert = typeof treasuryDistributionEvents.$inferInsert;
export type TreasuryLedgerRow = typeof treasuryLedger.$inferSelect;
export type TreasuryLedgerInsert = typeof treasuryLedger.$inferInsert;
export type TreasuryPolicyRow = typeof treasuryPolicies.$inferSelect;
export type TreasuryPolicyInsert = typeof treasuryPolicies.$inferInsert;
export type TreasuryAuditRecordRow = typeof treasuryAuditRecords.$inferSelect;
export type TreasuryAuditRecordInsert = typeof treasuryAuditRecords.$inferInsert;
export type TreasurySnapshotRow = typeof treasurySnapshots.$inferSelect;
export type TreasurySnapshotInsert = typeof treasurySnapshots.$inferInsert;
export type TreasuryReplayStateRow = typeof treasuryReplayStates.$inferSelect;
export type TreasuryReplayStateInsert = typeof treasuryReplayStates.$inferInsert;
export type TreasuryApprovalRow = typeof treasuryApprovals.$inferSelect;
export type TreasuryApprovalInsert = typeof treasuryApprovals.$inferInsert;
export type TreasuryDisputeRow = typeof treasuryDisputes.$inferSelect;
export type TreasuryDisputeInsert = typeof treasuryDisputes.$inferInsert;
