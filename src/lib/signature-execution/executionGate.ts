import type { SignatureBlockerCode } from "./blockers";

export type ExecutionGateFacts = {
  documentIntegrity: boolean; transactionOverlayApproved: boolean; identityVerified: boolean;
  authorityValid: boolean; disclosureValid: boolean; intentValid: boolean; placementValid: boolean;
  humanReviewValid: boolean; providerCertified: boolean; classificationAllowed: boolean;
  idempotencyHealthy: boolean; replayHealthy: boolean; promotionActive: boolean;
};

const checks: readonly [keyof ExecutionGateFacts, SignatureBlockerCode][] = [
  ["documentIntegrity", "SIG_DOC_HASH_MISMATCH"], ["transactionOverlayApproved", "SIG_OVERLAY_UNAPPROVED"],
  ["identityVerified", "SIG_AUTHN_INSUFFICIENT"], ["authorityValid", "SIG_AUTHORITY_MISSING"],
  ["disclosureValid", "SIG_DISCLOSURE_MISSING_STALE"], ["intentValid", "SIG_INTENT_MISSING_STALE"],
  ["placementValid", "SIG_PLACEMENT_COLLISION"], ["humanReviewValid", "SIG_HUMAN_REVIEW_REQUIRED"],
  ["providerCertified", "SIG_PROVIDER_UNCERTIFIED"], ["classificationAllowed", "SIG_CLASSIFICATION_DENIED"],
  ["idempotencyHealthy", "SIG_LEDGER_REPLAY_UNAVAILABLE"], ["replayHealthy", "SIG_LEDGER_REPLAY_UNAVAILABLE"],
  ["promotionActive", "SIG_PROMOTION_INACTIVE"],
];

export function evaluateExecutionGate(facts: ExecutionGateFacts) {
  const blockerCodes = [...new Set(checks.filter(([key]) => facts[key] !== true).map(([, code]) => code))];
  return { allowed: blockerCodes.length === 0, blockerCodes, evaluatedFacts: { ...facts } } as const;
}

export function productionExecutionFacts(overrides: Partial<ExecutionGateFacts> = {}): ExecutionGateFacts {
  return {
    documentIntegrity: false, transactionOverlayApproved: false, identityVerified: false,
    authorityValid: false, disclosureValid: false, intentValid: false, placementValid: false,
    humanReviewValid: false, providerCertified: false, classificationAllowed: false,
    idempotencyHealthy: false, replayHealthy: false, promotionActive: false, ...overrides,
  };
}
