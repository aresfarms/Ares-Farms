import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  PartnerWorkflowAdminRecord,
  getPartnerWorkflowAdminScopeRecord,
  listPartnerWorkflowAdminRecords,
} from "@/lib/partners/partnerWorkflowAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Partner Workflow Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for lender and sponsor workflow reads.
 *
 * - Vol II: Protects borrower, lender, sponsor, disclosure, diligence,
 *   certification, and commitment posture from uncontrolled disclosure.
 *
 * - Vol III: Provides replay-safe, record-scoped partner workflow reads
 *   before lender, sponsor, operator, underwriter, or admin modules consume data.
 *
 * - Vol IV: Supports due diligence monitoring, escalation, assignment,
 *   recovery, audit preparation, and dashboard-safe backend access.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

type PartnerAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  workflowId?: string | null;
  partnerType?: string | null;
  partnerId?: string | null;
  status?: string | null;
  workflowStage?: string | null;
  commitmentStatus?: string | null;
  dueDiligenceStatus?: string | null;
  disclosureStatus?: string | null;
  certificationStatus?: string | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createPartnerAdminTraceId(): string {
  return `partner-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): PartnerAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    workflowId: normalizeText(params.get("workflowId")),
    partnerType: normalizeText(params.get("partnerType")),
    partnerId: normalizeText(params.get("partnerId")),
    status: normalizeText(params.get("status")),
    workflowStage: normalizeText(params.get("workflowStage")),
    commitmentStatus: normalizeText(params.get("commitmentStatus")),
    dueDiligenceStatus: normalizeText(params.get("dueDiligenceStatus")),
    disclosureStatus: normalizeText(params.get("disclosureStatus")),
    certificationStatus: normalizeText(params.get("certificationStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: PartnerAdminQuery): boolean {
  return !privilegedRole(query.role) && !query.tenantId;
}

function normalizedPartnerType(value?: string | null): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

function rolePartnerAllowed(role: string, partnerType?: string | null): boolean {
  const normalized = normalizedPartnerType(partnerType);

  if (role === "lender") {
    return normalized === "LENDER";
  }

  if (role === "sponsor") {
    return normalized === "SPONSOR";
  }

  return true;
}

function partnerScopeRequired(query: PartnerAdminQuery): boolean {
  return (
    (query.role === "lender" || query.role === "sponsor") &&
    (!query.partnerId || !query.partnerType)
  );
}

function workflowResponse(record: PartnerWorkflowAdminRecord) {
  return {
    id: record.workflow.id,
    partnerType: record.workflow.partnerType,
    partnerId: record.workflow.partnerId,
    partnerName: record.workflow.partnerName,
    applicationId: record.workflow.applicationId,
    borrowerId: record.workflow.borrowerId,
    tenantId: record.workflow.tenantId,
    actorId: record.workflow.actorId,
    workflowType: record.workflow.workflowType,
    workflowStage: record.workflow.workflowStage,
    status: record.workflow.status,
    priority: record.workflow.priority,
    requestedAmount: record.workflow.requestedAmount,
    programType: record.workflow.programType,
    commitmentStatus: record.workflow.commitmentStatus,
    dueDiligenceStatus: record.workflow.dueDiligenceStatus,
    disclosureStatus: record.workflow.disclosureStatus,
    certificationStatus: record.workflow.certificationStatus,
    advisoryOnly: record.workflow.advisoryOnly,
    finalActionAllowed: record.workflow.finalActionAllowed,
    borrowerDisclosureAllowed: record.workflow.borrowerDisclosureAllowed,
    humanReviewRequired: record.workflow.humanReviewRequired,
    assignedTo: record.workflow.assignedTo,
    escalationStatus: record.workflow.escalationStatus,
    governanceVersion: record.workflow.governanceVersion,
    classification: record.workflow.classification,
    replayRef: record.workflow.replayRef,
    traceId: record.workflow.traceId,
    source: record.workflow.source,
    dueAt: record.workflow.dueAt,
    reviewedAt: record.workflow.reviewedAt,
    completedAt: record.workflow.completedAt,
    createdAt: record.workflow.createdAt,
    updatedAt: record.workflow.updatedAt,
  };
}

function applicationResponse(record: PartnerWorkflowAdminRecord) {
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

function propertyResponse(record: PartnerWorkflowAdminRecord) {
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
  records: PartnerWorkflowAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: PartnerAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    if (!record.workflow.applicationId) {
      continue;
    }

    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "partner-workflow.admin-read",
        module: "api.partners.admin",
        traceId: input.traceId,
        resourceType: "application",
        applicationId: record.workflow.applicationId,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: null,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createPartnerAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.partnerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "partner-workflow.admin-read",
      module: "api.partners.admin",
      traceId,
      schemaVersion: "partner-workflow-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/partners/admin",
        workflowId: query.workflowId,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        partnerType: query.partnerType,
        partnerId: query.partnerId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: [
        "lender",
        "sponsor",
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "partner-workflow.admin-read",
      module: "api.partners.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });
    const partnerAllowed = rolePartnerAllowed(access.role, query.partnerType);
    const missingPartnerScope = partnerScopeRequired({
      ...query,
      role: access.role,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      !partnerAllowed ||
      scopeRequired({ ...query, role: access.role }) ||
      missingPartnerScope
    ) {
      const observability = createObservabilityEvent({
        eventType: "PARTNER_WORKFLOW_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Partner workflow admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.admin",
        metadata: {
          route: "/api/partners/admin",
          runtimeGuard,
          access,
          partnerAllowed,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
          missingPartnerScope,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/partners/admin",
          accessDenied: true,
          access,
          partnerAllowed,
          missingPartnerScope,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for partner workflow admin reads or is missing governed scope.",
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
      operation: "partner-workflow.admin-read",
      module: "api.partners.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "partner-workflow-admin-read-api-v0.1.0",
          "src/app/api/partners/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "partner-workflows-v0.1.0",
          "src/db/schema/partnerWorkflows.ts",
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
          "partner-workflow-admin-read-runtime-v0.1.0",
          "src/lib/partners/partnerWorkflowAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getPartnerWorkflowAdminScopeRecord({
      workflowId: query.workflowId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "partner-workflow.admin-read",
          module: "api.partners.admin",
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
        eventType: "PARTNER_WORKFLOW_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Partner workflow admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.admin",
        metadata: {
          route: "/api/partners/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/partners/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this partner workflow record.",
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

    const records = await listPartnerWorkflowAdminRecords({
      workflowId: query.workflowId,
      partnerType: query.partnerType,
      partnerId: query.partnerId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      status: query.status,
      workflowStage: query.workflowStage,
      commitmentStatus: query.commitmentStatus,
      dueDiligenceStatus: query.dueDiligenceStatus,
      disclosureStatus: query.disclosureStatus,
      certificationStatus: query.certificationStatus,
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
        eventType: "PARTNER_WORKFLOW_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Partner workflow admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.admin",
        metadata: {
          route: "/api/partners/admin",
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
          route: "/api/partners/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more partner workflow records.",
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

    const partnerWorkflows = records.map((record) => ({
      workflow: workflowResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: partnerWorkflows.length,
        query: {
          workflowId: query.workflowId,
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          partnerType: query.partnerType,
          partnerId: query.partnerId,
          status: query.status,
        },
        partnerWorkflows,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "api-partners-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-lender",
          "authorized-sponsor",
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-partner-workflow-admin-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-partner-workflow-data",
          "not-a-final-commitment",
          "not-borrower-disclosable-without-approved-notice-context",
          "requires-governed-dashboard-access",
        ],
        redactionRequirements: [
          "redact-borrower-identifiers-before-partner-disclosure",
          "redact-partner-diligence-metadata-before-public-disclosure",
          "redact-property-address-before-non-authorized-disclosure",
        ],
        consentRequirements: ["authorized-partner-workflow-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "PARTNER_WORKFLOW_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Partner workflow records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.partners.admin",
      metadata: {
        route: "/api/partners/admin",
        rowCount: partnerWorkflows.length,
        workflowId: query.workflowId,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        partnerType: query.partnerType,
        partnerId: query.partnerId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "partner_workflow_admin_read",
          resourceId:
            query.workflowId ??
            query.applicationId ??
            query.partnerId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/partners/admin",
            rowCount: partnerWorkflows.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "partner_workflow_admin_read",
        targetId:
          query.workflowId ??
          query.applicationId ??
          query.partnerId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "partner-workflow-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: partnerWorkflows.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: partnerWorkflows.length,
          workflowId: query.workflowId,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          partnerType: query.partnerType,
          partnerId: query.partnerId,
        },
        metadata: {
          route: "/api/partners/admin",
          operation: "partner-workflow.admin-read",
        },
      },
      metadata: {
        route: "/api/partners/admin",
        operation: "partner-workflow.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: partnerWorkflows.length,
      partnerWorkflows,
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
      eventType: "PARTNER_WORKFLOW_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Partner workflow admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.partners.admin",
      metadata: {
        route: "/api/partners/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown partner workflow admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/partners/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown partner workflow admin read error.",
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
