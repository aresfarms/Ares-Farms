/**
 * Public order agreement shown immediately before payment.
 *
 * Vol I CONST-CONSENT-001; Vol III TECH-UX-001; Vol V
 * CANON-CONSENT-001 §§5, 7, 9: explicit, unbundled, accessible, versioned,
 * Level 4 Restricted and replayable disclosure evidence. The browser may
 * submit acceptance only; the server owns the exact text and version.
 */
export const PUBLIC_ORDER_AGREEMENT_ID = "furlong-public-order-refund-terms";
export const PUBLIC_ORDER_AGREEMENT_VERSION =
  "furlong-public-report-purchase-terms-v2.0.0";
export const PUBLIC_ORDER_AGREEMENT_TITLE =
  "Public report purchase and refund terms";

export const PUBLIC_ORDER_AGREEMENT_TERMS = [
  "The exact property, report, included scope, excluded scope, delivery target, list price, any verified credit, and total due are shown before payment. By ordering, you authorize property-specific processing to begin after signed payment confirmation.",
  "A supervised report may be canceled for a full refund before processing starts. An automated report may begin immediately after payment; once processing starts or the digital report is delivered, the purchase is non-refundable except as stated below.",
  "Furlong will refund a duplicate charge, an order it cannot fulfill, or a report it fails to deliver. If a purchased section is materially missing, Furlong may first correct the report at no charge; if it cannot, Furlong will refund the applicable purchase. Rights that cannot be waived by law remain unaffected.",
  "A report may conclude that the property or proposed use is unsuitable, infeasible, or unprofitable. An unfavorable conclusion is not grounds for a refund. Furlong does not guarantee profit, financing, grants, approvals, environmental clearance, or completion of a transaction.",
] as const;

export const PUBLIC_ORDER_AGREEMENT_ACCEPTANCE =
  "I confirm the property or list, selected report, included and excluded scope, delivery target, any credit, and total due shown. I accept these Purchase and Refund Terms and authorize Furlong to begin after signed payment confirmation.";

export const PUBLIC_ORDER_AGREEMENT_TEXT = [
  PUBLIC_ORDER_AGREEMENT_TITLE,
  ...PUBLIC_ORDER_AGREEMENT_TERMS,
  PUBLIC_ORDER_AGREEMENT_ACCEPTANCE,
].join("\n\n");

export type PublicOrderAgreementSubmission = {
  accepted?: unknown;
  version?: unknown;
};

export type PublicOrderAgreementDecision =
  | {
      accepted: true;
      version: typeof PUBLIC_ORDER_AGREEMENT_VERSION;
    }
  | {
      accepted: false;
      reason: "AGREEMENT_REQUIRED" | "AGREEMENT_VERSION_MISMATCH";
    };

export function evaluatePublicOrderAgreement(
  input: PublicOrderAgreementSubmission | null | undefined,
): PublicOrderAgreementDecision {
  if (!input || input.accepted !== true) {
    return { accepted: false, reason: "AGREEMENT_REQUIRED" };
  }
  if (input.version !== PUBLIC_ORDER_AGREEMENT_VERSION) {
    return {
      accepted: false,
      reason: "AGREEMENT_VERSION_MISMATCH",
    };
  }
  return {
    accepted: true,
    version: PUBLIC_ORDER_AGREEMENT_VERSION,
  };
}

export function publicOrderPaymentButtonLabel(
  amountCents: number,
  currency: string,
): string {
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
  return `PAY ${amount} AND START MY ANALYSIS`;
}
