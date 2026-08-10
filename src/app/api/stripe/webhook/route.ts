import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { applyVerificationOutcome } from "@/lib/identity/verificationStore";
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
import { persistStripeConnectAllocation } from "@/lib/stripe-connect/allocationStore";
import {
  approvedFounderRevenueRule,
  isFurlongCheckoutSession,
  normalizeRevenueClass,
} from "@/lib/stripe-connect/paymentProvenance";
import {
  buildAllocationEvidence,
  type StripeConnectRecipientRegistry,
} from "@/lib/stripe-connect/runtime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { readRequiredSecret } from "@/lib/security/requestGuards";
import { stripeConfiguredForLivePayments } from "@/lib/stripe/client";
import {
  evaluatePaymentRisk,
  type PaymentRiskDecision,
} from "@/lib/fraud/paymentRiskRuntime";
import {
  expectedStripeMethodForSyntheticScenario,
  syntheticFixtureContextFromProviderMetadata,
  syntheticStripeMethodMatches,
} from "@/lib/testing/syntheticFixtureLineage";

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
  return `stripe-webhook-${randomUUID()}`;
}

function webhookSecret(): string | null {
  return readRequiredSecret("STRIPE_WEBHOOK_SECRET");
}

function stripeConnectRecipients(): StripeConnectRecipientRegistry {
  return {
    CAITLIN: {
      connectedAccountRef:
        process.env.STRIPE_CONNECT_CAITLIN_ACCOUNT_ID?.trim() || null,
      certified: process.env.STRIPE_CONNECT_CAITLIN_CERTIFIED === "true",
    },
    STUART: {
      connectedAccountRef:
        process.env.STRIPE_CONNECT_STUART_ACCOUNT_ID?.trim() || null,
      certified: process.env.STRIPE_CONNECT_STUART_CERTIFIED === "true",
    },
  };
}

function stripeWebhookVerifier(): Stripe {
  // Webhook signature verification uses STRIPE_WEBHOOK_SECRET, not an API
  // credential. A non-credential sentinel keeps the dormant connector
  // constructible without putting Stripe-key-shaped content in source.
  return new Stripe(process.env.STRIPE_SECRET_KEY?.trim() || "not-configured");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string,
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
  billingEvent: Awaited<ReturnType<typeof persistBillingEvent>>,
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
    regulatedDecisionImpactAllowed: billingEvent.regulatedDecisionImpactAllowed,
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
        { status: 403 },
      );
    }

    if (!configuredWebhookSecret) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "STRIPE_WEBHOOK_SECRET is not configured for this environment.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 503 },
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
          traceId,
        ),
        createRuntimeVersionRef(
          "schema",
          "entitlements-v0.1.0",
          "src/db/schema/entitlements.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "schema",
          "billing-events-v0.1.0",
          "src/db/schema/billingEvents.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId,
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId,
        ),
        createRuntimeVersionRef(
          "api",
          "stripe-webhook-verified-v1.0.0",
          "src/app/api/stripe/webhook/route.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "api",
          "entitlement-store-v0.1.0",
          "src/lib/entitlements/store.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "runtime",
          "billing-event-runtime-v0.1.0",
          "src/lib/billing/billingEventStore.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId,
        ),
      ],
    });

    if (!signature) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_WEBHOOK_SIGNATURE_MISSING",
        domain: "security",
        severity: "WARN",
        message:
          "Stripe webhook rejected because the signature header is missing.",
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
        { status: 400 },
      );
    }

    let stripeEvent: Stripe.Event;

    try {
      stripeEvent = stripeWebhookVerifier().webhooks.constructEvent(
        bodyText,
        signature,
        configuredWebhookSecret,
      );
    } catch (error) {
      const observability = createObservabilityEvent({
        eventType: "STRIPE_WEBHOOK_SIGNATURE_INVALID",
        domain: "security",
        severity: "WARN",
        message:
          "Stripe webhook rejected because signature verification failed.",
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
        { status: 400 },
      );
    }

    const payloadRecord = isRecord(stripeEvent) ? stripeEvent : {};
    const event = payloadRecord as StripeWebhookPayload;

    /**
     * IDENTITY EVENTS BRANCH HERE, BEFORE THE PAYMENT PIPELINE.
     *
     * This is the ONLY place `identity_verifications.verified` is ever set to
     * true — the signature above is what makes it trustworthy. A browser
     * returning from Stripe saying "I finished" is a UI event and proves
     * nothing; anyone can hit that URL.
     *
     * Kept separate from the payment path deliberately: an identity result is
     * not a transaction, and must not acquire an entitlement, a fraud
     * disposition, or a billing record by passing through machinery built for
     * money. Different domain, different evidence, early return.
     */
    if (typeof stripeEvent.type === "string" && stripeEvent.type.startsWith("identity.verification_session.")) {
      const sessionObject = (stripeEvent.data?.object ?? {}) as { id?: string };
      const providerSessionId = typeof sessionObject.id === "string" ? sessionObject.id : null;
      let outcome: Awaited<ReturnType<typeof applyVerificationOutcome>> = null;
      if (providerSessionId) {
        // Re-read from Stripe rather than trusting the payload body: the
        // event tells us WHICH session changed, the API tells us what it is.
        outcome = await applyVerificationOutcome(providerSessionId, traceId);
      }
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        versionRuntime,
        observability: createObservabilityEvent({
          eventType: "STRIPE_IDENTITY_WEBHOOK_APPLIED",
          domain: "security",
          severity: outcome?.nameMatchedRequest === false ? "WARN" : "INFO",
          message: `Stripe identity event handled: ${stripeEvent.type}.`,
          traceId,
          replayRef: traceId,
          actorId: "identity-provider:stripe-identity",
          module: "api.stripe.webhook",
          metadata: {
            stripeEventType: stripeEvent.type,
            providerSessionId,
            applied: Boolean(outcome),
            verified: outcome?.verified ?? false,
            nameMatchedRequest: outcome?.nameMatchedRequest ?? null,
          },
        }),
        metadata: { route: "/api/stripe/webhook", domain: "identity", stripeEventType: stripeEvent.type },
      });
      return NextResponse.json({
        ok: true,
        handled: "identity",
        // An unknown session id is reported, never silently swallowed — it
        // means Stripe knows about a verification we have no record of.
        applied: Boolean(outcome),
        verified: outcome?.verified ?? false,
      });
    }

    const metadata = event.data?.object?.metadata;
    const syntheticFixtureContext = syntheticFixtureContextFromProviderMetadata(
      isRecord(metadata) ? metadata : null,
    );
    const tenantId = getMetadataValue(metadata, "tenantId") ?? "dev";
    const requestedPlan = getMetadataValue(metadata, "plan");
    const sessionId =
      getMetadataValue(metadata, "sessionId") ??
      getMetadataValue(metadata, "checkoutSessionId") ??
      event.data?.object?.id ??
      null;
    let entitlement: Entitlement | null = null;
    let fraudDecision: PaymentRiskDecision | null = null;
    let syntheticPaymentMethodEvidence: Record<string, unknown> | null = null;
    const stripeObject = (event.data?.object ?? {}) as Record<string, unknown>;
    if (event.type === "checkout.session.completed") {
      fraudDecision = {
        disposition: "HOLD",
        reasons: ["PAYMENT_RISK_SIGNAL_PENDING"],
        releaseAllowed: false,
        humanReviewRequired: false,
      };
    } else if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "charge.dispute.created"
    ) {
      fraudDecision = {
        disposition: "BLOCK",
        reasons: [
          event.type === "charge.dispute.created"
            ? "DISPUTE_OPENED"
            : "PAYMENT_FAILED",
        ],
        releaseAllowed: false,
        humanReviewRequired: true,
      };
    } else if (event.type === "charge.succeeded") {
      const outcome = isRecord(stripeObject.outcome)
        ? stripeObject.outcome
        : {};
      const paymentDetails = isRecord(stripeObject.payment_method_details)
        ? stripeObject.payment_method_details
        : {};
      const card = isRecord(paymentDetails.card) ? paymentDetails.card : {};
      const checks = isRecord(card.checks) ? card.checks : {};
      const threeDS = isRecord(card.three_d_secure) ? card.three_d_secure : {};
      const wallet = isRecord(card.wallet) ? card.wallet : null;
      const walletType =
        wallet && typeof wallet.type === "string" ? wallet.type : null;
      const expectedSyntheticPaymentMethod =
        expectedStripeMethodForSyntheticScenario(
          syntheticFixtureContext?.scenarioId,
        );
      const syntheticPaymentMethodMatches = syntheticStripeMethodMatches(
        syntheticFixtureContext?.scenarioId,
        walletType,
      );
      const rawRisk =
        typeof outcome.risk_level === "string"
          ? outcome.risk_level
          : "not_assessed";
      const riskLevel =
        rawRisk === "normal" || rawRisk === "elevated" || rawRisk === "highest"
          ? rawRisk
          : "not_assessed";
      const metadataRecord = isRecord(stripeObject.metadata)
        ? stripeObject.metadata
        : {};
      fraudDecision = syntheticPaymentMethodMatches
        ? evaluatePaymentRisk({
            stripeRiskLevel: riskLevel,
            stripeRiskScore:
              typeof outcome.risk_score === "number"
                ? outcome.risk_score
                : null,
            threeDSecureAuthenticated: threeDS.result === "authenticated",
            cvcCheck:
              checks.cvc_check === "pass" || checks.cvc_check === "fail"
                ? checks.cvc_check
                : "unavailable",
            postalCheck:
              checks.address_postal_code_check === "pass" ||
              checks.address_postal_code_check === "fail"
                ? checks.address_postal_code_check
                : "unavailable",
            identityProofed: metadataRecord.identityProofed === "true",
            plaidOwnershipMatch:
              metadataRecord.plaidOwnershipMatch === "true"
                ? true
                : metadataRecord.plaidOwnershipMatch === "false"
                  ? false
                  : null,
            paymentMethod: wallet ? "wallet" : "card",
            amountCents:
              typeof stripeObject.amount === "number" ? stripeObject.amount : 0,
          })
        : {
            disposition: "BLOCK",
            reasons: ["SYNTHETIC_PAYMENT_METHOD_MISMATCH"],
            releaseAllowed: false,
            humanReviewRequired: true,
          };
      syntheticPaymentMethodEvidence = {
        expected: expectedSyntheticPaymentMethod,
        observed: walletType ?? "card",
        matches: syntheticPaymentMethodMatches,
      };
    }

    const classifiedPayload = classifyRecord(payloadRecord, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "security",
      classificationSource: "api-stripe-webhook-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "security", "governance"],
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
        },
      );

      const checkoutSession = stripeEvent.data
        .object as Stripe.Checkout.Session;
      const revenueClass = normalizeRevenueClass(
        checkoutSession.metadata?.revenueClass,
      );
      if (isFurlongCheckoutSession(checkoutSession) && revenueClass) {
        const rule = approvedFounderRevenueRule(revenueClass);
        const allocationEvidence = buildAllocationEvidence({
          paymentRef: checkoutSession.id,
          sourceTransactionRef: null,
          grossAmount: checkoutSession.amount_total ?? 0,
          currency: checkoutSession.currency ?? "usd",
          rule,
          recipients: stripeConnectRecipients(),
          generatedAt: new Date(stripeEvent.created * 1000).toISOString(),
        });
        await persistStripeConnectAllocation({
          evidence: allocationEvidence,
          rule,
          revenueClass,
          traceId,
          replayRef: traceId,
        });
      }
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
        fraudDecision,
        paymentReleaseAllowed: fraudDecision?.releaseAllowed ?? false,
        advisory:
          "Webhook processing updates entitlement state only; payment success is not equivalent to fraud clearance or a regulated decision.",
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-stripe-webhook-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "security", "governance"],
        sharingPermissions: ["entitlement-review"],
        aiUsagePermissions: [],
        exportRestrictions: [
          "do-not-export-entitlement-webhook-output-without-review",
        ],
        redactionRequirements: ["redact-tenant-and-entitlement-identifiers"],
        consentRequirements: ["borrower-payment-consent"],
      },
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
        fraudDecision,
        paymentReleaseAllowed: fraudDecision?.releaseAllowed ?? false,
      },
      metadata: {
        requestedPlan,
        durableBillingEvent: true,
        durableEntitlementState: Boolean(entitlement),
        stubSignatureVerification: false,
        fraudDisposition: fraudDecision?.disposition ?? null,
        paymentReleaseAllowed: fraudDecision?.releaseAllowed ?? false,
        syntheticFixtureActive: Boolean(syntheticFixtureContext),
        syntheticPaymentMethodEvidence: syntheticPaymentMethodEvidence,
      },
      syntheticFixtureContext,
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
        fraudDisposition: fraudDecision?.disposition ?? null,
        paymentReleaseAllowed: fraudDecision?.releaseAllowed ?? false,
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
        fraudDisposition: fraudDecision?.disposition ?? null,
        paymentReleaseAllowed: fraudDecision?.releaseAllowed ?? false,
        syntheticFixtureActive: Boolean(syntheticFixtureContext),
        syntheticPaymentMethodEvidence: syntheticPaymentMethodEvidence,
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
          ? "cryptographically_verified"
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
          fraudDecision,
          paymentReleaseAllowed: fraudDecision?.releaseAllowed ?? false,
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
      { status: 500 },
    );
  }
}
