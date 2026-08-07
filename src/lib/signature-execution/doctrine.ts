export const SIGNATURE_EXECUTION_DOCTRINE = {
  volumeId: "FURLONG-VOL-VII-EXTACTION-EXEC-MASTER",
  canonicalId: "CANON-SIGNATURE-EXECUTION-001",
  technicalId: "TECH-PDF-EXECUTION-001",
  operationsId: "OPS-SIGNATURE-EXECUTION-001",
  buildId: "BUILD-EXTACTION-EXEC-001",
  verificationId: "VERIFY-EXTACTION-EXEC-001",
  version: "signature-execution-v1.0.0",
  liveSigningBlocked: true,
  mockAdapterId: "signature-mock-v1",
  appendedPageTemplateVersion: "furlong-execution-page-v1",
  maxAttempts: 5,
} as const;

export const SIGNATURE_EXECUTION_STATES = [
  "DRAFT", "PREPARING", "VALIDATION_FAILED", "READY_FOR_REVIEW", "CHANGES_REQUESTED",
  "AWAITING_SIGNER_AUTHORITY", "AWAITING_INTENT", "AUTHORIZED_FOR_SIGNATURE", "SIGNING",
  "SIGNATURE_CAPTURED", "FINALIZING", "VALIDATING", "EXECUTED", "DELIVERY_PENDING",
  "DELIVERED", "ACKNOWLEDGED", "EXECUTION_UNKNOWN", "DELIVERY_UNKNOWN",
  "RECONCILIATION_REQUIRED", "FAILED", "BLOCKED", "DECLINED", "REVOKED", "EXPIRED",
  "CANCELLED", "VOIDED", "CLOSED", "SUPERSEDED",
] as const;
export type SignatureExecutionState = (typeof SIGNATURE_EXECUTION_STATES)[number];

const transitions: Record<SignatureExecutionState, readonly SignatureExecutionState[]> = {
  DRAFT: ["PREPARING", "CANCELLED"], PREPARING: ["VALIDATION_FAILED", "READY_FOR_REVIEW"],
  VALIDATION_FAILED: ["PREPARING", "CANCELLED"], READY_FOR_REVIEW: ["CHANGES_REQUESTED", "AWAITING_SIGNER_AUTHORITY"],
  CHANGES_REQUESTED: ["PREPARING", "CANCELLED"], AWAITING_SIGNER_AUTHORITY: ["AWAITING_INTENT", "BLOCKED"],
  AWAITING_INTENT: ["AUTHORIZED_FOR_SIGNATURE", "DECLINED", "EXPIRED"], AUTHORIZED_FOR_SIGNATURE: ["SIGNING", "REVOKED", "EXPIRED"],
  SIGNING: ["SIGNATURE_CAPTURED", "EXECUTION_UNKNOWN", "FAILED"], SIGNATURE_CAPTURED: ["FINALIZING", "EXECUTION_UNKNOWN"],
  FINALIZING: ["VALIDATING", "FAILED"], VALIDATING: ["EXECUTED", "RECONCILIATION_REQUIRED", "FAILED"],
  EXECUTED: ["DELIVERY_PENDING", "SUPERSEDED", "VOIDED"], DELIVERY_PENDING: ["DELIVERED", "DELIVERY_UNKNOWN", "FAILED"],
  DELIVERED: ["ACKNOWLEDGED", "CLOSED"], ACKNOWLEDGED: ["CLOSED"], EXECUTION_UNKNOWN: ["RECONCILIATION_REQUIRED"],
  DELIVERY_UNKNOWN: ["RECONCILIATION_REQUIRED"], RECONCILIATION_REQUIRED: ["EXECUTED", "DELIVERED", "FAILED", "VOIDED"],
  FAILED: [], BLOCKED: [], DECLINED: [], REVOKED: [], EXPIRED: [], CANCELLED: [], VOIDED: [], CLOSED: [], SUPERSEDED: [],
};

export function canTransitionSignature(from: SignatureExecutionState, to: SignatureExecutionState): boolean {
  return transitions[from].includes(to);
}
export function assertSignatureTransition(from: SignatureExecutionState, to: SignatureExecutionState): void {
  if (!canTransitionSignature(from, to)) throw new Error(`Invalid signature execution transition: ${from} -> ${to}`);
}

export const SIGNATURE_EPROCESS_DISCLOSURE_VERSION = "signature-eprocess-disclosure-v1-draft-counsel-blocked";
export const SIGNATURE_EPROCESS_DISCLOSURE =
  "I agree to use an electronic process for this identified document. I have reviewed the exact document presented, can access and retain it, understand how to request paper where available, and understand that electronic-process consent is separate from my intent to sign.";
export const SIGNATURE_INTENT_STATEMENT =
  "By taking this affirmative action, I intend to sign the exact document identified by its SHA-256 fingerprint in the capacity shown. I understand that this action does not change the document and that execution is not final until Furlong validates and seals one executed PDF.";
