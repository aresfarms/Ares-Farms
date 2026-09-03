import { createHash } from "node:crypto";
import type { StripeConnectRecipientRegistry } from "./runtime";

export const FOUNDER_ECONOMICS_VERSION = "owner-controlled-economics-v2";
export const PLATFORM_STEWARDSHIP_BASE_CENTS = 400_000;
export const PLATFORM_STEWARDSHIP_INCLUDED_HOURS = 20;
export const PLATFORM_STEWARDSHIP_EXCESS_RATE_CENTS = 17_500;
export const BUILD_RECOVERY_PRIORITY_BASIS_POINTS = 1_500;

export type RevenueClass =
  | "OWNER_ENVIRONMENTAL_MODULE"
  | "PLATFORM_FINANCING_MODULE"
  | "GENERAL_PLATFORM";

export type GeneralFundWaterfallInput = {
  paymentRef: string;
  sourceTransactionRef: string | null;
  grossAmount: number;
  monthlyGeneralFundRevenue: number;
  processorFees: number;
  taxes: number;
  refundsAndChargebacks: number;
  currentOperatingExpenses: number;
  outstandingFounderExpenseReimbursement: number;
  outstandingBuildRecovery: number;
  stewardshipHoursThisMonth: number;
  stewardshipCashPaidEarlierThisMonth: number;
  stewardshipAccruedBeforeThisPayment: number;
  excessHoursApproved: boolean;
  recipients: StripeConnectRecipientRegistry;
  generatedAt: string;
};

export type GeneralFundTransfer = {
  recipient: "CAITLIN";
  purpose: "STEWARDSHIP" | "EXPENSE_REIMBURSEMENT" | "BUILD_RECOVERY" | "GENERAL_DISTRIBUTION";
  amount: number;
  connectedAccountRef: string | null;
  transferEligible: boolean;
};
export type GeneralFundWaterfallEvidence = {
  evidenceId: string;
  paymentRef: string;
  sourceTransactionRef: string | null;
  grossAmount: number;
  externalDeductions: number;
  operatingExpenses: number;
  stewardshipEntitlementThisMonth: number;
  stewardshipCashPaidOnThisPayment: number;
  stewardshipAccruedAfterThisPayment: number;
  founderExpenseReimbursementPaid: number;
  buildRecoveryPaid: number;
  caitlinGeneralDistribution: number;
  platformReserveRetained: number;
  totalCaitlinTransfer: number;
  transfers: GeneralFundTransfer[];
  generatedAt: string;
  governanceVersion: string;
  evidenceSha256: string;
};

function assertCents(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer in cents.`);
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function stewardshipMonthlyEntitlement(hours: number, excessHoursApproved: boolean): number {
  if (!Number.isFinite(hours) || hours < 0) throw new Error("stewardshipHoursThisMonth must be non-negative.");
  const excess = Math.max(0, hours - PLATFORM_STEWARDSHIP_INCLUDED_HOURS);
  return PLATFORM_STEWARDSHIP_BASE_CENTS + (excessHoursApproved ? Math.round(excess * PLATFORM_STEWARDSHIP_EXCESS_RATE_CENTS) : 0);
}
export function stewardshipCashCap(monthlyGeneralFundRevenue: number): number {
  assertCents(monthlyGeneralFundRevenue, "monthlyGeneralFundRevenue");
  if (monthlyGeneralFundRevenue < 500_000) return 0;
  if (monthlyGeneralFundRevenue < 1_000_000) return 200_000;
  return PLATFORM_STEWARDSHIP_BASE_CENTS;
}

function transfer(
  recipient: "CAITLIN",
  purpose: GeneralFundTransfer["purpose"],
  amount: number,
  recipients: StripeConnectRecipientRegistry
): GeneralFundTransfer {
  const registry = recipients[recipient];
  return {
    recipient,
    purpose,
    amount,
    connectedAccountRef: registry.connectedAccountRef,
    transferEligible: amount > 0 && registry.certified && Boolean(registry.connectedAccountRef),
  };
}

export function buildGeneralFundWaterfall(input: GeneralFundWaterfallInput): GeneralFundWaterfallEvidence {
  const moneyFields = [
    "grossAmount", "monthlyGeneralFundRevenue", "processorFees", "taxes",
    "refundsAndChargebacks", "currentOperatingExpenses", "outstandingFounderExpenseReimbursement",
    "outstandingBuildRecovery", "stewardshipCashPaidEarlierThisMonth", "stewardshipAccruedBeforeThisPayment",
  ] as const;
  for (const field of moneyFields) assertCents(input[field], field);

  const externalDeductions = input.processorFees + input.taxes + input.refundsAndChargebacks;
  let available = Math.max(0, input.grossAmount - externalDeductions - input.currentOperatingExpenses);
  const stewardshipEntitlementThisMonth = stewardshipMonthlyEntitlement(input.stewardshipHoursThisMonth, input.excessHoursApproved);
  const stewardshipOutstanding = Math.max(0, stewardshipEntitlementThisMonth + input.stewardshipAccruedBeforeThisPayment - input.stewardshipCashPaidEarlierThisMonth);
  const stewardshipAvailableCap = Math.max(0, stewardshipCashCap(input.monthlyGeneralFundRevenue) - input.stewardshipCashPaidEarlierThisMonth);
  const stewardshipCashPaidOnThisPayment = Math.min(available, stewardshipOutstanding, stewardshipAvailableCap);
  available -= stewardshipCashPaidOnThisPayment;
  const founderExpenseReimbursementPaid = Math.min(available, input.outstandingFounderExpenseReimbursement);
  available -= founderExpenseReimbursementPaid;

  const buildRecoveryTarget = Math.floor(available * BUILD_RECOVERY_PRIORITY_BASIS_POINTS / 10_000);
  const buildRecoveryPaid = Math.min(available, input.outstandingBuildRecovery, buildRecoveryTarget);
  available -= buildRecoveryPaid;

  const caitlinGeneralDistribution = 0;
  const platformReserveRetained = available;
  const stewardshipAccruedAfterThisPayment = Math.max(0, stewardshipOutstanding - stewardshipCashPaidOnThisPayment);

  const transfers = [
    transfer("CAITLIN", "STEWARDSHIP", stewardshipCashPaidOnThisPayment, input.recipients),
    transfer("CAITLIN", "EXPENSE_REIMBURSEMENT", founderExpenseReimbursementPaid, input.recipients),
    transfer("CAITLIN", "BUILD_RECOVERY", buildRecoveryPaid, input.recipients),
    transfer("CAITLIN", "GENERAL_DISTRIBUTION", caitlinGeneralDistribution, input.recipients),
  ].filter((item) => item.amount > 0);

  const totalCaitlinTransfer = transfers.filter((item) => item.recipient === "CAITLIN").reduce((sum, item) => sum + item.amount, 0);

  const base = {
    paymentRef: input.paymentRef,
    sourceTransactionRef: input.sourceTransactionRef,
    grossAmount: input.grossAmount,
    externalDeductions,
    operatingExpenses: input.currentOperatingExpenses,
    stewardshipEntitlementThisMonth,
    stewardshipCashPaidOnThisPayment,
    stewardshipAccruedAfterThisPayment,
    founderExpenseReimbursementPaid,
    buildRecoveryPaid,
    caitlinGeneralDistribution,
    platformReserveRetained,
    totalCaitlinTransfer,
    transfers,
    generatedAt: input.generatedAt,
    governanceVersion: FOUNDER_ECONOMICS_VERSION,
  };
  const evidenceSha256 = sha256(stableJson(base));
  const evidenceId = `gfw_${evidenceSha256.slice(0, 24)}`;
  return { evidenceId, ...base, evidenceSha256 };
}

export function directModuleRule(_revenueClass: RevenueClass) {
  // Owner-controlled transition: automatic personal/module splits are disabled.
  // Revenue remains in Furlong until a separately approved compensation or
  // affiliate economics policy is adopted.
  return { caitlinBasisPoints: 0 };
}
