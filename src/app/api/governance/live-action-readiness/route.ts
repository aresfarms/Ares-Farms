import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  createLiveActionReadinessReview,
  getLiveActionReadinessTargetScope,
} from "@/lib/governance/liveActionReadinessStore";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Live Action Readiness Review API
 *
 * Master Volume Governance:
 * - Vol I: Requires constitutional authority before live external action
 *   promotion can be reviewed.
 * - Vol II: Blocks live source calls, notice sends, and payment capture until
 *   borrower, tenant, billing, regulatory, and disclosure boundaries are met.
 * - Vol III: Creates replay-safe readiness evidence before any live adapter
 *   implementation is promoted.
 * - Vol IV: Requires runbook, rollback, incident response, monitoring,
 *   dry-run, audit export, and human approval evidence.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, consent, isolation, controlled disclosure, and evidence doctrine.
 */

type LiveActionReadinessRequest = {
  userId?: string | null;
  actorId?: string | null;
  role?: string | null;
  tenantId?: string | null;
  actionType?: string | null;
  targetExecutionId?: string | null;
  productionCredentialVaultRef?: string | null;
  liveAdapterImplementationRef?: string | null;
  productionRunbookApprovalRef?: string | null;
  dryRunEvidenceRef?: string | null;
  rollbackPlanRef?: string | null;
  incidentResponsePlanRef?: string | null;
  monitoringPlanRef?: string | null;
  auditEvidenceExportRef?: string | null;
  humanApprovalRef?: string | null;
  metadata?: Record<string, unknown>;
};

function createLiveActionReadinessTraceId(): string {
  return `live-action-readiness-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: LiveActionReadinessRequest): string | null {
  return body.actorId ?? body.userId ?? null;
}

function routeActorRole(body: LiveActionReadinessRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function tenantScopePresent(body: LiveActionReadinessRequest): boolean {
  return Boolean(body.tenantId?.trim());
}

function reviewResponse(
  review: Awaited<
    ReturnType<typeof createLiveActionReadinessReview>
  >["review"]
) {
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
    productionCredentialVaultRef:
      review.productionCredentialVaultRef,
    liveAdapterImplementationRef:
      review.liveAdapterImplementationRef,
    productionRunbookApprovalRef:
      review.productionRunbookApprovalRef,
    dryRunEvidenceRef: review.dryRunEvidenceRef,
    rollbackPlanRef: review.rollbackPlanRef,
    incidentResponsePlanRef: review.incidentResponsePlanRef,
    monitoringPlanRef: review.monitoringPlanRef,
    auditEvidenceExportRef: review.auditEvidenceExportRef,
    humanApprovalRef: review.humanApprovalRef,
    readyForLiveAction: review.readyForLiveAction,
    regulatedDecisionImpactAllowed:
      review.regulatedDecisionImpactAllowed,
    externalActionPerformed: review.externalActionPerformed,
    liveActionPerformed: review.liveActionPerformed,
    classification: review.classification,
    replayRef: review.replayRef,
    traceId: review.traceId,
    reviewedAt: review.reviewedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function persistDeniedEvidence(input: {
  traceId: string;
  actor: string | null;
  body: LiveActionReadinessRequest;
  runtimeGuard: ReturnType<typeof runRuntimeGuard>;
  access?: ReturnType<typeof evaluateAccess> | null;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const observability = createObservabilityEvent({
    eventType: "LIVE_ACTION_READINESS_ACCESS_DENIED",
    domain: "security",
    severity: "WARN",
    message: input.reason,
    traceId: input.traceId,
    replayRef: input.traceId,
    actorId: input.actor,
    module: "api.governance.live-action-readiness",
    metadata: {
      route: "/api/governance/live-action-readiness",
      actionType: input.body.actionType ?? null,
      targetExecutionId: input.body.targetExecutionId ?? null,
      runtimeAllowed: input.runtimeGuard.allowed,
      accessAllowed: input.access?.allowed ?? null,
      tenantScopePresent: tenantScopePresent(input.body),
      ...(input.metadata ?? {}),
    },
  });

  const evidence = await persistRouteGovernanceEvidence({
    traceId: input.traceId,
    replayRef: input.traceId,
    route: "/api/governance/live-action-readiness",
    operation: "live-action.readiness-review.denied",
    module: "api.governance.live-action-readiness",
    observability,
    sourceVersion: "live-action-readiness-route-v0.1.0",
    verificationStatus: "WARN",
    replaySafe: true,
    result: {
      denied: true,
      reason: input.reason,
    },
    metadata: {
      actionType: input.body.actionType ?? null,
      targetExecutionId: input.body.targetExecutionId ?? null,
    },
  });

  return { observability, evidence };
}

export async function POST(req: NextRequest) {
  const traceId = createLiveActionReadinessTraceId();

  try {
    const body = (await req.json()) as LiveActionReadinessRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "live-action.readiness-review",
      module: "api.governance.live-action-readiness",
      traceId,
      schemaVersion: "live-action-readiness-reviews-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/governance/live-action-readiness",
        actionType: body.actionType ?? null,
        targetExecutionId: body.targetExecutionId ?? null,
        liveActionExpected: false,
        externalActionExpected: false,
        paymentCaptureExpected: false,
      },
    });

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: ["admin", "governance"],
      operation: "live-action.readiness-review",
      module: "api.governance.live-action-readiness",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!runtimeGuard.allowed || !access.allowed || !tenantScopePresent(body)) {
      const denied = await persistDeniedEvidence({
        traceId,
        actor,
        body,
        runtimeGuard,
        access,
        reason:
          "Live action readiness review was denied by runtime, role, or tenant scope controls.",
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for live action readiness review or is missing governed tenant scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability: denied.observability,
            evidence: denied.evidence,
          },
        },
        { status: 403 }
      );
    }

    const targetScope = await getLiveActionReadinessTargetScope({
      actionType: body.actionType,
      targetExecutionId: body.targetExecutionId,
    });

    if (targetScope.tenantId && targetScope.tenantId !== body.tenantId) {
      const denied = await persistDeniedEvidence({
        traceId,
        actor,
        body,
        runtimeGuard,
        access,
        reason:
          "Live action readiness review was denied by tenant scope mismatch.",
        metadata: {
          requestedTenantId: body.tenantId ?? null,
          targetTenantId: targetScope.tenantId,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Live action readiness review target is outside the governed tenant scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            targetScope,
            observability: denied.observability,
            evidence: denied.evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "live-action.readiness-review",
      module: "api.governance.live-action-readiness",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "live-action-readiness-reviews-v0.1.0",
          "src/db/schema/liveActionReadinessReviews.ts",
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
          "live-action-readiness-runtime-v0.1.0",
          "src/lib/governance/liveActionReadinessStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "live-action-readiness-route-v0.1.0",
          "api.governance.live-action-readiness",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "live-action-readiness-route-input",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["governance", "authorized-operator"],
      sharingPermissions: ["regulated-operational-review"],
      aiUsagePermissions: ["classify", "explain"],
      exportRestrictions: [
        "requires-governed-export-context",
        "no-public-disclosure",
      ],
      redactionRequirements: [
        "redact-credentials-and-provider-secrets",
      ],
      consentRequirements: ["institutional-live-action-review"],
    });

    const readiness = await createLiveActionReadinessReview({
      traceId,
      actionType: body.actionType,
      targetExecutionId: body.targetExecutionId,
      tenantId: body.tenantId,
      actorId: actor,
      productionCredentialVaultRef:
        body.productionCredentialVaultRef,
      liveAdapterImplementationRef:
        body.liveAdapterImplementationRef,
      productionRunbookApprovalRef:
        body.productionRunbookApprovalRef,
      dryRunEvidenceRef: body.dryRunEvidenceRef,
      rollbackPlanRef: body.rollbackPlanRef,
      incidentResponsePlanRef: body.incidentResponsePlanRef,
      monitoringPlanRef: body.monitoringPlanRef,
      auditEvidenceExportRef: body.auditEvidenceExportRef,
      humanApprovalRef: body.humanApprovalRef,
      metadata: {
        ...(body.metadata ?? {}),
        route: "/api/governance/live-action-readiness",
      },
    });

    const responseReview = reviewResponse(readiness.review);
    const classifiedReview = classifyRecord(
      responseReview as Record<string, unknown>,
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource: "live-action-readiness-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["governance", "authorized-operator"],
        sharingPermissions: ["regulated-operational-review"],
        aiUsagePermissions: ["classify", "explain"],
        exportRestrictions: [
          "requires-governed-export-context",
          "no-public-disclosure",
        ],
        redactionRequirements: [
          "redact-credentials-and-provider-secrets",
        ],
        consentRequirements: ["institutional-live-action-review"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: readiness.review.id,
      outputType: "live_action_readiness_review",
      audience: "governance",
      claimType: "recommendation",
      summary: readiness.readyForLiveAction
        ? "Live action promotion controls are complete, but runtime still performed no external action."
        : "Live action promotion remains blocked until all governance, operational, credential, replay, consent, isolation, and human approval gates pass.",
      ruleVersion: "live-action-readiness-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.82,
      humanReviewRequired: true,
      replayRefs: [traceId],
      evidenceRefs: [
        {
          refId: readiness.review.targetExecutionId,
          sourceType: "connector",
          sourceName: readiness.review.actionType,
          sourceVersion: "execution-authorization-record",
          replayRef: readiness.review.replayRef,
        },
      ],
      metadata: {
        readinessStatus: readiness.readinessStatus,
        readyForLiveAction: readiness.readyForLiveAction,
        blockerReasons: readiness.blockerReasons,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "LIVE_ACTION_READINESS_REVIEWED",
      domain: "operations",
      severity: readiness.readyForLiveAction ? "INFO" : "WARN",
      message:
        "Live action readiness review completed without performing a live external action.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.governance.live-action-readiness",
      metadata: {
        route: "/api/governance/live-action-readiness",
        actionType: readiness.review.actionType,
        readinessStatus: readiness.readinessStatus,
        readyForLiveAction: readiness.readyForLiveAction,
        externalActionPerformed: readiness.review.externalActionPerformed,
        liveActionPerformed: readiness.review.liveActionPerformed,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      replayRef: traceId,
      route: "/api/governance/live-action-readiness",
      operation: "live-action.readiness-review",
      module: "api.governance.live-action-readiness",
      versionRuntime,
      classifications: [
        {
          resourceType: "live_action_readiness_request",
          resourceId: `${readiness.review.id}:request`,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            actionType: body.actionType ?? null,
          },
        },
        {
          resourceType: "live_action_readiness_review",
          resourceId: readiness.review.id,
          classification: classifiedReview.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            actionType: readiness.review.actionType,
            readinessStatus: readiness.readinessStatus,
          },
        },
      ],
      observability,
      targetType: "live_action_readiness_review",
      targetId: readiness.review.id,
      sourceVersion: "live-action-readiness-route-v0.1.0",
      verificationStatus: readiness.readyForLiveAction ? "PASS" : "WARN",
      replaySafe: true,
      result: {
        readinessStatus: readiness.readinessStatus,
        readyForLiveAction: readiness.readyForLiveAction,
        externalActionPerformed: readiness.review.externalActionPerformed,
        liveActionPerformed: readiness.review.liveActionPerformed,
      },
      metadata: {
        actionType: readiness.review.actionType,
        targetExecutionId: readiness.review.targetExecutionId,
      },
    });

    return NextResponse.json({
      ok: true,
      review: classifiedReview,
      result: {
        readinessStatus: readiness.readinessStatus,
        readyForLiveAction: readiness.readyForLiveAction,
        gates: readiness.gates,
        blockerReasons: readiness.blockerReasons,
        externalActionPerformed: readiness.review.externalActionPerformed,
        liveActionPerformed: readiness.review.liveActionPerformed,
        regulatedDecisionImpactAllowed:
          readiness.review.regulatedDecisionImpactAllowed,
      },
      governance: {
        traceId,
        runtimeGuard,
        access,
        targetScope,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedReview.classification,
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
            : "Unknown live action readiness review error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
