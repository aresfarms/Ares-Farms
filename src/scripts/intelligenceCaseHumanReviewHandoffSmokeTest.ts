import assert from "node:assert/strict";
import fs from "node:fs";

const casePage = fs.readFileSync("src/app/intelligence/cases/[caseId]/page.tsx", "utf8");
const reviewPage = fs.readFileSync("src/app/reviews/page.tsx", "utf8");

assert.match(casePage, /humanReviewParams/);
assert.match(casePage, /Open human review/);
assert.match(reviewPage, /case-human-review-handoff/);
assert.match(reviewPage, /Return to the same intelligence case/);
assert.match(reviewPage, /no Navigator transcript, identity, street address, or listing URL is transferred/i);
assert.match(reviewPage, /origin: "human-review"/);

console.log("✓ intelligence case human review handoff smoke test passed");
