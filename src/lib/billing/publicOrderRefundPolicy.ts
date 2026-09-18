export const PUBLIC_ORDER_REFUND_POLICY_VERSION =
  "public-order-refund-policy-v1.0.0";

export type PublicOrderRefundSnapshot = {
  status: string;
  amountTotalCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  paymentIntentId: string | null;
  fulfillmentStartedAt: Date | null;
  providerRefundId: string | null;
};

export type PublicOrderRefundDecision = {
  outcome:
    | "RESERVE_FULL_REFUND"
    | "RETRY_PROVIDER_SUBMISSION"
    | "ALREADY_PENDING"
    | "ALREADY_REFUNDED"
    | "DENY";
  allowed: boolean;
  amountCents: number;
  reasons: string[];
};

function decision(
  outcome: PublicOrderRefundDecision["outcome"],
  allowed: boolean,
  amountCents: number,
  reasons: string[],
): PublicOrderRefundDecision {
  return { outcome, allowed, amountCents, reasons };
}
export function evaluatePublicOrderFullRefund(
  order: PublicOrderRefundSnapshot,
): PublicOrderRefundDecision {
  if (order.status === "REFUNDED") {
    return decision(
      "ALREADY_REFUNDED",
      false,
      order.amountRefundedCents,
      ["SIGNED_FULL_REFUND_ALREADY_CONFIRMED"],
    );
  }

  if (order.status === "REFUND_PENDING") {
    return order.providerRefundId
      ? decision(
          "ALREADY_PENDING",
          false,
          order.amountTotalCents,
          ["PROVIDER_REFUND_ALREADY_SUBMITTED"],
        )
      : decision(
          "RETRY_PROVIDER_SUBMISSION",
          true,
          order.amountTotalCents,
          ["REFUND_RESERVED_WITHOUT_PROVIDER_CONFIRMATION"],
        );
  }

  if (order.status !== "FULFILLMENT_PENDING") {
    return decision("DENY", false, 0, [
      "ORDER_NOT_AWAITING_FULFILLMENT",
    ]);
  }
  if (order.fulfillmentStartedAt) {
    return decision("DENY", false, 0, [
      "PROPERTY_SPECIFIC_PROCESSING_ALREADY_BEGUN",
    ]);
  }

  if (
    order.amountTotalCents <= 0 ||
    order.amountPaidCents !== order.amountTotalCents ||
    order.amountRefundedCents !== 0
  ) {
    return decision("DENY", false, 0, [
      "FULL_VERIFIED_PAYMENT_NOT_AVAILABLE",
    ]);
  }

  if (!order.paymentIntentId?.trim()) {
    return decision("DENY", false, 0, [
      "VERIFIED_PAYMENT_REFERENCE_MISSING",
    ]);
  }

  return decision(
    "RESERVE_FULL_REFUND",
    true,
    order.amountTotalCents,
    ["PAID_AND_PROCESSING_NOT_STARTED"],
  );
}
