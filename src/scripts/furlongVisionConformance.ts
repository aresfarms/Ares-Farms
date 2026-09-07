import fs from "node:fs";
import path from "node:path";

import {
  FURLONG_CATEGORY_POSITION,
  FURLONG_CUSTOMER_CORE_SERVICES,
  FURLONG_CUSTOMER_EXPERIENCE_RULE,
  FURLONG_CUSTOMER_PROMISE,
  FURLONG_FINANCING_NEUTRALITY_RULE,
  FURLONG_INSTITUTIONAL_REVENUE_STREAMS,
  FURLONG_LIVING_RECORD_RULE,
  FURLONG_MARKET_SEQUENCE,
  FURLONG_MONETIZATION_RULE,
  FURLONG_PLAN_SEPARATION_RULE,
  FURLONG_SECURITY_RELEASE_RULE,
  FURLONG_SOIL_AMENDMENT_REQUIREMENTS,
  FURLONG_SOIL_AMENDMENT_RULE,
  FURLONG_VISION_REQUIREMENTS,
  FURLONG_VISION_VERSION,
} from "@/lib/platform/furlongVision";

const EXPECTED_PROMISE =
  "Give Furlong an address and it will show what the entire property could realistically produce and how to finance it completely through receiving the keys—not merely its listing facts, agricultural classification or estimated sale value.";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const homepage = read("src/components/public/HomePropertyFrontDoor.tsx");
const guild = read("src/app/(public)/guild/page.tsx");
const propertyWorkspace = read("src/components/property/PropertyEvaluationWorkspace.tsx");
const doctrine = read("docs/MASTER_VOLUME_AMENDMENT_2026-09-04_PROPERTY_INTELLIGENCE.md");
const financeGovernance = read("src/lib/financing/commercialFinanceGovernance.ts");
const financeFees = read("src/lib/financing/financingFeeSchedule.ts");
const failures: string[] = [];

if (FURLONG_VISION_VERSION !== "furlong-vision-v1.0.0") failures.push("Canonical Furlong vision version changed without a governed revision.");
if (FURLONG_CUSTOMER_PROMISE !== EXPECTED_PROMISE) failures.push("Canonical address-to-keys customer promise drifted.");

for (const requirement of [
  "address-first-entry",
  "answer-first-progressive-disclosure",
  "whole-property-segmentation",
  "objective-highest-supported-land-plan",
  "risk-adjusted-net-after-expenses",
  "capital-path-through-keys",
  "borrower-core-direct-free",
  "durable-property-logbook",
  "multi-property-portfolio-register",
  "customer-controlled-share-access",
  "verified-provider-fit-ranking",
  "customer-selected-multi-provider-comparison",
  "separate-consent-per-recipient",
  "no-paid-placement-lead-sale-file-auction-or-success-cut",
  "provider-response-and-closing-tracking",
  "outcome-learning-with-evidence",
  "production-security-evidence-gate",
] as const) {
  if (!FURLONG_VISION_REQUIREMENTS.includes(requirement)) failures.push(`Missing vision requirement: ${requirement}`);
}

for (const requirement of [
  "current-soil-production-case",
  "purchased-or-mechanical-amendment-case",
  "livestock-assisted-regeneration-case",
  "no-livestock-alternative",
  "three-five-ten-year-net-effect",
] as const) {
  if (!FURLONG_SOIL_AMENDMENT_REQUIREMENTS.includes(requirement)) failures.push(`Missing soil-amendment requirement: ${requirement}`);
}

for (const service of [
  "open-property-analysis",
  "financing-readiness",
  "verified-provider-comparison",
  "customer-controlled-case-file",
  "exact-recipient-case-room-handoff",
] as const) {
  if (!FURLONG_CUSTOMER_CORE_SERVICES.includes(service)) failures.push(`Customer-free core omitted: ${service}`);
}
if (FURLONG_INSTITUTIONAL_REVENUE_STREAMS.length < 6) failures.push("Institutional revenue model is not explicit enough.");
if (FURLONG_MARKET_SEQUENCE.slice(0, 3).join("|") !== "USDA_BI|SBA_504|SBA_7A") failures.push("USDA B&I → SBA 504/7(a) market specialization order drifted.");

if (!homepage.includes("What are you looking at?")) failures.push("Homepage is not using the simplified property-first question.");
if (!homepage.includes("Check this property")) failures.push("Homepage primary property action is not plain-language and singular.");
if (!homepage.includes("No account · No sales call · Free core analysis · Sources included")) failures.push("Homepage does not surface the four first-screen trust facts.");
if (!guild.includes("can never improve provider ranking")) failures.push("Guild is not explicitly separated from provider ranking and financing access.");
if (!guild.includes("no success fee")) failures.push("Guild page does not state the no-success-fee financing rule.");
if (!propertyWorkspace.includes("Core financing workflow stays customer-free")) failures.push("Property trust disclosure does not preserve the customer-free financing core.");
if (!financeGovernance.includes('posture: "CONTROLLED_REFERRAL_AUTHORITY_REQUIRED"')) failures.push("Commercial finance governance does not gate provider referrals on controlled authority.");
if (!financeFees.includes('service: "Managed provider comparison"') || !financeFees.includes("No provider can pay to improve rank")) failures.push("Customer fee schedule does not preserve compensation-independent provider matching.");

for (const doctrineToken of [
  EXPECTED_PROMISE,
  "objectively strongest property plan",
  "livestock-assisted regeneration",
  "durable, customer-controlled logbook",
  "never sells borrower leads",
]) {
  if (!doctrine.includes(doctrineToken)) failures.push(`Master Volume amendment is missing: ${doctrineToken}`);
}

void [
  FURLONG_CATEGORY_POSITION,
  FURLONG_CUSTOMER_EXPERIENCE_RULE,
  FURLONG_MONETIZATION_RULE,
  FURLONG_PLAN_SEPARATION_RULE,
  FURLONG_SOIL_AMENDMENT_RULE,
  FURLONG_LIVING_RECORD_RULE,
  FURLONG_FINANCING_NEUTRALITY_RULE,
  FURLONG_SECURITY_RELEASE_RULE,
];

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, rule: "FURLONG-VISION-001", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  rule: "FURLONG-VISION-001",
  addressToKeysPromiseLocked: true,
  answerFirstProgressiveDisclosureRequired: true,
  borrowerCoreDirectFree: true,
  institutionFundedRevenueModel: true,
  usdaSbaBeachheadLocked: true,
  objectiveAndPracticalPlansSeparated: true,
  soilAmendmentAlternativesRequired: true,
  livingPropertyPortfolioRequired: true,
  controlledProviderRecommendationsRequired: true,
  multiProviderPrivateComparisonRequired: true,
  productionRequiresEvidenceGate: true,
}, null, 2));
