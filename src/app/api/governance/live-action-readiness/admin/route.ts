import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  LiveActionReadinessAdminRecord,
  LiveActionReadinessAdminScopeRecord,
  getLiveActionReadinessAdminScopeRecord,
  listLiveActionReadinessAdminRecords,
} from "@/lib/governance/liveActionReadinessAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Live Action Readiness Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for live-action readiness reads.
 * - Vol II: Protects tenant, borrower, source, notice, payment, credential,
 *   consent, and regulated-action boundaries.
 * - Vol III: Provides replay-safe readiness inspection before dashboards or
 *   operator workflows consume live-action promotion state.
 * - Vol IV: Supports runbook, rollback, dry-run, monitoring, incident
 *   response, human approval, and audit-evidence review.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, source authority, controlled disclosure, and evidence doctrine.
 */

type LiveActionReadinessAdminQuery = {
  role: string;
  userId?: string | null;
  tenantId?: string | null;
  borrowerId?: string | null;
  applicationId?: string | null;
  reviewId?: string | null;
  actionType?: string | null;
  readinessStatus?: string | null;
  targetExecutionId?: string | null;
  targetAdapterId?: string | null;
  targetProviderId?: string | null;
  targetSourceId?: string | null;
  readyForLiveAction?: boolean | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
};

type LiveActionReadinessRecordAccessDecision = {
  allowed: boolean;
  role: string;
  operation: string;
  module: string;
  traceId: string;
  reason: string;
  actorId?: string | null;
  requestedScope: {
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
    userId?: string | null;
  };
  targetScope: {
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
  };
  roleAccessAllowed: boolean;
  matchedScopes: string[];
  deniedScopes: string[];
};

function createLiveActionReadinessAdminTraceId(): string {
  return `live-action-readiness-admin-read-${Date.now()}-${Math.random()
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

function normalizeOptionalBoolean(value: string | null): boolean | null {
  if (value === null) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 25);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

function parseQuery(req: NextRequest): LiveActionReadinessAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    tenantId: normalizeText(params.get("tenantId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    applicationId: normalizeText(params.get("applicationId")),
    reviewId: normalizeText(params.get("reviewId")),
    actionType: normalizeText(params.get("actionType")),
    readinessStatus: normalizeText(params.get("readinessStatus")),
    targetExecutionId: normalizeText(params.get("targetExecutionId")),
    targetAdapterId: normalizeText(params.get("targetAdapterId")),
    targetProviderId: normalizeText(params.get("targetProviderId")),
    targetSourceId: normalizeText(params.get("targetSourceId")),
    readyForLiveAction: normalizeOptionalBoolean(
      params.get("readyForLiveAction")
    ),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: LiveActionReadinessAdminQuery): boolean {
  return !privilegedRole(query.role) && !query.tenantId;
}

function sameWhenBothPresent(
  requested: string | null | undefined,
  target: string | null | undefined
): boolean {
  return Boolean(requested && target && requested === target);
}

function mismatchWhenBothPresent(
  requested: string | null | undefined,
  target: string | null | undefined
): boolean {
  return Boolean(requested && target && requested !== target);
}

function reviewResponse(record: LiveActionReadinessAdminRecord) {
  const review = record.review;

  return {
    id: review.id,
    actionType: review.actionType,
    readinessStatus: review.readinessStatus,
    targetExecutionId: review.targetExecutionId,
    targetAdapterId: review.targetAdapterId,
    targetProviderId: review.targetProviderId,
    targetSourceId: review.targetSourceId,
    targetTenantId: review.targetTenantId,
    targetApplicationId: review.targetApplicationId,
    targetBorrowerId: review.targetBorrowerId,
    targetBillingEventId: review.targetBillingEventId,
    targetSessionId: review.targetSessionId,
    actorId: review.actorId,
    productionCredentialVaultRef: review.productionCredentialVaultRef,
    liveAdapterImplementationRef: review.liveAdapterImplementationRef,
    productionRunbookApprovalRef: review.productionRunbookApprovalRef,
    dryRunEvidenceRef: review.dryRunEvidenceRef,
    rollbackPlanRef: review.rollbackPlanRef,
    incidentResponsePlanRef: review.incidentResponsePlanRef,
    monitoringPlanRef: review.monitoringPlanRef,
    auditEvidenceExportRef: review.auditEvidenceExportRef,
    humanApprovalRef: review.humanApprovalRef,
    executionAuthorizationFound: review.executionAuthorizationFound,
    executionAuthorizationAllowed: review.executionAuthorizationAllowed,
    liveActionNotPreviouslyPerformed:
      review.liveActionNotPreviouslyPerformed,
    credentialApproved: review.credentialApproved,
    outagePolicyTested: review.outagePolicyTested,
    replayPolicyVerified: review.replayPolicyVerified,
    schemaContractVerified: review.schemaContractVerified,
    consentVerified: review.consentVerified,
    isolationVerified: review.isolationVerified,
    operationalRunbookApproved: review.operationalRunbookApproved,
    productionCredentialVaultPresent:
      review.productionCredentialVaultPresent,
    liveAdapterImplementationPresent:
      review.liveAdapterImplementationPresent,
    productionRunbookApprovalPresent:
      review.productionRunbookApprovalPresent,
    dryRunEvidencePresent: review.dryRunEvidencePresent,
    rollbackPlanPresent: review.rollbackPlanPresent,
    incidentResponsePlanPresent: review.incidentResponsePlanPresent,
    monitoringPlanPresent: review.monitoringPlanPresent,
    auditEvidenceExportPresent: review.auditEvidenceExportPresent,
    humanApprovalPresent: review.humanApprovalPresent,
    domainSpecificControlsSatisfied:
      review.domainSpecificControlsSatisfied,
    readyForLiveAction: review.readyForLiveAction,
    regulatedDecisionImpactAllowed:
      review.regulatedDecisionImpactAllowed,
    externalActionPerformed: review.externalActionPerformed,
    liveActionPerformed: review.liveActionPerformed,
    gateSnapshot: review.gateSnapshot,
    blockerReasons: review.blockerReasons,
    governanceVersion: review.governanceVersion,
    classification: review.classification,
    replayRef: review.replayRef,
    traceId: review.traceId,
    source: review.source,
    metadata: review.metadata,
    reviewedAt: review.reviewedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

function applicationResponse(record: LiveActionReadinessAdminRecord) {
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

function propertyResponse(record: LiveActionReadinessAdminRecord) {
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

function scopeFromRecord(record: LiveActionReadinessAdminRecord) {
  return {
    applicationId: record.review.targetApplicationId,
    borrowerId: record.review.targetBorrowerId,
    tenantId: record.review.targetTenantId,
  };
}

function evaluateLiveActionReadinessRecordAccess(input: {
  access: ReturnType<typeof evaluateAccess>;
  query: LiveActionReadinessAdminQuery;
  traceId: string;
  targetScope: {
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
  };
}): LiveActionReadinessRecordAccessDecision {
  const requestedScope = {
    applicationId: input.query.applicationId,
    borrowerId: input.query.borrowerId,
    tenantId: input.query.tenantId,
    userId: input.query.userId,
  };
  const matchedScopes: string[] = [];
  const deniedScopes: string[] = [];

  if (!input.access.allowed) {
    return {
      allowed: false,
      role: input.access.role,
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId: input.traceId,
      reason: "Route-level role access was denied before record access.",
      actorId: input.access.actorId ?? null,
      requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: false,
      matchedScopes,
      deniedScopes: ["role"],
    };
  }

  if (
    mismatchWhenBothPresent(
      requestedScope.applicationId,
      input.targetScope.applicationId
    )
  ) {
    deniedScopes.push("applicationId");
  }

  if (
    mismatchWhenBothPresent(
      requestedScope.borrowerId,
      input.targetScope.borrowerId
    )
  ) {
    deniedScopes.push("borrowerId");
  }

  if (
    mismatchWhenBothPresent(requestedScope.tenantId, input.targetScope.tenantId)
  ) {
    deniedScopes.push("tenantId");
  }

  if (deniedScopes.length > 0) {
    return {
      allowed: false,
      role: input.access.role,
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId: input.traceId,
      reason: "Requested readiness scope does not match the canonical record.",
      actorId: input.access.actorId ?? null,
      requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  if (privilegedRole(input.access.role)) {
    matchedScopes.push("privileged-role");

    return {
      allowed: true,
      role: input.access.role,
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId: input.traceId,
      reason:
        "Privileged role is authorized for governed live-action readiness reads.",
      actorId: input.access.actorId ?? null,
      requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  if (
    sameWhenBothPresent(requestedScope.tenantId, input.targetScope.tenantId)
  ) {
    matchedScopes.push("tenant");

    return {
      allowed: true,
      role: input.access.role,
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId: input.traceId,
      reason:
        "Institutional role is authorized within the readiness tenant scope.",
      actorId: input.access.actorId ?? null,
      requestedScope,
      targetScope: input.targetScope,
      roleAccessAllowed: true,
      matchedScopes,
      deniedScopes,
    };
  }

  deniedScopes.push("tenantId");

  return {
    allowed: false,
    role: input.access.role,
    operation: "live-action-readiness.admin-read",
    module: "api.governance.live-action-readiness.admin",
    traceId: input.traceId,
    reason:
      "Institutional role must provide tenant scope for live-action readiness reads.",
    actorId: input.access.actorId ?? null,
    requestedScope,
    targetScope: input.targetScope,
    roleAccessAllowed: true,
    matchedScopes,
    deniedScopes,
  };
}

function evaluateScopeRecordAccess(input: {
  access: ReturnType<typeof evaluateAccess>;
  query: LiveActionReadinessAdminQuery;
  traceId: string;
  scopeRecord: LiveActionReadinessAdminScopeRecord;
}) {
  return evaluateLiveActionReadinessRecordAccess({
    access: input.access,
    query: input.query,
    traceId: input.traceId,
    targetScope: {
      applicationId: input.scopeRecord.applicationId,
      borrowerId: input.scopeRecord.borrowerId,
      tenantId: input.scopeRecord.tenantId,
    },
  });
}

function evaluateRecordAccessForRecords(input: {
  records: LiveActionReadinessAdminRecord[];
  access: ReturnType<typeof evaluateAccess>;
  query: LiveActionReadinessAdminQuery;
  traceId: string;
}) {
  return input.records.map((record) =>
    evaluateLiveActionReadinessRecordAccess({
      access: input.access,
      query: input.query,
      traceId: input.traceId,
      targetScope: scopeFromRecord(record),
    })
  );
}

async function deniedResponse(input: {
  status: number;
  traceId: string;
  actor: string | null;
  runtimeGuard: ReturnType<typeof runRuntimeGuard>;
  access?: ReturnType<typeof evaluateAccess> | null;
  eventType: string;
  message: string;
  error: string;
  metadata?: Record<string, unknown>;
}) {
  const observability = createObservabilityEvent({
    eventType: input.eventType,
    domain: "security",
    severity: "WARN",
    message: input.message,
    traceId: input.traceId,
    replayRef: input.traceId,
    actorId: input.actor,
    module: "api.governance.live-action-readiness.admin",
    metadata: {
      route: "/api/governance/live-action-readiness/admin",
      runtimeAllowed: input.runtimeGuard.allowed,
      accessAllowed: input.access?.allowed ?? null,
      ...(input.metadata ?? {}),
    },
  });

  const evidence = await persistGovernanceEvidence({
    traceId: input.traceId,
    replayRef: input.traceId,
    observability,
    metadata: {
      route: "/api/governance/live-action-readiness/admin",
      accessDenied: true,
      access: input.access ?? null,
      ...(input.metadata ?? {}),
    },
  });

  return NextResponse.json(
    {
      ok: false,
      error: input.error,
      governance: {
        traceId: input.traceId,
        runtimeGuard: input.runtimeGuard,
        access: input.access ?? null,
        observability,
        evidence,
      },
    },
    { status: input.status }
  );
}

export async function GET(req: NextRequest) {
  const traceId = createLiveActionReadinessAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId,
      schemaVersion: "live-action-readiness-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/governance/live-action-readiness/admin",
        tenantId: query.tenantId,
        applicationId: query.applicationId,
        reviewId: query.reviewId,
        targetExecutionId: query.targetExecutionId,
        externalActionExpected: false,
        liveActionExpected: false,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      return deniedResponse({
        status: 403,
        traceId,
        actor,
        runtimeGuard,
        access,
        eventType: "LIVE_ACTION_READINESS_ADMIN_READ_ACCESS_DENIED",
        message:
          "Live action readiness admin read was denied by runtime, role, or tenant scope controls.",
        error:
          "Role is not authorized for live action readiness admin reads or is missing governed tenant scope.",
        metadata: {
          scopeRequired: scopeRequired({ ...query, role: access.role }),
          tenantId: query.tenantId,
          reviewId: query.reviewId,
          targetExecutionId: query.targetExecutionId,
        },
      });
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "live-action-readiness.admin-read",
      module: "api.governance.live-action-readiness.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "live-action-readiness-admin-read-api-v0.1.0",
          "src/app/api/governance/live-action-readiness/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "live-action-readiness-reviews-v0.1.0",
          "src/db/schema/liveActionReadinessReviews.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series v2026-05-24",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "live-action-readiness-admin-read-runtime-v0.1.0",
          "src/lib/governance/liveActionReadinessAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getLiveActionReadinessAdminScopeRecord({
      reviewId: query.reviewId,
      targetExecutionId: query.targetExecutionId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord
      ? evaluateScopeRecordAccess({
          access,
          query,
          traceId,
          scopeRecord,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      return deniedResponse({
        status: 403,
        traceId,
        actor,
        runtimeGuard,
        access,
        eventType: "LIVE_ACTION_READINESS_ADMIN_READ_RECORD_ACCESS_DENIED",
        message:
          "Live action readiness admin read was denied by record-level access control.",
        error:
          "Actor is not authorized for this live action readiness record.",
        metadata: {
          requestedRecordAccess,
        },
      });
    }

    const records = await listLiveActionReadinessAdminRecords({
      reviewId: query.reviewId,
      actionType: query.actionType,
      readinessStatus: query.readinessStatus,
      targetExecutionId: query.targetExecutionId,
      targetAdapterId: query.targetAdapterId,
      targetProviderId: query.targetProviderId,
      targetSourceId: query.targetSourceId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      readyForLiveAction: query.readyForLiveAction,
      limit: query.limit,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
    });
    const recordAccess = evaluateRecordAccessForRecords({
      records,
      access,
      query,
      traceId,
    });
    const deniedRecordAccess = recordAccess.filter(
      (decision) => !decision.allowed
    );

    if (deniedRecordAccess.length > 0) {
      return deniedResponse({
        status: 403,
        traceId,
        actor,
        runtimeGuard,
        access,
        eventType: "LIVE_ACTION_READINESS_ADMIN_READ_RECORD_ACCESS_DENIED",
        message:
          "Live action readiness admin read was denied by record-level access control.",
        error:
          "Actor is not authorized for one or more live action readiness records.",
        metadata: {
          deniedCount: deniedRecordAccess.length,
          deniedRecordAccess,
        },
      });
    }

    const readinessRecords = records.map((record) => ({
      review: reviewResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: readinessRecords.length,
        query,
        readinessRecords,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-live-action-readiness-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-live-action-readiness-review",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "requires-governed-dashboard-access",
          "requires-redaction-before-public-disclosure",
          "no-credential-disclosure",
        ],
        redactionRequirements: [
          "redact-credential-vault-and-live-adapter-implementation-references-before-public-disclosure",
        ],
        consentRequirements: ["institutional-live-action-review"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "LIVE_ACTION_READINESS_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Live action readiness records were read through governed record-scoped controls without performing live external action.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.governance.live-action-readiness.admin",
      metadata: {
        route: "/api/governance/live-action-readiness/admin",
        rowCount: readinessRecords.length,
        tenantId: query.tenantId,
        applicationId: query.applicationId,
        reviewId: query.reviewId,
        targetExecutionId: query.targetExecutionId,
        externalActionPerformed: false,
        liveActionPerformed: false,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "live_action_readiness_admin_read",
          resourceId:
            query.reviewId ??
            query.targetExecutionId ??
            query.applicationId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/live-action-readiness/admin",
            rowCount: readinessRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "live_action_readiness_admin_read",
        targetId:
          query.reviewId ??
          query.targetExecutionId ??
          query.applicationId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "live-action-readiness-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: readinessRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: readinessRecords.length,
          tenantId: query.tenantId,
          applicationId: query.applicationId,
          externalActionPerformed: false,
          liveActionPerformed: false,
        },
        metadata: {
          route: "/api/governance/live-action-readiness/admin",
          operation: "live-action-readiness.admin-read",
        },
      },
      metadata: {
        route: "/api/governance/live-action-readiness/admin",
        operation: "live-action-readiness.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: readinessRecords.length,
      readinessRecords,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "LIVE_ACTION_READINESS_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Live action readiness admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.live-action-readiness.admin",
      metadata: {
        route: "/api/governance/live-action-readiness/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown live action readiness admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/live-action-readiness/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown live action readiness admin read error.",
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
