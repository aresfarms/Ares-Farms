import {
  runRuntimeGuard,
  type RuntimeGuardFinding,
  type RuntimeGuardResult,
} from "@/lib/runtime/runtimeGuard";
import { TREASURY_RESERVE_TYPES } from "@/db/schema";

/**
 * TreasuryGovernanceGuard (REG-TREASURY-001 / CANON-TREASURY-001)
 *
 * The runtime governance layer for every material treasury operation. It composes
 * the canonical runtime guard and adds the treasury-specific invariants the
 * Master Volumes require BEFORE any treasury write is allowed.
 *
 * Master Volume Governance:
 * - Vol II (REG-TREASURY-001): no capital moved outside governed controls;
 *   separation of powers (approver ≠ executor); revenue classification.
 * - Vol V (CANON-TREASURY-001 §2): immutable append-only ledger — a correction
 *   is a NEW event referencing the prior one (correctsEventId + rationale +
 *   approving actor), never an in-place overwrite.
 * - Vol V (§3): reserve-floor breach requires a TreasuryApproval.
 * - Vol V (§6 / CANON-CLASS-001 §4): classification floors — treasury min
 *   CONFIDENTIAL; compensation/reserve/dispute RESTRICTED; continuity/sovereign
 *   SOVEREIGN.
 * - Vol V (§9): cross-industry treasury transfers require a TreasuryApproval.
 *
 * SPINE GATE: while the spine carries no live payment capture, any operation
 * flagged `livePaymentCapture` is BLOCKED — live money waits on the founders +
 * counsel session + treasury replay-certification (membership economics shelved).
 */

export const TREASURY_GUARD_MODULE = "treasury-governance-runtime";

export type TreasuryOperation =
  | "record_revenue_event"
  | "record_compensation_event"
  | "record_expense_event"
  | "record_distribution_event"
  | "record_allocation"
  | "designate_reserve"
  | "append_ledger_entry"
  | "record_approval"
  | "open_dispute"
  | "correction";

/** Classification floor per treasury record family (CANON-CLASS-001 §4). */
const RESTRICTED_OPERATIONS = new Set<TreasuryOperation>([
  "record_compensation_event",
  "record_distribution_event",
  "designate_reserve",
  "record_approval",
  "open_dispute",
]);

const CLASSIFICATION_RANK: Record<string, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
  SOVEREIGN: 4,
};

export type TreasuryGuardInput = {
  operation: TreasuryOperation;
  actorId?: string | null;
  executorActor?: string | null;
  approverActor?: string | null;
  approvalId?: string | null;
  classificationLevel?: string | null;
  governanceVersion?: string | null;
  replayRef?: string | null;
  traceId?: string | null;
  /** Reserve-floor context: if the projected level would drop below the floor. */
  reserveType?: string | null;
  reserveFloor?: number | null;
  projectedReserveLevel?: number | null;
  /** Correction lineage (append-only): required when operation = "correction". */
  correctsEventId?: string | null;
  correctionRationale?: string | null;
  /** Cross-industry transfer requires a TreasuryApproval (§9). */
  crossIndustryTransfer?: boolean;
  /** SPINE GATE: live payment capture is not permitted in the spine. */
  livePaymentCapture?: boolean;
  metadata?: Record<string, unknown>;
};

export type TreasuryGuardResult = {
  allowed: boolean;
  operation: TreasuryOperation;
  findings: RuntimeGuardFinding[];
  runtime: RuntimeGuardResult;
  requiredClassificationFloor: string;
  timestamp: string;
};

function classificationFloorFor(operation: TreasuryOperation): string {
  return RESTRICTED_OPERATIONS.has(operation) ? "RESTRICTED" : "CONFIDENTIAL";
}

export function evaluateTreasuryOperation(
  input: TreasuryGuardInput
): TreasuryGuardResult {
  const runtime = runRuntimeGuard({
    operation: input.operation,
    module: TREASURY_GUARD_MODULE,
    actorId: input.actorId,
    governanceVersion: input.governanceVersion,
    classificationLevel: input.classificationLevel,
    replayRef: input.replayRef,
    traceId: input.traceId,
    metadata: input.metadata,
  });

  const findings: RuntimeGuardFinding[] = [...runtime.findings];
  const floor = classificationFloorFor(input.operation);

  // SPINE GATE — live payment capture is blocked until the treasury spine is
  // replay-certified and the founders + counsel session unlocks live billing.
  if (input.livePaymentCapture) {
    findings.push({
      domain: "constitutional",
      severity: "BLOCK",
      code: "LIVE_PAYMENT_CAPTURE_GATED",
      message:
        "Live payment capture is not permitted in the treasury spine. Live billing is gated to the founders + counsel session + replay certification.",
    });
  }

  // Append-only ledger — a correction must reference the prior event + rationale
  // + approving actor; treasury truth is never silently overwritten.
  if (input.operation === "correction") {
    if (!input.correctsEventId || !input.correctionRationale) {
      findings.push({
        domain: "replay",
        severity: "BLOCK",
        code: "CORRECTION_LINEAGE_MISSING",
        message:
          "A treasury correction must reference the prior event (correctsEventId) and a correction rationale; financial truth is append-only.",
      });
    }
    if (!input.approverActor && !input.approvalId) {
      findings.push({
        domain: "constitutional",
        severity: "BLOCK",
        code: "CORRECTION_APPROVAL_MISSING",
        message: "A treasury correction requires an approving actor or approval id.",
      });
    }
  }

  // Reserve-floor breach requires a TreasuryApproval (§3).
  if (
    typeof input.reserveFloor === "number" &&
    typeof input.projectedReserveLevel === "number" &&
    input.projectedReserveLevel < input.reserveFloor &&
    !input.approvalId
  ) {
    findings.push({
      domain: "constitutional",
      severity: "BLOCK",
      code: "RESERVE_FLOOR_BREACH_UNAPPROVED",
      message:
        "Operation would breach a reserve floor without a TreasuryApproval. A governed approval is required before execution.",
    });
  }

  // Reserve type must be one of the six canonical types.
  if (
    input.reserveType &&
    !TREASURY_RESERVE_TYPES.includes(input.reserveType as never)
  ) {
    findings.push({
      domain: "schema",
      severity: "BLOCK",
      code: "UNKNOWN_RESERVE_TYPE",
      message: `Reserve type "${input.reserveType}" is not one of the six canonical reserve types.`,
    });
  }

  // Separation of powers — an approver may not also be the executor (§6).
  if (
    input.approverActor &&
    input.executorActor &&
    input.approverActor === input.executorActor
  ) {
    findings.push({
      domain: "constitutional",
      severity: "BLOCK",
      code: "SEPARATION_OF_POWERS_VIOLATION",
      message:
        "The approving actor may not also be the executing actor. Treasury separation of powers requires distinct approve/execute roles.",
    });
  }

  // Cross-industry transfer requires an approval (§9).
  if (input.crossIndustryTransfer && !input.approvalId) {
    findings.push({
      domain: "constitutional",
      severity: "BLOCK",
      code: "CROSS_INDUSTRY_TRANSFER_UNAPPROVED",
      message:
        "Cross-industry treasury transfers require a TreasuryApproval before execution.",
    });
  }

  // Classification floor.
  const provided = (input.classificationLevel ?? "").trim().toUpperCase();
  if (provided) {
    const rank = CLASSIFICATION_RANK[provided];
    const floorRank = CLASSIFICATION_RANK[floor];
    if (rank === undefined) {
      findings.push({
        domain: "classification",
        severity: "WARN",
        code: "UNKNOWN_CLASSIFICATION",
        message: `Classification "${provided}" is not recognized.`,
      });
    } else if (rank < floorRank) {
      findings.push({
        domain: "classification",
        severity: "BLOCK",
        code: "CLASSIFICATION_BELOW_FLOOR",
        message: `Operation "${input.operation}" requires at least ${floor}; got ${provided}.`,
      });
    }
  }

  const blocked = findings.some((f) => f.severity === "BLOCK");

  return {
    allowed: !blocked,
    operation: input.operation,
    findings,
    runtime,
    requiredClassificationFloor: floor,
    timestamp: new Date().toISOString(),
  };
}

export function assertTreasuryOperationAllowed(
  input: TreasuryGuardInput
): TreasuryGuardResult {
  const result = evaluateTreasuryOperation(input);
  if (!result.allowed) {
    const codes = result.findings
      .filter((f) => f.severity === "BLOCK")
      .map((f) => f.code)
      .join(", ");
    throw new Error(
      `TreasuryGovernanceGuard blocked "${input.operation}": ${codes}`
    );
  }
  return result;
}
