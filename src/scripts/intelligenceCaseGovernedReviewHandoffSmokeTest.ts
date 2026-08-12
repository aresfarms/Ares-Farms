import assert from "node:assert/strict";
import fs from "node:fs";

const casePage = fs.readFileSync("src/app/intelligence/cases/[caseId]/page.tsx", "utf8");
const reviewPage = fs.readFileSync("src/app/governance/advanced-intelligence-v2/page.tsx", "utf8");

assert.match(casePage, /governedReviewParams/);
assert.match(casePage, /advanced-intelligence-v2\?\$\{governedReviewParams\.toString\(\)\}/);
assert.match(reviewPage, /applicationId: caseId/);
assert.match(reviewPage, /INTELLIGENCE_CASE_GOVERNED_REVIEW/);
assert.match(reviewPage, /Return to the same intelligence case/);
assert.match(reviewPage, /no Navigator transcript, identity, street address, or listing URL is transferred/i);
assert.match(reviewPage, /origin", "governed-review/);

console.log("✓ intelligence case governed review handoff smoke test passed");
