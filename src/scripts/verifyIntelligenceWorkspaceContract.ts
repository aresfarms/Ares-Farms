import assert from "node:assert/strict";
import {
  assertRecommendationEvidenceBoundary,
  sourceMaySupportIndividualRecommendation,
  type IntelligenceEvidenceRef,
} from "../lib/intelligence/intelligenceWorkspaceContract";

assert.equal(sourceMaySupportIndividualRecommendation("PUBLIC_FACT"), true);
assert.equal(sourceMaySupportIndividualRecommendation("CUSTOMER_PROVIDED"), true);
assert.equal(sourceMaySupportIndividualRecommendation("LICENSED_RECOMMENDATION_INPUT"), true);
assert.equal(sourceMaySupportIndividualRecommendation("INTERNAL_GOVERNED"), true);
assert.equal(sourceMaySupportIndividualRecommendation("LICENSED_DISPLAY_ONLY"), false);
assert.equal(sourceMaySupportIndividualRecommendation("LICENSED_ANALYTICS_AGGREGATE_ONLY"), false);

const base: IntelligenceEvidenceRef = {
  evidenceId: "ev-1",
  label: "Evidence",
  state: "VERIFIED",
  sourceId: "source-1",
  sourceAuthority: "authority",
  sourceUseBoundary: "PUBLIC_FACT",
  observedAt: null,
  retrievedAt: new Date(0).toISOString(),
  geography: null,
  confidence: 1,
  conflictRefs: [],
  traceId: "trace-1",
};

assert.doesNotThrow(() => assertRecommendationEvidenceBoundary([base]));
assert.throws(
  () => assertRecommendationEvidenceBoundary([{ ...base, evidenceId: "listing-1", sourceUseBoundary: "LICENSED_DISPLAY_ONLY" }]),
  /exceeds licensed-use boundary/,
);

console.log("verify:intelligence-workspace PASS - workspace contract and source-license boundary fail closed.");
