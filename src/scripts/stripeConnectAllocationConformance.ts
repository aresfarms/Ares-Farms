import assert from "node:assert/strict";
import {
  buildAllocationEvidence,
  buildGeneralFundWaterfall,
  buildStripeTransferPlan,
  createAllocationRule,
  defaultRetainAllRule,
  directModuleRule,
} from "@/lib/stripe-connect";

const recipients = {
  CAITLIN: { connectedAccountRef: "acct_caitlin_fixture", certified: true },
};

const retainAll = buildAllocationEvidence({
  paymentRef: "pi_fixture_retain",
  sourceTransactionRef: "ch_fixture_retain",
  grossAmount: 100_00,
  currency: "usd",
  rule: defaultRetainAllRule("PLATFORM_SHARED"),
  recipients,
  generatedAt: "2026-08-06T23:55:00.000Z",
});
assert.equal(retainAll.furlongRetainedAmount, 100_00);
assert.equal(buildStripeTransferPlan(retainAll).length, 0);

const approved = createAllocationRule({
  ruleId: "module-fee-fixture",
  revenueClass: "MODULE_FEE",
  version: 3,
  status: "APPROVED",
  caitlinBasisPoints: 2500,
  effectiveAt: "2026-08-06T00:00:00.000Z",
  approvedByRefs: ["founder-review-fixture"],
});
const split = buildAllocationEvidence({
  paymentRef: "pi_fixture_split",
  sourceTransactionRef: "ch_fixture_split",
  grossAmount: 10_000,
  currency: "usd",
  rule: approved,
  recipients,
  generatedAt: "2026-08-06T23:56:00.000Z",
});

assert.equal(split.allocations[0].amount, 2500);
assert.equal(split.furlongRetainedAmount, 7500);
assert.equal(split.allocations.every((item) => item.transferEligible), true);
assert.equal(buildStripeTransferPlan(split).every((item) => item.executionAllowed === false), true);
assert.match(split.evidenceSha256, /^[a-f0-9]{64}$/);
assert.throws(
  () => createAllocationRule({ ...approved, caitlinBasisPoints: 11_000 }),
  /must be an integer from 0 through 10000 basis points/
);

const replay = buildAllocationEvidence({
  paymentRef: "pi_fixture_split",
  sourceTransactionRef: "ch_fixture_split",
  grossAmount: 10_000,
  currency: "usd",
  rule: approved,
  recipients,
  generatedAt: "2026-08-06T23:56:00.000Z",
});
assert.equal(replay.evidenceSha256, split.evidenceSha256);

assert.deepEqual(directModuleRule("OWNER_ENVIRONMENTAL_MODULE"), { caitlinBasisPoints: 0 });
assert.deepEqual(directModuleRule("PLATFORM_FINANCING_MODULE"), { caitlinBasisPoints: 0 });

const waterfall = buildGeneralFundWaterfall({
  paymentRef: "pi_general_fixture",
  sourceTransactionRef: "ch_general_fixture",
  grossAmount: 30_000_00,
  processorFees: 900_00,
  refundsAndChargebacks: 0,
  taxes: 0,
  currentOperatingExpenses: 1_100_00,
  monthlyGeneralFundRevenue: 30_000_00,
  stewardshipHoursThisMonth: 20,
  stewardshipCashPaidEarlierThisMonth: 0,
  stewardshipAccruedBeforeThisPayment: 0,
  excessHoursApproved: false,
  outstandingFounderExpenseReimbursement: 0,
  outstandingBuildRecovery: 100_000_00,
  recipients,
  generatedAt: "2026-08-07T00:05:00.000Z",
});
assert.equal(waterfall.stewardshipEntitlementThisMonth, 400_000);
assert.equal(waterfall.stewardshipCashPaidOnThisPayment, 400_000);
assert.equal(waterfall.buildRecoveryPaid > 0, true);
assert.equal(waterfall.caitlinGeneralDistribution, 0);
assert.equal(
  waterfall.totalCaitlinTransfer + waterfall.platformReserveRetained + waterfall.externalDeductions + waterfall.operatingExpenses,
  waterfall.grossAmount
);
assert.match(waterfall.evidenceSha256, /^[a-f0-9]{64}$/);

const lowRevenue = buildGeneralFundWaterfall({
  ...{
    paymentRef: "pi_low_fixture", sourceTransactionRef: "ch_low_fixture", grossAmount: 4_000_00,
    processorFees: 0, refundsAndChargebacks: 0, taxes: 0, currentOperatingExpenses: 0,
    monthlyGeneralFundRevenue: 4_000_00, stewardshipHoursThisMonth: 20,
    stewardshipCashPaidEarlierThisMonth: 0, stewardshipAccruedBeforeThisPayment: 0,
    excessHoursApproved: false, outstandingFounderExpenseReimbursement: 0, outstandingBuildRecovery: 0,
    recipients, generatedAt: "2026-08-07T00:06:00.000Z",
  }
});
assert.equal(lowRevenue.stewardshipCashPaidOnThisPayment, 0);
assert.equal(lowRevenue.stewardshipAccruedAfterThisPayment, 400_000);

console.log(JSON.stringify({
  ok: true,
  retainAll: retainAll.furlongRetainedAmount,
  caitlin: split.allocations[0].amount,
  furlongRetained: split.furlongRetainedAmount,
  transferPromotionActive: false,
  evidenceSha256: split.evidenceSha256,
}, null, 2));
