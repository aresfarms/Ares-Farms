import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import { persistBillingEvent } from "@/lib/billing/billingEventStore";
import { PLANS } from "@/lib/billing/plans";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  assertStripeCheckoutAvailable,
  stripe,
  stripeConfiguredForLivePayments,
} from "@/lib/stripe/client";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Authenticated Stripe Checkout API
 *
 * Master Volume Governance:
 * - Vol I: prevents checkout from being treated as an approval or official report.
 * - Vol II: preserves controlled handling of authenticated tenant and billing metadata.
 * - Vol III: applies replay-safe runtime, version, classification, connector, and
 *   durable governance evidence controls.
 * - Vol IV: supports operational review, cancellation, and recovery handoff.
 * - Vol V: enforces connector governance, classification propagation, observability,
 *   replay, versioning, and auditability.
 */

type BillingPlanKey = keyof typeof PLANS;

type CheckoutBody = {
  plan?: string | null;
};

type SessionUserWithTenant = {
  id?: string | null;
  email?: string | null;
  tenantId?: string | null;
};

function createStripeCheckoutTraceId(): string {
  return `stripe-checkout-${randomUUID()}`;
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function isBillingPlanKey(plan: string | null | undefined): plan is BillingPlanKey {
  return Boolean(plan && Object.prototype.hasOwnProperty.call(PLANS, plan));
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
  const traceId = createStripeCheckoutTraceId();

  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUserWithTenant | undefined;

    if (!sessionUser) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_CHECKOUT_UNAUTHORIZED",
        domain: "security",
        severity: "WARN",
        message: "Unauthenticated checkout session creation was rejected.",
        traceId,
        replayRef: traceId,
        actorId: null,
        module: "api.stripe.checkout",
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/stripe/checkout",
          rejected: true,
          reason: "unauthorized",
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          governance: {
            traceId,
            observability,
            evidence,
          },
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CheckoutBody;
    const actorId = sessionUser.id ?? sessionUser.email ?? sessionUser.tenantId;

    const runtimeGuard = runRuntimeGuard({
      operation: "billing.stripe.checkout.create",
      module: "api.stripe.checkout",
      traceId,
      schemaVersion: "stripe-checkout-session-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/stripe/checkout",
        paymentConnector: "stripe-local-adapter",
        authenticated: true,
        durableGovernanceEvidence: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_CHECKOUT_RUNTIME_BLOCKED",
        domain: "security",
        severity: "WARN",
        message:
          "Authenticated checkout session creation was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.stripe.checkout",
        metadata: {
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/stripe/checkout",
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
      operation: "billing.stripe.checkout.create",
      module: "api.stripe.checkout",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "stripe-checkout-session-v0.1.0",
          "src/app/api/stripe/checkout/route.ts",
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

    const classifiedInput = classifyRecord(
      {
        plan: body.plan ?? null,
        tenantId: sessionUser.tenantId ?? null,
        userId: actorId ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-stripe-checkout-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["billing-session-creation"],
        aiUsagePermissions: [],
        exportRestrictions: ["do-not-export-payment-metadata-without-review"],
        redactionRequirements: ["redact-tenant-and-user-identifiers"],
        consentRequirements: ["borrower-payment-consent"],
      }
    );

    if (!isBillingPlanKey(body.plan)) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_CHECKOUT_PLAN_REJECTED",
        domain: "operations",
        severity: "WARN",
        message: "Checkout request used an invalid billing plan.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.stripe.checkout",
        metadata: {
          requestedPlan: body.plan ?? null,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        versionRuntime,
        classifications: [
          {
            resourceType: "stripe_checkout_request",
            resourceId: traceId,
            classification: classifiedInput.classification,
            traceId,
            replayRef: traceId,
            metadata: {
              route: "/api/stripe/checkout",
              rejected: true,
            },
          },
        ],
        observability,
        replayVerification: {
          traceId,
          replayRef: traceId,
          targetType: "stripe_checkout_validation",
          targetId: sessionUser.tenantId ?? traceId,
          verificationStatus: "rejected",
          deterministic: true,
          replaySafe: versionRuntime.replaySafe,
          sourceVersion: "stripe-checkout-session-v0.1.0",
          replayVersion: "stripe-checkout-validation-replay-v0.1.0",
          eventCount: 1,
          mismatchCount: 0,
          result: {
            valid: false,
            requestedPlan: body.plan ?? null,
          },
          metadata: {
            route: "/api/stripe/checkout",
          },
          verifiedBy: "api.stripe.checkout",
        },
        metadata: {
          route: "/api/stripe/checkout",
          rejected: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Invalid plan",
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

    const selected = PLANS[body.plan];
    const baseUrl = getBaseUrl();
    const tenantId = sessionUser.tenantId ?? "dev";
    assertStripeCheckoutAvailable();
    const livePaymentConnector = stripeConfiguredForLivePayments();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: selected.name,
            },
            unit_amount: Math.round(selected.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId,
        plan: body.plan,
        traceId,
        route: "api.stripe.checkout",
      },
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/dashboard?cancelled=true`,
    });

    const classifiedCheckout = classifyRecord(
      {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        plan: body.plan,
        planName: selected.name,
        amountTotal: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        tenantId,
        replayRef: traceId,
        advisory:
          "Checkout confirmation is not a final credit, financing, legal, permitting, or regulatory decision.",
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-stripe-checkout-route-output",
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
      eventType: "STRIPE_CHECKOUT_SESSION_CREATED",
      eventStatus: "SESSION_CREATED",
      route: "/api/stripe/checkout",
      tenantId,
      actorId,
      userId: sessionUser.id ?? sessionUser.email ?? null,
      sessionId: checkoutSession.id,
      plan: body.plan,
      productName: selected.name,
      amountTotal: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      checkoutSessionCreated: true,
      webhookReceived: false,
      entitlementGranted: false,
      paymentConnectorLiveMode: livePaymentConnector,
      stubSignatureVerification: false,
      regulatedDecisionImpactAllowed: false,
      humanReviewRequired: true,
      requestPayload: {
        plan: body.plan,
        tenantId,
        userId: sessionUser.id ?? null,
      },
      responsePayload: {
        sessionId: checkoutSession.id,
        plan: body.plan,
        planName: selected.name,
        amountTotal: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        advisoryOnly: true,
      },
      metadata: {
        authenticated: true,
        durableBillingEvent: true,
      },
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "authenticated_checkout_session",
      audience: "internal",
      claimType: "fact",
      summary:
        "Authenticated checkout session created through governed billing controls; session creation is not a regulated decision.",
      ruleVersion: "stripe-checkout-runtime-v0.1.0",
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        route: "/api/stripe/checkout",
        plan: body.plan,
        tenantId,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "STRIPE_CHECKOUT_SESSION_CREATED",
      domain: "connector",
      severity: "INFO",
      message:
        "Authenticated checkout session created through governed billing controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.stripe.checkout",
      metadata: {
        sessionId: checkoutSession.id,
        billingEventId: billingEvent.billingEventId,
        plan: body.plan,
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
          resourceType: "stripe_checkout_request",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/stripe/checkout",
            tenantId,
            plan: body.plan,
          },
        },
        {
          resourceType: "stripe_checkout_session",
          resourceId: checkoutSession.id,
          classification: classifiedCheckout.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/stripe/checkout",
            tenantId,
            plan: body.plan,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "stripe_checkout_session",
        targetId: checkoutSession.id,
        verificationStatus: versionRuntime.ok ? "verified" : "warning",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "stripe-checkout-session-v0.1.0",
        replayVersion: "stripe-checkout-session-replay-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          sessionId: checkoutSession.id,
          billingEventId: billingEvent.billingEventId,
          tenantId,
          plan: body.plan,
          advisoryOnly: true,
        },
        metadata: {
          route: "/api/stripe/checkout",
        },
        verifiedBy: "api.stripe.checkout",
      },
      metadata: {
        route: "/api/stripe/checkout",
        operation: "billing.stripe.checkout.create",
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
          error instanceof Error
            ? error.message
            : "Unknown Stripe checkout error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
