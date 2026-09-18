export const LENDER_SUBMISSION_DOCTRINE = {
  canonicalId: "CANON-LENDER-SUBMISSION-001",
  technicalId: "TECH-LENDER-DELIVERY-001",
  operationsId: "OPS-LENDER-SUBMISSION-001",
  version: "lender-submission-governance-v1.0.0",
  productionDeliveryBlocked: true,
  maxDeliveryAttempts: 5,
  supportedAdapter: "sandbox-v1",
} as const;

export const LENDER_SUBMISSION_STATES = [
  "DRAFT", "BUILDING", "VALIDATION_FAILED", "READY_FOR_REVIEW",
  "CHANGES_REQUESTED", "AWAITING_CUSTOMER_CONSENT", "CONSENTED",
  "AWAITING_RECIPIENT_VERIFICATION", "AUTHORIZED_FOR_DISPATCH",
  "DISPATCHING", "PROVIDER_ACCEPTED", "DELIVERED", "ACKNOWLEDGED",
  "DELIVERY_UNKNOWN", "RECONCILIATION_REQUIRED", "FAILED", "REVOKED",
  "EXPIRED", "CANCELLED", "CLOSED",
] as const;

export type LenderSubmissionState = (typeof LENDER_SUBMISSION_STATES)[number];

export const DELIVERY_TRUTH_STATUSES = [
  "ATTEMPTED", "PROVIDER_ACCEPTED", "DELIVERED", "ACKNOWLEDGED", "FAILED", "UNKNOWN",
] as const;
export type DeliveryTruthStatus = (typeof DELIVERY_TRUTH_STATUSES)[number];

const transitions: Record<LenderSubmissionState, readonly LenderSubmissionState[]> = {
  DRAFT: ["BUILDING", "CANCELLED"],
  BUILDING: ["VALIDATION_FAILED", "READY_FOR_REVIEW", "CANCELLED"],
  VALIDATION_FAILED: ["BUILDING", "CANCELLED"],
  READY_FOR_REVIEW: ["CHANGES_REQUESTED", "AWAITING_CUSTOMER_CONSENT", "CANCELLED"],
  CHANGES_REQUESTED: ["BUILDING", "CANCELLED"],
  AWAITING_CUSTOMER_CONSENT: ["CONSENTED", "CHANGES_REQUESTED", "EXPIRED", "CANCELLED"],
  CONSENTED: ["AWAITING_RECIPIENT_VERIFICATION", "REVOKED", "EXPIRED", "CANCELLED"],
  AWAITING_RECIPIENT_VERIFICATION: ["AUTHORIZED_FOR_DISPATCH", "REVOKED", "EXPIRED", "CANCELLED"],
  AUTHORIZED_FOR_DISPATCH: ["DISPATCHING", "REVOKED", "EXPIRED", "CANCELLED"],
  DISPATCHING: ["PROVIDER_ACCEPTED", "DELIVERED", "DELIVERY_UNKNOWN", "FAILED"],
  PROVIDER_ACCEPTED: ["DELIVERED", "ACKNOWLEDGED", "DELIVERY_UNKNOWN", "FAILED"],
  DELIVERED: ["ACKNOWLEDGED", "DELIVERY_UNKNOWN", "CLOSED"],
  ACKNOWLEDGED: ["CLOSED"],
  DELIVERY_UNKNOWN: ["RECONCILIATION_REQUIRED"],
  RECONCILIATION_REQUIRED: ["PROVIDER_ACCEPTED", "DELIVERED", "ACKNOWLEDGED", "FAILED"],
  FAILED: ["AUTHORIZED_FOR_DISPATCH", "CANCELLED", "CLOSED"],
  REVOKED: ["AWAITING_CUSTOMER_CONSENT", "CANCELLED", "CLOSED"],
  EXPIRED: ["AWAITING_CUSTOMER_CONSENT", "CANCELLED", "CLOSED"],
  CANCELLED: ["CLOSED"],
  CLOSED: [],
};

export function canTransition(from: LenderSubmissionState, to: LenderSubmissionState): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: LenderSubmissionState, to: LenderSubmissionState): void {
  if (!canTransition(from, to)) throw new Error(`Invalid lender submission transition: ${from} -> ${to}`);
}

export const LENDER_DISCLOSURE_TEXT =
  "I authorize Furlong to send this exact package to the named lender and verified recipient for the stated financing-review purpose. This authorization is limited to the listed data categories and channel, expires as shown, and may be revoked before dispatch. Submission is not approval, underwriting, a credit decision, or a lender commitment.";
export const LENDER_DISCLOSURE_VERSION = "lender-package-sharing-v1";
