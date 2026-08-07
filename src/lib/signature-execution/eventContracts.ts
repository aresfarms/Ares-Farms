export const SIGNATURE_EXECUTION_EVENT_TYPES = [
  "signature.execution.created", "signature.document.sealed", "signature.document.analysis.completed",
  "signature.placement.planned", "signature.authority.recorded", "signature.authority.revoked",
  "signature.disclosure.presented", "signature.consent.recorded", "signature.consent.withdrawn",
  "signature.intent.recorded", "signature.review.completed", "signature.review.changes_requested",
  "signature.authorization.created", "signature.authorization.revoked", "signature.command.queued",
  "signature.command.dispatched", "signature.capture.recorded", "signature.finalization.started",
  "signature.pdf.finalized", "signature.validation.completed", "signature.execution.completed",
  "signature.execution.failed", "signature.execution.unknown", "signature.reconciliation.required",
  "signature.reconciliation.decided", "signature.delivery.pending", "signature.delivery.proven",
  "signature.acknowledgment.recorded",
] as const;
