import type { PublicProductCode } from "./publicProductCatalog";

export const PUBLIC_ORDER_PAYMENT_POLICY_VERSION =
  "public-order-payment-policy-v1.0.0";

export type PublicOrderPaymentSnapshot = {
  id: string;
  productCode: PublicProductCode;
  productCatalogVersion: string;
  status: string;
  amountTotalCents: number;
  currency: string;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
};

export type PublicOrderStripeEventInput = {
  signatureVerified: boolean;
  providerEventId: string;
  eventType: string;
  orderId: string | null;
  productCode: string | null;
  productCatalogVersion: string | null;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  amountCents: number | null;
  amountRefundedCents: number | null;
  currency: string | null;
  paymentStatus: string | null;
  providerEvidence?: Record<string, unknown>;
};

export type PublicOrderPaymentAction =
  | "IGNORE"
  | "REJECT_HOLD"
  | "MARK_PENDING"
  | "CONFIRM_PAID"
  | "RECORD_CHARGE_EVIDENCE"
  | "MARK_FAILED"
  | "CANCEL"
  | "REVOKE_REFUND"
  | "HOLD_REFUND_FAILED"
  | "REVOKE_DISPUTE"
  | "CLOSE_DISPUTE_WON"
  | "CLOSE_DISPUTE_LOST";

export type PublicOrderPaymentDecision = {
  action: PublicOrderPaymentAction;
  accepted: boolean;
  grantAccess: boolean;
  revokeAccess: boolean;
  eventStatus:
    | "IGNORED"
    | "REJECTED"
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "CANCELED"
    | "REFUNDED"
    | "DISPUTED"
    | "DISPUTE_WON"
    | "DISPUTE_LOST";
  reasons: string[];
};

export const PUBLIC_ORDER_REQUIRED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
  "charge.succeeded",
  "charge.refunded",
  "refund.failed",
  "charge.dispute.created",
  "charge.dispute.closed",
] as const;

const SUPPORTED = new Set<string>(PUBLIC_ORDER_REQUIRED_STRIPE_EVENTS);

const PAYMENT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "charge.succeeded",
]);

const ADVERSE_EVENTS = new Set([
  "checkout.session.async_payment_failed",
  "payment_intent.payment_failed",
  "charge.refunded",
  "refund.failed",
  "charge.dispute.created",
]);

function decision(
  action: PublicOrderPaymentAction,
  eventStatus: PublicOrderPaymentDecision["eventStatus"],
  reasons: string[],
): PublicOrderPaymentDecision {
  return {
    action,
    accepted: !["IGNORE", "REJECT_HOLD"].includes(action),
    grantAccess: action === "CONFIRM_PAID",
    revokeAccess: [
      "MARK_FAILED",
      "CANCEL",
      "REVOKE_REFUND",
      "REVOKE_DISPUTE",
      "CLOSE_DISPUTE_WON",
      "CLOSE_DISPUTE_LOST",
    ].includes(action),
    eventStatus,
    reasons,
  };
}

function normalizedCurrency(value: string | null): string | null {
  const result = value?.trim().toLowerCase() ?? "";
  return result || null;
}

function publicOrderIdentityMatches(
  order: PublicOrderPaymentSnapshot,
  event: PublicOrderStripeEventInput,
): boolean {
  if (event.orderId && event.orderId !== order.id) return false;
  if (event.productCode && event.productCode !== order.productCode)
    return false;
  if (
    event.productCatalogVersion &&
    event.productCatalogVersion !== order.productCatalogVersion
  ) {
    return false;
  }
  return true;
}

function providerReferenceMatches(
  order: PublicOrderPaymentSnapshot,
  event: PublicOrderStripeEventInput,
): boolean {
  if (
    event.checkoutSessionId &&
    order.checkoutSessionId &&
    event.checkoutSessionId === order.checkoutSessionId
  ) {
    return true;
  }
  if (
    event.paymentIntentId &&
    order.paymentIntentId &&
    event.paymentIntentId === order.paymentIntentId
  ) {
    return true;
  }
  return Boolean(event.orderId && event.orderId === order.id);
}

export function evaluatePublicOrderPaymentEvent(
  order: PublicOrderPaymentSnapshot,
  event: PublicOrderStripeEventInput,
): PublicOrderPaymentDecision {
  if (!SUPPORTED.has(event.eventType)) {
    return decision("IGNORE", "IGNORED", ["UNSUPPORTED_EVENT"]);
  }
  if (!event.signatureVerified) {
    return decision("REJECT_HOLD", "REJECTED", [
      "PROVIDER_SIGNATURE_NOT_VERIFIED",
    ]);
  }
  if (!publicOrderIdentityMatches(order, event)) {
    return decision("REJECT_HOLD", "REJECTED", [
      "ORDER_PRODUCT_OR_CATALOG_MISMATCH",
    ]);
  }
  if (!providerReferenceMatches(order, event)) {
    return decision("REJECT_HOLD", "REJECTED", ["PROVIDER_REFERENCE_MISMATCH"]);
  }

  const eventCurrency = normalizedCurrency(event.currency);
  const orderCurrency = normalizedCurrency(order.currency);
  if (eventCurrency && eventCurrency !== orderCurrency) {
    return decision("REJECT_HOLD", "REJECTED", ["CURRENCY_MISMATCH"]);
  }

  if (
    PAYMENT_EVENTS.has(event.eventType) &&
    ["HELD", "REFUNDED", "DISPUTED", "DISPUTE_WON", "DISPUTE_LOST"].includes(
      order.status,
    )
  ) {
    return decision("REJECT_HOLD", "REJECTED", [
      "ADVERSE_OR_HELD_STATE_CANNOT_BE_REGRANTED",
    ]);
  }

  if (event.eventType === "charge.succeeded") {
    if (
      event.amountCents !== order.amountTotalCents ||
      eventCurrency !== orderCurrency
    ) {
      return decision("REJECT_HOLD", "REJECTED", ["SERVER_PRICE_MISMATCH"]);
    }
    return decision("RECORD_CHARGE_EVIDENCE", "PENDING", [
      "SIGNED_CHARGE_EVIDENCE_RECORDED_WITHOUT_GRANT",
    ]);
  }

  if (event.eventType === "checkout.session.completed") {
    if (
      event.productCode !== order.productCode ||
      event.productCatalogVersion !== order.productCatalogVersion ||
      event.checkoutSessionId !== order.checkoutSessionId
    ) {
      return decision("REJECT_HOLD", "REJECTED", [
        "CHECKOUT_METADATA_OR_SESSION_MISMATCH",
      ]);
    }
    if (
      event.amountCents !== order.amountTotalCents ||
      eventCurrency !== orderCurrency
    ) {
      return decision("REJECT_HOLD", "REJECTED", ["SERVER_PRICE_MISMATCH"]);
    }
    if (event.paymentStatus !== "paid") {
      return decision("MARK_PENDING", "PENDING", ["PAYMENT_NOT_CONFIRMED"]);
    }
    return decision("CONFIRM_PAID", "PAID", [
      "SIGNED_PAID_CHECKOUT_PRICE_MATCHED",
    ]);
  }

  if (event.eventType === "checkout.session.async_payment_succeeded") {
    if (
      event.amountCents !== order.amountTotalCents ||
      eventCurrency !== orderCurrency
    ) {
      return decision("REJECT_HOLD", "REJECTED", ["SERVER_PRICE_MISMATCH"]);
    }
    return decision("CONFIRM_PAID", "PAID", [
      "SIGNED_ASYNC_PAYMENT_PRICE_MATCHED",
    ]);
  }

  if (event.eventType === "refund.failed" && order.status === "REFUNDED") {
    return decision("IGNORE", "IGNORED", ["REFUND_ALREADY_CONFIRMED"]);
  }

  if (event.eventType === "refund.failed") {
    return decision("HOLD_REFUND_FAILED", "FAILED", [
      "SIGNED_REFUND_FAILURE_REQUIRES_OPERATOR_REVIEW",
    ]);
  }

  if (event.eventType === "charge.refunded") {
    if (!event.amountRefundedCents || event.amountRefundedCents <= 0) {
      return decision("REJECT_HOLD", "REJECTED", ["REFUND_AMOUNT_MISSING"]);
    }
    return decision("REVOKE_REFUND", "REFUNDED", [
      "SIGNED_REFUND_REVOKES_RESOURCE_ACCESS",
    ]);
  }

  if (event.eventType === "charge.dispute.closed") {
    if (event.paymentStatus === "won") {
      return decision("CLOSE_DISPUTE_WON", "DISPUTE_WON", [
        "SIGNED_DISPUTE_CLOSED_IN_FURLONG_FAVOR",
      ]);
    }
    if (event.paymentStatus === "lost") {
      return decision("CLOSE_DISPUTE_LOST", "DISPUTE_LOST", [
        "SIGNED_DISPUTE_CLOSED_IN_CUSTOMER_FAVOR",
      ]);
    }
    return decision("REJECT_HOLD", "REJECTED", [
      "DISPUTE_CLOSE_OUTCOME_MISSING",
    ]);
  }

  if (event.eventType === "charge.dispute.created") {
    return decision("REVOKE_DISPUTE", "DISPUTED", [
      "SIGNED_DISPUTE_REVOKES_RESOURCE_ACCESS",
    ]);
  }

  if (event.eventType === "checkout.session.expired") {
    return decision("CANCEL", "CANCELED", ["CHECKOUT_EXPIRED"]);
  }

  if (ADVERSE_EVENTS.has(event.eventType)) {
    return decision("MARK_FAILED", "FAILED", ["PAYMENT_FAILED"]);
  }

  return decision("IGNORE", "IGNORED", ["NO_STATE_TRANSITION"]);
}
