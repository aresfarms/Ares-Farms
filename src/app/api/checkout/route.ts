import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { persistBillingEvent } from "@/lib/billing/billingEventStore";
import {
  assertStripeCheckoutAvailable,
  stripe,
  stripeConfiguredForLivePayments,
} from "@/lib/stripe/client";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Legacy Checkout Session API
 *
 * Master Volume Governance:
 * - Vol I: prevents checkout completion from implying credit approval or regulated reliance.
 * - Vol II: protects tenant, report, borrower, and billing metadata during checkout.
 * - Vol III: applies runtime guard, version lineage, classification, replay reference,
 *   and durable governance evidence.
 * - Vol IV: supports controlled operator review and local-development checkout recovery.
 * - Vol V: enforces connector governance, classification, replay, observability, and auditability.
 */

type CheckoutRequest = {
  productName?: string | null;
  price?: number | string | null;
  tenantId?: string | null;
  reportId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function createCheckoutTraceId(): string {
  return `checkout-${randomUUID()}`;
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function parseUnitAmount(value: CheckoutRequest["price"]): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "string" ? Number(value.trim()) : Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue);
}

function normalizeText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function billingEventResponse(
  billingEvent: Awaited<ReturnType<typeof persistBillingEvent>>
) {
  return {
    id: billingEvent.id,
    billingEventId: billingEvent.billingEventId,
    eventType: billingEvent.eventType,
    eventStatus: billingEvent.eventStatus,
    route: billingEvent.route,
    tenantId: billingEvent.tenantId,
    actorId: billingEvent.actorId,
    userId: billingEvent.userId,
    reportId: billingEvent.reportId,
    sessionId: billingEvent.sessionId,
    plan: billingEvent.plan,
    productName: billingEvent.productName,
    amountTotal: billingEvent.amountTotal,
    currency: billingEvent.currency,
    checkoutSessionCreated: billingEvent.checkoutSessionCreated,
    webhookReceived: billingEvent.webhookReceived,
    entitlementGranted: billingEvent.entitlementGranted,
    paymentConnectorLiveMode: billingEvent.paymentConnectorLiveMode,
    stubSignatureVerification: billingEvent.stubSignatureVerification,
    regulatedDecisionImpactAllowed:
      billingEvent.regulatedDecisionImpactAllowed,
    humanReviewRequired: billingEvent.humanReviewRequired,
    governanceVersion: billingEvent.governanceVersion,
    classification: billingEvent.classification,
    replayRef: billingEvent.replayRef,
    traceId: billingEvent.traceId,
    source: billingEvent.source,
    occurredAt: billingEvent.occurredAt,
    createdAt: billingEvent.createdAt,
    updatedAt: billingEvent.updatedAt,
  };
}

export async function POST(req: Request) {
  const traceId = createCheckoutTraceId();

  try {
    const body = (await req.json()) as CheckoutRequest;
    const productName = normalizeText(body.productName);
    const tenantId = normalizeText(body.tenantId);
    const unitAmount = parseUnitAmount(body.price);
    const actorId = body.userId ?? tenantId;

    const runtimeGuard = runRuntimeGuard({
      operation: "billing.checkout.create",
      module: "api.checkout",
      traceId,
      schemaVersion: "checkout-session-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/checkout",
        legacyCheckoutRoute: true,
        paymentConnector: "stripe-local-adapter",
        durableGovernanceEvidence: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CHECKOUT_RUNTIME_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Checkout session creation was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.checkout",
        metadata: {
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/checkout",
          blocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked checkout creation.",
          governance: {
            traceId,
            runtimeGuard,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "billing.checkout.create",
      module: "api.checkout",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "checkout-session-v0.1.0",
          "src/app/api/checkout/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "stripe-checkout-adapter-v0.1.0",
          "src/lib/stripe/client.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "billing-events-v0.1.0",
          "src/db/schema/billingEvents.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "billing-event-runtime-v0.1.0",
          "src/lib/billing/billingEventStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-checkout-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "governance"],
      sharingPermissions: ["billing-session-creation"],
      aiUsagePermissions: [],
      exportRestrictions: ["do-not-export-payment-metadata-without-review"],
      redactionRequirements: ["redact-tenant-and-report-identifiers"],
      consentRequirements: ["borrower-payment-consent"],
    });

    if (!productName || !tenantId || unitAmount === null) {
      const observability = createObservabilityEvent({
        eventType: "CHECKOUT_VALIDATION_FAILED",
        domain: "operations",
        severity: "WARN",
        message:
          "Checkout request failed validation before payment session creation.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.checkout",
        metadata: {
          hasProductName: Boolean(productName),
          hasTenantId: Boolean(tenantId),
          hasUnitAmount: unitAmount !== null,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        versionRuntime,
        classifications: [
          {
            resourceType: "checkout_request",
            resourceId: traceId,
            classification: classifiedInput.classification,
            traceId,
            replayRef: traceId,
            metadata: {
              route: "/api/checkout",
              validationFailed: true,
            },
          },
        ],
        observability,
        replayVerification: {
          traceId,
          replayRef: traceId,
          targetType: "checkout_validation",
          targetId: tenantId ?? traceId,
          verificationStatus: "rejected",
          deterministic: true,
          replaySafe: versionRuntime.replaySafe,
          sourceVersion: "checkout-session-v0.1.0",
          replayVersion: "checkout-validation-replay-v0.1.0",
          eventCount: 1,
          mismatchCount: 0,
          result: {
            valid: false,
            hasProductName: Boolean(productName),
            hasTenantId: Boolean(tenantId),
            hasUnitAmount: unitAmount !== null,
          },
          metadata: {
            route: "/api/checkout",
          },
          verifiedBy: "api.checkout",
        },
        metadata: {
          route: "/api/checkout",
          rejected: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid productName, price, or tenantId.",
          governance: {
            traceId,
            runtimeGuard,
            versionRuntime,
            inputClassification: classifiedInput.classification,
            observability,
            evidence,
          },
        },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl();
    assertStripeCheckoutAvailable();
    const livePaymentConnector = stripeConfiguredForLivePayments();

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId,
        reportId: body.reportId ?? "none",
        traceId,
        route: "api.checkout",
      },
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/dashboard?cancelled=true`,
    });

    const classifiedCheckout = classifyRecord(
      {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        amountTotal: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        tenantId,
        reportId: body.reportId ?? null,
        replayRef: traceId,
        advisory:
          "Checkout confirmation is not a final credit, financing, legal, permitting, or regulatory decision.",
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-checkout-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["billing-session-review"],
        aiUsagePermissions: [],
        exportRestrictions: ["do-not-export-payment-session-without-review"],
        redactionRequirements: ["redact-tenant-and-session-identifiers"],
        consentRequirements: ["borrower-payment-consent"],
      }
    );

    const billingEvent = await persistBillingEvent({
      traceId,
      billingEventId: traceId,
      eventType: "CHECKOUT_SESSION_CREATED",
      eventStatus: "SESSION_CREATED",
      route: "/api/checkout",
      tenantId,
      actorId,
      userId: body.userId,
      reportId: body.reportId,
      sessionId: checkoutSession.id,
      productName,
      amountTotal: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      checkoutSessionCreated: true,
      webhookReceived: false,
      entitlementGranted: false,
      paymentConnectorLiveMode: livePaymentConnector,
      stubSignatureVerification: false,
      regulatedDecisionImpactAllowed: false,
      humanReviewRequired: true,
      requestPayload: body as Record<string, unknown>,
      responsePayload: {
        sessionId: checkoutSession.id,
        amountTotal: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        advisoryOnly: true,
      },
      metadata: {
        legacyCheckoutRoute: true,
        durableBillingEvent: true,
        reportId: body.reportId ?? null,
      },
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "checkout_session",
      audience: "internal",
      claimType: "fact",
      summary:
        "Checkout session created through governed billing controls; session creation is not a regulated decision.",
      ruleVersion: "checkout-session-runtime-v0.1.0",
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        route: "/api/checkout",
        tenantId,
        reportId: body.reportId ?? null,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CHECKOUT_SESSION_CREATED",
      domain: "connector",
      severity: "INFO",
      message: "Checkout session created through governed billing controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.checkout",
      metadata: {
        sessionId: checkoutSession.id,
        billingEventId: billingEvent.billingEventId,
        versionRuntimeOk: versionRuntime.ok,
        durableGovernanceEvidence: true,
        durableBillingEvent: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "checkout_request",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/checkout",
            tenantId,
          },
        },
        {
          resourceType: "checkout_session",
          resourceId: checkoutSession.id,
          classification: classifiedCheckout.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/checkout",
            tenantId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "checkout_session",
        targetId: checkoutSession.id,
        verificationStatus: versionRuntime.ok ? "verified" : "warning",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "checkout-session-v0.1.0",
        replayVersion: "checkout-session-replay-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          sessionId: checkoutSession.id,
          billingEventId: billingEvent.billingEventId,
          tenantId,
          url: checkoutSession.url,
          advisoryOnly: true,
        },
        metadata: {
          route: "/api/checkout",
        },
        verifiedBy: "api.checkout",
      },
      metadata: {
        route: "/api/checkout",
        operation: "billing.checkout.create",
      },
    });

    return NextResponse.json({
      ok: true,
      url: checkoutSession.url,
      checkout: classifiedCheckout,
      billingEvent: billingEventResponse(billingEvent),
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedCheckout.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown checkout error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
