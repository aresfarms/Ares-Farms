import { createHash } from "node:crypto";

export const STRIPE_CONNECT_GOVERNANCE_VERSION = "stripe-connect-allocation-v1";
export const STRIPE_CONNECT_TRANSFER_PROMOTION_ACTIVE = false;

export type StripeConnectRecipient = "CAITLIN" | "STUART";
export type AllocationRuleStatus = "DRAFT" | "APPROVED" | "RETIRED";

export type StripeConnectAllocationRule = {
  ruleId: string;
  revenueClass: string;
  version: number;
  status: AllocationRuleStatus;
  caitlinBasisPoints: number;
  stuartBasisPoints: number;
  effectiveAt: string;
  approvedByRefs: string[];
};

export type StripeConnectRecipientRegistry = {
  CAITLIN: { connectedAccountRef: string | null; certified: boolean };
  STUART: { connectedAccountRef: string | null; certified: boolean };
};

export type StripeConnectAllocation = {
  recipient: StripeConnectRecipient;
  amount: number;
  basisPoints: number;
  connectedAccountRef: string | null;
  transferEligible: boolean;
};

export type StripeConnectAllocationEvidence = {
  evidenceId: string;
  paymentRef: string;
  sourceTransactionRef: string | null;
  transferGroup: string;
  grossAmount: number;
  currency: string;
  ruleId: string;
  ruleVersion: number;
  allocations: StripeConnectAllocation[];
  furlongRetainedAmount: number;
  generatedAt: string;
  governanceVersion: string;
  evidenceSha256: string;
};
function assertBasisPoints(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error(`${field} must be an integer from 0 through 10000 basis points.`);
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createAllocationRule(input: StripeConnectAllocationRule): StripeConnectAllocationRule {
  assertBasisPoints(input.caitlinBasisPoints, "caitlinBasisPoints");
  assertBasisPoints(input.stuartBasisPoints, "stuartBasisPoints");
  if (input.caitlinBasisPoints + input.stuartBasisPoints > 10_000) {
    throw new Error("Connected-account allocations cannot exceed 100% of the payment.");
  }
  if (input.version < 1 || !Number.isInteger(input.version)) {
    throw new Error("Allocation rule version must be a positive integer.");
  }
  return { ...input, approvedByRefs: [...input.approvedByRefs].sort() };
}

export function defaultRetainAllRule(revenueClass = "UNCLASSIFIED"): StripeConnectAllocationRule {
  return createAllocationRule({
    ruleId: `stripe-connect-${revenueClass.toLowerCase()}-retain-all`,
    revenueClass,
    version: 1,
    status: "DRAFT",
    caitlinBasisPoints: 0,
    stuartBasisPoints: 0,
    effectiveAt: "1970-01-01T00:00:00.000Z",
    approvedByRefs: [],
  });
}
export function buildAllocationEvidence(input: {
  paymentRef: string;
  sourceTransactionRef?: string | null;
  grossAmount: number;
  currency: string;
  rule: StripeConnectAllocationRule;
  recipients: StripeConnectRecipientRegistry;
  generatedAt: string;
}): StripeConnectAllocationEvidence {
  if (!Number.isInteger(input.grossAmount) || input.grossAmount < 0) {
    throw new Error("grossAmount must be a non-negative integer in the smallest currency unit.");
  }
  const rule = createAllocationRule(input.rule);
  const caitlinAmount = Math.floor(input.grossAmount * rule.caitlinBasisPoints / 10_000);
  const stuartAmount = Math.floor(input.grossAmount * rule.stuartBasisPoints / 10_000);
  const furlongRetainedAmount = input.grossAmount - caitlinAmount - stuartAmount;
  const transferGroup = `furlong:${input.paymentRef}:rule:${rule.ruleId}:v${rule.version}`;
  const allocations: StripeConnectAllocation[] = [
    {
      recipient: "CAITLIN",
      amount: caitlinAmount,
      basisPoints: rule.caitlinBasisPoints,
      connectedAccountRef: input.recipients.CAITLIN.connectedAccountRef,
      transferEligible: rule.status === "APPROVED" && caitlinAmount > 0 && input.recipients.CAITLIN.certified && Boolean(input.recipients.CAITLIN.connectedAccountRef),
    },
    {
      recipient: "STUART",
      amount: stuartAmount,
      basisPoints: rule.stuartBasisPoints,
      connectedAccountRef: input.recipients.STUART.connectedAccountRef,
      transferEligible: rule.status === "APPROVED" && stuartAmount > 0 && input.recipients.STUART.certified && Boolean(input.recipients.STUART.connectedAccountRef),
    },
  ];
  const base = {
    paymentRef: input.paymentRef,
    sourceTransactionRef: input.sourceTransactionRef ?? null,
    transferGroup,
    grossAmount: input.grossAmount,
    currency: input.currency.toLowerCase(),
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    allocations,
    furlongRetainedAmount,
    generatedAt: input.generatedAt,
    governanceVersion: STRIPE_CONNECT_GOVERNANCE_VERSION,
  };
  const evidenceSha256 = sha256(stableJson(base));
  return { evidenceId: `sca_${evidenceSha256.slice(0, 24)}`, ...base, evidenceSha256 };
}
export function assertStripeConnectTransferExecutionAllowed(
  evidence: StripeConnectAllocationEvidence
): void {
  if (!STRIPE_CONNECT_TRANSFER_PROMOTION_ACTIVE) {
    throw new Error("Stripe Connect transfer promotion is inactive.");
  }
  if (!evidence.sourceTransactionRef) {
    throw new Error("Stripe Connect transfer requires a bound source transaction reference.");
  }
  const blocked = evidence.allocations.filter((item) => item.amount > 0 && !item.transferEligible);
  if (blocked.length > 0) {
    throw new Error(`Stripe Connect transfer blocked for uncertified recipients: ${blocked.map((item) => item.recipient).join(", ")}`);
  }
}

export function buildStripeTransferPlan(evidence: StripeConnectAllocationEvidence) {
  return evidence.allocations
    .filter((item) => item.amount > 0)
    .map((item) => ({
      recipient: item.recipient,
      amount: item.amount,
      currency: evidence.currency,
      destination: item.connectedAccountRef,
      sourceTransaction: evidence.sourceTransactionRef,
      transferGroup: evidence.transferGroup,
      executionAllowed: STRIPE_CONNECT_TRANSFER_PROMOTION_ACTIVE && item.transferEligible && Boolean(evidence.sourceTransactionRef),
      metadata: {
        allocationEvidenceId: evidence.evidenceId,
        allocationEvidenceSha256: evidence.evidenceSha256,
        allocationRuleId: evidence.ruleId,
        allocationRuleVersion: String(evidence.ruleVersion),
        paymentRef: evidence.paymentRef,
        recipient: item.recipient,
      },
    }));
}
