import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { publicProduct } from "@/lib/billing/publicProductCatalog";
import { publicOrderReportArtifactForCustomer } from "@/lib/billing/publicOrderReportArtifact";
import {
  loadPublicOrder,
  publicOrderUpgradeOffer,
} from "@/lib/billing/publicOrderStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, max = 10_000): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((item) => stringValue(item, 4_000))
        .filter((item): item is string => Boolean(item))
        .slice(0, 20)
    : [];
}

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

export async function GET(
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
  const traceId = "public-order-read-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "billing.public-order.read",
    module: "api.public.purchases",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      orderId,
      recoveryTokenPresented: Boolean(bearer(req)),
    },
  });
  if (!guard.allowed) {
    return response(
      { ok: false, error: "Order access is temporarily unavailable." },
      403,
    );
  }

  const bundle = await loadPublicOrder({
    orderId,
    buyerActorId: authority.actorId,
    accessToken: bearer(req),
  });
  if (!bundle) {
    return response(
      { ok: false, error: "Order not found or access not authorized." },
      404,
    );
  }

  const product = publicProduct(bundle.order.productCode);
  const agreement = record(bundle.agreementEvent?.metadata);
  const targetSnapshot = record(bundle.order.targetSnapshot);
  const upgradeOffer = await publicOrderUpgradeOffer(bundle.order);
  const reportArtifact =
    bundle.order.status === "FULFILLED" &&
    bundle.order.amountPaidCents === bundle.order.amountTotalCents &&
    bundle.order.amountRefundedCents === 0 &&
    !bundle.order.disputedAt
      ? publicOrderReportArtifactForCustomer(bundle.order.metadata)
      : null;
  return response({
    ok: true,
    order: {
      id: bundle.order.id,
      productCode: bundle.order.productCode,
      productName: product?.publicName ?? null,
      targetType: bundle.order.targetType,
      targetRef: bundle.order.targetRef,
      fulfillmentMode: bundle.order.fulfillmentMode,
      status: bundle.order.status,
      canCancelForFullRefund:
        bundle.order.status === "FULFILLMENT_PENDING" &&
        !bundle.order.fulfillmentStartedAt &&
        bundle.order.amountPaidCents === bundle.order.amountTotalCents &&
        Boolean(bundle.order.paymentIntentId),
      refundPending: bundle.order.status === "REFUND_PENDING",
      amountTotalCents: bundle.order.amountTotalCents,
      amountPaidCents: bundle.order.amountPaidCents,
      amountRefundedCents: bundle.order.amountRefundedCents,
      unitAmountCents: bundle.order.unitAmountCents,
      creditAmountCents: bundle.order.creditAmountCents,
      currency: bundle.order.currency,
      target: {
        exactAddress: stringValue(targetSnapshot.exactAddress, 300),
        propertyId: stringValue(targetSnapshot.propertyId, 200),
      },
      report: reportArtifact
        ? {
            ...reportArtifact,
            downloadPath:
              "/api/public/purchases/" + bundle.order.id + "/report",
          }
        : null,
      upgradeOffer,
      checkoutCreatedAt: bundle.order.checkoutCreatedAt,
      paidAt: bundle.order.paidAt,
      fulfillmentStartedAt: bundle.order.fulfillmentStartedAt,
      fulfilledAt: bundle.order.fulfilledAt,
      refundedAt: bundle.order.refundedAt,
      disputedAt: bundle.order.disputedAt,
      expiresAt: bundle.order.expiresAt,
      createdAt: bundle.order.createdAt,
      updatedAt: bundle.order.updatedAt,
    },
    agreement: bundle.agreementEvent
      ? {
          id: stringValue(agreement.agreementId, 200),
          version: stringValue(agreement.agreementVersion, 200),
          title: stringValue(agreement.agreementTitle, 500),
          terms: stringList(agreement.agreementTerms),
          acceptanceText: stringValue(agreement.acceptanceText, 4_000),
          exactTextSha256: stringValue(agreement.exactTextSha256, 64),
          acceptedAt: stringValue(agreement.acceptedAt, 100),
        }
      : null,
    access: bundle.grants.map((grant) => ({
      accessType: grant.accessType,
      resourceType: grant.resourceType,
      resourceRef: grant.resourceRef,
      active: grant.active,
      unitsGranted: grant.unitsGranted,
      unitsRemaining: grant.unitsRemaining,
      startsAt: grant.startsAt,
      expiresAt: grant.expiresAt,
      revokedAt: grant.revokedAt,
      revocationReason: grant.revocationReason,
    })),
    governance: {
      traceId,
      personalFinancialInformationRequired: false,
      paymentIsNotReportCompletion: true,
    },
  });
}
