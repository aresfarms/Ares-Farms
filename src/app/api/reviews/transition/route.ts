import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistReviewTransition } from "@/lib/reviews/reviewTransitionControlStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Review Transition Control API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires accountable authority before human-review records can transition
 *   toward final regulated action.
 *
 * - Vol II: Regulatory Governance
 *   Preserves adverse-action, appeal, disclosure, fair-lending, borrower
 *   explanation, and official-notice approval boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Records replay-safe review transition evidence and deterministic gate
 *   outcomes before finalization can pass.
 *
 * - Vol IV: Operational Runbooks
 *   Supports underwriter approval, escalation resolution, revision handling,
 *   recovery, and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replayability,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

type ReviewTransitionRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  transitionType?: string | null;
  requestedStatus?: string | null;
  reviewOutcome?: string | null;
  reviewerRole?: string | null;
  reviewerAttestationRef?: string | null;
  approvalAuthorityRef?: string | null;
  reasonCodes?: string[];
  explanationSummary?: string | null;
  disclosureReviewCompleted?: boolean | null;
  appealRightsPrepared?: boolean | null;
  metadata?: Record<string, unknown>;
};

function createReviewTransitionTraceId(): string {
  return `review-transition-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: ReviewTransitionRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: ReviewTransitionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function transitionResponse(
  transition: Awaited<ReturnType<typeof persistReviewTransition>>["transition"]
) {
  return {
    id: transition.id,
    applicationId: transition.applicationId,
    borrowerId: transition.borrowerId,
    tenantId: transition.tenantId,
    humanReviewWorkflowId: transition.humanReviewWorkflowId,
    adverseActionReviewId: transition.adverseActionReviewId,
    transitionType: transition.transitionType,
    requestedStatus: transition.requestedStatus,
    transitionStatus: transition.transitionStatus,
    reviewOutcome: transition.reviewOutcome,
    reviewerRole: transition.reviewerRole,
    reasonCodes: transition.reasonCodes,
    finalActionAllowed: transition.finalActionAllowed,
    finalNoticeAllowed: transition.finalNoticeAllowed,
    borrowerDisclosureAllowed: transition.borrowerDisclosureAllowed,
    adverseActionRequired: transition.adverseActionRequired,
    humanReviewRequired: transition.humanReviewRequired,
    transitionedAt: transition.transitionedAt,
    createdAt: transition.createdAt,
    updatedAt: transition.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createReviewTransitionTraceId();

  try {
    const body = (await req.json()) as ReviewTransitionRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "human-review.transition",
      module: "api.reviews.transition",
      traceId,
      schemaVersion: "review-transition-controls-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/reviews/transition",
        applicationId: body.applicationId ?? null,
        humanReviewWorkflowId: body.humanReviewWorkflowId ?? null,
        transitionType: body.transitionType ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REVIEW_TRANSITION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Human-review transition was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.transition",
        metadata: {
          route: "/api/reviews/transition",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/transition",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked human-review transition.",
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
      allowedRoles: ["underwriter", "admin", "governance"],
      operation: "human-review.transition",
      module: "api.reviews.transition",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REVIEW_TRANSITION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Human-review transition was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.transition",
        metadata: {
          route: "/api/reviews/transition",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/transition",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for human-review transition.",
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
      operation: "human-review.transition",
      module: "api.reviews.transition",
      traceId,
      resourceType: "human_review",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REVIEW_TRANSITION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Human-review transition was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.transition",
        metadata: {
          route: "/api/reviews/transition",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/transition",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this human-review transition.",
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
      operation: "human-review.transition",
      module: "api.reviews.transition",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "review-transition-api-v0.1.0",
          "src/app/api/reviews/transition/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "review-transition-controls-v0.1.0",
          "src/db/schema/reviewTransitionControls.ts",
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
          "review-transition-control-runtime-v0.1.0",
          "src/lib/reviews/reviewTransitionControlStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        humanReviewWorkflowId: body.humanReviewWorkflowId ?? null,
        adverseActionReviewId: body.adverseActionReviewId ?? null,
        transitionType: body.transitionType ?? null,
        requestedStatus: body.requestedStatus ?? null,
        reviewOutcome: body.reviewOutcome ?? null,
        reviewerRole: body.reviewerRole ?? null,
        reasonCodes: body.reasonCodes ?? [],
        disclosureReviewCompleted: body.disclosureReviewCompleted ?? false,
        appealRightsPrepared: body.appealRightsPrepared ?? false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-reviews-transition-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "human-review-transition",
          "adverse-action-review",
          "regulated-final-action-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-a-final-decision",
          "not-an-adverse-action-notice",
          "requires-finalization-before-official-action",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const transition = await persistReviewTransition({
      traceId,
      humanReviewWorkflowId: body.humanReviewWorkflowId,
      adverseActionReviewId: body.adverseActionReviewId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      transitionType: body.transitionType,
      requestedStatus: body.requestedStatus,
      reviewOutcome: body.reviewOutcome,
      reviewerRole: body.reviewerRole,
      reviewerAttestationRef: body.reviewerAttestationRef,
      approvalAuthorityRef: body.approvalAuthorityRef,
      reasonCodes: body.reasonCodes,
      explanationSummary: body.explanationSummary,
      disclosureReviewCompleted: body.disclosureReviewCompleted,
      appealRightsPrepared: body.appealRightsPrepared,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        transitionId: transition.transition.id,
        transitionStatus: transition.transition.transitionStatus,
        finalActionAllowed: transition.finalActionAllowed,
        finalNoticeAllowed: transition.finalNoticeAllowed,
        borrowerDisclosureAllowed:
          transition.transition.borrowerDisclosureAllowed,
        humanReviewStatus: transition.humanReview.status,
        adverseActionStatus:
          transition.adverseActionReview?.adverseActionStatus ?? null,
        noticeStatus: transition.adverseActionReview?.noticeStatus ?? null,
        gates: transition.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-reviews-transition-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "human-review-transition",
          "regulated-final-action-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "transition-record-only",
          "not-borrower-disclosable",
          "notice-delivery-not-performed",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(transition.transition.id),
      outputType: "human_review_transition_control",
      audience: "governance",
      claimType: "fact",
      summary:
        "Human-review transition controls were evaluated against reviewer authority, attestation, adverse-action, appeal, disclosure, and explanation gates.",
      ruleVersion: "review-transition-control-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !transition.finalActionAllowed,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(transition.humanReview.id),
          sourceType: "human_review",
          sourceName: "human-review-workflow",
          sourceVersion: "human-review-workflow-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        transitionId: transition.transition.id,
        transitionAllowed: transition.transitionAllowed,
        finalActionAllowed: transition.finalActionAllowed,
        finalNoticeAllowed: transition.finalNoticeAllowed,
        gates: transition.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: transition.transitionAllowed
        ? "REVIEW_TRANSITION_APPROVED"
        : "REVIEW_TRANSITION_BLOCKED",
      domain: "operations",
      severity: transition.transitionAllowed ? "INFO" : "WARN",
      message: transition.transitionAllowed
        ? "Human-review transition gates passed for final-action eligibility."
        : "Human-review transition gates blocked final-action eligibility.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.reviews.transition",
      metadata: {
        transitionId: transition.transition.id,
        humanReviewWorkflowId: transition.humanReview.id,
        adverseActionReviewId: transition.adverseActionReview?.id ?? null,
        transitionAllowed: transition.transitionAllowed,
        finalActionAllowed: transition.finalActionAllowed,
        finalNoticeAllowed: transition.finalNoticeAllowed,
        gates: transition.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "review_transition_input",
          resourceId: body.humanReviewWorkflowId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reviews/transition",
            stage: "input",
          },
        },
        {
          resourceType: "review_transition_output",
          resourceId: String(transition.transition.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reviews/transition",
            stage: "output",
            humanReviewWorkflowId: transition.humanReview.id,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "review_transition_control",
        targetId: String(transition.transition.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "review-transition-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          transitionId: transition.transition.id,
          transitionAllowed: transition.transitionAllowed,
          finalActionAllowed: transition.finalActionAllowed,
          finalNoticeAllowed: transition.finalNoticeAllowed,
          gates: transition.gates,
        },
        metadata: {
          route: "/api/reviews/transition",
          operation: "human-review.transition",
        },
      },
      metadata: {
        route: "/api/reviews/transition",
        operation: "human-review.transition",
      },
    });

    return NextResponse.json({
      ok: true,
      transition: transitionResponse(transition.transition),
      humanReview: {
        id: transition.humanReview.id,
        status: transition.humanReview.status,
        applicationId: transition.humanReview.applicationId,
        finalActionAllowed: transition.humanReview.finalActionAllowed,
        humanReviewRequired: transition.humanReview.humanReviewRequired,
        reviewedAt: transition.humanReview.reviewedAt,
      },
      adverseActionReview: transition.adverseActionReview
        ? {
            id: transition.adverseActionReview.id,
            adverseActionStatus:
              transition.adverseActionReview.adverseActionStatus,
            noticeStatus: transition.adverseActionReview.noticeStatus,
            finalActionAllowed:
              transition.adverseActionReview.finalActionAllowed,
            finalNoticeAllowed:
              transition.adverseActionReview.finalNoticeAllowed,
            humanReviewRequired:
              transition.adverseActionReview.humanReviewRequired,
            appealStatus: transition.adverseActionReview.appealStatus,
          }
        : null,
      result: {
        transitionAllowed: transition.transitionAllowed,
        finalActionAllowed: transition.finalActionAllowed,
        finalNoticeAllowed: transition.finalNoticeAllowed,
        borrowerDisclosureAllowed:
          transition.transition.borrowerDisclosureAllowed,
        gates: transition.gates,
        message: transition.transitionAllowed
          ? "Review transition approved final-action eligibility. Borrower notice delivery was not performed."
          : "Review transition blocked final-action eligibility. This is not a final decision or notice.",
      },
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
    const observability = createObservabilityEvent({
      eventType: "REVIEW_TRANSITION_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Human-review transition encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.reviews.transition",
      metadata: {
        route: "/api/reviews/transition",
        error:
          error instanceof Error
            ? error.message
            : "Unknown human-review transition error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/reviews/transition",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown human-review transition error.",
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
