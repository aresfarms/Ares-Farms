import assert from "node:assert/strict";
import fs from "node:fs";

import { onboardingIntelligenceCaseHandoff } from "@/lib/intelligence/onboardingIntelligenceCaseHandoff";

const farmA = onboardingIntelligenceCaseHandoff("farms-agriculture", "Farms & Agriculture");
const farmB = onboardingIntelligenceCaseHandoff("farms-agriculture", "Farms & Agriculture");
const capital = onboardingIntelligenceCaseHandoff("financing-capital", "Financing & Capital");

assert.equal(farmA.caseId, farmB.caseId, "same structured onboarding choice must produce the same case reference");
assert.notEqual(farmA.caseId, capital.caseId, "different onboarding categories must produce different case references");
assert.equal(farmA.transcriptTransferred, false);
assert.equal(farmA.identityTransferred, false);
assert.equal(farmA.addressTransferred, false);
assert.equal(farmA.accountCreated, false);
assert.match(farmA.href, /^\/intelligence\/cases\/onboarding-/);
assert.match(farmA.href, /origin=onboarding/);

const page = fs.readFileSync("src/app/(public)/onboarding/page.tsx", "utf8");
assert.match(page, /Open your intelligence case/);
assert.match(page, /onboardingIntelligenceCaseHandoff/);
assert.match(page, /No identity, address, transcript, listing URL, or hidden account is transferred/);

console.log("✓ onboarding intelligence case handoff smoke test passed");
