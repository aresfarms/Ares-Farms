export const SIGNATURE_BLOCKER_CODES = [
  "SIG_DOC_HASH_MISMATCH", "SIG_DOC_UNSUPPORTED", "SIG_EXISTING_SIGNATURE_CONFLICT",
  "SIG_ZONE_MISSING", "SIG_ZONE_AMBIGUOUS", "SIG_PLACEMENT_COLLISION", "SIG_AUTHN_INSUFFICIENT",
  "SIG_AUTHORITY_MISSING", "SIG_AUTHORITY_EXPIRED_REVOKED", "SIG_DISCLOSURE_MISSING_STALE",
  "SIG_INTENT_MISSING_STALE", "SIG_OVERLAY_UNAPPROVED", "SIG_HUMAN_REVIEW_REQUIRED",
  "SIG_PROVIDER_UNCERTIFIED", "SIG_CLASSIFICATION_DENIED", "SIG_LEDGER_REPLAY_UNAVAILABLE",
  "SIG_PROMOTION_INACTIVE", "SIG_OUTCOME_UNKNOWN", "SIG_VALIDATION_FAILED", "SIG_DELIVERY_NOT_PROVEN",
] as const;
export type SignatureBlockerCode = (typeof SIGNATURE_BLOCKER_CODES)[number];

export const SIGNATURE_BLOCKER_MEANINGS: Record<SignatureBlockerCode, string> = {
  SIG_DOC_HASH_MISMATCH: "Presented/current bytes differ from the sealed source.",
  SIG_DOC_UNSUPPORTED: "PDF structure, encryption, action, form, or signature profile is unsupported.",
  SIG_EXISTING_SIGNATURE_CONFLICT: "Finalization may invalidate an existing signature or certification.",
  SIG_ZONE_MISSING: "Certified authored signature zone was not found.", SIG_ZONE_AMBIGUOUS: "More than one zone or signer-role mapping exists.",
  SIG_PLACEMENT_COLLISION: "Appearance or margin treatment would overlap protected content.", SIG_AUTHN_INSUFFICIENT: "Signer authentication is below the required level.",
  SIG_AUTHORITY_MISSING: "Capacity or represented-party authority is not proven.", SIG_AUTHORITY_EXPIRED_REVOKED: "Authority is invalid at execution.",
  SIG_DISCLOSURE_MISSING_STALE: "Electronic-process disclosure is missing, stale, or withdrawn.", SIG_INTENT_MISSING_STALE: "Affirmative intent is absent or bound to different bytes or capacity.",
  SIG_OVERLAY_UNAPPROVED: "No counsel-approved transaction/jurisdiction basis exists.", SIG_HUMAN_REVIEW_REQUIRED: "Required exact-version human review is absent or stale.",
  SIG_PROVIDER_UNCERTIFIED: "Adapter, tenant, region, key, clock, or webhook posture is uncertified.", SIG_CLASSIFICATION_DENIED: "Classification, residency, minimum-necessary, retention, or export rule fails.",
  SIG_LEDGER_REPLAY_UNAVAILABLE: "Audit append, chain, outbox, or replay facility is unhealthy.", SIG_PROMOTION_INACTIVE: "No active scoped production promotion exists.",
  SIG_OUTCOME_UNKNOWN: "A provider or finalization side effect cannot be proven.", SIG_VALIDATION_FAILED: "Final PDF structure, hash, render, signature, or evidence validation failed.",
  SIG_DELIVERY_NOT_PROVEN: "Executed artifact exists but delivery evidence is insufficient.",
};
