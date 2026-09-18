import type { InstitutionalActionEvaluation, InstitutionalActionType } from "@/lib/platform/institutionalActionAuthority";

export const INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION = "institutional-execution-receipt-v1";

export type InstitutionalExecutionStatus =
  | "PREPARED_NOT_EXECUTED"
  | "EXECUTED"
  | "FAILED"
  | "REVERSED"
  | "CANCELLED";

export type InstitutionalExecutionReceipt = Readonly<{
  receiptId: string;
  schemaVersion: typeof INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION;
  governanceVersion: string;
  claimId: string;
  actionPolicyId: string;
  actionType: InstitutionalActionType;
  actionReplayRef: string;
  status: InstitutionalExecutionStatus;
  idempotencyKey: string;
  executorRef: string;
  adapterRef?: string | null;
  externalReference?: string | null;
  preparedAt: string;
  executedAt?: string | null;
  completedAt?: string | null;
  outcome: Readonly<Record<string, unknown>>;
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
function list(values: readonly string[], field: string, required = true): readonly string[] {
  const normalized = values.map((value) => nonEmpty(value, field));
  if (required && !normalized.length) throw new Error(`${field} must contain at least one value.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized].sort());
}

export function createInstitutionalExecutionReceipt(input: {
  receiptId: string;
  governanceVersion: string;
  action: InstitutionalActionEvaluation;
  status: InstitutionalExecutionStatus;
  idempotencyKey: string;
  executorRef: string;
  adapterRef?: string | null;
  externalReference?: string | null;
  preparedAt: string;
  executedAt?: string | null;
  completedAt?: string | null;
  outcome?: Record<string, unknown>;
  evidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}): InstitutionalExecutionReceipt {
  if (input.action.decision !== "ALLOW") throw new Error("Only allowed institutional actions may produce execution receipts.");
  iso(input.preparedAt, "preparedAt");
  if (input.executedAt) iso(input.executedAt, "executedAt");
  if (input.completedAt) iso(input.completedAt, "completedAt");
  if (input.status === "PREPARED_NOT_EXECUTED" && (input.executedAt || input.externalReference)) {
    throw new Error("Prepared-not-executed receipts may not claim execution or an external reference.");
  }
  if (["EXECUTED", "FAILED", "REVERSED"].includes(input.status) && !input.executedAt) {
    throw new Error(`${input.status} receipts require executedAt.`);
  }
  if (input.executedAt && input.executedAt < input.preparedAt) throw new Error("executedAt may not precede preparedAt.");
  if (input.completedAt && input.executedAt && input.completedAt < input.executedAt) throw new Error("completedAt may not precede executedAt.");
  if (input.status === "EXECUTED" && !Object.keys(input.outcome ?? {}).length) throw new Error("Executed receipts require a recorded outcome.");

  return Object.freeze({
    receiptId: nonEmpty(input.receiptId, "receiptId"),
    schemaVersion: INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION,
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"),
    claimId: input.action.claimId,
    actionPolicyId: input.action.actionPolicyId,
    actionType: input.action.actionType,
    actionReplayRef: nonEmpty(input.action.replayRef, "action.replayRef"),
    status: input.status,
    idempotencyKey: nonEmpty(input.idempotencyKey, "idempotencyKey"),
    executorRef: nonEmpty(input.executorRef, "executorRef"),
    adapterRef: input.adapterRef?.trim() || null,
    externalReference: input.externalReference?.trim() || null,
    preparedAt: input.preparedAt,
    executedAt: input.executedAt ?? null,
    completedAt: input.completedAt ?? null,
    outcome: Object.freeze({ ...(input.outcome ?? {}) }),
    evidenceRefs: list(input.evidenceRefs, "evidenceRefs"),
    auditRefs: list(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"),
    versionRefs: list(input.versionRefs, "versionRefs"),
  });
}

export function createInstitutionalExecutionReceiptRegistry(receipts: readonly InstitutionalExecutionReceipt[]): Readonly<Record<string, InstitutionalExecutionReceipt>> {
  const byId: Record<string, InstitutionalExecutionReceipt> = {};
  const idempotency = new Set<string>();
  for (const receipt of [...receipts].sort((a, b) => a.receiptId.localeCompare(b.receiptId))) {
    validateInstitutionalExecutionReceipt(receipt);
    if (byId[receipt.receiptId]) throw new Error(`Duplicate execution receipt: ${receipt.receiptId}`);
    if (idempotency.has(receipt.idempotencyKey)) throw new Error(`Duplicate execution idempotency key: ${receipt.idempotencyKey}`);
    byId[receipt.receiptId] = receipt;
    idempotency.add(receipt.idempotencyKey);
  }
  return Object.freeze(byId);
}

export function validateInstitutionalExecutionReceipt(receipt: InstitutionalExecutionReceipt): void {
  if (receipt.schemaVersion !== INSTITUTIONAL_EXECUTION_RECEIPT_SCHEMA_VERSION) throw new Error("Unsupported institutional execution receipt schema.");
  nonEmpty(receipt.receiptId, "receiptId");
  nonEmpty(receipt.claimId, "claimId");
  nonEmpty(receipt.actionPolicyId, "actionPolicyId");
  nonEmpty(receipt.actionReplayRef, "actionReplayRef");
  nonEmpty(receipt.idempotencyKey, "idempotencyKey");
  nonEmpty(receipt.executorRef, "executorRef");
  iso(receipt.preparedAt, "preparedAt");
  if (receipt.executedAt) iso(receipt.executedAt, "executedAt");
  if (receipt.completedAt) iso(receipt.completedAt, "completedAt");
  list(receipt.evidenceRefs, "evidenceRefs");
  list(receipt.auditRefs, "auditRefs");
  list(receipt.versionRefs, "versionRefs");
  if (receipt.status === "PREPARED_NOT_EXECUTED" && (receipt.executedAt || receipt.externalReference)) throw new Error("Prepared receipt falsely claims execution.");
  if (["EXECUTED", "FAILED", "REVERSED"].includes(receipt.status) && !receipt.executedAt) throw new Error("Executed-state receipt is missing executedAt.");
}

export const institutionalExecutionReceiptAuthority = Object.freeze({
  create: createInstitutionalExecutionReceipt,
  createRegistry: createInstitutionalExecutionReceiptRegistry,
  validate: validateInstitutionalExecutionReceipt,
});
