import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistPaymentConnectorAdapter } from "@/lib/billing/paymentConnectorControlStore";
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
 * Payment Connector Certification API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before payment connector promotion.
 * - Vol II: Protects tenant, billing, credential, refund, dispute, and
 *   entitlement metadata.
 * - Vol III: Records replay-safe connector certification before any live
 *   payment processor promotion can occur.
 * - Vol IV: Supports credential review, outage handling, dispute response,
 *   refund controls, reconciliation, recovery, and audit preparation.
 * - Vol V: Enforces classification, observability, replay, version lineage,
 *   connector governance, consent, schema, and isolation doctrine.
 */

type PaymentConnectorRequest = {
  userId?: string | null;
  actorId?: string | null;
  tenantId?: string | null;
  role?: string | null;
  adapterId?: string | null;
  adapterName?: string | null;
  processorName?: string | null;
  processorType?: string | null;
  processorEnvironment?: string | null;
  paymentAuthorityRef?: string | null;
  certificationStatus?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  webhookSecretRef?: string | null;
  webhookSignatureStatus?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  schemaContractVersion?: string | null;
  refundPolicyRef?: string | null;
  refundPolicyStatus?: string | null;
  disputePolicyRef?: string | null;
  disputePolicyStatus?: string | null;
  reconciliationPolicyRef?: string | null;
  reconciliationPolicyStatus?: string | null;
  metadata?: Record<string, unknown>;
};

function createPaymentConnectorTraceId(): string {
  return `payment-connector-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: PaymentConnectorRequest): string | null {
  return body.actorId ?? body.userId ?? null;
}

function routeActorRole(body: PaymentConnectorRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function adapterResponse(
  adapter: Awaited<ReturnType<typeof persistPaymentConnectorAdapter>>["adapter"]
) {
  return {
    id: adapter.id,
    adapterId: adapter.adapterId,
    adapterName: adapter.adapterName,
    processorName: adapter.processorName,
    processorType: adapter.processorType,
    processorEnvironment: adapter.processorEnvironment,
    paymentAuthorityRef: adapter.paymentAuthorityRef,
    certificationStatus: adapter.certificationStatus,
    livePaymentsAllowed: adapter.livePaymentsAllowed,
    credentialRef: adapter.credentialRef,
    credentialStatus: adapter.credentialStatus,
    credentialVaultRequired: adapter.credentialVaultRequired,
    webhookSecretRef: adapter.webhookSecretRef,
    webhookSignatureStatus: adapter.webhookSignatureStatus,
    outagePolicyRef: adapter.outagePolicyRef,
    outageStatus: adapter.outageStatus,
    replayPolicyRef: adapter.replayPolicyRef,
    replayStatus: adapter.replayStatus,
    schemaContractVersion: adapter.schemaContractVersion,
    refundPolicyRef: adapter.refundPolicyRef,
    refundPolicyStatus: adapter.refundPolicyStatus,
    disputePolicyRef: adapter.disputePolicyRef,
    disputePolicyStatus: adapter.disputePolicyStatus,
    reconciliationPolicyRef: adapter.reconciliationPolicyRef,
    reconciliationPolicyStatus: adapter.reconciliationPolicyStatus,
    consentRequired: adapter.consentRequired,
    isolationRequired: adapter.isolationRequired,
    humanReviewRequired: adapter.humanReviewRequired,
    livePaymentCaptured: adapter.livePaymentCaptured,
    lastCertifiedAt: adapter.lastCertifiedAt,
    revokedAt: adapter.revokedAt,
    classification: adapter.classification,
    replayRef: adapter.replayRef,
    traceId: adapter.traceId,
    createdAt: adapter.createdAt,
    updatedAt: adapter.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createPaymentConnectorTraceId();

  try {
    const body = (await req.json()) as PaymentConnectorRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "payment-connector.certify",
      module: "api.billing.connectors",
      traceId,
      schemaVersion: "payment-connector-adapters-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/billing/connectors",
        adapterId: body.adapterId ?? null,
        processorType: body.processorType ?? null,
        livePaymentExpected: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PAYMENT_CONNECTOR_RUNTIME_BLOCKED",
        domain: "connector",
        severity: "WARN",
        message:
          "Payment connector certification was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.connectors",
        metadata: {
          route: "/api/billing/connectors",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/billing/connectors",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked payment connector certification.",
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

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "payment-connector.certify",
      module: "api.billing.connectors",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PAYMENT_CONNECTOR_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Payment connector certification was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.connectors",
        metadata: {
          route: "/api/billing/connectors",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/billing/connectors",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for payment connector certification.",
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
      operation: "payment-connector.certify",
      module: "api.billing.connectors",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "payment-connector-certification-api-v0.1.0",
          "src/app/api/billing/connectors/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "payment-connector-adapters-v0.1.0",
          "src/db/schema/paymentConnectorAdapters.ts",
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
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        adapterId: body.adapterId ?? null,
        adapterName: body.adapterName ?? null,
        processorName: body.processorName ?? null,
        processorType: body.processorType ?? null,
        processorEnvironment: body.processorEnvironment ?? null,
        paymentAuthorityRef: body.paymentAuthorityRef ?? null,
        certificationStatus: body.certificationStatus ?? null,
        credentialRef: body.credentialRef ?? null,
        credentialStatus: body.credentialStatus ?? null,
        webhookSecretRef: body.webhookSecretRef ?? null,
        webhookSignatureStatus: body.webhookSignatureStatus ?? null,
        outagePolicyRef: body.outagePolicyRef ?? null,
        outageStatus: body.outageStatus ?? null,
        replayPolicyRef: body.replayPolicyRef ?? null,
        replayStatus: body.replayStatus ?? null,
        schemaContractVersion: body.schemaContractVersion ?? null,
        refundPolicyRef: body.refundPolicyRef ?? null,
        disputePolicyRef: body.disputePolicyRef ?? null,
        reconciliationPolicyRef: body.reconciliationPolicyRef ?? null,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-billing-connectors-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "security",
          "governance",
        ],
        sharingPermissions: ["payment-connector-certification-review"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "credential-references-only",
          "webhook-secret-references-only",
          "no-secret-material",
          "not-a-regulated-decision",
        ],
        redactionRequirements: [
          "redact-credential-and-webhook-references-before-public-disclosure",
        ],
        consentRequirements: ["payment-processing-consent-governance-review"],
      }
    );

    const certification = await persistPaymentConnectorAdapter({
      traceId,
      adapterId: body.adapterId,
      adapterName: body.adapterName,
      processorName: body.processorName,
      processorType: body.processorType,
      processorEnvironment: body.processorEnvironment,
      paymentAuthorityRef: body.paymentAuthorityRef,
      certificationStatus: body.certificationStatus,
      credentialRef: body.credentialRef,
      credentialStatus: body.credentialStatus,
      webhookSecretRef: body.webhookSecretRef,
      webhookSignatureStatus: body.webhookSignatureStatus,
      outagePolicyRef: body.outagePolicyRef,
      outageStatus: body.outageStatus,
      replayPolicyRef: body.replayPolicyRef,
      replayStatus: body.replayStatus,
      schemaContractVersion: body.schemaContractVersion,
      refundPolicyRef: body.refundPolicyRef,
      refundPolicyStatus: body.refundPolicyStatus,
      disputePolicyRef: body.disputePolicyRef,
      disputePolicyStatus: body.disputePolicyStatus,
      reconciliationPolicyRef: body.reconciliationPolicyRef,
      reconciliationPolicyStatus: body.reconciliationPolicyStatus,
      actorId: actor,
      metadata: {
        ...(body.metadata ?? {}),
        access,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        adapterId: certification.adapter.adapterId,
        processorType: certification.adapter.processorType,
        processorEnvironment: certification.adapter.processorEnvironment,
        certificationStatus: certification.certificationStatus,
        livePaymentsAllowed: certification.livePaymentsAllowed,
        controls: certification.controls,
        livePaymentCaptured: false,
        humanReviewRequired: certification.adapter.humanReviewRequired,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-billing-connectors-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "security",
          "governance",
        ],
        sharingPermissions: ["payment-connector-certification-review"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-a-regulated-decision",
          "no-live-payment-capture-from-certification-route",
        ],
        redactionRequirements: [
          "redact-payment-connector-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["payment-processing-consent-governance-review"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: certification.adapter.id,
      outputType: "payment_connector_certification",
      audience: "internal",
      claimType: "fact",
      summary:
        "Payment connector certification was evaluated through governed controls; no live payment processor action was performed.",
      ruleVersion: "payment-connector-control-runtime-v0.1.0",
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        adapterId: certification.adapter.adapterId,
        certificationStatus: certification.certificationStatus,
        livePaymentsAllowed: certification.livePaymentsAllowed,
        livePaymentCaptured: false,
      },
    });

    const observability = createObservabilityEvent({
      eventType:
        certification.certificationStatus === "CERTIFIED"
          ? "PAYMENT_CONNECTOR_CERTIFIED"
          : "PAYMENT_CONNECTOR_CERTIFICATION_BLOCKED_OR_PENDING",
      domain: "connector",
      severity:
        certification.certificationStatus === "CERTIFIED" ? "INFO" : "WARN",
      message:
        "Payment connector certification evaluated through governed controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.billing.connectors",
      metadata: {
        route: "/api/billing/connectors",
        adapterId: certification.adapter.adapterId,
        certificationStatus: certification.certificationStatus,
        livePaymentsAllowed: certification.livePaymentsAllowed,
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
          resourceType: "payment_connector_certification_request",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/billing/connectors",
          },
        },
        {
          resourceType: "payment_connector_adapter",
          resourceId: certification.adapter.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/billing/connectors",
            adapterId: certification.adapter.adapterId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "payment_connector_certification",
        targetId: certification.adapter.id,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "payment-connector-certification-api-v0.1.0",
        replayVersion: "payment-connector-control-runtime-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          certificationStatus: certification.certificationStatus,
          livePaymentsAllowed: certification.livePaymentsAllowed,
          livePaymentCaptured: false,
        },
        metadata: {
          route: "/api/billing/connectors",
        },
      },
      metadata: {
        route: "/api/billing/connectors",
        operation: "payment-connector.certify",
      },
    });

    return NextResponse.json({
      ok: true,
      adapter: adapterResponse(certification.adapter),
      result: {
        certificationStatus: certification.certificationStatus,
        livePaymentsAllowed: certification.livePaymentsAllowed,
        livePaymentCaptured: false,
        controls: certification.controls,
        message: certification.message,
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
            : "Unknown payment connector certification error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
