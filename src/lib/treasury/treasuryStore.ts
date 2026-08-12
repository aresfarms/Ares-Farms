import { and, desc, eq } from "drizzle-orm";

import {
  treasuryAllocations,
  treasuryApprovals,
  treasuryCompensationEvents,
  treasuryDisputes,
  treasuryLedger,
  treasuryPolicies,
  treasuryReserves,
  treasuryRevenueEvents,
  type TreasuryApprovalRow,
  type TreasuryDisputeRow,
  type TreasuryLedgerRow,
  type TreasuryPolicyRow,
  type TreasuryReserveRow,
  type TreasuryRevenueEventRow,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  assertTreasuryOperationAllowed,
  type TreasuryOperation,
} from "@/lib/treasury/treasuryGovernanceGuard";

/**
 * Governed Treasury Store (REG-TREASURY-001 / CANON-TREASURY-001)
 *
 * Every material treasury write passes the TreasuryGovernanceGuard first, then
 * inserts a classification-carrying, replay-referenced row, and appends an
 * immutable TreasuryLedger entry. Financial truth is append-only — corrections
 * are new events (never overwrites). SPINE ONLY: no live payment capture; no
 * tier prices; no membership checkout.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const TREASURY_SOURCE = "treasury-governance-runtime";

/** numeric() columns are string-typed in drizzle — normalize money to string. */
function money(amount: number): string {
  return amount.toFixed(2);
}

type LedgerEventType =
  | "revenue"
  | "compensation"
  | "expense"
  | "distribution"
  | "allocation"
  | "reserve"
  | "correction";

async function appendLedgerEntry(input: {
  ledgerEntryId: string;
  eventType: LedgerEventType;
  eventId?: string | null;
  accountId?: string | null;
  amount?: number | null;
  approvingActor?: string | null;
  governanceBasis?: string | null;
  policyVersion?: string | null;
  correctsEventId?: string | null;
  correctionRationale?: string | null;
  traceId: string;
  classification?: string;
  metadata?: Record<string, unknown>;
}): Promise<TreasuryLedgerRow> {
  assertTreasuryOperationAllowed({
    operation: input.correctsEventId ? "correction" : "append_ledger_entry",
    classificationLevel: input.classification ?? "CONFIDENTIAL",
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: input.traceId,
    traceId: input.traceId,
    correctsEventId: input.correctsEventId,
    correctionRationale: input.correctionRationale,
    approverActor: input.approvingActor,
  });

  const [row] = await db
    .insert(treasuryLedger)
    .values({
      ledgerEntryId: input.ledgerEntryId,
      eventType: input.eventType,
      eventId: input.eventId ?? null,
      accountId: input.accountId ?? null,
      amount: input.amount != null ? money(input.amount) : null,
      correctsEventId: input.correctsEventId ?? null,
      correctionRationale: input.correctionRationale ?? null,
      approvingActor: input.approvingActor ?? null,
      governanceBasis: input.governanceBasis ?? null,
      policyVersion: input.policyVersion ?? null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: input.classification ?? "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: TREASURY_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  return row;
}

/** Record recognized revenue (e.g. a subscription/engagement) + ledger entry. */
export async function recordRevenueEvent(input: {
  revenueEventId: string;
  amount: number;
  revenueSource?: string | null;
  moduleAttribution?: string | null;
  programAttribution?: string | null;
  restrictionBasis?: string | null;
  accountId?: string | null;
  traceId: string;
  metadata?: Record<string, unknown>;
}): Promise<TreasuryRevenueEventRow> {
  assertTreasuryOperationAllowed({
    operation: "record_revenue_event",
    classificationLevel: "CONFIDENTIAL",
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: input.traceId,
    traceId: input.traceId,
    livePaymentCapture: false,
  });

  const [row] = await db
    .insert(treasuryRevenueEvents)
    .values({
      revenueEventId: input.revenueEventId,
      amount: money(input.amount),
      revenueSource: input.revenueSource ?? null,
      moduleAttribution: input.moduleAttribution ?? null,
      programAttribution: input.programAttribution ?? null,
      restrictionBasis: input.restrictionBasis ?? null,
      accountId: input.accountId ?? null,
      recognitionStatus: "recorded",
      governanceVersion: GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: TREASURY_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  await appendLedgerEntry({
    ledgerEntryId: `ledger-${input.revenueEventId}`,
    eventType: "revenue",
    eventId: input.revenueEventId,
    accountId: input.accountId,
    amount: input.amount,
    governanceBasis: "REG-TREASURY-001/revenue-classification",
    traceId: input.traceId,
  });

  return row;
}

/** Record compensation paid to a professional/partner (Level 4 RESTRICTED). */
export async function recordCompensationEvent(input: {
  compensationEventId: string;
  recipientId?: string | null;
  recipientRole?: string | null;
  amount: number;
  compensationBasis?: string | null;
  approvalId?: string | null;
  executorActor?: string | null;
  approverActor?: string | null;
  traceId: string;
  metadata?: Record<string, unknown>;
}) {
  assertTreasuryOperationAllowed({
    operation: "record_compensation_event",
    classificationLevel: "RESTRICTED",
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: input.traceId,
    traceId: input.traceId,
    approvalId: input.approvalId,
    executorActor: input.executorActor,
    approverActor: input.approverActor,
  });

  const [row] = await db
    .insert(treasuryCompensationEvents)
    .values({
      compensationEventId: input.compensationEventId,
      recipientId: input.recipientId ?? null,
      recipientRole: input.recipientRole ?? null,
      amount: money(input.amount),
      compensationBasis: input.compensationBasis ?? null,
      approvalId: input.approvalId ?? null,
      relatedPartyReview: false,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: TREASURY_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  await appendLedgerEntry({
    ledgerEntryId: `ledger-${input.compensationEventId}`,
    eventType: "compensation",
    eventId: input.compensationEventId,
    amount: input.amount,
    approvingActor: input.approverActor,
    governanceBasis: "CANON-TREASURY-001/compensation",
    classification: "RESTRICTED",
    traceId: input.traceId,
  });

  return row;
}

/** Record a governed allocation across accounts (revenue waterfall step). */
export async function recordAllocation(input: {
  allocationId: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  amount: number;
  allocationBasis?: string | null;
  approvalId?: string | null;
  reserveType?: string | null;
  reserveFloor?: number | null;
  projectedReserveLevel?: number | null;
  crossIndustryTransfer?: boolean;
  traceId: string;
  metadata?: Record<string, unknown>;
}) {
  assertTreasuryOperationAllowed({
    operation: "record_allocation",
    classificationLevel: "CONFIDENTIAL",
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: input.traceId,
    traceId: input.traceId,
    approvalId: input.approvalId,
    reserveType: input.reserveType,
    reserveFloor: input.reserveFloor,
    projectedReserveLevel: input.projectedReserveLevel,
    crossIndustryTransfer: input.crossIndustryTransfer,
  });

  const [row] = await db
    .insert(treasuryAllocations)
    .values({
      allocationId: input.allocationId,
      fromAccountId: input.fromAccountId ?? null,
      toAccountId: input.toAccountId ?? null,
      amount: money(input.amount),
      allocationBasis: input.allocationBasis ?? null,
      approvalId: input.approvalId ?? null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: TREASURY_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  await appendLedgerEntry({
    ledgerEntryId: `ledger-${input.allocationId}`,
    eventType: "allocation",
    eventId: input.allocationId,
    accountId: input.toAccountId,
    amount: input.amount,
    governanceBasis: "REG-TREASURY-001/revenue-waterfall",
    traceId: input.traceId,
  });

  return row;
}

/** Record a governance approval (separation of powers; approver ≠ executor). */
export async function recordTreasuryApproval(input: {
  approvalId: string;
  approvalType:
    | "action"
    | "policy_change"
    | "reserve_floor_breach"
    | "cross_industry_transfer"
    | "exception";
  subjectRef?: string | null;
  approverActor?: string | null;
  approvalBasis?: string | null;
  decision?: "pending" | "approved" | "rejected";
  traceId: string;
  metadata?: Record<string, unknown>;
}): Promise<TreasuryApprovalRow> {
  assertTreasuryOperationAllowed({
    operation: "record_approval",
    classificationLevel: "RESTRICTED",
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: input.traceId,
    traceId: input.traceId,
    approverActor: input.approverActor,
  });

  const [row] = await db
    .insert(treasuryApprovals)
    .values({
      approvalId: input.approvalId,
      approvalType: input.approvalType,
      subjectRef: input.subjectRef ?? null,
      approverActor: input.approverActor ?? null,
      approvalBasis: input.approvalBasis ?? null,
      decision: input.decision ?? "pending",
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: TREASURY_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  return row;
}

/** Open a treasury dispute (never silently closed — resolution event required). */
export async function openTreasuryDispute(input: {
  disputeId: string;
  disputedEventType?: string | null;
  disputedEventId?: string | null;
  disputingActor?: string | null;
  disputeBasis?: string | null;
  assignedReviewer?: string | null;
  traceId: string;
  metadata?: Record<string, unknown>;
}): Promise<TreasuryDisputeRow> {
  assertTreasuryOperationAllowed({
    operation: "open_dispute",
    classificationLevel: "RESTRICTED",
    governanceVersion: GOVERNANCE_VERSION,
    replayRef: input.traceId,
    traceId: input.traceId,
  });

  const [row] = await db
    .insert(treasuryDisputes)
    .values({
      disputeId: input.disputeId,
      disputedEventType: input.disputedEventType ?? null,
      disputedEventId: input.disputedEventId ?? null,
      disputingActor: input.disputingActor ?? null,
      disputeBasis: input.disputeBasis ?? null,
      assignedReviewer: input.assignedReviewer ?? null,
      status: "open",
      governanceVersion: GOVERNANCE_VERSION,
      classification: "RESTRICTED",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: TREASURY_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  return row;
}

/** Governed reads for admin/oversight surfaces (caller must be authorized). */
export async function listTreasuryReserves(): Promise<TreasuryReserveRow[]> {
  return db
    .select()
    .from(treasuryReserves)
    .orderBy(desc(treasuryReserves.createdAt))
    .limit(50);
}

export async function listTreasuryPolicies(): Promise<TreasuryPolicyRow[]> {
  return db
    .select()
    .from(treasuryPolicies)
    .orderBy(desc(treasuryPolicies.createdAt))
    .limit(50);
}

export async function listTreasuryLedger(
  eventType?: LedgerEventType | null,
  limit = 100
): Promise<TreasuryLedgerRow[]> {
  const query = db
    .select()
    .from(treasuryLedger)
    .orderBy(desc(treasuryLedger.occurredAt))
    .limit(Math.min(Math.max(limit, 1), 500));

  return eventType
    ? query.where(eq(treasuryLedger.eventType, eventType))
    : query;
}

export async function getTreasuryReserveByType(
  reserveType: string
): Promise<TreasuryReserveRow[]> {
  return db
    .select()
    .from(treasuryReserves)
    .where(and(eq(treasuryReserves.reserveType, reserveType)))
    .limit(10);
}
