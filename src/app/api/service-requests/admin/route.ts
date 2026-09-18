import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import {
  ServiceRequestType,
  listServiceRequests,
} from "@/lib/serviceRequests/serviceRequestStore";

/**
 * Service Request Admin Read API (operator / licensed-professional queue)
 *
 * The governed read behind the fulfillment queue: the PE sees incoming
 * environmental_report_order rows; the licensed lender sees incoming
 * financing_deal_intake rows. Role-gated and fully governed — this closes the
 * "governed intake → licensed professional fulfills" loop.
 *
 * Master Volume Governance:
 * - Vol I: accountable authority for a RESTRICTED read; no regulated decision
 *   is made by viewing the queue.
 * - Vol II (Section 1071 firewall): the underlying record holds no demographic
 *   data; contact PII is disclosed only to authorized operators.
 * - Vol III / III-B (GOV-RUNTIME-001 §3.49): runtime guard + version lineage +
 *   classification (RESTRICTED) + observability + persisted evidence on every
 *   read. Access is role-gated (operator/admin/governance) via evaluateAccess.
 * - Vol V (CANON-CLASS-001, HITL-GOV-001): RESTRICTED, human-review posture.
 */

type ServiceRequestAdminQuery = {
  role: string;
  userId?: string | null;
  tenantId?: string | null;
  requestType?: ServiceRequestType | null;
  routedTo?: string | null;
  status?: string | null;
};

function parseQuery(req: NextRequest): ServiceRequestAdminQuery {
  const p = req.nextUrl.searchParams;
  const requestType = p.get("requestType");
  return {
    role: p.get("role") ?? "",
    userId: p.get("userId"),
    tenantId: p.get("tenantId"),
    requestType:
      requestType === "environmental_report_order" ||
      requestType === "financing_deal_intake"
        ? requestType
        : null,
    routedTo: p.get("routedTo"),
    status: p.get("status"),
  };
}

function createTraceId(): string {
  return `service-requests-admin-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET(req: NextRequest) {
  const traceId = createTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.tenantId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "service-requests.admin-read",
      module: "api.service-requests.admin",
      traceId,
      schemaVersion: "service-requests-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/service-requests/admin",
        requestType: query.requestType,
        routedTo: query.routedTo,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "service-requests.admin-read",
      module: "api.service-requests.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId ?? undefined,
    });

    if (!runtimeGuard.allowed || !access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "SERVICE_REQUESTS_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Service request admin read was denied by runtime or role controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.service-requests.admin",
        metadata: { route: "/api/service-requests/admin", runtimeGuard, access },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/service-requests/admin", accessDenied: true },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for service request admin reads.",
          governance: { traceId, runtimeGuard, access, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "service-requests.admin-read",
      module: "api.service-requests.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "service-requests-admin-read-v0.1.0",
          "src/app/api/service-requests/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "service-requests-v0.1.0",
          "src/db/schema/serviceRequests.ts",
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
          "service-request-runtime-v0.1.0",
          "src/lib/serviceRequests/serviceRequestStore.ts",
          traceId
        ),
      ],
    });

    const records = await listServiceRequests({
      requestType: query.requestType,
      routedTo: query.routedTo,
      status: query.status,
      tenantId: query.tenantId,
    });

    const classifiedOutput = classifyRecord(
      { count: records.length },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "institutional",
        classificationSource: "api-service-requests-admin-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance"],
        sharingPermissions: ["regulated-operational-review"],
        aiUsagePermissions: ["summarize"],
        exportRestrictions: ["requires-governed-access", "requires-human-review"],
        redactionRequirements: ["redact-contact-pii-before-external-disclosure"],
        consentRequirements: [],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "SERVICE_REQUESTS_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message: "Service request queue read by an authorized operator.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.service-requests.admin",
      metadata: {
        route: "/api/service-requests/admin",
        requestType: query.requestType,
        count: records.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "service_requests_admin_read",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: { route: "/api/service-requests/admin", count: records.length },
        },
      ],
      observability,
      metadata: { route: "/api/service-requests/admin" },
    });

    return NextResponse.json({
      ok: true,
      records,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        outputClassification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "SERVICE_REQUESTS_ADMIN_READ_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Service request admin read encountered an unhandled error.",
      traceId,
      replayRef: traceId,
      module: "api.service-requests.admin",
      metadata: {
        route: "/api/service-requests/admin",
        error: error instanceof Error ? error.message : "Unknown error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/service-requests/admin", runtimeError: true },
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
