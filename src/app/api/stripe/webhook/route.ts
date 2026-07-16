import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

import { persistBillingEvent } from "@/lib/billing/billingEventStore";
import {
  Entitlement,
  EntitlementPlan,
  EntitlementType,
  grantEntitlement,
} from "@/lib/entitlements/store";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { readRequiredSecret } from "@/lib/security/requestGuards";
import { stripeConfiguredForLivePayments } from "@/lib/stripe/client";

/**
 * Stripe Webhook API
 *
 * Master Volume Governance:
 * - Vol I: prevents payment events from becoming unreviewed constitutional decisions.
 * - Vol II: protects payment, tenant, entitlement, and regulated-service metadata.
 * - Vol III: gates entitlement writes through runtime, version, classification, replay,
 *   and durable governance evidence controls.
 * - Vol IV: supports operational review, incident triage, and webhook recovery.
 * - Vol V: enforces connector governance, observability, classification, replay,
 *   versioning, and auditability.
 *
 * Signature posture:
 * Stripe webhooks must pass cryptographic verification with STRIPE_WEBHOOK_SECRET.
 * Missing configuration or invalid signatures fail closed.
 */

type StripeWebhookPayload = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      metadata?: Record<string, unknown>;
    };
  };
};

function createStripeWebhookTraceId(): string {
  return `stripe-webhook-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function webhookSecret(): string | null {
  return readRequiredSecret("STRIPE_WEBHOOK_SECRET");
}

function stripeWebhookVerifier(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY?.trim() || "sk_test_placeholder");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = metadata?.[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function mapPlanToEntitlementPlan(plan: string | null): EntitlementPlan {
  if (plan === "free") {
    return "free";
  }

  if (plan === "environmental") {
    return "enterprise";
  }

  if (plan === "paid" || plan === "pro") {
    return "pro";
  }

  return "pro";
}

function mapPlanToPermissions(plan: string | null): EntitlementType[] {
  if (plan === "environmental") {
    return ["paid", "environmental"];
  }

  if (plan === "paid" || plan === "pro") {
    return ["paid"];
  }

  if (plan === "free") {
    return ["free"];
  }

  return ["paid", "environmental"];
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
    sessionId: billingEvent.sessionId,
    entitlementId: billingEvent.entitlementId,
    stripeEventType: billingEvent.stripeEventType,
    plan: billingEvent.plan,
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
  const traceId = createStripeWebhookTraceId();

  try {
    const bodyText = await req.text();
    const headerStore = await headers();
    const signature = headerStore.get("stripe-signature");
    const configuredWebhookSecret = webhookSecret();
    const livePaymentConnector = stripeConfiguredForLivePayments();

    const runtimeGuard = runRuntimeGuard({
      operation: "billing.stripe.webhook",
      module: "api.stripe.webhook",
      traceId,
      schemaVersion: "stripe-webhook-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: null,
      metadata: {
        route: "/api/stripe/webhook",
        signaturePresent: Boolean(signature),
        cryptographicSignatureVerification: true,
        writesEntitlementState: true,
        durableEntitlementState: true,
        durableGovernanceEvidence: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_WEBHOOK_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Stripe webhook was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: null,
        module: "api.stripe.webhook",
        metadata: {
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/stripe/webhook",
          blocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked Stripe webhook handling.",
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

    if (!configuredWebhookSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "STRIPE_WEBHOOK_SECRET is not configured for this environment.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 503 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "billing.stripe.webhook",
      module: "api.stripe.webhook",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "stripe-webhook-v0.1.0",
          "src/app/api/stripe/webhook/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "entitlements-v0.1.0",
          "src/db/schema/entitlements.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "billing-events-v0.1.0",
          "src/db/schema/billingEvents.ts",
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
          "stripe-webhook-verified-v1.0.0",
          "src/app/api/stripe/webhook/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "entitlement-store-v0.1.0",
          "src/lib/entitlements/store.ts",
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

    if (!signature) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_WEBHOOK_SIGNATURE_MISSING",
        domain: "security",
        severity: "WARN",
        message: "Stripe webhook rejected because the signature header is missing.",
        traceId,
        replayRef: traceId,
        actorId: null,
        module: "api.stripe.webhook",
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        versionRuntime,
        observability,
        replayVerification: {
          traceId,
          replayRef: traceId,
          targetType: "stripe_webhook_rejection",
          targetId: "missing-signature",
          verificationStatus: "rejected",
          deterministic: true,
          replaySafe: versionRuntime.replaySafe,
          sourceVersion: "stripe-webhook-local-stub-v0.1.0",
          replayVersion: "stripe-webhook-rejection-replay-v0.1.0",
          eventCount: 1,
          mismatchCount: 0,
          result: {
            rejected: true,
            reason: "missing-signature",
          },
          metadata: {
            route: "/api/stripe/webhook",
          },
          verifiedBy: "api.stripe.webhook",
        },
        metadata: {
          route: "/api/stripe/webhook",
          rejected: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Missing stripe signature.",
          governance: {
            traceId,
            runtimeGuard,
            versionRuntime,
            observability,
            evidence,
          },
        },
        { status: 400 }
      );
    }

    let stripeEvent: Stripe.Event;

    try {
      stripeEvent = stripeWebhookVerifier().webhooks.constructEvent(
        bodyText,
        signature,
        configuredWebhookSecret
      );
    } catch (error) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_WEBHOOK_SIGNATURE_INVALID",
        domain: "security",
        severity: "WARN",
        message: "Stripe webhook rejected because signature verification failed.",
        traceId,
        replayRef: traceId,
        actorId: null,
        module: "api.stripe.webhook",
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        versionRuntime,
        observability,
        replayVerification: {
          traceId,
          replayRef: traceId,
          targetType: "stripe_webhook_rejection",
          targetId: "invalid-payload",
          verificationStatus: "rejected",
          deterministic: true,
          replaySafe: versionRuntime.replaySafe,
          sourceVersion: "stripe-webhook-verified-v1.0.0",
          replayVersion: "stripe-webhook-rejection-replay-v0.1.0",
          eventCount: 1,
          mismatchCount: 0,
          result: {
            rejected: true,
            reason: "invalid-signature",
          },
          metadata: {
            route: "/api/stripe/webhook",
          },
          verifiedBy: "api.stripe.webhook",
        },
        metadata: {
          route: "/api/stripe/webhook",
          rejected: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Stripe webhook signature verification failed.",
          governance: {
            traceId,
            runtimeGuard,
            versionRuntime,
            observability,
            evidence,
          },
        },
        { status: 400 }
      );
    }

    const payloadRecord = isRecord(stripeEvent) ? stripeEvent : {};
    const event = payloadRecord as StripeWebhookPayload;
    const metadata = event.data?.object?.metadata;
    const tenantId = getMetadataValue(metadata, "tenantId") ?? "dev";
    const requestedPlan = getMetadataValue(metadata, "plan");
    const sessionId =
      getMetadataValue(metadata, "sessionId") ??
      getMetadataValue(metadata, "checkoutSessionId") ??
      event.data?.object?.id ??
      null;
    let entitlement: Entitlement | null = null;

    const classifiedPayload = classifyRecord(payloadRecord, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "security",
      classificationSource: "api-stripe-webhook-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "security",
        "governance",
      ],
      sharingPermissions: ["webhook-processing", "entitlement-review"],
      aiUsagePermissions: [],
      exportRestrictions: [
        "do-not-export-webhook-payload-without-security-review",
      ],
      redactionRequirements: [
        "redact-signature",
        "redact-tenant-and-session-identifiers",
      ],
      consentRequirements: ["borrower-payment-consent"],
    });

    if (event.type === "checkout.session.completed") {
      entitlement = await grantEntitlement(
        tenantId,
        mapPlanToEntitlementPlan(requestedPlan),
        mapPlanToPermissions(requestedPlan),
        {
          traceId,
          replayRef: traceId,
          source: "stripe-webhook",
          sourceRef: event.type,
          grantedBy: "api.stripe.webhook",
          metadata: {
            requestedPlan,
            eventType: event.type,
            stubSignatureVerification: false,
          },
        }
      );
    }

    const classifiedResult = classifyRecord(
      {
        received: true,
        eventType: event.type ?? "unknown",
        entitlementGranted: Boolean(entitlement),
        entitlementId: entitlement?.id ?? null,
        tenantId,
        plan: entitlement?.plan ?? null,
        permissions: entitlement?.permissions ?? [],
        replayRef: traceId,
        advisory:
          "Webhook processing updates entitlement state only; it is not a credit, financing, legal, permitting, or regulatory decision.",
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-stripe-webhook-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "security",
          "governance",
        ],
        sharingPermissions: ["entitlement-review"],
        aiUsagePermissions: [],
        exportRestrictions: [
          "do-not-export-entitlement-webhook-output-without-review",
        ],
        redactionRequirements: ["redact-tenant-and-entitlement-identifiers"],
        consentRequirements: ["borrower-payment-consent"],
      }
    );

    const billingEvent = await persistBillingEvent({
      traceId,
      billingEventId: traceId,
      eventType: entitlement
        ? "STRIPE_WEBHOOK_ENTITLEMENT_GRANTED"
        : "STRIPE_WEBHOOK_RECEIVED",
      eventStatus: entitlement ? "ENTITLEMENT_GRANTED" : "WEBHOOK_RECEIVED",
      route: "/api/stripe/webhook",
      tenantId,
      actorId: tenantId,
      sessionId,
      entitlementId: entitlement?.id ?? null,
      stripeEventType: event.type ?? "unknown",
      plan: entitlement?.plan ?? requestedPlan,
      checkoutSessionCreated: false,
      webhookReceived: true,
      entitlementGranted: Boolean(entitlement),
      paymentConnectorLiveMode: livePaymentConnector,
      stubSignatureVerification: false,
      regulatedDecisionImpactAllowed: false,
      humanReviewRequired: true,
      requestPayload: payloadRecord,
      responsePayload: {
        eventType: event.type ?? "unknown",
        entitlementGranted: Boolean(entitlement),
        entitlementId: entitlement?.id ?? null,
        tenantId,
        plan: entitlement?.plan ?? null,
        permissions: entitlement?.permissions ?? [],
        advisoryOnly: true,
      },
      metadata: {
        requestedPlan,
        durableBillingEvent: true,
        durableEntitlementState: Boolean(entitlement),
        stubSignatureVerification: false,
      },
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "stripe_webhook_entitlement_processing",
      audience: "internal",
      claimType: "fact",
      summary:
        "Stripe webhook handled through governed runtime controls; entitlement updates remain operational access controls, not regulated decisions.",
      ruleVersion: "stripe-webhook-runtime-v0.1.0",
      confidenceScore: 0.8,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        eventType: event.type ?? "unknown",
        entitlementGranted: Boolean(entitlement),
        billingEventId: billingEvent.billingEventId,
        durableEntitlementState: true,
        durableGovernanceEvidence: true,
        durableBillingEvent: true,
        stubSignatureVerification: false,
      },
    });

    const observability = createObservabilityEvent({
      eventType: entitlement
        ? "STRIPE_WEBHOOK_ENTITLEMENT_GRANTED"
        : "STRIPE_WEBHOOK_RECEIVED",
      domain: "connector",
      severity: "INFO",
      message: entitlement
        ? "Stripe webhook granted durable entitlement through governed runtime controls."
        : "Stripe webhook received through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: tenantId,
      module: "api.stripe.webhook",
      metadata: {
        eventType: event.type ?? "unknown",
        billingEventId: billingEvent.billingEventId,
        entitlementGranted: Boolean(entitlement),
        durableEntitlementState: true,
        durableGovernanceEvidence: true,
        durableBillingEvent: true,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "stripe_webhook_payload",
          resourceId: traceId,
          classification: classifiedPayload.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/stripe/webhook",
            eventType: event.type ?? "unknown",
          },
        },
        {
          resourceType: "stripe_webhook_output",
          resourceId: entitlement?.id ?? tenantId,
          classification: classifiedResult.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/stripe/webhook",
            entitlementGranted: Boolean(entitlement),
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "stripe_webhook",
        targetId: entitlement?.id ?? tenantId,
        verificationStatus: versionRuntime.ok
          ? "verified_with_stub_signature"
          : "warning",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "stripe-webhook-verified-v1.0.0",
        replayVersion: "stripe-webhook-replay-v0.1.0",
        eventCount: entitlement ? 1 : 0,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          eventType: event.type ?? "unknown",
          billingEventId: billingEvent.billingEventId,
          entitlementGranted: Boolean(entitlement),
          entitlementId: entitlement?.id ?? null,
          stubSignatureVerification: false,
        },
        metadata: {
          route: "/api/stripe/webhook",
          durableEntitlementState: true,
        },
        verifiedBy: "api.stripe.webhook",
      },
      metadata: {
        route: "/api/stripe/webhook",
        operation: "billing.stripe.webhook",
      },
    });

    return NextResponse.json({
      ok: true,
      received: true,
      webhook: classifiedResult,
      billingEvent: billingEventResponse(billingEvent),
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedPayload.classification,
        outputClassification: classifiedResult.classification,
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
            : "Unknown Stripe webhook error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
