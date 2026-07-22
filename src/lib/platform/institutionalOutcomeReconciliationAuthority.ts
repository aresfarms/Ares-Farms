import type { InstitutionalExecutionReceipt } from "@/lib/platform/institutionalExecutionReceiptAuthority";

export const INSTITUTIONAL_OUTCOME_RECONCILIATION_SCHEMA_VERSION = "institutional-outcome-reconciliation-v1";

export type ReconciliationState = "MATCHED" | "EXCEPTION_OPEN" | "REMEDIATION_PENDING" | "RESOLVED" | "ESCALATED";
export type ExceptionSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InstitutionalOutcomeReconciliation = Readonly<{
  reconciliationId: string;
  schemaVersion: typeof INSTITUTIONAL_OUTCOME_RECONCILIATION_SCHEMA_VERSION;
  governanceVersion: string;
  receiptId: string;
  claimId: string;
  actionType: InstitutionalExecutionReceipt["actionType"];
  state: ReconciliationState;
  severity: ExceptionSeverity;
  expectedOutcome: Readonly<Record<string, unknown>>;
  observedOutcome: Readonly<Record<string, unknown>>;
  mismatchFields: readonly string[];
  exceptionRef?: string | null;
  remediationRefs: readonly string[];
  reversalReceiptRef?: string | null;
  humanReviewRefs: readonly string[];
  reconciledAt: string;
  resolvedAt?: string | null;
  evidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty.`);
  return normalized;
}
function iso(value: string, field: string): string {
  if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);
  return value;
}
function list(values: readonly string[], field: string, required = false): readonly string[] {
  const normalized = values.map((value) => nonEmpty(value, field));
  if (required && !normalized.length) throw new Error(`${field} must contain at least one value.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized].sort());
}

export function reconcileInstitutionalOutcome(input: {
  reconciliationId: string;
  governanceVersion: string;
  receipt: InstitutionalExecutionReceipt;
  expectedOutcome: Record<string, unknown>;
  observedOutcome?: Record<string, unknown>;
  severity?: ExceptionSeverity;
  exceptionRef?: string | null;
  remediationRefs?: readonly string[];
  reversalReceiptRef?: string | null;
  humanReviewRefs?: readonly string[];
  reconciledAt: string;
  resolvedAt?: string | null;
  evidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}): InstitutionalOutcomeReconciliation {
  iso(input.reconciledAt, "reconciledAt");
  if (input.resolvedAt) {
    iso(input.resolvedAt, "resolvedAt");
    if (input.resolvedAt < input.reconciledAt) throw new Error("resolvedAt may not precede reconciledAt.");
  }
  const observedOutcome = input.observedOutcome ?? input.receipt.outcome;
  const fields = [...new Set([...Object.keys(input.expectedOutcome), ...Object.keys(observedOutcome)])].sort();
  const mismatchFields = fields.filter((field) => JSON.stringify(input.expectedOutcome[field]) !== JSON.stringify(observedOutcome[field]));
  const matched = mismatchFields.length === 0;
  const remediationRefs = list(input.remediationRefs ?? [], "remediationRefs");
  const humanReviewRefs = list(input.humanReviewRefs ?? [], "humanReviewRefs");
  const severity = matched ? "NONE" : input.severity ?? "MEDIUM";
  if (!matched && severity === "NONE") throw new Error("Outcome mismatches may not use NONE severity.");
  if (!matched && !input.exceptionRef?.trim()) throw new Error("Outcome mismatches require an exceptionRef.");
  if ((severity === "HIGH" || severity === "CRITICAL") && !humanReviewRefs.length) {
    throw new Error("High or critical exceptions require human review.");
  }
  if (input.resolvedAt && !remediationRefs.length && !input.reversalReceiptRef?.trim()) {
    throw new Error("Resolved exceptions require remediation or reversal evidence.");
  }
  let state: ReconciliationState = "MATCHED";
  if (!matched) state = input.resolvedAt ? "RESOLVED" : remediationRefs.length || input.reversalReceiptRef ? "REMEDIATION_PENDING" : "EXCEPTION_OPEN";
  if (!matched && severity === "CRITICAL" && !input.resolvedAt) state = "ESCALATED";

  return Object.freeze({
    reconciliationId: nonEmpty(input.reconciliationId, "reconciliationId"),
    schemaVersion: INSTITUTIONAL_OUTCOME_RECONCILIATION_SCHEMA_VERSION,
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"),
    receiptId: input.receipt.receiptId,
    claimId: input.receipt.claimId,
    actionType: input.receipt.actionType,
    state,
    severity,
    expectedOutcome: Object.freeze({ ...input.expectedOutcome }),
    observedOutcome: Object.freeze({ ...observedOutcome }),
    mismatchFields: Object.freeze(mismatchFields),
    exceptionRef: input.exceptionRef?.trim() || null,
    remediationRefs,
    reversalReceiptRef: input.reversalReceiptRef?.trim() || null,
    humanReviewRefs,
    reconciledAt: input.reconciledAt,
    resolvedAt: input.resolvedAt ?? null,
    evidenceRefs: list(input.evidenceRefs, "evidenceRefs", true),
    auditRefs: list(input.auditRefs, "auditRefs", true),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
    versionRefs: list(input.versionRefs, "versionRefs", true),
  });
}

export function validateInstitutionalOutcomeReconciliation(record: InstitutionalOutcomeReconciliation): void {
  if (record.schemaVersion !== INSTITUTIONAL_OUTCOME_RECONCILIATION_SCHEMA_VERSION) throw new Error("Unsupported institutional outcome reconciliation schema.");
  nonEmpty(record.reconciliationId, "reconciliationId");
  nonEmpty(record.receiptId, "receiptId");
  nonEmpty(record.claimId, "claimId");
  iso(record.reconciledAt, "reconciledAt");
  if (record.resolvedAt) iso(record.resolvedAt, "resolvedAt");
  list(record.evidenceRefs, "evidenceRefs", true);
  list(record.auditRefs, "auditRefs", true);
  list(record.versionRefs, "versionRefs", true);
  if (record.state === "MATCHED" && record.mismatchFields.length) throw new Error("Matched reconciliation may not contain mismatch fields.");
  if (record.state !== "MATCHED" && !record.exceptionRef) throw new Error("Exception reconciliation requires exceptionRef.");
}

export const institutionalOutcomeReconciliationAuthority = Object.freeze({
  reconcile: reconcileInstitutionalOutcome,
  validate: validateInstitutionalOutcomeReconciliation,
});
