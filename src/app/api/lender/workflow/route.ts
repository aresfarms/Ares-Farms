import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  LENDER_WORKFLOW_RUNTIME_VERSION,
  LenderWorkflowInput,
  evaluateLenderWorkflow,
} from "@/lib/lender/workflowRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Lender Workflow Coordination API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over lender coordination.
 * - Vol II: prevents coordination from becoming approval, eligibility,
 *   underwriting, credit decision, lender commitment, official credit
 *   communication, or regulatory or legal reliance.
 * - Vol III: provides deterministic, replay-safe aggregation of
 *   application, overlay, evidence, packet, and partner-workflow
 *   coordination posture.
 * - Vol III-B: attaches runtime guard, classification (CONFIDENTIAL),
 *   version lineage, observability, explainability, replay verification,
 *   and audit-safe error envelope.
 * - Vol IV: routes missing-item handoffs to lender applications, overlays,
 *   evidence, property opportunities, revenue opportunities, partner
 *   workflows, and the lender dashboard.
 * - Vol V-VII: enforces canonical claims governance, source authority,
 *   conformance, and surface disclosure boundaries on lender-readable
 *   coordination output.
 */

type LenderWorkflowRequest = LenderWorkflowInput & {
  userId?: string | null;
};

function createLenderWorkflowTraceId(): string {
  return `lender-workflow-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createLenderWorkflowTraceId();

  try {
    const body = (await req.json().catch(() => ({}))) as LenderWorkflowRequest;
    const actorId = body.userId ?? body.lenderId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "lender.workflow.view",
      module: "api.lender.workflow",
      traceId,
      schemaVersion: "lender-workflow-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/lender/workflow",
        lenderCoordinationSurface: true,
        partnerWorkflowId: body.partnerWorkflowId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "LENDER_WORKFLOW_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Lender workflow runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.lender.workflow",
        metadata: {
          route: "/api/lender/workflow",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/lender/workflow",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked lender workflow request.",
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

    const versionRuntime = evaluateVersionRuntime({
      operation: "lender.workflow.view",
      module: "api.lender.workflow",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "lender-workflow-request-v0.1.0",
          "src/app/api/lender/workflow/route.ts",
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
          "rules",
          LENDER_WORKFLOW_RUNTIME_VERSION,
          "src/lib/lender/workflowRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "lender",
      classificationSource: "api-lender-workflow-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["lender", "authorized-operator", "governance"],
      sharingPermissions: [
        "lender-coordination",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-approval",
        "not-an-eligibility-determination",
        "not-a-credit-decision",
        "not-a-lender-commitment",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-borrower-identifiers-before-external-disclosure",
        "redact-sensitive-application-content-before-external-disclosure",
      ],
      consentRequirements: ["lender-coordination-consent"],
    });

    const workflowResult = evaluateLenderWorkflow(body);

    const classifiedOutput = classifyRecord(
      {
        workflowResult,
        event: {
          eventType: "lender.workflow.viewed",
          lenderId: body.lenderId ?? null,
          partnerWorkflowId: body.partnerWorkflowId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "lender",
        classificationSource: "api-lender-workflow-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["lender", "authorized-operator", "governance"],
        sharingPermissions: [
          "lender-coordination",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-approval",
          "not-an-eligibility-determination",
          "not-a-credit-decision",
          "not-a-lender-commitment",
          "not-an-official-credit-communication",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["lender-coordination-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "lender_workflow_coordination",
      audience: "lender",
      claimType: "recommendation",
      summary:
        "Lender workflow coordination generated as advisory queue translation only. No approval, eligibility, underwriting, credit decision, lender commitment, or regulatory or legal reliance is created.",
      ruleVersion: LENDER_WORKFLOW_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore:
        workflowResult.totals.applicationCount === 0 ? 0.45 : 0.7,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        applicationCount: workflowResult.totals.applicationCount,
        readyForReviewCount: workflowResult.totals.readyForReviewCount,
        coordinationOnly: workflowResult.coordinationOnly,
        productionBlocked: workflowResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "LENDER_WORKFLOW_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Lender workflow coordination composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.lender.workflow",
      metadata: {
        route: "/api/lender/workflow",
        partnerWorkflowId: body.partnerWorkflowId ?? null,
        applicationCount: workflowResult.totals.applicationCount,
        readyForReviewCount: workflowResult.totals.readyForReviewCount,
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
          resourceType: "lender_workflow_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/lender/workflow",
            stage: "input",
            partnerWorkflowId: body.partnerWorkflowId ?? null,
          },
        },
        {
          resourceType: "lender_workflow_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/lender/workflow",
            stage: "output",
            coordinationOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "lender_workflow_coordination",
        targetId: body.partnerWorkflowId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: LENDER_WORKFLOW_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          applicationCount: workflowResult.totals.applicationCount,
          readyForReviewCount: workflowResult.totals.readyForReviewCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/lender/workflow",
          operation: "lender.workflow.view",
        },
      },
      metadata: {
        route: "/api/lender/workflow",
        operation: "lender.workflow.view",
      },
    });

    return NextResponse.json({
      ok: true,
      workflowResult,
      event: classifiedOutput.event,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "LENDER_WORKFLOW_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Lender workflow API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.lender.workflow",
      metadata: {
        route: "/api/lender/workflow",
        error:
          error instanceof Error
            ? error.message
            : "Unknown lender workflow runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/lender/workflow",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown lender workflow runtime error.",
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
