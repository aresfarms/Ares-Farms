import { NextRequest, NextResponse } from "next/server";

import {
  EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
  EvidenceResolutionWorkflowInput,
  composeEvidenceResolutionWorkflow,
} from "@/lib/evidence-resolution/evidenceResolutionWorkflowRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = EvidenceResolutionWorkflowInput;

function createTraceId(): string {
  return `evidence-resolution-workflow-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.evidence.resolution.workflow.compose",
      module: "api.governance.evidence-resolution-workflow",
      traceId,
      schemaVersion: "evidence-resolution-workflow-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/evidence-resolution-workflow",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Evidence Resolution Workflow runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.evidence-resolution-workflow",
        metadata: {
          route: "/api/governance/evidence-resolution-workflow",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/evidence-resolution-workflow",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Evidence Resolution Workflow request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.evidence.resolution.workflow.compose",
      module: "api.governance.evidence-resolution-workflow",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "evidence-resolution-workflow-request-v0.1.0",
          "src/app/api/governance/evidence-resolution-workflow/route.ts",
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
          EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
          "src/lib/evidence-resolution/evidenceResolutionWorkflowRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "readiness-assessment-v2-runtime-v0.1.0",
          "src/lib/readiness/readinessAssessmentV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "borrower-onboarding-core-v2-runtime-v0.1.0",
          "src/lib/borrower/onboardingCoreV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-escalation-engine-v2-runtime-v0.1.0",
          "src/lib/environmental/escalationEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-risk-assessment-v2-runtime-v0.1.0",
          "src/lib/environmental/riskAssessmentV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-compliance-v2-runtime-v0.1.0",
          "src/lib/environmental/complianceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "environmental-intake-v2-runtime-v0.1.0",
          "src/lib/environmental/intakeV2Runtime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource:
        "api-governance-evidence-resolution-workflow-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "auditor",
        "regulator",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "governance-evidence-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-a-denial",
        "not-a-rejection",
        "not-an-approval",
        "not-a-preapproval",
        "not-a-fraud-accusation",
        "not-a-misrepresentation-accusation",
        "not-an-eligibility-determination",
        "not-a-credit-decision",
        "not-a-lender-commitment",
        "not-an-agency-decision",
        "not-an-official-certification",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-legal-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-evidence-resolution-workflow-review-consent",
      ],
    });

    const result = composeEvidenceResolutionWorkflow(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.evidence.resolution.workflow.composed",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-evidence-resolution-workflow-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "auditor",
          "regulator",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "governance-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-denial",
          "not-a-rejection",
          "not-a-fraud-accusation",
          "not-a-misrepresentation-accusation",
          "not-an-approval",
          "not-a-preapproval",
          "not-an-eligibility-determination",
          "not-a-credit-decision",
          "not-a-lender-commitment",
          "not-an-agency-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-legal-reliance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-evidence-resolution-workflow-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "evidence_resolution_workflow_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Evidence Resolution Workflow v1 pack composed as advisory variance-resolution posture, replay-safe, audit-safe, conflict-preserving internal evidence only. Uncertainty is not denial. NEEDS_INPUT signals stay NEEDS_INPUT. No fraud accusation, denial, rejection, approval, preapproval, lender commitment, agency decision, public verification, regulatory reliance, source certainty claim, or legal reliance is created. Every clarification request preserves uncertainty and resolves to REQUIRES_HUMAN_REVIEW.",
      ruleVersion: EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        varianceCount: result.summary.varianceCount,
        clarificationRequestCount: result.summary.clarificationRequestCount,
        borrowerClarificationCount: result.summary.borrowerClarificationCount,
        requiresHumanReviewCount: result.summary.requiresHumanReviewCount,
        v1OverallReadinessPercent: result.summary.v1OverallReadinessPercent,
        falseRejectionRiskCount: result.summary.falseRejectionRiskCount,
        fraudAccusationRiskCount: result.summary.fraudAccusationRiskCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "EVIDENCE_RESOLUTION_WORKFLOW_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Evidence Resolution Workflow v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.evidence-resolution-workflow",
      metadata: {
        route: "/api/governance/evidence-resolution-workflow",
        varianceCount: result.summary.varianceCount,
        clarificationRequestCount: result.summary.clarificationRequestCount,
        falseRejectionRiskCount: result.summary.falseRejectionRiskCount,
        fraudAccusationRiskCount: result.summary.fraudAccusationRiskCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
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
          resourceType: "evidence_resolution_workflow_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/evidence-resolution-workflow",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "evidence_resolution_workflow_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/evidence-resolution-workflow",
            stage: "output",
            advisoryOnly: true,
            uncertaintyPreserved: true,
            noFraudAccusation: true,
            noDenial: true,
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
        targetType: "evidence_resolution_workflow_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          varianceCount: result.summary.varianceCount,
          clarificationRequestCount: result.summary.clarificationRequestCount,
          fraudAccusationRiskCount: result.summary.fraudAccusationRiskCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/evidence-resolution-workflow",
          operation: "governance.evidence.resolution.workflow.compose",
        },
      },
      metadata: {
        route: "/api/governance/evidence-resolution-workflow",
        operation: "governance.evidence.resolution.workflow.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      result,
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
      eventType: "EVIDENCE_RESOLUTION_WORKFLOW_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Evidence Resolution Workflow API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.evidence-resolution-workflow",
      metadata: {
        route: "/api/governance/evidence-resolution-workflow",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Evidence Resolution Workflow runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/evidence-resolution-workflow",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Evidence Resolution Workflow runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
