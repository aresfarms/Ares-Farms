import assert from "node:assert/strict";
import fs from "node:fs";

import { onboardingIntelligenceCaseHandoff } from "@/lib/intelligence/onboardingIntelligenceCaseHandoff";

const farmA = onboardingIntelligenceCaseHandoff("farms-agriculture", "Farms & Agriculture");
const farmB = onboardingIntelligenceCaseHandoff("farms-agriculture", "Farms & Agriculture");
const capital = onboardingIntelligenceCaseHandoff("financing-capital", "Financing & Capital");
const enriched = onboardingIntelligenceCaseHandoff("programs-incentives", "Grants & State and Federal Programs", {
  caseId: "navigator-existing-case",
  displayName: "Navigator intelligence case",
  goal: "Evaluate acquisition pathways.",
  state: "PA",
  customerTypes: ["farmer"],
  intendedUses: ["farm acquisition"],
});

assert.equal(farmA.caseId, farmB.caseId, "same structured onboarding choice must produce the same case reference");
assert.notEqual(farmA.caseId, capital.caseId, "different onboarding categories must produce different case references");
assert.equal(enriched.caseId, "navigator-existing-case", "onboarding enrichment must preserve the existing case reference");
assert.equal(enriched.enrichmentMode, true);
assert.equal(enriched.source, "ONBOARDING_CASE_ENRICHMENT");
assert.match(enriched.href, /customerTypes=farmer%2Cprogram\+applicant/);
assert.match(enriched.href, /intendedUses=farm\+acquisition%2Cgrants%2Cincentives%2Cprogram\+stacking/);
assert.match(enriched.href, /state=PA/);
assert.equal(farmA.transcriptTransferred, false);
assert.equal(farmA.identityTransferred, false);
assert.equal(farmA.addressTransferred, false);
assert.equal(farmA.accountCreated, false);
assert.match(farmA.href, /^\/intelligence\/cases\/onboarding-/);
assert.match(farmA.href, /origin=onboarding/);

const onboardingPage = fs.readFileSync("src/app/(public)/onboarding/page.tsx", "utf8");
const casePage = fs.readFileSync("src/app/intelligence/cases/[caseId]/page.tsx", "utf8");
assert.match(onboardingPage, /Return to your enriched intelligence case/);
assert.match(onboardingPage, /ONBOARDING_CASE_ENRICHMENT|onboardingIntelligenceCaseHandoff/);
assert.match(onboardingPage, /No identity, address, transcript, listing URL, or hidden account is transferred/);
assert.match(casePage, /Enrich this case through onboarding/);
assert.match(casePage, /onboardingParams/);

console.log("✓ onboarding intelligence case creation and enrichment smoke test passed");
