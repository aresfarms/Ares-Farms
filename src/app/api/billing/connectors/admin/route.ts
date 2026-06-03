import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  PaymentConnectorAdminRecord,
  PaymentConnectorAdminScopeRecord,
  getPaymentConnectorAdminScopeRecord,
  listPaymentConnectorAdminRecords,
} from "@/lib/billing/paymentConnectorAdminStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Payment Connector Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for payment connector lifecycle reads.
 * - Vol II: Protects tenant, billing, credential, refund, dispute,
 *   reconciliation, and entitlement-adjacent metadata.
 * - Vol III: Provides replay-safe payment connector lifecycle reads before
 *   dashboards or operator workflows consume these records.
 * - Vol IV: Supports connector review, payment recovery, dispute/refund
 *   oversight, reconciliation, audit preparation, and escalation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, connector governance, controlled disclosure, and evidence review.
 */

type PaymentConnectorAdminQuery = {
  role: string;
  userId?: string | null;
  tenantId?: string | null;
  adapterId?: string | null;
  executionId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
  processorType?: string | null;
  certificationStatus?: string | null;
  executionStatus?: string | null;
  limit: number;
  includeExecutions: boolean;
  includeBillingEvents: boolean;
};

function createPaymentConnectorAdminTraceId(): string {
  return `payment-connector-admin-read-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) {
    return fallback;
  }

  return value.toLowerCase() !== "false";
}

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 25);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

function parseQuery(req: NextRequest): PaymentConnectorAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    tenantId: normalizeText(params.get("tenantId")),
    adapterId: normalizeText(params.get("adapterId")),
    executionId: normalizeText(params.get("executionId")),
    billingEventId: normalizeText(params.get("billingEventId")),
    sessionId: normalizeText(params.get("sessionId")),
    processorType: normalizeText(params.get("processorType")),
    certificationStatus: normalizeText(params.get("certificationStatus")),
    executionStatus: normalizeText(params.get("executionStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeExecutions: normalizeBoolean(params.get("includeExecutions"), true),
    includeBillingEvents: normalizeBoolean(
      params.get("includeBillingEvents"),
      true
    ),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: PaymentConnectorAdminQuery): boolean {
  return !(privilegedRole(query.role) || query.tenantId);
}

function tenantScopeMismatch(input: {
  query: PaymentConnectorAdminQuery;
  scopeRecord: PaymentConnectorAdminScopeRecord | null;
}): boolean {
  if (!input.query.tenantId || !input.scopeRecord?.tenantId) {
    return false;
  }

  return input.query.tenantId !== input.scopeRecord.tenantId;
}

function adapterResponse(record: PaymentConnectorAdminRecord) {
  return {
    id: record.adapter.id,
    adapterId: record.adapter.adapterId,
    adapterName: record.adapter.adapterName,
    processorName: record.adapter.processorName,
    processorType: record.adapter.processorType,
    processorEnvironment: record.adapter.processorEnvironment,
    paymentAuthorityRef: record.adapter.paymentAuthorityRef,
    certificationStatus: record.adapter.certificationStatus,
    livePaymentsAllowed: record.adapter.livePaymentsAllowed,
    credentialRef: record.adapter.credentialRef,
    credentialStatus: record.adapter.credentialStatus,
    credentialVaultRequired: record.adapter.credentialVaultRequired,
    webhookSecretRef: record.adapter.webhookSecretRef,
    webhookSignatureStatus: record.adapter.webhookSignatureStatus,
    outagePolicyRef: record.adapter.outagePolicyRef,
    outageStatus: record.adapter.outageStatus,
    replayPolicyRef: record.adapter.replayPolicyRef,
    replayStatus: record.adapter.replayStatus,
    schemaContractVersion: record.adapter.schemaContractVersion,
    refundPolicyRef: record.adapter.refundPolicyRef,
    refundPolicyStatus: record.adapter.refundPolicyStatus,
    disputePolicyRef: record.adapter.disputePolicyRef,
    disputePolicyStatus: record.adapter.disputePolicyStatus,
    reconciliationPolicyRef: record.adapter.reconciliationPolicyRef,
    reconciliationPolicyStatus: record.adapter.reconciliationPolicyStatus,
    consentRequired: record.adapter.consentRequired,
    isolationRequired: record.adapter.isolationRequired,
    humanReviewRequired: record.adapter.humanReviewRequired,
    livePaymentCaptured: record.adapter.livePaymentCaptured,
    lastCertifiedAt: record.adapter.lastCertifiedAt,
    revokedAt: record.adapter.revokedAt,
    governanceVersion: record.adapter.governanceVersion,
    classification: record.adapter.classification,
    replayRef: record.adapter.replayRef,
    traceId: record.adapter.traceId,
    source: record.adapter.source,
    createdAt: record.adapter.createdAt,
    updatedAt: record.adapter.updatedAt,
  };
}

function executionResponse(record: PaymentConnectorAdminRecord) {
  return record.executions.map((execution) => ({
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
    governanceVersion: execution.governanceVersion,
    classification: execution.classification,
    replayRef: execution.replayRef,
    traceId: execution.traceId,
    source: execution.source,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  }));
}

function billingEventResponse(record: PaymentConnectorAdminRecord) {
  return record.billingEvents.map((billingEvent) => ({
    id: billingEvent.id,
    billingEventId: billingEvent.billingEventId,
    eventType: billingEvent.eventType,
    eventStatus: billingEvent.eventStatus,
    route: billingEvent.route,
    tenantId: billingEvent.tenantId,
    actorId: billingEvent.actorId,
    userId: billingEvent.userId,
    sessionId: billingEvent.sessionId,
    entitlementId: billingEvent.entitlementId,
    plan: billingEvent.plan,
    amountTotal: billingEvent.amountTotal,
    currency: billingEvent.currency,
    checkoutSessionCreated: billingEvent.checkoutSessionCreated,
    webhookReceived: billingEvent.webhookReceived,
    entitlementGranted: billingEvent.entitlementGranted,
    paymentConnectorLiveMode: billingEvent.paymentConnectorLiveMode,
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
  }));
}

export async function GET(req: NextRequest) {
  const traceId = createPaymentConnectorAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.tenantId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "payment-connector.admin-read",
      module: "api.billing.connectors.admin",
      traceId,
      schemaVersion: "payment-connector-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/billing/connectors/admin",
        tenantId: query.tenantId,
        adapterId: query.adapterId,
        executionId: query.executionId,
        billingEventId: query.billingEventId,
        sessionId: query.sessionId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "payment-connector.admin-read",
      module: "api.billing.connectors.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      const observability = createObservabilityEvent({
        eventType: "PAYMENT_CONNECTOR_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Payment connector admin read was denied by runtime, role, or tenant scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.connectors.admin",
        metadata: {
          route: "/api/billing/connectors/admin",
          runtimeGuard,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/billing/connectors/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for payment connector admin reads or is missing governed tenant scope.",
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
      operation: "payment-connector.admin-read",
      module: "api.billing.connectors.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "payment-connector-admin-read-api-v0.1.0",
          "src/app/api/billing/connectors/admin/route.ts",
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
          "payment-connector-executions-v0.1.0",
          "src/db/schema/paymentConnectorExecutions.ts",
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
          "payment-connector-admin-read-runtime-v0.1.0",
          "src/lib/billing/paymentConnectorAdminStore.ts",
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

    const scopeRecord = await getPaymentConnectorAdminScopeRecord({
      executionId: query.executionId,
      billingEventId: query.billingEventId,
      sessionId: query.sessionId,
    });

    if (tenantScopeMismatch({ query, scopeRecord })) {
      const observability = createObservabilityEvent({
        eventType: "PAYMENT_CONNECTOR_ADMIN_READ_TENANT_SCOPE_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Payment connector admin read was denied by tenant record scope.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.connectors.admin",
        metadata: {
          route: "/api/billing/connectors/admin",
          access,
          scopeRecord,
          queryTenantId: query.tenantId,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/billing/connectors/admin",
          tenantScopeDenied: true,
          access,
          scopeRecord,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this payment connector tenant record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            scopeRecord,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const records = await listPaymentConnectorAdminRecords({
      adapterId: query.adapterId,
      executionId: query.executionId,
      billingEventId: query.billingEventId,
      sessionId: query.sessionId,
      tenantId: query.tenantId,
      processorType: query.processorType,
      certificationStatus: query.certificationStatus,
      executionStatus: query.executionStatus,
      limit: query.limit,
      includeExecutions: query.includeExecutions,
      includeBillingEvents: query.includeBillingEvents,
    });
    const paymentConnectorRecords = records.map((record) => ({
      adapter: adapterResponse(record),
      executions: executionResponse(record),
      billingEvents: billingEventResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: paymentConnectorRecords.length,
        query: {
          tenantId: query.tenantId,
          adapterId: query.adapterId,
          executionId: query.executionId,
          billingEventId: query.billingEventId,
          sessionId: query.sessionId,
          processorType: query.processorType,
          certificationStatus: query.certificationStatus,
          executionStatus: query.executionStatus,
          includeExecutions: query.includeExecutions,
          includeBillingEvents: query.includeBillingEvents,
        },
        paymentConnectors: paymentConnectorRecords,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-billing-connectors-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "security",
          "governance",
        ],
        sharingPermissions: ["controlled-payment-connector-lifecycle-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-a-regulated-decision",
          "credential-references-only",
          "requires-security-review-before-third-party-disclosure",
        ],
        redactionRequirements: [
          "redact-payment-session-credential-and-tenant-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "PAYMENT_CONNECTOR_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Payment connector lifecycle records were read through governed tenant-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.billing.connectors.admin",
      metadata: {
        route: "/api/billing/connectors/admin",
        rowCount: paymentConnectorRecords.length,
        tenantId: query.tenantId,
        adapterId: query.adapterId,
        executionId: query.executionId,
        billingEventId: query.billingEventId,
        sessionId: query.sessionId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "payment_connector_admin_read",
          resourceId:
            query.executionId ??
            query.adapterId ??
            query.billingEventId ??
            query.sessionId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/billing/connectors/admin",
            rowCount: paymentConnectorRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "payment_connector_admin_read",
        targetId:
          query.executionId ??
          query.adapterId ??
          query.billingEventId ??
          query.sessionId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "payment-connector-admin-read-api-v0.1.0",
        replayVersion: "payment-connector-admin-read-runtime-v0.1.0",
        eventCount: paymentConnectorRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: paymentConnectorRecords.length,
          tenantId: query.tenantId,
          adapterId: query.adapterId,
          executionId: query.executionId,
          billingEventId: query.billingEventId,
          sessionId: query.sessionId,
        },
        metadata: {
          route: "/api/billing/connectors/admin",
          operation: "payment-connector.admin-read",
        },
      },
      metadata: {
        route: "/api/billing/connectors/admin",
        operation: "payment-connector.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: paymentConnectorRecords.length,
      paymentConnectors: paymentConnectorRecords,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        scopeRecord,
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "PAYMENT_CONNECTOR_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Payment connector admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.billing.connectors.admin",
      metadata: {
        route: "/api/billing/connectors/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown payment connector admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/billing/connectors/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown payment connector admin read error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 }
    );
  }
}
