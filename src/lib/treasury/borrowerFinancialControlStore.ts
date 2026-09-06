import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import {
  borrowerProtectionFeeControls,
  engagementScopeAcceptances,
  governedPaymentRecords,
  governedRefundRecords,
  moduleRevenueAttributionRecords,
  serviceDeliveryEvidenceRecords,
  treasuryReconciliationRecords,
  treasuryRevenueEvents,
} from "@/db/schema";
import { db } from "@/lib/db";

export const BORROWER_FINANCIAL_CONTROL_VERSION = "borrower-financial-control-v1.0.0";

export type FinancialControlSnapshot = Readonly<{
  scopeAcceptedInAdvance: boolean;
  feeControlPresent: boolean;
  feeDisclosedInAdvance: boolean;
  actualWorkEvidencePresent: boolean;
  actualWorkEvidenceVerified: boolean;
  moduleAttributionPresent: boolean;
  paymentRecordPresent: boolean;
  paymentReferencesActualWorkEvidence: boolean;
  refundRecordsCoherent: boolean;
  revenueAttributionRecordPresent: boolean;
  reconciliationPresent: boolean;
  reconciliationComplete: boolean;
  reconciliationVarianceResolved: boolean;
  fiveSourceReconciliationPresent: boolean;
  separationOfDutiesSatisfied: boolean;
  distributionAllowedByReconciliation: boolean;
  productionPaymentConnectorAuthorized: boolean;
}>;

export type FinancialControlDecision = Readonly<{
  engagementReady: boolean;
  paymentAuthorizationReady: boolean;
  revenueRecognitionReady: boolean;
  liveCaptureAllowed: boolean;
  distributionAllowed: boolean;
  blockers: string[];
}>;

/**
 * Fail-closed evaluation. A payment authorization and revenue recognition are
 * deliberately separate: advance retainers may be recorded under an accepted
 * scope, but platform revenue is not recognized as earned until actual work is
 * evidenced. Live capture additionally requires the separate production
 * connector authorization gate.
 */
export function evaluateFinancialControlChain(
  state: FinancialControlSnapshot,
): FinancialControlDecision {
  const engagementBlockers: string[] = [];
  if (!state.scopeAcceptedInAdvance) engagementBlockers.push("ADVANCE_SCOPE_ACCEPTANCE_MISSING");
  if (!state.feeControlPresent) engagementBlockers.push("BORROWER_PROTECTION_FEE_CONTROL_MISSING");
  if (!state.feeDisclosedInAdvance) engagementBlockers.push("ADVANCE_FEE_DISCLOSURE_MISSING");
  if (!state.moduleAttributionPresent) engagementBlockers.push("MODULE_REVENUE_ATTRIBUTION_MISSING");

  const paymentBlockers = [...engagementBlockers];
  if (!state.actualWorkEvidencePresent) paymentBlockers.push("ACTUAL_WORK_EVIDENCE_MISSING");
  if (!state.actualWorkEvidenceVerified) paymentBlockers.push("ACTUAL_WORK_EVIDENCE_UNVERIFIED");
  if (!state.paymentReferencesActualWorkEvidence) paymentBlockers.push("PAYMENT_WORK_EVIDENCE_LINK_MISSING");

  const revenueBlockers = [...paymentBlockers];
  if (!state.paymentRecordPresent) revenueBlockers.push("PAYMENT_RECORD_MISSING");
  if (!state.refundRecordsCoherent) revenueBlockers.push("REFUND_LINEAGE_INCOHERENT");
  if (!state.revenueAttributionRecordPresent) revenueBlockers.push("MODULE_REVENUE_ATTRIBUTION_RECORD_MISSING");
  if (!state.reconciliationPresent) revenueBlockers.push("TREASURY_RECONCILIATION_MISSING");
  if (!state.reconciliationComplete) revenueBlockers.push("TREASURY_RECONCILIATION_INCOMPLETE");
  if (!state.reconciliationVarianceResolved) revenueBlockers.push("TREASURY_VARIANCE_UNRESOLVED");
  if (!state.fiveSourceReconciliationPresent) revenueBlockers.push("FIVE_SOURCE_RECONCILIATION_EVIDENCE_MISSING");
  if (!state.separationOfDutiesSatisfied) revenueBlockers.push("TREASURY_SEPARATION_OF_DUTIES_FAILED");

  const engagementReady = engagementBlockers.length === 0;
  const paymentAuthorizationReady = paymentBlockers.length === 0;
  const revenueRecognitionReady = revenueBlockers.length === 0;
  const liveCaptureAllowed = paymentAuthorizationReady && state.productionPaymentConnectorAuthorized;
  const distributionAllowed =
    revenueRecognitionReady && state.distributionAllowedByReconciliation;
  const blockers = Array.from(new Set([
    ...revenueBlockers,
    ...(!state.productionPaymentConnectorAuthorized ? ["PRODUCTION_PAYMENT_CONNECTOR_NOT_AUTHORIZED"] : []),
    ...(!state.distributionAllowedByReconciliation ? ["TREASURY_DISTRIBUTION_NOT_RELEASED"] : []),
  ]));
  return { engagementReady, paymentAuthorizationReady, revenueRecognitionReady, liveCaptureAllowed, distributionAllowed, blockers };
}


export type PaymentAuthorizationPreflight = Readonly<{
  allowed: boolean;
  blockers: string[];
  scopeAcceptanceId: string | null;
  feeControlId: string | null;
  actualWorkEvidenceId: string | null;
  moduleAttribution: string | null;
}>;

/**
 * Resolve the durable records that must already exist before a paid service
 * can move into payment authorization. This is deliberately narrower than
 * revenue recognition/reconciliation: it proves accepted scope, advance fee
 * control/disclosure, module attribution, and verified actual work.
 */
export async function evaluateRecordedPaymentAuthorization(input: {
  tenantId: string;
  scopeAcceptanceId: string | null | undefined;
  feeControlId: string | null | undefined;
  actualWorkEvidenceId: string | null | undefined;
  moduleAttribution: string | null | undefined;
  expectedAmountCents?: number | null;
}): Promise<PaymentAuthorizationPreflight> {
  const blockers: string[] = [];
  const scopeId = input.scopeAcceptanceId?.trim() || null;
  const feeId = input.feeControlId?.trim() || null;
  const workId = input.actualWorkEvidenceId?.trim() || null;
  const moduleId = input.moduleAttribution?.trim() || null;

  if (!scopeId) blockers.push("ADVANCE_SCOPE_ACCEPTANCE_MISSING");
  if (!feeId) blockers.push("BORROWER_PROTECTION_FEE_CONTROL_MISSING");
  if (!workId) blockers.push("PAYMENT_WORK_EVIDENCE_LINK_MISSING");
  if (!moduleId) blockers.push("MODULE_REVENUE_ATTRIBUTION_MISSING");
  if (blockers.length) {
    return { allowed: false, blockers, scopeAcceptanceId: scopeId, feeControlId: feeId, actualWorkEvidenceId: workId, moduleAttribution: moduleId };
  }

  const [scope] = await db.select().from(engagementScopeAcceptances)
    .where(eq(engagementScopeAcceptances.scopeAcceptanceId, scopeId!)).limit(1);
  const [fee] = await db.select().from(borrowerProtectionFeeControls)
    .where(eq(borrowerProtectionFeeControls.feeControlId, feeId!)).limit(1);
  const [work] = await db.select().from(serviceDeliveryEvidenceRecords)
    .where(eq(serviceDeliveryEvidenceRecords.evidenceId, workId!)).limit(1);

  if (!scope || scope.status !== "accepted" || scope.tenantId !== input.tenantId)
    blockers.push("ADVANCE_SCOPE_ACCEPTANCE_INVALID");
  if (scope && scope.moduleId !== moduleId)
    blockers.push("SCOPE_MODULE_ATTRIBUTION_MISMATCH");
  if (!fee) blockers.push("BORROWER_PROTECTION_FEE_CONTROL_MISSING");
  if (fee) {
    if (fee.scopeAcceptanceId !== scopeId) blockers.push("FEE_CONTROL_SCOPE_MISMATCH");
    if (fee.moduleId !== moduleId) blockers.push("FEE_CONTROL_MODULE_MISMATCH");
    if (fee.disclosureStatus !== "DISCLOSED_AND_ACCEPTED" || !fee.disclosedBeforeAssessment)
      blockers.push("ADVANCE_FEE_DISCLOSURE_MISSING");
    if (!fee.scopeAcceptedBeforeWork) blockers.push("SCOPE_ACCEPTANCE_NOT_BEFORE_WORK");
    const cap = fee.maximumFeeAmount ?? fee.feeAmount;
    if (input.expectedAmountCents != null && cap != null && input.expectedAmountCents > cap)
      blockers.push("PAYMENT_AMOUNT_EXCEEDS_FEE_CONTROL");
  }
  if (!work) blockers.push("ACTUAL_WORK_EVIDENCE_MISSING");
  if (work) {
    if (work.scopeAcceptanceId !== scopeId || work.feeControlId !== feeId)
      blockers.push("WORK_EVIDENCE_CONTROL_MISMATCH");
    if (work.moduleId !== moduleId) blockers.push("WORK_EVIDENCE_MODULE_MISMATCH");
    if (!work.verified || !work.verifiedAt) blockers.push("ACTUAL_WORK_EVIDENCE_UNVERIFIED");
    if (scope?.acceptedAt && work.workStartedAt && work.workStartedAt < scope.acceptedAt)
      blockers.push("WORK_PRECEDED_SCOPE_ACCEPTANCE");
  }

  return {
    allowed: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    scopeAcceptanceId: scopeId,
    feeControlId: feeId,
    actualWorkEvidenceId: workId,
    moduleAttribution: moduleId,
  };
}

function scopeHash(scopeSummary: string, scopeVersion: string): string {
  return createHash("sha256")
    .update(`${scopeVersion}\n${scopeSummary}`, "utf8")
    .digest("hex");
}

export async function recordAdvanceScopeAcceptance(input: {
  borrowerId?: string | null;
  customerSubjectRef?: string | null;
  tenantId: string;
  moduleId: string;
  serviceCode: string;
  scopeVersion: string;
  scopeSummary: string;
  quotedAmount?: string | null;
  quotedRate?: string | null;
  currency?: string;
  acceptedBy: string;
  acceptanceMethod: string;
  acceptedAt: Date;
  feeControlId?: string | null;
  traceId: string;
}) {
  const scopeAcceptanceId = `scope-${randomUUID()}`;
  const rows = await db
    .insert(engagementScopeAcceptances)
    .values({
      scopeAcceptanceId,
      borrowerId: input.borrowerId ?? null,
      customerSubjectRef: input.customerSubjectRef ?? null,
      tenantId: input.tenantId,
      moduleId: input.moduleId,
      serviceCode: input.serviceCode,
      scopeVersion: input.scopeVersion,
      scopeSummary: input.scopeSummary,
      scopeHash: scopeHash(input.scopeSummary, input.scopeVersion),
      quotedAmount: input.quotedAmount ?? null,
      quotedRate: input.quotedRate ?? null,
      currency: input.currency ?? "USD",
      acceptedBy: input.acceptedBy,
      acceptanceMethod: input.acceptanceMethod,
      acceptedAt: input.acceptedAt,
      feeControlId: input.feeControlId ?? null,
      governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: "borrower-financial-control-chain",
    })
    .returning();
  return rows[0];
}

export async function recordBorrowerProtectionFeeControl(input: {
  journeyId: string;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId: string;
  actorId?: string | null;
  moduleId: string;
  serviceCode: string;
  scopeAcceptanceId: string;
  feeType: string;
  feeAmountCents: number;
  maximumFeeAmountCents?: number | null;
  feeRateAmountCents?: number | null;
  currency?: string;
  feeDisclosureRef: string;
  disclosureVersion: string;
  regulatoryBasis: string;
  waiverConditions?: unknown;
  enforcementMechanism: string;
  disclosureAt: Date;
  borrowerAcceptedAt: Date;
  borrowerExternalFirmRightPreserved?: boolean;
  noSurchargeOrPreferenceIncentive?: boolean;
  traceId: string;
}) {
  const feeControlId = `fee-control-${randomUUID()}`;
  const rows = await db
    .insert(borrowerProtectionFeeControls)
    .values({
      feeControlId,
      journeyId: input.journeyId,
      applicationId: input.applicationId ?? null,
      borrowerId: input.borrowerId ?? null,
      tenantId: input.tenantId,
      actorId: input.actorId ?? null,
      moduleId: input.moduleId,
      serviceCode: input.serviceCode,
      scopeAcceptanceId: input.scopeAcceptanceId,
      feeType: input.feeType,
      feeAmount: input.feeAmountCents,
      maximumFeeAmount: input.maximumFeeAmountCents ?? null,
      feeRateAmount: input.feeRateAmountCents ?? null,
      currency: input.currency ?? "USD",
      standardMarketRateAmount: 0,
      advisoryDiscountPercent: 0,
      feeDisclosureRef: input.feeDisclosureRef,
      disclosureVersion: input.disclosureVersion,
      regulatoryBasis: input.regulatoryBasis,
      waiverConditions: input.waiverConditions ?? null,
      enforcementMechanism: input.enforcementMechanism,
      disclosureStatus: "DISCLOSED_AND_ACCEPTED",
      disclosedBeforeAssessment: input.disclosureAt <= input.borrowerAcceptedAt,
      scopeAcceptedBeforeWork: true,
      disclosureAt: input.disclosureAt,
      borrowerAcceptedAt: input.borrowerAcceptedAt,
      borrowerExternalFirmRightPreserved:
        input.borrowerExternalFirmRightPreserved ?? false,
      noSurchargeOrPreferenceIncentive:
        input.noSurchargeOrPreferenceIncentive ?? true,
      governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      source: "borrower-financial-control-chain",
    })
    .returning();
  return rows[0];
}

export async function recordActualWorkEvidence(input: {
  scopeAcceptanceId: string;
  feeControlId: string;
  moduleId: string;
  serviceCode: string;
  workType: string;
  actualWorkSummary: string;
  performedBy: string;
  evidenceRefs: string[];
  billableUnits?: string | null;
  amountEligible?: string | null;
  verified: boolean;
  verifiedBy?: string | null;
  workStartedAt?: Date | null;
  workCompletedAt?: Date | null;
  traceId: string;
}) {
  const evidenceId = `work-evidence-${randomUUID()}`;
  const rows = await db.insert(serviceDeliveryEvidenceRecords).values({
    evidenceId,
    scopeAcceptanceId: input.scopeAcceptanceId,
    feeControlId: input.feeControlId,
    moduleId: input.moduleId,
    serviceCode: input.serviceCode,
    workType: input.workType,
    actualWorkSummary: input.actualWorkSummary,
    performedBy: input.performedBy,
    evidenceRefs: input.evidenceRefs,
    billableUnits: input.billableUnits ?? null,
    amountEligible: input.amountEligible ?? null,
    verified: input.verified,
    verifiedBy: input.verifiedBy ?? null,
    workStartedAt: input.workStartedAt ?? null,
    workCompletedAt: input.workCompletedAt ?? null,
    verifiedAt: input.verified ? new Date() : null,
    governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    source: "borrower-financial-control-chain",
  }).returning();
  return rows[0];
}

export async function recordGovernedPayment(input: {
  provider: string;
  providerPaymentRef: string;
  billingEventId?: string | null;
  scopeAcceptanceId?: string | null;
  feeControlId?: string | null;
  actualWorkEvidenceId: string;
  moduleAttribution: string;
  amount: string;
  currency?: string;
  paymentPurpose: string;
  status: string;
  liveCapture: boolean;
  treasuryLedgerRef?: string | null;
  revenueEventRef?: string | null;
  traceId: string;
}) {
  const existing = await db.select().from(governedPaymentRecords).where(
    and(
      eq(governedPaymentRecords.provider, input.provider),
      eq(governedPaymentRecords.providerPaymentRef, input.providerPaymentRef),
    ),
  ).limit(1);
  if (existing[0]) return existing[0];
  const paymentRecordId = `payment-${randomUUID()}`;
  const rows = await db.insert(governedPaymentRecords).values({
    paymentRecordId,
    provider: input.provider,
    providerPaymentRef: input.providerPaymentRef,
    billingEventId: input.billingEventId ?? null,
    scopeAcceptanceId: input.scopeAcceptanceId ?? null,
    feeControlId: input.feeControlId ?? null,
    actualWorkEvidenceId: input.actualWorkEvidenceId,
    moduleAttribution: input.moduleAttribution,
    amount: input.amount,
    currency: input.currency ?? "USD",
    paymentPurpose: input.paymentPurpose,
    status: input.status,
    liveCapture: input.liveCapture,
    treasuryLedgerRef: input.treasuryLedgerRef ?? null,
    revenueEventRef: input.revenueEventRef ?? null,
    governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    source: "borrower-financial-control-chain",
  }).returning();
  return rows[0];
}

export async function recordGovernedRefund(input: {
  paymentRecordId: string;
  providerRefundRef?: string | null;
  amount: string;
  currency?: string;
  reason: string;
  status: string;
  treasuryLedgerRef?: string | null;
  approvalId?: string | null;
  traceId: string;
}) {
  const refundRecordId = `refund-${randomUUID()}`;
  const rows = await db.insert(governedRefundRecords).values({
    refundRecordId,
    paymentRecordId: input.paymentRecordId,
    providerRefundRef: input.providerRefundRef ?? null,
    amount: input.amount,
    currency: input.currency ?? "USD",
    reason: input.reason,
    status: input.status,
    treasuryLedgerRef: input.treasuryLedgerRef ?? null,
    approvalId: input.approvalId ?? null,
    governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    source: "borrower-financial-control-chain",
  }).returning();
  return rows[0];
}


export async function recordObservedProviderRefund(input: {
  providerPaymentRef: string;
  providerRefundRef: string;
  amount: string;
  currency?: string;
  reason: string;
  status: string;
  traceId: string;
}) {
  const prior = await db.select().from(governedRefundRecords)
    .where(eq(governedRefundRecords.providerRefundRef, input.providerRefundRef)).limit(1);
  if (prior[0]) return prior[0];
  const payments = await db.select().from(governedPaymentRecords)
    .where(eq(governedPaymentRecords.providerPaymentRef, input.providerPaymentRef)).limit(1);
  const payment = payments[0];
  if (!payment) throw new Error("Refund cannot be recorded before its governed payment record exists.");
  return recordGovernedRefund({
    paymentRecordId: payment.paymentRecordId,
    providerRefundRef: input.providerRefundRef,
    amount: input.amount,
    currency: input.currency,
    reason: input.reason,
    status: input.status,
    treasuryLedgerRef: payment.treasuryLedgerRef,
    traceId: input.traceId,
  });
}

export async function recordModuleRevenueAttribution(input: {
  paymentRecordId: string;
  revenueEventId?: string | null;
  moduleId: string;
  serviceCode: string;
  providerEntity: string;
  grossAmount: string;
  refundAmount: string;
  netAmount: string;
  contributorShare: string;
  platformOverhead: string;
  currency?: string;
  restrictions?: unknown;
  taxPosture?: string | null;
  relatedParty: boolean;
  relatedPartyReviewRef?: string | null;
  traceId: string;
}) {
  const existing = await db.select().from(moduleRevenueAttributionRecords).where(
    and(
      eq(moduleRevenueAttributionRecords.paymentRecordId, input.paymentRecordId),
      eq(moduleRevenueAttributionRecords.moduleId, input.moduleId),
    ),
  ).limit(1);
  if (existing[0]) return existing[0];
  if (input.relatedParty && !input.relatedPartyReviewRef) {
    throw new Error("Related-party revenue attribution requires a review reference.");
  }
  const attributionId = `module-revenue-${randomUUID()}`;
  const rows = await db.insert(moduleRevenueAttributionRecords).values({
    attributionId, paymentRecordId: input.paymentRecordId, revenueEventId: input.revenueEventId ?? null,
    moduleId: input.moduleId, serviceCode: input.serviceCode, providerEntity: input.providerEntity,
    grossAmount: input.grossAmount, refundAmount: input.refundAmount, netAmount: input.netAmount,
    contributorShare: input.contributorShare, platformOverhead: input.platformOverhead, currency: input.currency ?? "USD",
    restrictions: input.restrictions ?? null, taxPosture: input.taxPosture ?? null, relatedParty: input.relatedParty,
    relatedPartyReviewRef: input.relatedPartyReviewRef ?? null, governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
    classification: "RESTRICTED", replayRef: input.traceId, traceId: input.traceId, source: "borrower-financial-control-chain",
  }).returning();
  return rows[0];
}

export async function recordModuleAttributedRevenue(input: {
  amount: string;
  moduleAttribution: string;
  revenueSource: string;
  accountId?: string | null;
  traceId: string;
  evidenceId: string;
  paymentRecordId: string;
}) {
  if (!input.moduleAttribution.trim()) throw new Error("Module attribution is required.");
  const revenueEventId = `revenue-${randomUUID()}`;
  const rows = await db.insert(treasuryRevenueEvents).values({
    revenueEventId,
    amount: input.amount,
    revenueSource: input.revenueSource,
    moduleAttribution: input.moduleAttribution,
    accountId: input.accountId ?? null,
    recognitionStatus: "recognized-with-work-evidence",
    status: "recorded",
    governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    source: "borrower-financial-control-chain",
    metadata: { evidenceId: input.evidenceId, paymentRecordId: input.paymentRecordId },
  }).returning();
  return rows[0];
}

export async function recordTreasuryReconciliation(input: {
  periodStart: Date;
  periodEnd: Date;
  internalLedgerTotal: string;
  providerSettlementTotal: string;
  custodyStatementTotal: string;
  accountingSystemTotal: string;
  recognizedRevenueTotal: string;
  refundTotal: string;
  variance: string;
  varianceDisposition?: string | null;
  sourceRefs: string[];
  reconcilerActor: string;
  attestationActor: string;
  distributionAllowed: boolean;
  approvalId?: string | null;
  status: "pending" | "reconciled" | "exception";
  exceptionRef?: string | null;
  traceId: string;
}) {
  if (input.sourceRefs.length < 5) {
    throw new Error("Treasury reconciliation requires ledger, processor, bank/custody, accounting, and refund/revenue source evidence.");
  }
  if (input.reconcilerActor === input.attestationActor) {
    throw new Error("Treasury reconciliation and attestation require separate actors.");
  }
  if (input.distributionAllowed && (input.status !== "reconciled" || Number(input.variance) !== 0)) {
    throw new Error("Distribution cannot be released until reconciliation is complete with zero unresolved variance.");
  }
  const reconciliationId = `reconciliation-${randomUUID()}`;
  const rows = await db.insert(treasuryReconciliationRecords).values({
    reconciliationId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    internalLedgerTotal: input.internalLedgerTotal,
    providerSettlementTotal: input.providerSettlementTotal,
    custodyStatementTotal: input.custodyStatementTotal,
    accountingSystemTotal: input.accountingSystemTotal,
    recognizedRevenueTotal: input.recognizedRevenueTotal,
    refundTotal: input.refundTotal,
    variance: input.variance,
    varianceDisposition: input.varianceDisposition ?? null,
    sourceRefs: input.sourceRefs,
    reconcilerActor: input.reconcilerActor,
    attestationActor: input.attestationActor,
    separationOfDutiesConfirmed: true,
    distributionAllowed: input.distributionAllowed,
    approvalId: input.approvalId ?? null,
    status: input.status,
    exceptionRef: input.exceptionRef ?? null,
    completedAt: input.status === "reconciled" ? new Date() : null,
    governanceVersion: BORROWER_FINANCIAL_CONTROL_VERSION,
    classification: "RESTRICTED",
    replayRef: input.traceId,
    traceId: input.traceId,
    source: "borrower-financial-control-chain",
  }).returning();
  return rows[0];
}
