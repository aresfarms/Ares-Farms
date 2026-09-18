import { reconcileInstitutionalOutcome, validateInstitutionalOutcomeReconciliation, INSTITUTIONAL_OUTCOME_RECONCILIATION_SCHEMA_VERSION } from "@/lib/platform/institutionalOutcomeReconciliationAuthority";
import type { InstitutionalExecutionReceipt } from "@/lib/platform/institutionalExecutionReceiptAuthority";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectFailure(operation: () => unknown, expected: string): void {
  try { operation(); } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`);
    return;
  }
  throw new Error(`Expected operation to fail: ${expected}`);
}

const receipt = Object.freeze({
  receiptId: "receipt:workflow:verification", schemaVersion: "institutional-execution-receipt-v1",
  governanceVersion: "master-volume-series-2026-07", claimId: "claim:verification",
  actionPolicyId: "policy:action:verification", actionType: "WORKFLOW_TRANSITION",
  actionReplayRef: "replay:action:verification", status: "EXECUTED", idempotencyKey: "idem:verification",
  executorRef: "operator:verification", adapterRef: null, externalReference: null,
  preparedAt: "2026-07-22T06:00:00.000Z", executedAt: "2026-07-22T06:01:00.000Z",
  completedAt: "2026-07-22T06:02:00.000Z", outcome: Object.freeze({ state: "REVIEW_READY" }),
  evidenceRefs: Object.freeze(["evidence:execution"]), auditRefs: Object.freeze(["audit:execution"]),
  replayRef: "replay:execution", versionRefs: Object.freeze(["version:execution"]),
}) satisfies InstitutionalExecutionReceipt;

const base = {
  reconciliationId: "reconciliation:verification", governanceVersion: "master-volume-series-2026-07", receipt,
  expectedOutcome: { state: "REVIEW_READY" }, reconciledAt: "2026-07-22T06:03:00.000Z",
  evidenceRefs: ["evidence:reconciliation"], auditRefs: ["audit:reconciliation"],
  replayRef: "replay:reconciliation", versionRefs: ["version:reconciliation"],
};
const matched = reconcileInstitutionalOutcome(base);
validateInstitutionalOutcomeReconciliation(matched);
assert(matched.state === "MATCHED" && matched.severity === "NONE", "Matching outcome should close cleanly.");
const exception = reconcileInstitutionalOutcome({ ...base, reconciliationId: "reconciliation:exception", observedOutcome: { state: "FAILED" }, severity: "HIGH", exceptionRef: "exception:verification", humanReviewRefs: ["review:verification"] });
assert(exception.state === "EXCEPTION_OPEN" && exception.mismatchFields.includes("state"), "Mismatch should open an exception.");
expectFailure(() => reconcileInstitutionalOutcome({ ...base, observedOutcome: { state: "FAILED" } }), "exceptionRef");
expectFailure(() => reconcileInstitutionalOutcome({ ...base, observedOutcome: { state: "FAILED" }, severity: "CRITICAL", exceptionRef: "exception:critical" }), "human review");
console.log(JSON.stringify({ ok: true, schemaVersion: INSTITUTIONAL_OUTCOME_RECONCILIATION_SCHEMA_VERSION, matched: matched.state, exception: exception.state, message: "Institutional outcome reconciliation authority conformance passed." }, null, 2));
