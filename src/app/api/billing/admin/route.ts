import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  BillingAdminRecord,
  BillingAdminScopeRecord,
  getBillingAdminScopeRecord,
  listBillingAdminRecords,
} from "@/lib/billing/billingEventStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Billing Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for billing and entitlement reads
 *   while preventing payment state from becoming a regulated decision.
 * - Vol II: Protects tenant, payment, entitlement, access, and regulated
 *   service metadata through controlled disclosure.
 * - Vol III: Provides replay-safe, tenant-scoped billing reads before
 *   dashboards, entitlement modules, or operator workflows consume them.
 * - Vol IV: Supports billing review, webhook recovery, entitlement
 *   reconciliation, incident triage, and audit preparation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, connector governance, source authority, and human review.
 */

type BillingAdminQuery = {
  role: string;
  userId?: string | null;
  tenantId?: string | null;
  billingEventId?: string | null;
  eventType?: string | null;
  eventStatus?: string | null;
  sessionId?: string | null;
  entitlementId?: string | null;
  plan?: string | null;
  limit: number;
  includeEntitlement: boolean;
};

function createBillingAdminTraceId(): string {
  return `billing-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): BillingAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    tenantId: normalizeText(params.get("tenantId")),
    billingEventId: normalizeText(params.get("billingEventId")),
    eventType: normalizeText(params.get("eventType")),
    eventStatus: normalizeText(params.get("eventStatus")),
    sessionId: normalizeText(params.get("sessionId")),
    entitlementId: normalizeText(params.get("entitlementId")),
    plan: normalizeText(params.get("plan")),
    limit: normalizeLimit(params.get("limit")),
    includeEntitlement: normalizeBoolean(params.get("includeEntitlement"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: BillingAdminQuery): boolean {
  return !(privilegedRole(query.role) || query.tenantId);
}

function tenantScopeMismatch(input: {
  query: BillingAdminQuery;
  scopeRecord: BillingAdminScopeRecord | null;
}): boolean {
  if (!input.query.tenantId || !input.scopeRecord?.tenantId) {
    return false;
  }

  return input.query.tenantId !== input.scopeRecord.tenantId;
}

function billingEventResponse(record: BillingAdminRecord) {
  return {
    id: record.billingEvent.id,
    billingEventId: record.billingEvent.billingEventId,
    eventType: record.billingEvent.eventType,
    eventStatus: record.billingEvent.eventStatus,
    route: record.billingEvent.route,
    tenantId: record.billingEvent.tenantId,
    actorId: record.billingEvent.actorId,
    userId: record.billingEvent.userId,
    reportId: record.billingEvent.reportId,
    applicationId: record.billingEvent.applicationId,
    sessionId: record.billingEvent.sessionId,
    entitlementId: record.billingEvent.entitlementId,
    stripeEventType: record.billingEvent.stripeEventType,
    plan: record.billingEvent.plan,
    productName: record.billingEvent.productName,
    amountTotal: record.billingEvent.amountTotal,
    currency: record.billingEvent.currency,
    checkoutSessionCreated: record.billingEvent.checkoutSessionCreated,
    webhookReceived: record.billingEvent.webhookReceived,
    entitlementGranted: record.billingEvent.entitlementGranted,
    paymentConnectorLiveMode: record.billingEvent.paymentConnectorLiveMode,
    stubSignatureVerification:
      record.billingEvent.stubSignatureVerification,
    regulatedDecisionImpactAllowed:
      record.billingEvent.regulatedDecisionImpactAllowed,
    humanReviewRequired: record.billingEvent.humanReviewRequired,
    governanceVersion: record.billingEvent.governanceVersion,
    classification: record.billingEvent.classification,
    replayRef: record.billingEvent.replayRef,
    traceId: record.billingEvent.traceId,
    source: record.billingEvent.source,
    occurredAt: record.billingEvent.occurredAt,
    reviewedAt: record.billingEvent.reviewedAt,
    createdAt: record.billingEvent.createdAt,
    updatedAt: record.billingEvent.updatedAt,
  };
}

function entitlementResponse(record: BillingAdminRecord) {
  if (!record.entitlement) {
    return null;
  }

  return {
    id: record.entitlement.id,
    tenantId: record.entitlement.tenantId,
    plan: record.entitlement.plan,
    active: record.entitlement.active,
    permissions: record.entitlement.permissions,
    source: record.entitlement.source,
    sourceRef: record.entitlement.sourceRef,
    traceId: record.entitlement.traceId,
    replayRef: record.entitlement.replayRef,
    governanceVersion: record.entitlement.governanceVersion,
    classification: record.entitlement.classification,
    grantedBy: record.entitlement.grantedBy,
    revokedBy: record.entitlement.revokedBy,
    revokedAt: record.entitlement.revokedAt,
    createdAt: record.entitlement.createdAt,
    updatedAt: record.entitlement.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const traceId = createBillingAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.tenantId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "billing.admin-read",
      module: "api.billing.admin",
      traceId,
      schemaVersion: "billing-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/billing/admin",
        tenantId: query.tenantId,
        billingEventId: query.billingEventId,
        sessionId: query.sessionId,
        entitlementId: query.entitlementId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "billing.admin-read",
      module: "api.billing.admin",
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
        eventType: "BILLING_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Billing admin read was denied by runtime, role, or tenant scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.admin",
        metadata: {
          route: "/api/billing/admin",
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
          route: "/api/billing/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for billing admin reads or is missing governed tenant scope.",
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
      operation: "billing.admin-read",
      module: "api.billing.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "billing-admin-read-api-v0.1.0",
          "src/app/api/billing/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "billing-events-v0.1.0",
          "src/db/schema/billingEvents.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "entitlements-v0.1.0",
          "src/db/schema/entitlements.ts",
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

    const scopeRecord = await getBillingAdminScopeRecord({
      billingEventId: query.billingEventId,
      sessionId: query.sessionId,
      entitlementId: query.entitlementId,
    });

    if (tenantScopeMismatch({ query, scopeRecord })) {
      const observability = createObservabilityEvent({
        eventType: "BILLING_ADMIN_READ_TENANT_SCOPE_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Billing admin read was denied by tenant record scope.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.billing.admin",
        metadata: {
          route: "/api/billing/admin",
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
          route: "/api/billing/admin",
          tenantScopeDenied: true,
          access,
          scopeRecord,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this billing tenant record.",
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

    const records = await listBillingAdminRecords({
      billingEventId: query.billingEventId,
      eventType: query.eventType,
      eventStatus: query.eventStatus,
      tenantId: query.tenantId,
      sessionId: query.sessionId,
      entitlementId: query.entitlementId,
      plan: query.plan,
      limit: query.limit,
      includeEntitlement: query.includeEntitlement,
    });
    const billingEventsResponse = records.map((record) => ({
      billingEvent: billingEventResponse(record),
      entitlement: entitlementResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: billingEventsResponse.length,
        query: {
          tenantId: query.tenantId,
          billingEventId: query.billingEventId,
          eventType: query.eventType,
          eventStatus: query.eventStatus,
          sessionId: query.sessionId,
          entitlementId: query.entitlementId,
          plan: query.plan,
          includeEntitlement: query.includeEntitlement,
        },
        billingEvents: billingEventsResponse,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-billing-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "security",
          "governance",
        ],
        sharingPermissions: ["controlled-billing-entitlement-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-a-regulated-decision",
          "requires-governed-dashboard-access",
          "requires-security-review-before-third-party-disclosure",
        ],
        redactionRequirements: [
          "redact-payment-session-and-tenant-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "BILLING_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Billing events were read through governed tenant-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.billing.admin",
      metadata: {
        route: "/api/billing/admin",
        rowCount: billingEventsResponse.length,
        tenantId: query.tenantId,
        billingEventId: query.billingEventId,
        sessionId: query.sessionId,
        entitlementId: query.entitlementId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "billing_admin_read",
          resourceId:
            query.billingEventId ??
            query.sessionId ??
            query.entitlementId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/billing/admin",
            rowCount: billingEventsResponse.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "billing_admin_read",
        targetId:
          query.billingEventId ??
          query.sessionId ??
          query.entitlementId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "billing-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: billingEventsResponse.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: billingEventsResponse.length,
          tenantId: query.tenantId,
          billingEventId: query.billingEventId,
          sessionId: query.sessionId,
          entitlementId: query.entitlementId,
        },
        metadata: {
          route: "/api/billing/admin",
          operation: "billing.admin-read",
        },
      },
      metadata: {
        route: "/api/billing/admin",
        operation: "billing.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: billingEventsResponse.length,
      billingEvents: billingEventsResponse,
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
      eventType: "BILLING_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Billing admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.billing.admin",
      metadata: {
        route: "/api/billing/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown billing admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/billing/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown billing admin read error.",
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
