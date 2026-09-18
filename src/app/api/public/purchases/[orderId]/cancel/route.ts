import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  loadPublicOrder,
  PublicOrderConflictError,
  recordPublicOrderRefundAttemptFailure,
  recordPublicOrderRefundSubmission,
  reservePublicOrderFullRefund,
} from "@/lib/billing/publicOrderStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { stripe } from "@/lib/stripe/client";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bearer(req: NextRequest): string | null {
  const value = req.headers.get("authorization")?.trim() ?? "";
  return value.toLowerCase().startsWith("bearer ")
    ? value.slice(7).trim() || null
    : null;
}

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie, Authorization",
    },
  });
}

/**
 * Customer cancellation before fulfillment begins.
 *
 * Master Volume traceability: Vol I CONST-CONSENT-001, Vol III
 * TECH-LEDGER-001 / TECH-UX-001, Vol III-B runtime enforcement, and Vol V
 * CANON-CONSENT-001 / CANON-TREASURY-001.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const orderId = (await context.params).orderId.trim();
  if (!UUID.test(orderId)) {
    return response(
      { ok: false, error: "A valid order identifier is required." },
      400,
    );
  }

  const authority = sessionAuthority(req);
  const accessToken = bearer(req);
  const traceId = "public-order-refund-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "billing.public-order.cancel-before-processing",
    module: "api.public.purchases.cancel",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      orderId,
      recoveryTokenPresented: Boolean(accessToken),
      refundAmountFromBrowser: false,
    },
  });
  if (!guard.allowed) {
    return response(
      { ok: false, error: "Order cancellation is unavailable." },
      403,
    );
  }

  const bundle = await loadPublicOrder({
    orderId,
    buyerActorId: authority.actorId,
    accessToken,
  });
  if (!bundle) {
    return response(
      { ok: false, error: "Order not found or access not authorized." },
      404,
    );
  }

  let refundReserved = false;
  try {
    const reservation = await reservePublicOrderFullRefund({
      orderId: bundle.order.id,
      traceId,
    });
    if (reservation.state === "ALREADY_REFUNDED") {
      return response({
        ok: true,
        status: "REFUNDED",
        message: "This order has already been refunded.",
        traceId,
      });
    }
    if (reservation.state === "ALREADY_PENDING") {
      return response(
        {
          ok: true,
          status: "REFUND_PENDING",
          message:
            "Your full refund is already being processed.",
          traceId,
        },
        202,
      );
    }

    refundReserved = true;
    const paymentIntentId = reservation.order.paymentIntentId;
    if (!paymentIntentId) {
      throw new PublicOrderConflictError(
        "The verified payment reference is unavailable.",
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: reservation.order.amountTotalCents,
      currency: reservation.order.currency,
      reason: "requested_by_customer",
      idempotencyKey: reservation.idempotencyKey,
      metadata: {
        purchaseFlow: "public-order",
        publicOrderId: reservation.order.id,
        publicProductCode: reservation.order.productCode,
        publicProductCatalogVersion:
          reservation.order.productCatalogVersion,
        refundPolicy: "cancel-before-processing",
        refundScope: "full-order",
      },
    });

    await recordPublicOrderRefundSubmission({
      orderId: reservation.order.id,
      providerRefundId: refund.id,
      providerStatus: refund.status,
      paymentIntentId:
        refund.payment_intent ?? paymentIntentId,
      amountCents: refund.amount,
      currency: refund.currency,
      traceId,
    });

    return response(
      {
        ok: true,
        status: "REFUND_PENDING",
        message:
          "Your analysis was stopped before processing. Stripe is processing the full refund.",
        refund: {
          amountCents: refund.amount,
          currency: refund.currency,
          providerStatus: refund.status,
        },
        traceId,
      },
      202,
    );
  } catch (error) {
    if (refundReserved) {
      try {
        await recordPublicOrderRefundAttemptFailure({
          orderId: bundle.order.id,
          reason:
            error instanceof Error
              ? error.message
              : "Unknown provider submission failure.",
          traceId,
        });
      } catch {
        // Preserve the original failure response; the order remains held.
      }
    }

    if (error instanceof PublicOrderConflictError) {
      return response(
        { ok: false, error: error.message, traceId },
        409,
      );
    }
    return response(
      {
        ok: false,
        error:
          "The order is safely paused, but the refund could not yet be submitted. Please try again.",
        status: refundReserved ? "REFUND_PENDING" : bundle.order.status,
        traceId,
      },
      503,
    );
  }
}
