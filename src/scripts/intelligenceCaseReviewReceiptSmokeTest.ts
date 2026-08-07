import assert from "node:assert/strict";

import { composeIntelligenceCaseWorkspace } from "@/lib/intelligence/intelligenceCaseWorkspaceRuntime";

const queued = composeIntelligenceCaseWorkspace({
  caseId: "case-review-receipt",
  reviewReceipt: {
    reviewId: "review-123",
    status: "QUEUED",
    outcome: "REVIEW_REQUIRED",
    finalActionAllowed: null,
  },
});
assert.equal(queued.outcome.status, "IN_PROGRESS");
assert.deepEqual(queued.outcome.evidenceRefs, ["review-123"]);
assert.equal(queued.outcome.recommendationAdopted, null);

const approved = composeIntelligenceCaseWorkspace({
  caseId: "case-review-receipt",
  reviewReceipt: {
    reviewId: "review-123",
    status: "COMPLETED",
    outcome: "APPROVE",
    finalActionAllowed: true,
  },
});
assert.equal(approved.outcome.status, "IN_PROGRESS");
assert.equal(approved.outcome.recommendationAdopted, true);
assert.match(
  approved.outcome.varianceNotes.join(" "),
  /not itself a final decision/,
);

const denied = composeIntelligenceCaseWorkspace({
  caseId: "case-review-receipt",
  reviewReceipt: {
    reviewId: "review-456",
    status: "COMPLETED",
    outcome: "DENY",
    finalActionAllowed: false,
  },
});
assert.equal(denied.outcome.recommendationAdopted, false);
assert.match(denied.outcome.varianceNotes.join(" "), /remains held/);

console.log("✓ intelligence case review receipt smoke test passed");
