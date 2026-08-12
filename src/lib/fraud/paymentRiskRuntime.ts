export type PaymentRiskDisposition = "BLOCK" | "CHALLENGE" | "HOLD" | "SAFE_TO_RELEASE";

export type PaymentRiskInput = {
  stripeRiskLevel?: "normal" | "elevated" | "highest" | "not_assessed" | null;
  stripeRiskScore?: number | null;
  threeDSecureAuthenticated?: boolean | null;
  cvcCheck?: "pass" | "fail" | "unavailable" | "unchecked" | null;
  postalCheck?: "pass" | "fail" | "unavailable" | "unchecked" | null;
  identityProofed?: boolean;
  plaidOwnershipMatch?: boolean | null;
  paymentMethod: "card" | "bank" | "wallet";
  amountCents: number;
  recentInstrumentAttempts?: number;
};

export type PaymentRiskDecision = {
  disposition: PaymentRiskDisposition;
  reasons: string[];
  releaseAllowed: boolean;
  humanReviewRequired: boolean;
};
export function evaluatePaymentRisk(input: PaymentRiskInput): PaymentRiskDecision {
  const reasons: string[] = [];

  if (input.stripeRiskLevel === "highest" || (input.stripeRiskScore ?? 0) >= 80) {
    return { disposition: "BLOCK", reasons: ["STRIPE_HIGH_RISK"], releaseAllowed: false, humanReviewRequired: true };
  }
  if (input.cvcCheck === "fail" || input.postalCheck === "fail") {
    return { disposition: "BLOCK", reasons: ["CARDHOLDER_CHECK_FAILED"], releaseAllowed: false, humanReviewRequired: true };
  }
  if ((input.recentInstrumentAttempts ?? 0) >= 5) {
    return { disposition: "BLOCK", reasons: ["PAYMENT_INSTRUMENT_VELOCITY"], releaseAllowed: false, humanReviewRequired: true };
  }
  if (input.identityProofed !== true) reasons.push("IDENTITY_NOT_BOUND");
  if (input.paymentMethod === "bank" && input.plaidOwnershipMatch !== true) reasons.push("BANK_OWNERSHIP_NOT_MATCHED");
  if (input.stripeRiskLevel === "elevated" && input.threeDSecureAuthenticated !== true) reasons.push("3DS_CHALLENGE_REQUIRED");

  if (reasons.includes("3DS_CHALLENGE_REQUIRED")) {
    return { disposition: "CHALLENGE", reasons, releaseAllowed: false, humanReviewRequired: false };
  }
  if (reasons.length > 0) {
    return { disposition: "HOLD", reasons, releaseAllowed: false, humanReviewRequired: true };
  }
  return { disposition: "SAFE_TO_RELEASE", reasons: ["RISK_CONTROLS_PASSED"], releaseAllowed: true, humanReviewRequired: false };
}
