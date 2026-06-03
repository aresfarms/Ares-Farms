import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  listPartnerWorkflows,
  persistPartnerWorkflow,
} from "@/lib/partners/partnerWorkflowStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Lender and Sponsor Workflow API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires governed institutional workflow authority and accountable access.
 *
 * - Vol II: Regulatory Governance
 *   Preserves borrower protection, controlled disclosure, lender, sponsor,
 *   and regulated-finance workflow boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe durable workflow state before lender or sponsor
 *   portals expose sensitive records.
 *
 * - Vol IV: Operational Runbooks
 *   Supports due diligence, review queues, assignment, escalation, recovery,
 *   and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, observability, replayability, source authority,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

type PartnerWorkflowRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  partnerType?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  workflowType?: string | null;
  workflowStage?: string | null;
  status?: string | null;
  priority?: string | null;
  requestedAmount?: unknown;
  programType?: string | null;
  commitmentStatus?: string | null;
  dueDiligenceStatus?: string | null;
  disclosureStatus?: string | null;
  certificationStatus?: string | null;
  assignedTo?: string | null;
  escalationStatus?: string | null;
  dueAt?: string | null;
  metadata?: Record<string, unknown>;
};

function createPartnerWorkflowTraceId(action: string): string {
  return `partner-workflow-${action}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: PartnerWorkflowRequest): string | null {
  return body.userId ?? body.borrowerId ?? body.partnerId ?? null;
}

function routeActorRole(body: PartnerWorkflowRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function tenantFilterRequired(role: string, tenantId?: string | null): boolean {
  return !privilegedRole(role) && !tenantId;
}

function partnerTypeAllowedForRole(role: string, partnerType?: string | null) {
  const normalizedPartnerType = partnerType?.trim().toUpperCase();

  if (role === "lender") {
    return normalizedPartnerType === "LENDER";
  }

  if (role === "sponsor") {
    return normalizedPartnerType === "SPONSOR";
  }

  return true;
}

function workflowResponse(
  workflow: Awaited<ReturnType<typeof persistPartnerWorkflow>>["workflow"]
) {
  return {
    id: workflow.id,
    partnerType: workflow.partnerType,
    partnerId: workflow.partnerId,
    partnerName: workflow.partnerName,
    applicationId: workflow.applicationId,
    borrowerId: workflow.borrowerId,
    tenantId: workflow.tenantId,
    workflowType: workflow.workflowType,
    workflowStage: workflow.workflowStage,
    status: workflow.status,
    priority: workflow.priority,
    requestedAmount: workflow.requestedAmount,
    programType: workflow.programType,
    commitmentStatus: workflow.commitmentStatus,
    dueDiligenceStatus: workflow.dueDiligenceStatus,
    disclosureStatus: workflow.disclosureStatus,
    certificationStatus: workflow.certificationStatus,
    advisoryOnly: workflow.advisoryOnly,
    finalActionAllowed: workflow.finalActionAllowed,
    borrowerDisclosureAllowed: workflow.borrowerDisclosureAllowed,
    humanReviewRequired: workflow.humanReviewRequired,
    assignedTo: workflow.assignedTo,
    escalationStatus: workflow.escalationStatus,
    dueAt: workflow.dueAt,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createPartnerWorkflowTraceId("create");

  try {
    const body = (await req.json()) as PartnerWorkflowRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "partner-workflow.create",
      module: "api.partners.workflows",
      traceId,
      schemaVersion: "partner-workflow-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/partners/workflows",
        partnerType: body.partnerType ?? null,
        partnerId: body.partnerId ?? null,
        applicationId: body.applicationId ?? null,
        finalActionAllowed: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PARTNER_WORKFLOW_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Partner workflow creation was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.workflows",
        metadata: {
          route: "/api/partners/workflows",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/partners/workflows",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked partner workflow creation.",
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
        "lender",
        "sponsor",
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "partner-workflow.create",
      module: "api.partners.workflows",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });
    const rolePartnerAllowed = partnerTypeAllowedForRole(
      access.role,
      body.partnerType
    );

    if (
      !access.allowed ||
      !rolePartnerAllowed ||
      tenantFilterRequired(access.role, body.tenantId)
    ) {
      const observability = createObservabilityEvent({
        eventType: "PARTNER_WORKFLOW_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Partner workflow creation was denied by access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.workflows",
        metadata: {
          route: "/api/partners/workflows",
          access,
          rolePartnerAllowed,
          tenantRequired: tenantFilterRequired(access.role, body.tenantId),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/partners/workflows",
          accessDenied: true,
          access,
          rolePartnerAllowed,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for this partner workflow or is missing tenant scope.",
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
          operation: "partner-workflow.create",
          module: "api.partners.workflows",
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
        eventType: "PARTNER_WORKFLOW_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Partner workflow creation was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.workflows",
        metadata: {
          route: "/api/partners/workflows",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/partners/workflows",
          recordAccessDenied: true,
          access,
          recordAccess,
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
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "partner-workflow.create",
      module: "api.partners.workflows",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "partner-workflow-v0.1.0",
          "src/app/api/partners/workflows/route.ts",
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
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "partner-workflow-runtime-v0.1.0",
          "src/lib/partners/partnerWorkflowStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "institutional",
      classificationSource: "api-partners-workflows-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-lender",
        "authorized-sponsor",
        "authorized-operator",
        "authorized-underwriter",
        "governance",
      ],
      sharingPermissions: [
        "lender-workflow-review",
        "sponsor-workflow-review",
        "regulated-operational-processing",
      ],
      aiUsagePermissions: ["classify", "summarize"],
      exportRestrictions: [
        "not-a-final-commitment",
        "not-a-borrower-disclosure",
        "requires-governed-access",
      ],
      redactionRequirements: [
        "redact-borrower-identifiers-before-partner-disclosure",
      ],
      consentRequirements: ["authorized-partner-workflow-processing"],
    });

    const persisted = await persistPartnerWorkflow({
      traceId,
      partnerType: body.partnerType,
      partnerId: body.partnerId,
      partnerName: body.partnerName,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      workflowType: body.workflowType,
      workflowStage: body.workflowStage,
      status: body.status,
      priority: body.priority,
      requestedAmount: body.requestedAmount,
      programType: body.programType,
      commitmentStatus: body.commitmentStatus,
      dueDiligenceStatus: body.dueDiligenceStatus,
      disclosureStatus: body.disclosureStatus,
      certificationStatus: body.certificationStatus,
      assignedTo: body.assignedTo,
      escalationStatus: body.escalationStatus,
      dueAt: body.dueAt,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });
    const workflow = workflowResponse(persisted.workflow);

    const classifiedOutput = classifyRecord(workflow, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "institutional",
      classificationSource: "api-partners-workflows-route-output",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-lender",
        "authorized-sponsor",
        "authorized-operator",
        "authorized-underwriter",
        "governance",
      ],
      sharingPermissions: [
        "lender-workflow-review",
        "sponsor-workflow-review",
        "regulated-operational-processing",
      ],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-a-final-commitment",
        "not-a-borrower-disclosure",
        "requires-human-review-before-reliance",
      ],
      redactionRequirements: [
        "redact-borrower-identifiers-before-partner-disclosure",
      ],
      consentRequirements: ["authorized-partner-workflow-processing"],
    });

    const explanation = createExplanationLineage({
      outputIdentifier: String(persisted.workflow.id),
      outputType: "partner_workflow",
      audience: "governance",
      claimType: "fact",
      summary:
        "Lender or sponsor workflow was persisted as governed advisory workflow state; no final commitment or borrower disclosure is allowed.",
      ruleVersion: "partner-workflow-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        workflowId: persisted.workflow.id,
        partnerType: persisted.workflow.partnerType,
        partnerId: persisted.workflow.partnerId,
        applicationId: persisted.workflow.applicationId,
        finalActionAllowed: persisted.workflow.finalActionAllowed,
        borrowerDisclosureAllowed:
          persisted.workflow.borrowerDisclosureAllowed,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "PARTNER_WORKFLOW_CREATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Lender or sponsor workflow was persisted through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.partners.workflows",
      metadata: {
        workflowId: persisted.workflow.id,
        partnerType: persisted.workflow.partnerType,
        partnerId: persisted.workflow.partnerId,
        status: persisted.workflow.status,
        finalActionAllowed: persisted.workflow.finalActionAllowed,
        borrowerDisclosureAllowed:
          persisted.workflow.borrowerDisclosureAllowed,
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
          resourceType: "partner_workflow_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/partners/workflows",
            stage: "input",
          },
        },
        {
          resourceType: "partner_workflow",
          resourceId: String(persisted.workflow.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/partners/workflows",
            stage: "output",
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "partner_workflow",
        targetId: String(persisted.workflow.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "partner-workflow-runtime-v0.1.0",
        replayVersion: "partner-workflow-replay-v0.1.0",
        metadata: {
          partnerType: persisted.workflow.partnerType,
          status: persisted.workflow.status,
        },
      },
      metadata: {
        route: "/api/partners/workflows",
        workflowId: persisted.workflow.id,
        durableGovernanceEvidence: true,
      },
    });

    return NextResponse.json({
      ok: true,
      workflow,
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
            : "Unknown partner workflow error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const traceId = createPartnerWorkflowTraceId("list");

  try {
    const params = req.nextUrl.searchParams;
    const role = params.get("role") ?? "user";
    const tenantId = params.get("tenantId");
    const partnerType = params.get("partnerType");
    const partnerId = params.get("partnerId");
    const status = params.get("status");
    const limit = Number(params.get("limit") ?? 25);
    const actor = params.get("userId") ?? partnerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "partner-workflow.list",
      module: "api.partners.workflows",
      traceId,
      schemaVersion: "partner-workflow-list-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/partners/workflows",
        partnerType,
        partnerId,
        tenantId,
        status,
      },
    });

    const access = evaluateAccess({
      role,
      allowedRoles: [
        "lender",
        "sponsor",
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "partner-workflow.list",
      module: "api.partners.workflows",
      traceId,
      actorId: actor,
      tenantId,
    });
    const rolePartnerAllowed = partnerTypeAllowedForRole(access.role, partnerType);
    const partnerFilterRequired =
      (access.role === "lender" || access.role === "sponsor") && !partnerId;

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      !rolePartnerAllowed ||
      tenantFilterRequired(access.role, tenantId) ||
      partnerFilterRequired
    ) {
      const observability = createObservabilityEvent({
        eventType: "PARTNER_WORKFLOW_LIST_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Partner workflow list was denied by access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.partners.workflows",
        metadata: {
          route: "/api/partners/workflows",
          runtimeGuard,
          access,
          rolePartnerAllowed,
          tenantRequired: tenantFilterRequired(access.role, tenantId),
          partnerFilterRequired,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/partners/workflows",
          listAccessDenied: true,
          access,
          rolePartnerAllowed,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for partner workflow listing or is missing required scope.",
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
      operation: "partner-workflow.list",
      module: "api.partners.workflows",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "partner-workflow-list-v0.1.0",
          "src/app/api/partners/workflows/route.ts",
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
          "api",
          "partner-workflow-runtime-v0.1.0",
          "src/lib/partners/partnerWorkflowStore.ts",
          traceId
        ),
      ],
    });

    const workflows = await listPartnerWorkflows({
      partnerType,
      partnerId,
      tenantId,
      status,
      limit,
    });
    const safeWorkflows = workflows.map(workflowResponse);

    const classifiedOutput = classifyRecord(
      {
        count: safeWorkflows.length,
        workflows: safeWorkflows,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "api-partners-workflows-route-list-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-lender",
          "authorized-sponsor",
          "authorized-operator",
          "authorized-underwriter",
          "governance",
        ],
        sharingPermissions: [
          "lender-workflow-review",
          "sponsor-workflow-review",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-workflow-data",
          "requires-governed-access",
        ],
        redactionRequirements: [
          "redact-borrower-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["authorized-partner-workflow-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "PARTNER_WORKFLOWS_LISTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Lender or sponsor workflows were listed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.partners.workflows",
      metadata: {
        rowCount: safeWorkflows.length,
        partnerType,
        partnerId,
        tenantId,
        status,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "partner_workflow_list",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/partners/workflows",
            rowCount: safeWorkflows.length,
          },
        },
      ],
      observability,
      metadata: {
        route: "/api/partners/workflows",
        rowCount: safeWorkflows.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      count: safeWorkflows.length,
      workflows: safeWorkflows,
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
            : "Unknown partner workflow list error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
