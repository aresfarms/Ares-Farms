import { INSTITUTIONAL_ACTION_SCHEMA_VERSION } from "@/lib/platform/institutionalActionAuthority";
import type { InstitutionalActionEvaluation } from "@/lib/platform/institutionalActionAuthority";
import {
  INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION,
  createInstitutionalExecutionReceipt,
  createInstitutionalExecutionReceiptRegistry,
} from "@/lib/platform/institutionalExecutionReceiptAuthority";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectFailure(operation: () => unknown, expected: string): void {
  try { operation(); } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `Expected failure containing: ${expected}`);
    return;
  }
  throw new Error(`Expected operation to fail: ${expected}`);
}

const at = "2026-07-22T06:00:00.000Z";
const action: InstitutionalActionEvaluation = Object.freeze({
  schemaVersion: INSTITUTIONAL_ACTION_SCHEMA_VERSION,
  reliancePolicyId: "reliance:internal",
  claimId: "claim:verification",
  actionPolicyId: "action:internal",
  actionType: "WORKFLOW_TRANSITION",
  decision: "ALLOW",
  reasons: Object.freeze([]),
  evaluatedAt: at,
  approvalRefs: Object.freeze(["approval:operator"]),
  evidenceRefs: Object.freeze(["evidence:workflow"]),
  auditRefs: Object.freeze(["audit:action"]),
  replayRef: "replay:action",
});

const prepared = createInstitutionalExecutionReceipt({
  receiptId: "receipt:prepared", governanceVersion: "master-volume-series-2026-07", action,
  status: "PREPARED_NOT_EXECUTED", idempotencyKey: "idem:prepared", executorRef: "runtime:verification",
  preparedAt: at, outcome: { posture: "prepared-only" }, evidenceRefs: ["evidence:receipt"],
  auditRefs: ["audit:receipt"], replayRef: "replay:receipt:prepared", versionRefs: ["version:receipt:prepared"],
});
const executed = createInstitutionalExecutionReceipt({
  receiptId: "receipt:executed", governanceVersion: "master-volume-series-2026-07", action,
  status: "EXECUTED", idempotencyKey: "idem:executed", executorRef: "runtime:verification",
  preparedAt: at, executedAt: at, completedAt: at, outcome: { transitioned: true },
  evidenceRefs: ["evidence:receipt"], auditRefs: ["audit:receipt"], replayRef: "replay:receipt:executed",
  versionRefs: ["version:receipt:executed"],
});
const registry = createInstitutionalExecutionReceiptRegistry([executed, prepared]);
assert(prepared.schemaVersion === INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION, "Schema version drifted.");
assert(Object.isFrozen(prepared) && Object.isFrozen(prepared.outcome), "Receipt must be immutable.");
assert(Object.keys(registry).join(",") === "receipt:executed,receipt:prepared", "Registry must be deterministic.");
expectFailure(() => createInstitutionalExecutionReceipt({ receiptId: "receipt:invalid", governanceVersion: "master-volume-series-2026-07", action, status: "EXECUTED", idempotencyKey: "idem:invalid", executorRef: "runtime:verification", preparedAt: at, executedAt: null, outcome: {}, evidenceRefs: ["evidence:receipt"], auditRefs: ["audit:receipt"], replayRef: "replay:receipt:invalid", versionRefs: ["version:receipt:invalid"] }), "require executedAt");
expectFailure(() => createInstitutionalExecutionReceiptRegistry([prepared, { ...executed, idempotencyKey: prepared.idempotencyKey }]), "Duplicate execution idempotency key");
console.log(JSON.stringify({ ok: true, schemaVersion: INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION, receipts: Object.keys(registry).length, message: "Institutional execution receipt authority conformance passed." }, null, 2));
