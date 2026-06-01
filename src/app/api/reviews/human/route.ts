import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistHumanReviewWorkflow } from "@/lib/reviews/humanReviewWorkflowStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Human Review Workflow API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires accountable human review before regulated outcomes become final.
 *
 * - Vol II: Regulatory Governance
 *   Preserves adverse-action, reason-code, appeal, borrower explanation,
 *   fair-lending, and human-review boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Persists replay-safe review workflow state before decision outputs can be
 *   treated as regulated workflow outputs.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operator queues, escalation, assignment, recovery, and audit prep.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces explainability, classification, observability, replayability,
 *   source authority, version lineage, and evidence preservation.
 */

type HumanReviewRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  reviewType?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceTraceId?: string | null;
  priority?: string | null;
  requiredReviewerRole?: string | null;
  candidateOutcome?: string | null;
  adverseActionCandidate?: boolean | null;
  reasonCodes?: string[];
  explanationSummary?: string | null;
  metadata?: Record<string, unknown>;
};

function createReviewTraceId(): string {
  return `human-review-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: HumanReviewRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: HumanReviewRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

export async function POST(req: NextRequest) {
  const traceId = createReviewTraceId();

  try {
    const body = (await req.json()) as HumanReviewRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "human-review.queue",
      module: "api.reviews.human",
      traceId,
      schemaVersion: "human-review-workflow-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/reviews/human",
        applicationId: body.applicationId ?? null,
        adverseActionCandidate: body.adverseActionCandidate ?? false,
        finalActionAllowed: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "HUMAN_REVIEW_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Human review workflow was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.human",
        metadata: {
          route: "/api/reviews/human",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/human",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked human review workflow.",
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
      operation: "human-review.queue",
      module: "api.reviews.human",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "HUMAN_REVIEW_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Human review workflow was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.human",
        metadata: {
          route: "/api/reviews/human",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/human",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for human review workflow creation.",
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

    const recordAccess = await evaluateApplicationRecordAccess({
      access,
      operation: "human-review.queue",
      module: "api.reviews.human",
      traceId,
      resourceType: "human_review",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "HUMAN_REVIEW_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Human review workflow was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.human",
        metadata: {
          route: "/api/reviews/human",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/human",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this application human-review record.",
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
      operation: "human-review.queue",
      module: "api.reviews.human",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "human-review-workflow-v0.1.0",
          "src/app/api/reviews/human/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "review-workflows-v0.1.0",
          "src/db/schema/reviewWorkflows.ts",
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
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "human-review-workflow-runtime-v0.1.0",
          "src/lib/reviews/humanReviewWorkflowStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        reviewType: body.reviewType ?? null,
        sourceType: body.sourceType ?? null,
        sourceId: body.sourceId ?? null,
        sourceTraceId: body.sourceTraceId ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        candidateOutcome: body.candidateOutcome ?? null,
        adverseActionCandidate: body.adverseActionCandidate ?? null,
        reasonCodes: body.reasonCodes ?? [],
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-reviews-human-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "human-review-workflow",
          "adverse-action-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-a-final-decision",
          "not-an-adverse-action-notice",
          "requires-authorized-human-review-before-final-action",
        ],
        redactionRequirements: [
          "redact-borrower-identifiers-before-public-disclosure",
          "redact-internal-review-notes-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const workflow = await persistHumanReviewWorkflow({
      traceId,
      reviewType: body.reviewType ?? "regulated_decision_review",
      sourceType: body.sourceType ?? "rule_overlay_evaluation",
      sourceId: body.sourceId,
      sourceTraceId: body.sourceTraceId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      priority: body.priority,
      requiredReviewerRole: body.requiredReviewerRole,
      candidateOutcome: body.candidateOutcome,
      adverseActionCandidate: body.adverseActionCandidate,
      reasonCodes: body.reasonCodes,
      explanationSummary: body.explanationSummary,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        humanReviewWorkflowId: workflow.humanReview.id,
        status: workflow.humanReview.status,
        finalActionAllowed: workflow.humanReview.finalActionAllowed,
        adverseActionCandidate: workflow.humanReview.adverseActionCandidate,
        adverseActionReviewId: workflow.adverseActionReview?.id ?? null,
        noticeStatus: workflow.adverseActionReview?.noticeStatus ?? null,
        finalNoticeAllowed: workflow.adverseActionReview?.finalNoticeAllowed ?? false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-reviews-human-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "human-review-workflow",
          "adverse-action-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-final-decision",
          "not-an-adverse-action-notice",
          "requires-authorized-human-review-before-final-action",
        ],
        redactionRequirements: [
          "redact-borrower-identifiers-before-public-disclosure",
          "redact-internal-review-notes-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(workflow.humanReview.id),
      outputType: "human_review_workflow",
      audience: "governance",
      claimType: "fact",
      summary:
        "Human review workflow was queued; any adverse-action candidate remains non-final and is not a borrower notice.",
      ruleVersion: "human-review-workflow-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(workflow.humanReview.id),
          sourceType: "human_review",
          sourceName: "Human Review Workflow",
          sourceVersion: "human-review-workflow-runtime-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        humanReviewWorkflowId: workflow.humanReview.id,
        adverseActionReviewId: workflow.adverseActionReview?.id ?? null,
        finalActionAllowed: workflow.humanReview.finalActionAllowed,
        finalNoticeAllowed:
          workflow.adverseActionReview?.finalNoticeAllowed ?? false,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "HUMAN_REVIEW_WORKFLOW_QUEUED",
      domain: "operations",
      severity: "INFO",
      message:
        "Human review workflow was persisted with regulated adverse-action safeguards.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.reviews.human",
      metadata: {
        humanReviewWorkflowId: workflow.humanReview.id,
        adverseActionReviewId: workflow.adverseActionReview?.id ?? null,
        status: workflow.humanReview.status,
        finalActionAllowed: workflow.humanReview.finalActionAllowed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "human_review_input",
          resourceId: String(workflow.humanReview.id),
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reviews/human",
            stage: "input",
          },
        },
        {
          resourceType: "human_review_output",
          resourceId: String(workflow.humanReview.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reviews/human",
            stage: "output",
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "human_review_workflow",
        targetId: String(workflow.humanReview.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "human-review-workflow-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          humanReviewWorkflowId: workflow.humanReview.id,
          adverseActionReviewId: workflow.adverseActionReview?.id ?? null,
          finalActionAllowed: workflow.humanReview.finalActionAllowed,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/reviews/human",
          operation: "human-review.queue",
        },
      },
      metadata: {
        route: "/api/reviews/human",
        operation: "human-review.queue",
      },
    });

    return NextResponse.json({
      ok: true,
      humanReview: workflow.humanReview,
      adverseActionReview: workflow.adverseActionReview,
      application: workflow.application,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
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
      eventType: "HUMAN_REVIEW_WORKFLOW_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Human review workflow encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.reviews.human",
      metadata: {
        route: "/api/reviews/human",
        error:
          error instanceof Error
            ? error.message
            : "Unknown human review workflow error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/reviews/human",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown human review workflow error.",
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
