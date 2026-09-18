import assert from "node:assert/strict";
import { compareFinancingScenario, monthlyPrincipalInterest, remainingBalanceAfterPayments } from "@/lib/financing/financingCostComparison";

const payment = monthlyPrincipalInterest(800_000, 7, 25);
assert.ok(Math.abs(payment - 5654.2336) < 0.1, `unexpected payment ${payment}`);
const balance = remainingBalanceAfterPayments(800_000, 7, 25, 120);
assert.ok(balance > 600_000 && balance < 700_000, `unexpected 10-year balloon balance ${balance}`);

const result = compareFinancingScenario({
  id: "test",
  label: "Test",
  projectCostUsd: 1_000_000,
  equityPct: 20,
  annualRatePct: 7,
  amortizationYears: 25,
  termYears: 10,
  upfrontFeePct: 1,
  annualNoiUsd: 100_000,
});
assert.equal(result.loanAmountUsd, 800_000);
assert.equal(result.equityCashUsd, 200_000);
assert.equal(result.upfrontFeeUsd, 8_000);
assert.equal(result.hasBalloon, true);
assert.ok(result.dscr != null && result.dscr > 1.45 && result.dscr < 1.5);
assert.ok(Math.abs(result.screeningFinancingCostThroughTermUsd - (result.interestThroughTermUsd + result.upfrontFeeUsd)) < 0.01);
assert.ok(Math.abs(result.loanAmountUsd - result.principalReductionThroughTermUsd - result.remainingBalanceAtTermUsd) < 0.01);

const zero = compareFinancingScenario({
  id: "zero",
  label: "Zero",
  projectCostUsd: 120_000,
  equityPct: 0,
  annualRatePct: 0,
  amortizationYears: 10,
  termYears: 10,
  upfrontFeePct: 0,
});
assert.equal(Math.round(zero.monthlyPrincipalInterestUsd), 1000);
assert.ok(zero.remainingBalanceAtTermUsd < 0.01);
assert.ok(zero.interestThroughTermUsd < 0.01);

console.log(JSON.stringify({ ok: true, rule: "FINANCING-COST-COMPARISON-001", guarantees: ["fixed-rate amortization", "term balloon", "cash equity", "upfront fee", "interest through term", "optional DSCR", "not labeled APR"] }, null, 2));
