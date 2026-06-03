import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  LENDER_WORKFLOW_V2_RUNTIME_VERSION,
  LenderWorkflowV2Input,
  composeLenderWorkflowV2,
} from "@/lib/lender/workflowV2Runtime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Lender Workflow v2 API
 *
 * Master Volume Governance:
 * - Vol I: preserves Customer Type review boundary, Capital Graph
 *   sponsor authority, legacy v1 lender workflow boundary; the route
 *   never grants pathway / opportunity / credit authority.
 * - Vol II: every per-application briefing routes to the named
 *   sponsor / regulatory authority for review.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining v2 → Opportunity Discovery v2 →
 *   Financing Pathway Engine v2 → Revenue Intelligence v2 → Customer
 *   Type → Capital Graph → legacy v1 lender workflow.
 * - Vol III-B: runtime guard, classification, version lineage,
 *   observability, explainability, replay verification, audit-safe
 *   error envelope.
 * - Vol IV: routes governed handoffs to Opportunity Discovery v2,
 *   Financing Pathway Engine v2, Revenue Intelligence v2, Customer
 *   Type Registry, Capital Graph, lender workflow (v1), advanced
 *   intelligence, evidence engine, certification engine, registry
 *   framework, evidence packets, audit replay, governance, reviews,
 *   and module readiness.
 * - Vol V: preserves canonical claims governance, controlled
 *   disclosure, replay, audit, portability, and coordination-only
 *   boundaries.
 * - Vol VI: keeps every composed briefing behind a public-safe DTO;
 *   no raw borrower / sponsor / property records, no live external
 *   fetch, no source-certainty claim.
 */

type LenderWorkflowV2Request = LenderWorkflowV2Input;

function createLenderWorkflowV2TraceId(): string {
  return `lender-workflow-v2-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createLenderWorkflowV2TraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as LenderWorkflowV2Request;
    const actorId = body.userId ?? body.reviewerRole ?? body.lenderId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.lender.workflow.v2.compose",
      module: "api.governance.lender-workflow-v2",
      traceId,
      schemaVersion: "lender-workflow-v2-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/lender-workflow-v2",
        lenderId: body.lenderId ?? null,
        partnerWorkflowId: body.partnerWorkflowId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "LENDER_WORKFLOW_V2_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Lender Workflow v2 runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.lender-workflow-v2",
        metadata: {
          route: "/api/governance/lender-workflow-v2",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/lender-workflow-v2",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Lender Workflow v2 request.",
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
      operation: "governance.lender.workflow.v2.compose",
      module: "api.governance.lender-workflow-v2",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "lender-workflow-v2-request-v0.1.0",
          "src/app/api/governance/lender-workflow-v2/route.ts",
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
          LENDER_WORKFLOW_V2_RUNTIME_VERSION,
          "src/lib/lender/workflowV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "opportunity-discovery-v2-runtime-v0.1.0",
          "src/lib/opportunity/discoveryV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "financing-pathway-engine-v2-runtime-v0.1.0",
          "src/lib/financing/pathwayEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "revenue-intelligence-v2-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueIntelligenceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "customer-type-runtime-v0.1.0",
          "src/lib/customer-types/customerTypeRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "capital-graph-runtime-v0.1.0",
          "src/lib/capital-graph/capitalGraphRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "lender-workflow-runtime-v0.1.0",
          "src/lib/lender/workflowRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-lender-workflow-v2-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "auditor",
        "regulator",
        "lender",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "governance-evidence-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-approval",
        "not-an-eligibility-determination",
        "not-a-pathway-determination",
        "not-an-opportunity-determination",
        "not-a-credit-decision",
        "not-an-underwriting-decision",
        "not-a-lender-commitment",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-borrower-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-lender-workflow-v2-review-consent",
      ],
    });

    const v2Result = composeLenderWorkflowV2(body);

    const classifiedOutput = classifyRecord(
      {
        v2Result,
        event: {
          eventType: "governance.lender.workflow.v2.composed",
          lenderId: v2Result.lenderId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-lender-workflow-v2-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "auditor",
          "regulator",
          "lender",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "governance-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-approval",
          "not-an-eligibility-determination",
          "not-a-pathway-determination",
          "not-an-opportunity-determination",
          "not-a-credit-decision",
          "not-an-underwriting-decision",
          "not-a-lender-commitment",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-program-approval",
          "not-a-tax-credit-allocation",
          "not-an-environmental-clearance",
          "not-a-carbon-credit-issuance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-borrower-notice-send",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-lender-workflow-v2-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "lender_workflow_v2_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Lender Workflow v2 pack composed as advisory coordination evidence, replay-safe, audit-safe, conflict-preserving internal evidence only. No approval, autonomous customer eligibility determination, autonomous pathway determination, autonomous opportunity determination, credit decision, underwriting decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, source certainty claim, borrower notice send, or legal reliance is created.",
      ruleVersion: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + v2Result.summary.totalGrantCardCount / 60)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        applicationCount: v2Result.summary.applicationCount,
        applicationsWithProfilesCount:
          v2Result.summary.applicationsWithCustomerProfilesCount,
        totalGrantCardCount: v2Result.summary.totalGrantCardCount,
        conflictSignalCount: v2Result.summary.conflictSignalCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        sovereignCardCount: v2Result.summary.sovereignCardCount,
        replaySafe: v2Result.replaySafe,
        auditSafe: v2Result.auditSafe,
        conflictPreserving: v2Result.conflictPreserving,
        federationScoped: v2Result.federationScoped,
        productionBlocked: v2Result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "LENDER_WORKFLOW_V2_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Lender Workflow v2 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.lender-workflow-v2",
      metadata: {
        route: "/api/governance/lender-workflow-v2",
        applicationCount: v2Result.summary.applicationCount,
        applicationsWithProfilesCount:
          v2Result.summary.applicationsWithCustomerProfilesCount,
        totalGrantCardCount: v2Result.summary.totalGrantCardCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        sovereignCardCount: v2Result.summary.sovereignCardCount,
        readyForReviewCount: v2Result.summary.readyForReviewCount,
        evidencePendingCount: v2Result.summary.evidencePendingCount,
        overlayReviewPendingCount:
          v2Result.summary.overlayReviewPendingCount,
        intakeInProgressCount: v2Result.summary.intakeInProgressCount,
        onHoldCount: v2Result.summary.onHoldCount,
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
          resourceType: "lender_workflow_v2_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/lender-workflow-v2",
            stage: "input",
            lenderId: body.lenderId ?? null,
          },
        },
        {
          resourceType: "lender_workflow_v2_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/lender-workflow-v2",
            stage: "output",
            advisoryOnly: true,
            coordinationOnly: true,
            replaySafe: true,
            auditSafe: true,
            conflictPreserving: true,
            federationScoped: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "lender_workflow_v2_pack",
        targetId: body.lenderId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          applicationCount: v2Result.summary.applicationCount,
          totalGrantCardCount: v2Result.summary.totalGrantCardCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/lender-workflow-v2",
          operation: "governance.lender.workflow.v2.compose",
        },
      },
      metadata: {
        route: "/api/governance/lender-workflow-v2",
        operation: "governance.lender.workflow.v2.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      v2Result,
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
      eventType: "LENDER_WORKFLOW_V2_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Lender Workflow v2 API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.lender-workflow-v2",
      metadata: {
        route: "/api/governance/lender-workflow-v2",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Lender Workflow v2 runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/lender-workflow-v2",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Lender Workflow v2 runtime error.",
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
