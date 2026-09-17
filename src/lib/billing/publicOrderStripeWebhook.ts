import { createHash } from "node:crypto";

import type Stripe from "stripe";

import {
  applyPublicOrderProviderEvent,
} from "@/lib/billing/publicOrderStore";

export const PUBLIC_ORDER_STRIPE_WEBHOOK_VERSION =
  "public-order-stripe-webhook-v1.0.0";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null;
}

function metadataValue(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  return textValue(metadata[key]);
}

function paymentIntentId(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  const linked = textValue(object.payment_intent);
  if (linked) return linked;
  if (eventType.startsWith("payment_intent.")) {
    return textValue(object.id);
  }
  return null;
}

function checkoutSessionId(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  if (eventType.startsWith("checkout.session.")) {
    return textValue(object.id);
  }
  return null;
}

function amountCents(
  eventType: string,
  object: Record<string, unknown>,
): number | null {
  if (eventType.startsWith("checkout.session.")) {
    return numberValue(object.amount_total);
  }
  if (eventType.startsWith("payment_intent.")) {
    return (
      numberValue(object.amount_received) ??
      numberValue(object.amount)
    );
  }
  if (
    eventType.startsWith("charge.") ||
    eventType.startsWith("refund.")
  ) {
    return numberValue(object.amount);
  }
  return null;
}

function amountRefundedCents(
  eventType: string,
  object: Record<string, unknown>,
): number | null {
  if (eventType === "charge.refunded") {
    return numberValue(object.amount_refunded);
  }
  if (eventType.startsWith("refund.")) {
    return numberValue(object.amount);
  }
  return null;
}

function chargeEvidence(
  eventType: string,
  object: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (eventType !== "charge.succeeded") return undefined;
  const outcome = record(object.outcome);
  const paymentDetails = record(object.payment_method_details);
  const card = record(paymentDetails.card);
  const checks = record(card.checks);
  const threeDS = record(card.three_d_secure);
  const wallet = record(card.wallet);
  return {
    riskLevel: textValue(outcome.risk_level),
    riskScore: numberValue(outcome.risk_score),
    networkStatus: textValue(outcome.network_status),
    cardChecks: {
      addressLine1: textValue(checks.address_line1_check),
      addressPostal: textValue(checks.address_postal_code_check),
      cvc: textValue(checks.cvc_check),
    },
    threeDSecure: {
      result: textValue(threeDS.result),
      version: textValue(threeDS.version),
      authenticationFlow: textValue(threeDS.authentication_flow),
    },
    walletType: textValue(wallet.type),
  };
}

function providerPaymentStatus(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  const checkoutStatus =
    textValue(object.payment_status)?.toLowerCase() ?? null;
  if (checkoutStatus) return checkoutStatus;
  if (
    eventType.startsWith("refund.") ||
    eventType.startsWith("charge.dispute.")
  ) {
    return textValue(object.status)?.toLowerCase() ?? null;
  }
  return null;
}

export async function processPublicOrderStripeWebhook(input: {
  stripeEvent: Stripe.Event;
  rawBody: string;
  traceId: string;
}) {
  const eventType = input.stripeEvent.type;
  const object = record(input.stripeEvent.data?.object);
  const metadata = record(object.metadata);
  const orderId = metadataValue(metadata, "publicOrderId");
  const declaredPublicOrder =
    metadataValue(metadata, "purchaseFlow") === "public-order" ||
    Boolean(orderId);
  const paymentIntent = paymentIntentId(eventType, object);
  const sessionId = checkoutSessionId(eventType, object);

  const result = await applyPublicOrderProviderEvent({
    event: {
      signatureVerified: true,
      providerEventId: input.stripeEvent.id,
      eventType,
      orderId,
      productCode: metadataValue(metadata, "publicProductCode"),
      productCatalogVersion: metadataValue(
        metadata,
        "publicProductCatalogVersion",
      ),
      checkoutSessionId: sessionId,
      paymentIntentId: paymentIntent,
      amountCents: amountCents(eventType, object),
      amountRefundedCents: amountRefundedCents(eventType, object),
      currency: textValue(object.currency)?.toLowerCase() ?? null,
      paymentStatus: providerPaymentStatus(eventType, object),
      providerEvidence: chargeEvidence(eventType, object),
    },
    payloadDigest: createHash("sha256")
      .update(input.rawBody)
      .digest("hex"),
    occurredAt: new Date(input.stripeEvent.created * 1000),
    traceId: input.traceId,
  });

  if (!result.handled && declaredPublicOrder) {
    return {
      handled: true as const,
      orphaned: true,
      duplicate: false,
      decision: {
        action: "REJECT_HOLD" as const,
        eventStatus: "REJECTED" as const,
        reasons: ["PUBLIC_ORDER_NOT_FOUND"],
        accepted: false,
        grantAccess: false,
        revokeAccess: false,
      },
      order: null,
    };
  }

  return result;
}