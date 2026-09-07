import { readFileSync } from "node:fs";

import {
  matchCapitalProvider,
  type CapitalDealMatchInput,
  type CapitalProviderProfile,
} from "@/lib/financing/capitalNetworkRuntime";

const failures: string[] = [];
const assert = (condition: boolean, message: string) => { if (!condition) failures.push(message); };
const schema = readFileSync("src/db/schema/capitalNetwork.ts", "utf8");
const migration = readFileSync("src/lib/db/migrations/0061_capital_network_published_credit_box.sql", "utf8");
const matchesUi = readFileSync("src/components/public/CapitalNetworkMatches.tsx", "utf8");
const onboarding = readFileSync("src/app/capital-network/onboarding/page.tsx", "utf8");

const deal: CapitalDealMatchInput = {
  serviceRequestId: "FIN-TEST",
  state: "MD",
  program: "usda_bi",
  purpose: "acquisition",
  estimatedAmount: 2_000_000,
  propertyType: "hospitality",
  industry: "hospitality",
  borrowerType: "business",
};
const base: CapitalProviderProfile = {
  providerId: "provider-a",
  organizationName: "Provider A",
  providerRole: "LENDER",
  providerType: "BANK",
  status: "CERTIFIED_ACTIVE",
  affiliation: "INDEPENDENT",
  states: ["MD"],
  programs: ["usda_bi"],
  purposes: ["acquisition"],
  propertyTypes: ["hospitality"],
  industries: ["hospitality"],
  borrowerTypes: ["business"],
  minDealAmount: 500_000,
  maxDealAmount: 10_000_000,
  publishedCreditBox: { publishedSummary: "Published criteria." },
  collateralPolicy: { publishedSummary: "Published collateral policy." },
  environmentalRequirements: { publishedSummary: "Phase I when required." },
  typicalFirstResponseDays: 3,
  typicalClosingDays: 60,
  creditBoxSourceRefs: ["https://example.test/provider-policy"],
  creditBoxVerifiedAt: new Date("2026-09-05T00:00:00Z"),
  matchingEnabled: true,
  explicitAssignmentAllowed: true,
  liveRoutingAllowed: true,
  profileVersion: 1,
};
const verified = matchCapitalProvider(deal, base);
const unverified = matchCapitalProvider(deal, { ...base, creditBoxSourceRefs: [], creditBoxVerifiedAt: null });
assert(verified.eligible, "A matching verified provider should be eligible on non-personal fit dimensions.");
assert(verified.score === unverified.score, "Published-box verification status must not create a paid/administrative ranking advantage.");
assert(verified.reasons.some((reason) => reason.includes("source-verified")), "Verified published-box evidence must be explained.");
assert(unverified.reasons.some((reason) => reason.includes("still being completed")), "Incomplete published-box evidence must be disclosed.");
for (const token of ["published_credit_box", "collateral_policy", "environmental_requirements", "credit_box_source_refs", "credit_box_verified_at"]) {
  assert(migration.includes(token), `Published-box migration missing ${token}.`);
}
assert(schema.includes("typicalFirstResponseDays") && schema.includes("typicalClosingDays"), "Provider schema must preserve provider-published turnaround expectations.");
assert(matchesUi.includes("Personal credit and eligibility remain with the provider"), "Customer comparison must preserve provider credit authority.");
assert(matchesUi.includes("Furlong-measured execution history is shown separately"), "Published expectations must stay distinct from measured execution history.");
assert(onboarding.includes("Published provider box"), "Provider onboarding must collect published box evidence.");
assert(onboarding.includes("One public URL or policy reference per line"), "Provider onboarding must request source references.");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "CAPITAL-NETWORK-PUBLISHED-BOX-001", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  rule: "CAPITAL-NETWORK-PUBLISHED-BOX-001",
  publishedBoxSourceGoverned: true,
  personalCreditAuthorityRemainsProvider: true,
  publishedExpectationsSeparatedFromMeasuredHistory: true,
  rankingIndependentOfVerificationAdministration: true,
}, null, 2));
