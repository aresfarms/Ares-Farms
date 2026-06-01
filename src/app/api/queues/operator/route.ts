import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  listOperatorReviewQueueItems,
  persistOperatorReviewQueueItem,
} from "@/lib/queues/operatorReviewQueueStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Operator Review Queue API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires accountable operational review authority and controlled access.
 *
 * - Vol II: Regulatory Governance
 *   Preserves borrower/application workflow boundaries before regulated,
 *   borrower-facing, lender-facing, or sponsor-facing reliance.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe durable queue state with version, classification,
 *   observability, record access, and evidence persistence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports review queues, assignment, escalation, backlog review, recovery,
 *   and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, observability, replayability, source authority,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

type QueueRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  queueType?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceTraceId?: string | null;
  status?: string | null;
  priority?: string | null;
  escalationStatus?: string | null;
  reviewReason?: string | null;
  requiredRole?: string | null;
  assignedTo?: string | null;
  dueAt?: string | null;
  metadata?: Record<string, unknown>;
};

function createQueueTraceId(action: string): string {
  return `operator-queue-${action}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: QueueRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: QueueRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function privilegedQueueRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function tenantFilterRequired(role: string, tenantId?: string | null): boolean {
  return !privilegedQueueRole(role) && !tenantId;
}

function queueItemResponse(item: Awaited<ReturnType<typeof persistOperatorReviewQueueItem>>["queueItem"]) {
  return {
    id: item.id,
    queueType: item.queueType,
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    sourceTraceId: item.sourceTraceId,
    applicationId: item.applicationId,
    borrowerId: item.borrowerId,
    tenantId: item.tenantId,
    status: item.status,
    priority: item.priority,
    escalationStatus: item.escalationStatus,
    reviewReason: item.reviewReason,
    requiredRole: item.requiredRole,
    assignedTo: item.assignedTo,
    dueAt: item.dueAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createQueueTraceId("create");

  try {
    const body = (await req.json()) as QueueRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "operator-queue.create",
      module: "api.queues.operator",
      traceId,
      schemaVersion: "operator-review-queue-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/queues/operator",
        queueType: body.queueType ?? null,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "OPERATOR_QUEUE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Operator queue creation was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.operator",
        metadata: {
          route: "/api/queues/operator",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/queues/operator",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked operator queue creation.",
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
      allowedRoles: [
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "operator-queue.create",
      module: "api.queues.operator",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed || tenantFilterRequired(access.role, body.tenantId)) {
      const observability = createObservabilityEvent({
        eventType: "OPERATOR_QUEUE_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Operator queue creation was denied by access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.operator",
        metadata: {
          route: "/api/queues/operator",
          access,
          tenantRequired: tenantFilterRequired(access.role, body.tenantId),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/queues/operator",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for operator queue creation or is missing tenant scope.",
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

    const recordAccess = body.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "operator-queue.create",
          module: "api.queues.operator",
          traceId,
          resourceType: "application",
          applicationId: body.applicationId,
          borrowerId: body.borrowerId,
          tenantId: body.tenantId,
          userId: body.userId,
        })
      : null;

    if (recordAccess && !recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "OPERATOR_QUEUE_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Operator queue creation was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.operator",
        metadata: {
          route: "/api/queues/operator",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/queues/operator",
          recordAccessDenied: true,
          access,
          recordAccess,
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
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "operator-queue.create",
      module: "api.queues.operator",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "operator-review-queue-v0.1.0",
          "src/app/api/queues/operator/route.ts",
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
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "operator-review-queue-runtime-v0.1.0",
          "src/lib/queues/operatorReviewQueueStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "institutional",
      classificationSource: "api-queues-operator-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "authorized-underwriter",
        "auditor",
        "governance",
      ],
      sharingPermissions: ["operator-review-queue"],
      aiUsagePermissions: ["summarize", "classify"],
      exportRestrictions: [
        "not-public-queue-data",
        "requires-governed-access",
      ],
      redactionRequirements: [
        "redact-borrower-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["authorized-operational-processing"],
    });

    const persisted = await persistOperatorReviewQueueItem({
      traceId,
      queueType: body.queueType,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      sourceTraceId: body.sourceTraceId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      status: body.status,
      priority: body.priority,
      escalationStatus: body.escalationStatus,
      reviewReason: body.reviewReason,
      requiredRole: body.requiredRole,
      assignedTo: body.assignedTo,
      dueAt: body.dueAt,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const queueItem = queueItemResponse(persisted.queueItem);

    const classifiedOutput = classifyRecord(queueItem, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "institutional",
      classificationSource: "api-queues-operator-route-output",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "authorized-underwriter",
        "auditor",
        "governance",
      ],
      sharingPermissions: ["operator-review-queue"],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-a-final-decision",
        "requires-human-review-context",
      ],
      redactionRequirements: [
        "redact-borrower-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["authorized-operational-processing"],
    });

    const explanation = createExplanationLineage({
      outputIdentifier: String(persisted.queueItem.id),
      outputType: "operator_review_queue_item",
      audience: "internal",
      claimType: "fact",
      summary:
        "Operator review queue item was persisted for governed review, assignment, escalation, and audit preparation.",
      ruleVersion: "operator-review-queue-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        queueItemId: persisted.queueItem.id,
        queueType: persisted.queueItem.queueType,
        sourceType: persisted.queueItem.sourceType,
        applicationId: persisted.queueItem.applicationId,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "OPERATOR_REVIEW_QUEUE_ITEM_CREATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Operator review queue item was persisted through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.queues.operator",
      metadata: {
        queueItemId: persisted.queueItem.id,
        queueType: persisted.queueItem.queueType,
        status: persisted.queueItem.status,
        priority: persisted.queueItem.priority,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "operator_queue_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/queues/operator",
            stage: "input",
          },
        },
        {
          resourceType: "operator_queue_item",
          resourceId: String(persisted.queueItem.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/queues/operator",
            stage: "output",
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "operator_review_queue",
        targetId: String(persisted.queueItem.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "operator-review-queue-runtime-v0.1.0",
        replayVersion: "operator-review-queue-replay-v0.1.0",
        metadata: {
          queueType: persisted.queueItem.queueType,
          status: persisted.queueItem.status,
        },
      },
      metadata: {
        route: "/api/queues/operator",
        queueItemId: persisted.queueItem.id,
        durableGovernanceEvidence: true,
      },
    });

    return NextResponse.json({
      ok: true,
      queueItem,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
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
            : "Unknown operator review queue error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const traceId = createQueueTraceId("list");

  try {
    const params = req.nextUrl.searchParams;
    const role = params.get("role") ?? "user";
    const tenantId = params.get("tenantId");
    const status = params.get("status");
    const queueType = params.get("queueType");
    const limit = Number(params.get("limit") ?? 25);
    const actor = params.get("userId") ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "operator-queue.list",
      module: "api.queues.operator",
      traceId,
      schemaVersion: "operator-review-queue-list-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/queues/operator",
        tenantId,
        status,
        queueType,
      },
    });

    const access = evaluateAccess({
      role,
      allowedRoles: [
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "operator-queue.list",
      module: "api.queues.operator",
      traceId,
      actorId: actor,
      tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      tenantFilterRequired(access.role, tenantId)
    ) {
      const observability = createObservabilityEvent({
        eventType: "OPERATOR_QUEUE_LIST_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Operator queue list was denied by access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.queues.operator",
        metadata: {
          route: "/api/queues/operator",
          runtimeGuard,
          access,
          tenantRequired: tenantFilterRequired(access.role, tenantId),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/queues/operator",
          listAccessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for operator queue listing or is missing tenant scope.",
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
      operation: "operator-queue.list",
      module: "api.queues.operator",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "operator-review-queue-list-v0.1.0",
          "src/app/api/queues/operator/route.ts",
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
          "api",
          "operator-review-queue-runtime-v0.1.0",
          "src/lib/queues/operatorReviewQueueStore.ts",
          traceId
        ),
      ],
    });

    const queueItems = await listOperatorReviewQueueItems({
      tenantId,
      status,
      queueType,
      limit,
    });
    const safeQueueItems = queueItems.map(queueItemResponse);

    const classifiedOutput = classifyRecord(
      {
        count: safeQueueItems.length,
        queueItems: safeQueueItems,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "api-queues-operator-route-list-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["operator-review-queue"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-queue-data",
          "requires-governed-access",
        ],
        redactionRequirements: [
          "redact-borrower-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "OPERATOR_REVIEW_QUEUE_LISTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Operator review queue items were listed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.queues.operator",
      metadata: {
        rowCount: safeQueueItems.length,
        tenantId,
        status,
        queueType,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "operator_queue_list",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/queues/operator",
            rowCount: safeQueueItems.length,
          },
        },
      ],
      observability,
      metadata: {
        route: "/api/queues/operator",
        rowCount: safeQueueItems.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: safeQueueItems.length,
      queueItems: safeQueueItems,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        classification: classifiedOutput.classification,
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
            : "Unknown operator review queue list error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
