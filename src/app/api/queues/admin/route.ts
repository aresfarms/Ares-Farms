import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  OperatorQueueAdminRecord,
  getOperatorQueueAdminScopeRecord,
  listOperatorQueueAdminRecords,
} from "@/lib/queues/operatorQueueAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Operator Queue Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for operator workflow reads.
 *
 * - Vol II: Protects borrower, application, queue, escalation, assignment,
 *   and review posture from uncontrolled disclosure.
 *
 * - Vol III: Provides replay-safe, record-scoped queue reads before operator,
 *   underwriter, auditor, or admin dashboards consume workflow data.
 *
 * - Vol IV: Supports review queues, escalation, assignment, backlog review,
 *   recovery, incident response, and audit preparation.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

type OperatorQueueAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  queueItemId?: string | null;
  queueType?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  status?: string | null;
  priority?: string | null;
  escalationStatus?: string | null;
  requiredRole?: string | null;
  assignedTo?: string | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createOperatorQueueAdminTraceId(): string {
  return `operator-queue-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): OperatorQueueAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    queueItemId: normalizeText(params.get("queueItemId")),
    queueType: normalizeText(params.get("queueType")),
    sourceType: normalizeText(params.get("sourceType")),
    sourceId: normalizeText(params.get("sourceId")),
    status: normalizeText(params.get("status")),
    priority: normalizeText(params.get("priority")),
    escalationStatus: normalizeText(params.get("escalationStatus")),
    requiredRole: normalizeText(params.get("requiredRole")),
    assignedTo: normalizeText(params.get("assignedTo")),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: OperatorQueueAdminQuery): boolean {
  return !privilegedRole(query.role) && !query.tenantId;
}

function queueItemResponse(record: OperatorQueueAdminRecord) {
  return {
    id: record.queueItem.id,
    queueType: record.queueItem.queueType,
    sourceType: record.queueItem.sourceType,
    sourceId: record.queueItem.sourceId,
    sourceTraceId: record.queueItem.sourceTraceId,
    applicationId: record.queueItem.applicationId,
    borrowerId: record.queueItem.borrowerId,
    tenantId: record.queueItem.tenantId,
    actorId: record.queueItem.actorId,
    status: record.queueItem.status,
    priority: record.queueItem.priority,
    escalationStatus: record.queueItem.escalationStatus,
    reviewReason: record.queueItem.reviewReason,
    requiredRole: record.queueItem.requiredRole,
    assignedTo: record.queueItem.assignedTo,
    lockedBy: record.queueItem.lockedBy,
    governanceVersion: record.queueItem.governanceVersion,
    classification: record.queueItem.classification,
    replayRef: record.queueItem.replayRef,
    traceId: record.queueItem.traceId,
    source: record.queueItem.source,
    metadata: record.queueItem.metadata,
    dueAt: record.queueItem.dueAt,
    lockedAt: record.queueItem.lockedAt,
    completedAt: record.queueItem.completedAt,
    createdAt: record.queueItem.createdAt,
    updatedAt: record.queueItem.updatedAt,
  };
}

function applicationResponse(record: OperatorQueueAdminRecord) {
  if (!record.application) {
    return null;
  }

  return {
    id: record.application.id,
    borrowerId: record.application.borrowerId,
    tenantId: record.application.tenantId,
    propertyId: record.application.propertyId,
    status: record.application.status,
    reviewStatus: record.application.reviewStatus,
    decisionStatus: record.application.decisionStatus,
    classification: record.application.classification,
    replayRef: record.application.replayRef,
  };
}

function propertyResponse(record: OperatorQueueAdminRecord) {
  if (!record.property) {
    return null;
  }

  return {
    id: record.property.id,
    tenantId: record.property.tenantId,
    name: record.property.name,
    city: record.property.city,
    state: record.property.state,
    county: record.property.county,
    country: record.property.country,
    classification: record.property.classification,
    replayRef: record.property.replayRef,
  };
}

async function evaluateRecordAccessForRecords(input: {
  records: OperatorQueueAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: OperatorQueueAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    if (!record.queueItem.applicationId) {
      continue;
    }

    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "operator-queue.admin-read",
        module: "api.queues.admin",
        traceId: input.traceId,
        resourceType: "application",
        applicationId: record.queueItem.applicationId,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: null,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createOperatorQueueAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "operator-queue.admin-read",
      module: "api.queues.admin",
      traceId,
      schemaVersion: "operator-queue-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/queues/admin",
        queueItemId: query.queueItemId,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        queueType: query.queueType,
        status: query.status,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: [
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "operator-queue.admin-read",
      module: "api.queues.admin",
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
        eventType: "OPERATOR_QUEUE_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Operator queue admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.admin",
        metadata: {
          route: "/api/queues/admin",
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
          route: "/api/queues/admin",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for operator queue admin reads or is missing governed scope.",
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
      operation: "operator-queue.admin-read",
      module: "api.queues.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "operator-queue-admin-read-api-v0.1.0",
          "src/app/api/queues/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "operator-review-queue-items-v0.1.0",
          "src/db/schema/operatorReviewQueues.ts",
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
          "operator-queue-admin-read-runtime-v0.1.0",
          "src/lib/queues/operatorQueueAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getOperatorQueueAdminScopeRecord({
      queueItemId: query.queueItemId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "operator-queue.admin-read",
          module: "api.queues.admin",
          traceId,
          resourceType: "application",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: null,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "OPERATOR_QUEUE_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Operator queue admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.admin",
        metadata: {
          route: "/api/queues/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/queues/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this operator queue record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess: requestedRecordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const records = await listOperatorQueueAdminRecords({
      queueItemId: query.queueItemId,
      queueType: query.queueType,
      sourceType: query.sourceType,
      sourceId: query.sourceId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      status: query.status,
      priority: query.priority,
      escalationStatus: query.escalationStatus,
      requiredRole: query.requiredRole,
      assignedTo: query.assignedTo,
      limit: query.limit,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
    });
    const recordAccess = await evaluateRecordAccessForRecords({
      records,
      access,
      query,
      traceId,
    });
    const deniedRecordAccess = recordAccess.filter((decision) => !decision.allowed);

    if (deniedRecordAccess.length > 0) {
      const observability = createObservabilityEvent({
        eventType: "OPERATOR_QUEUE_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Operator queue admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.admin",
        metadata: {
          route: "/api/queues/admin",
          deniedCount: deniedRecordAccess.length,
          access,
          deniedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/queues/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more operator queue records.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const queueItems = records.map((record) => ({
      queueItem: queueItemResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: queueItems.length,
        query: {
          queueItemId: query.queueItemId,
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          queueType: query.queueType,
          status: query.status,
          priority: query.priority,
        },
        queueItems,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "api-queues-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-operator-queue-admin-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-queue-data",
          "not-a-final-decision",
          "not-borrower-disclosable-without-approved-notice-context",
          "requires-governed-dashboard-access",
        ],
        redactionRequirements: [
          "redact-borrower-identifiers-before-public-disclosure",
          "redact-queue-review-metadata-before-non-authorized-disclosure",
          "redact-property-address-before-non-authorized-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "OPERATOR_QUEUE_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Operator queue records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.queues.admin",
      metadata: {
        route: "/api/queues/admin",
        rowCount: queueItems.length,
        queueItemId: query.queueItemId,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        queueType: query.queueType,
        status: query.status,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const targetId =
      query.queueItemId ?? query.applicationId ?? query.tenantId ?? traceId;
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "operator_queue_admin_read",
          resourceId: targetId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/queues/admin",
            rowCount: queueItems.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "operator_queue_admin_read",
        targetId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "operator-queue-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: queueItems.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: queueItems.length,
          queueItemId: query.queueItemId,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          queueType: query.queueType,
          status: query.status,
        },
        metadata: {
          route: "/api/queues/admin",
          operation: "operator-queue.admin-read",
        },
      },
      metadata: {
        route: "/api/queues/admin",
        operation: "operator-queue.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: queueItems.length,
      queueItems,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess: {
          evaluated: recordAccess.length,
          denied: deniedRecordAccess.length,
          requested: requestedRecordAccess,
          decisions: recordAccess,
        },
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "OPERATOR_QUEUE_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Operator queue admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.queues.admin",
      metadata: {
        route: "/api/queues/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown operator queue admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/queues/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown operator queue admin read error.",
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
