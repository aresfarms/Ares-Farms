import { evaluatePaymentRisk } from "@/lib/fraud/paymentRiskRuntime";

const base = { paymentMethod: "card" as const, amountCents: 10000, idmeIdentityVerified: true };
const highest = evaluatePaymentRisk({ ...base, stripeRiskLevel: "highest" });
const badCvc = evaluatePaymentRisk({ ...base, stripeRiskLevel: "normal", cvcCheck: "fail" });
const challenge = evaluatePaymentRisk({ ...base, stripeRiskLevel: "elevated", threeDSecureAuthenticated: false });
const safe = evaluatePaymentRisk({ ...base, stripeRiskLevel: "normal", cvcCheck: "pass", postalCheck: "pass" });
if (highest.disposition !== "BLOCK" || badCvc.disposition !== "BLOCK" || challenge.disposition !== "CHALLENGE" || safe.disposition !== "SAFE_TO_RELEASE") {
  throw new Error("Payment fraud conformance failed.");
}
console.log(JSON.stringify({ ok: true, highest: highest.disposition, badCvc: badCvc.disposition, elevated: challenge.disposition, normal: safe.disposition }, null, 2));
