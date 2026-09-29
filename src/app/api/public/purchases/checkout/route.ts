import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";
import { storedEconomicPackages, supportedReportChoices, assessStoredEconomicEvidence } from "@/lib/intelligence/storedEconomicEvidence";
import { preparePublicAutomatedReport } from "@/lib/billing/preparePublicAutomatedReport";
import { verifiedAutomatedReportForOrder } from "@/lib/billing/publicAutomatedReportPolicy";
import { AutomatedReportNotReadyError } from "@/lib/reports/automatedPropertyReport";
import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  PUBLIC_PRODUCT_CATALOG_VERSION,
  productSupportsTarget,
  publicCheckoutDecision,
  publicProduct,
  publicProductDeliveryPromise,
  type PublicProductTargetType,
} from "@/lib/billing/publicProductCatalog";
import { evaluateRecordedPublicProductPrice } from "@/lib/billing/publicProductPriceReviewStore";
import {
  evaluatePublicOrderAgreement,
  PUBLIC_ORDER_AGREEMENT_VERSION,
} from "@/lib/billing/publicOrderAgreement";
import {
  attachPublicOrderCheckout,
  createPublicOrder,
  markPublicOrderCheckoutFailed,
  PublicOrderConflictError,
  recordPublicOrderAgreementAcceptance,
  recordPublicOrderCheckoutIntent,
  recoverPublicOrderCheckout,
} from "@/lib/billing/publicOrderStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { loadPropertyComparison } from "@/lib/intelligence/propertyComparisonStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import {
  assertStripeCheckoutAvailable,
  stripe,
  stripeConfiguredForLivePayments,
  type StripeCheckoutSessionCreateParams,
} from "@/lib/stripe/client";

type CheckoutBody = {
  productCode?: unknown;
  target?: unknown;
  agreement?: unknown;
  upgrade?: unknown;
};

type CheckoutTarget = {
  type: PublicProductTargetType;
  targetRef: string;
  snapshot: Record<string, unknown>;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, max) : null;
}

function requestNetworkAddress(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const address = forwarded?.split(",")[0] || req.headers.get("x-real-ip");
  return textValue(address, 256);
}

function requestUserAgent(req: NextRequest): string | null {
  return textValue(req.headers.get("user-agent"), 1_000);
}

function bearer(req: NextRequest): string | null {
  const value = req.headers.get("authorization")?.trim() ?? "";
  return value.toLowerCase().startsWith("bearer ")
    ? value.slice(7).trim() || null
    : null;
}

function checkoutRequestId(req: NextRequest): string {
  const supplied = req.headers.get("idempotency-key")?.trim() ?? "";
  return /^[A-Za-z0-9:_-]{16,120}$/.test(supplied)
    ? supplied
    : "public-checkout-" + randomUUID();
}

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function propertyTarget(value: Record<string, unknown>): CheckoutTarget | null {
  const exactAddress = textValue(value.exactAddress, 300);
  if (!exactAddress || exactAddress.length < 8) return null;
  const propertyId = textValue(value.propertyId, 200);
  const fingerprint = createHash("sha256")
    .update(exactAddress.toLowerCase())
    .digest("hex");
  return {
    type: "PROPERTY",
    targetRef: propertyId || "address-sha256:" + fingerprint,
    snapshot: {
      exactAddress,
      propertyId,
      customerVision: null,
      selectedReportCandidateId: null,
      source: "customer-selected-public-property",
    },
  };
}

async function resolveTarget(input: {
  raw: unknown;
  req: NextRequest;
  actorId: string | null;
}): Promise<CheckoutTarget | null> {
  const value = record(input.raw);
  const type = textValue(value.type, 40);
  if (type === "PROPERTY") {
    const target = propertyTarget(value);
    const comparisonId = textValue(value.analysisComparisonId, 64);
    // Free-form visions cannot enter automated ranking. Resolve a supported
    // candidate selector against this customer's saved, current evidence.
    if (textValue(value.customerVision, 1000)) return null;
    const selectedCandidateId = textValue(value.selectedReportCandidateId, 200);
    if (!target || !comparisonId) return selectedCandidateId ? null : target;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(comparisonId)) return null;
    const bundle = await loadPropertyComparison({ comparisonId, ownerActorId: input.actorId, accessToken: bearer(input.req) });
    const item = bundle?.items.find(item => item.status === "COMPLETED" && item.propertyId === target.snapshot.propertyId &&
      normalizedListingAddress(item.normalizedAddress ?? item.submittedAddress) === normalizedListingAddress(String(target.snapshot.exactAddress)));
    if (!item) return null;
    const packages = storedEconomicPackages(item.resultSnapshot);
    if (!packages || !assessStoredEconomicEvidence(item, new Date())?.ok) return null;
    const choice = selectedCandidateId ? supportedReportChoices(packages).find(c => c.id === selectedCandidateId) : null;
    if (selectedCandidateId && !choice) return null;
    target.snapshot.selectedReportCandidateId = choice?.id ?? null;
    target.snapshot.customerVision = choice?.title ?? null;
    target.snapshot.economicEvidence = { propertyId: item.propertyId, comparisonItemId: item.id, packages };
    target.snapshot.analysisComparisonId = comparisonId;
    return target;
  }
  if (type !== "PROPERTY_COMPARISON") return null;

  const comparisonId = textValue(value.comparisonId, 64);
  if (
    !comparisonId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      comparisonId,
    )
  ) {
    return null;
  }
  const comparison = await loadPropertyComparison({
    comparisonId,
    ownerActorId: input.actorId,
    accessToken: bearer(input.req),
  });
  if (!comparison) return null;

  return {
    type: "PROPERTY_COMPARISON",
    targetRef: comparison.comparison.id,
    snapshot: {
      comparisonId: comparison.comparison.id,
      propertyCount: comparison.comparison.propertyCount,
      requestedResultCount: comparison.comparison.requestedResultCount,
      statusAtCheckout: comparison.comparison.status,
      source: "authorized-public-property-comparison",
    },
  };
}

function privateResponse(
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  const traceId = "public-order-checkout-" + randomUUID();
  const parsed = await readJsonBodyWithLimit<CheckoutBody>(req, {
    maxBytes: 32 * 1024,
  });
  if (!parsed.ok) {
    return privateResponse(
      { ok: false, error: parsed.error, traceId },
      parsed.status,
    );
  }

  const authority = sessionAuthority(req);
  const product = publicProduct(parsed.body.productCode);
  if (!product) {
    return privateResponse(
      { ok: false, error: "Unknown public product.", traceId },
      400,
    );
  }

  const release = publicCheckoutDecision(product);
  if (!release.allowed || release.maxOpenOrders === null) {
    return privateResponse(
      {
        ok: false,
        error: "This product is not available for purchase.",
        reason: release.reason,
        traceId,
      },
      409,
    );
  }

  const deliveryPromise = publicProductDeliveryPromise(
    product,
    release.deliveryBusinessDays,
  );
  const deliveryDescription =
    product.description + " Delivery target: " + deliveryPromise + ".";
  const agreement = evaluatePublicOrderAgreement(record(parsed.body.agreement));
  if (!agreement.accepted) {
    return privateResponse(
      {
        ok: false,
        error:
          agreement.reason === "AGREEMENT_VERSION_MISMATCH"
            ? "The checkout terms changed. Review them again before paying."
            : "Accept the refund terms before paying.",
        reason: agreement.reason,
        requiredAgreementVersion: PUBLIC_ORDER_AGREEMENT_VERSION,
        traceId,
      },
      400,
    );
  }
  const agreementAcceptedAt = new Date();

  let priceReview: Awaited<
    ReturnType<typeof evaluateRecordedPublicProductPrice>
  >;
  try {
    priceReview = await evaluateRecordedPublicProductPrice({ product });
  } catch {
    return privateResponse(
      {
        ok: false,
        error: "Current price validation is temporarily unavailable.",
        traceId,
      },
      503,
    );
  }
  if (!priceReview.allowed || !priceReview.review) {
    return privateResponse(
      {
        ok: false,
        error:
          "This product cannot be sold until its current cost and margin review is approved.",
        traceId,
      },
      409,
    );
  }

  const target = await resolveTarget({
    raw: parsed.body.target,
    req,
    actorId: authority.actorId,
  });
  if (!target) {
    return privateResponse(
      {
        ok: false,
        error:
          "A valid property or authorized property comparison is required.",
        traceId,
      },
      400,
    );
  }
  if (!productSupportsTarget(product, target.type)) {
    return privateResponse(
      {
        ok: false,
        error: "This product does not support the selected target.",
        traceId,
      },
      400,
    );
  }
  const rawUpgrade = record(parsed.body.upgrade);
  const upgradeOrderId = textValue(rawUpgrade.sourceOrderId, 100);
  const upgradeAccessToken = textValue(rawUpgrade.sourceAccessToken, 300);
  const upgradeRequested = Boolean(upgradeOrderId || upgradeAccessToken);
  if (
    upgradeRequested &&
    (!upgradeOrderId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        upgradeOrderId,
      ) ||
      !upgradeAccessToken)
  ) {
    return privateResponse(
      {
        ok: false,
        error: "A complete, authorized prior-report credit is required.",
        traceId,
      },
      400,
    );
  }
  const upgradeSource =
    upgradeOrderId && upgradeAccessToken
      ? {
          orderId: upgradeOrderId,
          accessToken: upgradeAccessToken,
        }
      : null;

  const guard = runRuntimeGuard({
    operation: "billing.public-order.checkout.create",
    module: "api.public.purchases.checkout",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "furlong-public-order-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      productCode: product.code,
      productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
      targetType: target.type,
      browserPriceAccepted: false,
      serverPriceCents: product.unitAmountCents,
      personalFinancialInformationRequired: false,
      deliveryBusinessDays: release.deliveryBusinessDays,
      maxOpenOrders: release.maxOpenOrders,
      upgradeCreditRequested: Boolean(upgradeSource),
    },
  });
  if (!guard.allowed) {
    return privateResponse(
      {
        ok: false,
        error: "Public checkout is temporarily unavailable.",
        traceId,
      },
      403,
    );
  }

  const requestId = checkoutRequestId(req);
  const recoveryToken = req.headers.get("x-checkout-recovery")?.trim() ?? null;
  if (recoveryToken && !/^furlong-order-[A-Za-z0-9_-]{43}$/.test(recoveryToken)) {
    return privateResponse({ ok: false, error: "Invalid checkout recovery token.", traceId }, 400);
  }
  if (recoveryToken) {
    const prior = await recoverPublicOrderCheckout({ checkoutRequestId: requestId, recoveryToken });
    if (prior) {
      const snapshot = record(prior.targetSnapshot);
      if (prior.productCode !== product.code || prior.targetRef !== target.targetRef ||
          snapshot.customerVision !== target.snapshot.customerVision) {
        return privateResponse({ ok: false, error: "This checkout belongs to a different request.", traceId }, 409);
      }
      const priorMetadata = record(prior.metadata);
      if (prior.status === "CREATED" && priorMetadata.checkoutIntent) {
        if (Date.now() - prior.createdAt.getTime() > 23 * 60 * 60 * 1000) {
          return privateResponse({ ok: false, error: "This checkout needs an order-status review before another payment session can be opened.", traceId }, 409);
        }
        try {
          const providerRequest = record(priorMetadata.checkoutIntent) as StripeCheckoutSessionCreateParams;
          const session = await stripe.checkout.sessions.create(providerRequest);
          if (session.amount_total !== prior.amountTotalCents || session.currency !== prior.currency) {
            throw new Error("Provider amount mismatch.");
          }
          await attachPublicOrderCheckout({ orderId: prior.id, checkoutSessionId: session.id, checkoutUrl: session.url, traceId });
          return privateResponse({ ok: true, orderId: prior.id, orderAccessToken: recoveryToken,
            checkoutSessionId: session.id, checkoutUrl: session.url, traceId }, 200);
        } catch {
          return privateResponse({ ok: false, error: "Checkout confirmation is pending. Retry this same request; a second payment session will not be created.", traceId }, 503);
        }
      }
      if (prior.status === "CHECKOUT_CREATED" && typeof priorMetadata.checkoutUrl === "string") {
        return privateResponse({ ok: true, orderId: prior.id, orderAccessToken: recoveryToken,
          checkoutSessionId: prior.checkoutSessionId, checkoutUrl: priorMetadata.checkoutUrl, traceId }, 200);
      }
      if (["FULFILLED", "FULFILLMENT_PENDING", "IN_FULFILLMENT", "PAID"].includes(prior.status)) {
        return privateResponse({ ok: true, orderId: prior.id, orderAccessToken: recoveryToken,
          checkoutUrl: `/purchase/success?order=${prior.id}`, traceId }, 200);
      }
      return privateResponse({ ok: false, error: prior.status === "FAILED"
        ? "This report preparation failed without opening checkout. You can try again."
        : "This order is still being prepared or is no longer payable. Check its status before starting another.",
        retryWithNewRequest: prior.status === "FAILED" && !priorMetadata.checkoutIntent,
        traceId }, 409);
    }
  }
  let paymentAttempted = false;
  let orderId: string | null = null;
  try {
    assertStripeCheckoutAvailable();
    const created = await createPublicOrder({
      checkoutRequestId: requestId,
      recoveryToken,
      buyerActorId: authority.actorId,
      product,
      targetType: target.type,
      targetRef: target.targetRef,
      targetSnapshot: target.snapshot,
      priceReviewId: priceReview.review.id,
      maxOpenOrders: release.maxOpenOrders,
      upgradeSource,
      traceId,
    });
    orderId = created.order.id;
    if (product.fulfillmentMode === "AUTOMATED") {
      created.order = await preparePublicAutomatedReport({ order: created.order, traceId });
      if (!verifiedAutomatedReportForOrder(created.order)) {
        throw new AutomatedReportNotReadyError(["The frozen report could not be verified for this order."]);
      }
    }

    const recordedAgreement = await recordPublicOrderAgreementAcceptance({
      orderId: created.order.id,
      productName: product.publicName || "Furlong property analysis",
      productDescription: deliveryDescription,
      includedScope: product.included,
      excludedScope: product.excluded,
      acceptedAt: agreementAcceptedAt,
      networkAddress: requestNetworkAddress(req),
      userAgent: requestUserAgent(req),
      traceId,
    });

    const metadata = {
      furlongOrigin: "true",
      purchaseFlow: "public-order",
      publicOrderId: created.order.id,
      publicProductCode: product.code,
      publicProductCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
      publicTargetType: target.type,
      publicTargetRef: target.targetRef.slice(0, 480),
      publicAgreementVersion: recordedAgreement.agreementVersion,
      publicAgreementDigest: recordedAgreement.agreementDigest,
      publicAgreementAcceptedAt: recordedAgreement.acceptedAt.toISOString(),
      publicDeliveryBusinessDays:
        release.deliveryBusinessDays?.toString() ?? "automated",
      publicMaxOpenOrders: release.maxOpenOrders.toString(),
      publicUnitAmountCents: created.order.unitAmountCents.toString(),
      publicCreditAmountCents: created.order.creditAmountCents.toString(),
      publicAmountTotalCents: created.order.amountTotalCents.toString(),
      traceId,
    };
    const root = baseUrl();
    const providerRequest: StripeCheckoutSessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.publicName || "Furlong property analysis",
              description: deliveryDescription,
            },
            unit_amount: created.order.amountTotalCents,
          },
          quantity: 1,
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      payment_method_options: {
        card: {
          request_three_d_secure:
            process.env.STRIPE_3DS_POLICY === "any"
              ? "any"
              : process.env.STRIPE_3DS_POLICY === "challenge"
                ? "challenge"
                : "automatic",
        },
      },
      success_url:
        root +
        "/purchase/success?order=" +
        created.order.id +
        "&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: root + "/purchase/canceled?order=" + created.order.id,
      idempotencyKey: "furlong-public-order:" + requestId,
    };
    await recordPublicOrderCheckoutIntent({ orderId: created.order.id, providerRequest });
    paymentAttempted = true;
    const checkout = await stripe.checkout.sessions.create(providerRequest);

    if (
      checkout.amount_total !== created.order.amountTotalCents ||
      checkout.currency.toLowerCase() !== product.currency
    ) {
      await markPublicOrderCheckoutFailed({
        orderId: created.order.id,
        traceId,
        reason: "Stripe checkout did not match the server catalog.",
      });
      return privateResponse(
        {
          ok: false,
          error: "Checkout price verification failed.",
          traceId,
        },
        503,
      );
    }

    const order = await attachPublicOrderCheckout({
      orderId: created.order.id,
      checkoutSessionId: checkout.id,
      checkoutUrl: checkout.url,
      traceId,
    });
    const observability = createObservabilityEvent({
      eventType: "PUBLIC_ORDER_CHECKOUT_CREATED",
      domain: "operations",
      severity: "INFO",
      message: "A server-priced public checkout session was created.",
      traceId,
      replayRef: traceId,
      actorId: authority.actorId,
      module: "api.public.purchases.checkout",
      metadata: {
        orderId: order.id,
        productCode: order.productCode,
        targetType: order.targetType,
        agreementVersion: recordedAgreement.agreementVersion,
        agreementDigest: recordedAgreement.agreementDigest,
        deliveryBusinessDays: release.deliveryBusinessDays,
        paymentConnectorLiveMode: stripeConfiguredForLivePayments(),
      },
    });
    await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/public/purchases/checkout",
        orderId: order.id,
        catalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
        serverPriceCents: order.amountTotalCents,
        agreementVersion: recordedAgreement.agreementVersion,
        agreementDigest: recordedAgreement.agreementDigest,
        agreementAcceptedAt: recordedAgreement.acceptedAt.toISOString(),
        deliveryBusinessDays: release.deliveryBusinessDays,
      },
    });

    return privateResponse(
      {
        ok: true,
        orderId: order.id,
        orderAccessToken: created.accessToken,
        checkoutSessionId: checkout.id,
        checkoutUrl: checkout.url,
        product: {
          code: product.code,
          name: product.publicName,
          amountCents: order.amountTotalCents,
          currency: order.currency,
          fulfillmentMode: order.fulfillmentMode,
          deliveryBusinessDays: release.deliveryBusinessDays,
        },
        agreement: {
          version: recordedAgreement.agreementVersion,
          digest: recordedAgreement.agreementDigest,
          acceptedAt: recordedAgreement.acceptedAt.toISOString(),
        },
        status: order.status,
        traceId,
      },
      201,
    );
  } catch (error) {
    if (orderId && !paymentAttempted) {
      await markPublicOrderCheckoutFailed({
        orderId,
        traceId,
        reason:
          error instanceof Error ? error.message : "Checkout creation failed.",
      }).catch(() => null);
    }
    return privateResponse(
      {
        ok: false,
        reason: error instanceof AutomatedReportNotReadyError ? "AUTOMATED_ARTIFACT_NOT_READY" : "CHECKOUT_UNAVAILABLE",
        retryWithNewRequest: Boolean(orderId && !paymentAttempted),
        error:
          error instanceof PublicOrderConflictError || error instanceof AutomatedReportNotReadyError
            ? error.message + (error instanceof AutomatedReportNotReadyError ? " No payment has been taken." : "")
            : "Checkout confirmation is pending. Retry the same request to recover it safely.",
        traceId,
      },
      error instanceof PublicOrderConflictError || error instanceof AutomatedReportNotReadyError ? 409 : 503,
    );
  }
}
