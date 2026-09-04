import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  RELIABILITY_PUBLIC_MIN_SAMPLE,
  RELIABILITY_RANKING_MIN_SAMPLE,
  executionReliabilityTieBreak,
  summarizeProviderExecutionReliability,
  type ReliabilityRecord,
} from "@/lib/financing/capitalNetworkExecutionReliability";

const date = (day: number) => new Date(`2026-01-${String(day).padStart(2, "0")}T12:00:00Z`);
const verified = (providerId: string, outcome: ReliabilityRecord["outcome"], day: number): ReliabilityRecord => ({
  providerId,
  outcome,
  verificationStatus: "VERIFIED",
  selectedAt: date(1),
  consentedAt: date(2),
  providerFirstResponseAt: date(Math.min(day, 4)),
  providerDispositionAt: date(day),
  closedFundedAt: outcome === "CLOSED_FUNDED" ? date(day) : null,
});

const thin = summarizeProviderExecutionReliability("new-provider", [
  verified("new-provider", "CLOSED_FUNDED", 12),
  verified("new-provider", "BORROWER_WITHDREW", 8),
]);
assert.equal(thin.publicDisplayEligible, false);
assert.equal(thin.rankingTieBreakEligible, false);
assert(thin.customerLabel.includes(`2/${RELIABILITY_PUBLIC_MIN_SAMPLE}`));

const strongRecords: ReliabilityRecord[] = [];
const slowRecords: ReliabilityRecord[] = [];
for (let i = 0; i < RELIABILITY_RANKING_MIN_SAMPLE; i += 1) {
  strongRecords.push(verified("strong", i < 8 ? "CLOSED_FUNDED" : "PROVIDER_DECLINED", 14 + (i % 3)));
  slowRecords.push(verified("slow", i < 5 ? "CLOSED_FUNDED" : "PROVIDER_DECLINED", 18 + (i % 4)));
}
strongRecords.push(verified("strong", "BORROWER_WITHDREW", 9));
strongRecords.push(verified("strong", "THIRD_PARTY_OR_EXTERNAL_BLOCKED", 11));

const strong = summarizeProviderExecutionReliability("strong", strongRecords);
const slow = summarizeProviderExecutionReliability("slow", slowRecords);
assert.equal(strong.publicDisplayEligible, true);
assert.equal(strong.rankingTieBreakEligible, true);
assert.equal(strong.providerDecisionOutcomeCount, 10);
assert.equal(strong.closeRatePct, 80);
assert.equal(strong.borrowerOrExternalExitCount, 2);
assert(executionReliabilityTieBreak(strong, slow) < 0, "Higher verified close rate should win an otherwise-equal suitability tie.");
assert.equal(executionReliabilityTieBreak(strong, thin), 0, "A new/low-sample provider must not be demoted for lacking Furlong history.");

const runtime = readFileSync("src/lib/financing/capitalNetworkExecutionReliability.ts", "utf8");
for (const forbidden of ["creditScore", "personalIncome", "householdIncome", "debtToIncome", "personalLiquidity", "personalNetWorth", "interestRate", "compensationAmount"]) {
  assert(!runtime.includes(`${forbidden}:`), `Reliability runtime must not ingest ${forbidden}.`);
}
assert(runtime.includes("New providers are not penalized"));

const migration = readFileSync("src/lib/db/migrations/0057_capital_network_execution_reliability.sql", "utf8");
assert(migration.includes("capital_network_execution_records"));
assert(migration.includes("evidence_refs"));
assert(migration.includes("verification_status"));
assert(!migration.includes("credit_score"));
assert(!migration.includes("personal_income"));
assert(!migration.includes("compensation_amount"));

const store = readFileSync("src/lib/financing/capitalNetworkStore.ts", "utf8");
assert(store.includes("recordCapitalNetworkExecutionOutcome"));
assert(store.includes("At least one evidence reference is required"));
assert(store.includes("executionReliabilityTieBreak"));
assert(store.includes("personalFinancialScoring: false"));

const publicUi = readFileSync("src/components/public/CapitalNetworkMatches.tsx", "utf8");
assert(publicUi.includes("Verified Furlong execution record"));
assert(publicUi.includes("How this is calculated"));
assert(publicUi.includes("Personal credit/income does not change a nonresidential match"));

const deskUi = readFileSync("src/app/capital-network/page.tsx", "utf8");
assert(deskUi.includes("Record evidence-backed execution outcome"));
assert(deskUi.includes("Record verified outcome"));

console.log(JSON.stringify({
  ok: true,
  thresholds: { publicDisplay: RELIABILITY_PUBLIC_MIN_SAMPLE, rankingTieBreak: RELIABILITY_RANKING_MIN_SAMPLE },
  strong: {
    verifiedOutcomes: strong.verifiedOutcomeCount,
    providerDecisionOutcomes: strong.providerDecisionOutcomeCount,
    closeRatePct: strong.closeRatePct,
    borrowerOrExternalExitsExcludedFromProviderDenominator: strong.borrowerOrExternalExitCount,
  },
  newProviderNeutrality: true,
  matchingUse: "tie-break only after both providers meet minimum verified provider-decision sample",
  forbiddenInfluences: ["interest rate", "compensation", "affiliation", "borrower personal financial profile"],
}, null, 2));
