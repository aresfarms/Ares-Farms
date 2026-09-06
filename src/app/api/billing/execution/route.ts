import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { evaluateRecordedPaymentAuthorization } from "@/lib/treasury/borrowerFinancialControlStore";
import { persistBillingEvent } from "@/lib/billing/billingEventStore";
import { persistPaymentConnectorExecution } from "@/lib/billing/paymentConnectorControlStore";
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
 * Payment Connector Execution Authorization API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before payment execution
 *   authorization and prevents payment state from becoming a regulated
 *   decision.
 * - Vol II: Protects tenant, billing, entitlement, refund, dispute, and
 *   payment metadata.
 * - Vol III: Records replay-safe execution authorization without live
 *   payment processor capture.
 * - Vol IV: Supports outage handling, reconciliation, refund/dispute review,
 *   recovery, escalation, and audit preparation.
 * - Vol V: Enforces classification, observability, replay, version lineage,
 *   connector governance, schema contracts, consent, and isolation doctrine.
 */

type PaymentExecutionRequest = {
  userId?: string | null;
  actorId?: string | null;
  tenantId?: string | null;
  role?: string | null;
  adapterId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
  plan?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  executionRef?: string | null;
  paymentProcessorRef?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  schemaContractStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  scopeAcceptanceId?: string | null;
  feeControlId?: string | null;
  actualWorkEvidenceId?: string | null;
  moduleAttribution?: string | null;
  metadata?: Record<string, unknown>;
};

function createPaymentExecutionTraceId(): string {
  return `payment-execution-${randomUUID()}`;
}

function executionResponse(
  execution: Awaited<ReturnType<typeof persistPaymentConnectorExecution>>["execution"]
) {
  return {
    id: execution.id,
    adapterId: execution.adapterId,
    billingEventId: execution.billingEventId,
    sessionId: execution.sessionId,
    tenantId: execution.tenantId,
    actorId: execution.actorId,
    userId: execution.userId,
    plan: execution.plan,
    amountTotal: execution.amountTotal,
    currency: execution.currency,
    executionStatus: execution.executionStatus,
    executionRef: execution.executionRef,
    paymentProcessorRef: execution.paymentProcessorRef,
    paymentAuthorityRef: execution.paymentAuthorityRef,
    credentialRef: execution.credentialRef,
    webhookSecretRef: execution.webhookSecretRef,
    outagePolicyRef: execution.outagePolicyRef,
    replayPolicyRef: execution.replayPolicyRef,
    operationalRunbookRef: execution.operationalRunbookRef,
    schemaContractVersion: execution.schemaContractVersion,
    consentRef: execution.consentRef,
    isolationRef: execution.isolationRef,
    refundPolicyRef: execution.refundPolicyRef,
    disputePolicyRef: execution.disputePolicyRef,
    reconciliationPolicyRef: execution.reconciliationPolicyRef,
    adapterFound: execution.adapterFound,
    adapterCertified: execution.adapterCertified,
    livePaymentsAllowed: execution.livePaymentsAllowed,
    paymentAuthorityPresent: execution.paymentAuthorityPresent,
    credentialRefPresent: execution.credentialRefPresent,
    credentialApproved: execution.credentialApproved,
    webhookSecretPresent: execution.webhookSecretPresent,
    webhookSignatureVerified: execution.webhookSignatureVerified,
    outagePolicyPresent: execution.outagePolicyPresent,
    outagePolicyTested: execution.outagePolicyTested,
    replayPolicyPresent: execution.replayPolicyPresent,
    replayPolicyVerified: execution.replayPolicyVerified,
    schemaContractPresent: execution.schemaContractPresent,
    schemaContractVerified: execution.schemaContractVerified,
    consentRefPresent: execution.consentRefPresent,
    consentVerified: execution.consentVerified,
    isolationRefPresent: execution.isolationRefPresent,
    isolationVerified: execution.isolationVerified,
    operationalRunbookPresent: execution.operationalRunbookPresent,
    operationalRunbookApproved: execution.operationalRunbookApproved,
    refundPolicyPresent: execution.refundPolicyPresent,
    refundPolicyApproved: execution.refundPolicyApproved,
    disputePolicyPresent: execution.disputePolicyPresent,
    disputePolicyApproved: execution.disputePolicyApproved,
    reconciliationPolicyPresent: execution.reconciliationPolicyPresent,
    reconciliationPolicyApproved: execution.reconciliationPolicyApproved,
    executionAllowed: execution.executionAllowed,
    paymentProcessorActionPerformed:
      execution.paymentProcessorActionPerformed,
    livePaymentCaptured: execution.livePaymentCaptured,
    regulatedDecisionImpactAllowed:
      execution.regulatedDecisionImpactAllowed,
    humanReviewRequired: execution.humanReviewRequired,
    executionAuthorizedAt: execution.executionAuthorizedAt,
    paymentCapturedAt: execution.paymentCapturedAt,
    classification: execution.classification,
    replayRef: execution.replayRef,
    traceId: execution.traceId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  };
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
    classification: billingEvent.classification,
    replayRef: billingEvent.replayRef,
    traceId: billingEvent.traceId,
    createdAt: billingEvent.createdAt,
    updatedAt: billingEvent.updatedAt,
  };
}

function hasTenantScope(body: PaymentExecutionRequest): boolean {
  return Boolean(body.tenantId?.trim());
}

export async function POST(req: NextRequest) {
  const traceId = createPaymentExecutionTraceId();

  try {
    const body = (await req.json()) as PaymentExecutionRequest;
    const authority = sessionAuthority(req);
    const actor = authority.actorId;

    const runtimeGuard = runRuntimeGuard({
      operation: "payment-connector.execution",
      module: "api.billing.execution",
      traceId,
      schemaVersion: "payment-connector-executions-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/billing/execution",
        adapterId: body.adapterId ?? null,
        tenantId: body.tenantId ?? null,
        sessionId: body.sessionId ?? null,
        livePaymentExpected: false,
        regulatedDecisionImpactAllowed: false,
      },
    });

    const access = evaluateAccess({
      role: authority.role,
      allowedRoles: ["operator", "admin", "governance"],
      operation: "payment-connector.execution",
      module: "api.billing.execution",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!runtimeGuard.allowed || !access.allowed || !hasTenantScope(body)) {
      const observability = createObservabilityEvent({
        eventType: "PAYMENT_EXECUTION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Payment connector execution authorization was denied by runtime, role, or tenant scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.execution",
        metadata: {
          route: "/api/billing/execution",
          runtimeGuard,
          access,
          tenantScopePresent: hasTenantScope(body),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/billing/execution",
          accessDenied: true,
          access,
          tenantScopePresent: hasTenantScope(body),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for payment execution or is missing governed tenant scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "payment-connector.execution",
      module: "api.billing.execution",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "payment-connector-execution-api-v0.1.0",
          "src/app/api/billing/execution/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "payment-connector-executions-v0.1.0",
          "src/db/schema/paymentConnectorExecutions.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "payment-connector-adapters-v0.1.0",
          "src/db/schema/paymentConnectorAdapters.ts",
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
          "payment-connector-control-runtime-v0.1.0",
          "src/lib/billing/paymentConnectorControlStore.ts",
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
        adapterId: body.adapterId ?? null,
        billingEventId: body.billingEventId ?? null,
        sessionId: body.sessionId ?? null,
        tenantId: body.tenantId ?? null,
        userId: body.userId ?? null,
        plan: body.plan ?? null,
        amountTotal: body.amountTotal ?? null,
        currency: body.currency ?? null,
        operationalRunbookStatus: body.operationalRunbookStatus ?? null,
        schemaContractStatus: body.schemaContractStatus ?? null,
        consentStatus: body.consentStatus ?? null,
        isolationStatus: body.isolationStatus ?? null,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-billing-execution-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "security",
          "governance",
        ],
        sharingPermissions: ["payment-execution-authorization-review"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-a-regulated-decision",
          "no-live-payment-capture-from-runtime",
          "requires-certified-payment-connector",
        ],
        redactionRequirements: [
          "redact-payment-session-and-tenant-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-payment-consent"],
      }
    );

    const financialPreflight = await evaluateRecordedPaymentAuthorization({
      tenantId: body.tenantId!,
      scopeAcceptanceId: body.scopeAcceptanceId,
      feeControlId: body.feeControlId,
      actualWorkEvidenceId: body.actualWorkEvidenceId,
      moduleAttribution: body.moduleAttribution,
      expectedAmountCents: body.amountTotal ?? null,
    });
    if (!financialPreflight.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PAYMENT_EXECUTION_FINANCIAL_CONTROL_BLOCKED",
        domain: "operations",
        severity: "WARN",
        message: "Payment execution authorization was blocked by the borrower financial-control chain.",
        traceId, replayRef: traceId, actorId: actor, module: "api.billing.execution",
        metadata: { blockers: financialPreflight.blockers },
      });
      const evidence = await persistGovernanceEvidence({ traceId, replayRef: traceId, observability, metadata: { route: "/api/billing/execution", financialPreflight } });
      return NextResponse.json({ ok: false, error: "Payment authorization requires accepted scope, fee control, module attribution, and verified actual-work evidence.", financialPreflight, governance: { traceId, runtimeGuard, access, versionRuntime, observability, evidence } }, { status: 409 });
    }

    const paymentExecution = await persistPaymentConnectorExecution({
      traceId,
      adapterId: body.adapterId,
      billingEventId: body.billingEventId,
      sessionId: body.sessionId,
      tenantId: body.tenantId,
      actorId: actor,
      userId: body.userId,
      plan: body.plan,
      amountTotal: body.amountTotal,
      currency: body.currency,
      executionRef: body.executionRef,
      paymentProcessorRef: body.paymentProcessorRef,
      operationalRunbookRef: body.operationalRunbookRef,
      operationalRunbookStatus: body.operationalRunbookStatus,
      schemaContractStatus: body.schemaContractStatus,
      consentRef: body.consentRef,
      consentStatus: body.consentStatus,
      isolationRef: body.isolationRef,
      isolationStatus: body.isolationStatus,
      metadata: {
        ...(body.metadata ?? {}),
        financialPreflight,
        scopeAcceptanceId: body.scopeAcceptanceId ?? null,
        feeControlId: body.feeControlId ?? null,
        actualWorkEvidenceId: body.actualWorkEvidenceId ?? null,
        moduleAttribution: body.moduleAttribution ?? null,
        access,
      },
    });

    const billingEvent = await persistBillingEvent({
      traceId,
      billingEventId: traceId,
      eventType: paymentExecution.executionAllowed
        ? "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED"
        : "PAYMENT_EXECUTION_BLOCKED",
      eventStatus: paymentExecution.executionStatus,
      route: "/api/billing/execution",
      tenantId: body.tenantId,
      actorId: actor,
      userId: body.userId,
      sessionId: body.sessionId,
      plan: body.plan,
      amountTotal: body.amountTotal ?? null,
      currency: body.currency,
      checkoutSessionCreated: false,
      webhookReceived: false,
      entitlementGranted: false,
      paymentConnectorLiveMode: false,
      stubSignatureVerification: false,
      regulatedDecisionImpactAllowed: false,
      humanReviewRequired: true,
      requestPayload: body as Record<string, unknown>,
      responsePayload: {
        paymentConnectorExecutionId: paymentExecution.execution.id,
        executionStatus: paymentExecution.executionStatus,
        executionAllowed: paymentExecution.executionAllowed,
        paymentProcessorActionPerformed: false,
        livePaymentCaptured: false,
        regulatedDecisionImpactAllowed: false,
      },
      metadata: {
        paymentConnectorExecutionId: paymentExecution.execution.id,
        adapterId: paymentExecution.execution.adapterId,
        durablePaymentConnectorExecution: true,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        paymentConnectorExecutionId: paymentExecution.execution.id,
        billingEventId: billingEvent.billingEventId,
        executionStatus: paymentExecution.executionStatus,
        executionAllowed: paymentExecution.executionAllowed,
        gates: paymentExecution.gates,
        paymentProcessorActionPerformed: false,
        livePaymentCaptured: false,
        regulatedDecisionImpactAllowed: false,
        humanReviewRequired: true,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-billing-execution-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "security",
          "governance",
        ],
        sharingPermissions: ["payment-execution-authorization-review"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-a-regulated-decision",
          "no-live-payment-capture-from-runtime",
        ],
        redactionRequirements: [
          "redact-payment-session-and-tenant-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-payment-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: paymentExecution.execution.id,
      outputType: "payment_connector_execution_authorization",
      audience: "internal",
      claimType: "fact",
      summary:
        "Payment execution authorization was evaluated through governed controls; no live payment processor action was performed.",
      ruleVersion: "payment-connector-control-runtime-v0.1.0",
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        adapterId: paymentExecution.execution.adapterId,
        executionStatus: paymentExecution.executionStatus,
        executionAllowed: paymentExecution.executionAllowed,
        paymentProcessorActionPerformed: false,
        livePaymentCaptured: false,
      },
    });

    const observability = createObservabilityEvent({
      eventType: paymentExecution.executionAllowed
        ? "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED"
        : "PAYMENT_EXECUTION_BLOCKED",
      domain: "connector",
      severity: paymentExecution.executionAllowed ? "INFO" : "WARN",
      message:
        "Payment execution authorization evaluated through governed controls without live payment capture.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.billing.execution",
      metadata: {
        route: "/api/billing/execution",
        adapterId: paymentExecution.execution.adapterId,
        executionStatus: paymentExecution.executionStatus,
        executionAllowed: paymentExecution.executionAllowed,
        billingEventId: billingEvent.billingEventId,
        paymentProcessorActionPerformed: false,
        livePaymentCaptured: false,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "payment_connector_execution_request",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/billing/execution",
          },
        },
        {
          resourceType: "payment_connector_execution",
          resourceId: paymentExecution.execution.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/billing/execution",
            billingEventId: billingEvent.billingEventId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "payment_connector_execution",
        targetId: paymentExecution.execution.id,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "payment-connector-execution-api-v0.1.0",
        replayVersion: "payment-connector-control-runtime-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          executionStatus: paymentExecution.executionStatus,
          executionAllowed: paymentExecution.executionAllowed,
          paymentProcessorActionPerformed: false,
          livePaymentCaptured: false,
          regulatedDecisionImpactAllowed: false,
        },
        metadata: {
          route: "/api/billing/execution",
        },
      },
      metadata: {
        route: "/api/billing/execution",
        operation: "payment-connector.execution",
      },
    });

    return NextResponse.json({
      ok: true,
      execution: executionResponse(paymentExecution.execution),
      billingEvent: billingEventResponse(billingEvent),
      result: {
        executionStatus: paymentExecution.executionStatus,
        executionAllowed: paymentExecution.executionAllowed,
        gates: paymentExecution.gates,
        paymentProcessorActionPerformed: false,
        livePaymentCaptured: false,
        regulatedDecisionImpactAllowed: false,
      },
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
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
            : "Unknown payment execution authorization error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
