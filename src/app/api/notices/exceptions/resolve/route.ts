import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistBorrowerNoticeExceptionResolution } from "@/lib/notices/borrowerNoticeExceptionResolutionStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Notice Exception Resolution API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before a notice exception closes.
 *
 * - Vol II: Preserves adverse-action, appeal, delivery, retry, dispute,
 *   retention, and borrower-disclosure boundaries.
 *
 * - Vol III: Records replay-safe exception resolution and queue lifecycle
 *   evidence without performing external provider actions.
 *
 * - Vol IV: Supports failed-delivery recovery, dispute handling, escalation,
 *   operator closure, and audit preparation.
 *
 * - Vol V: Enforces classification, explainability, observability,
 *   replayability, version lineage, controlled disclosure, and evidence
 *   preservation.
 */

type NoticeExceptionResolutionRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  queueItemId?: string | null;
  receiptId?: string | null;
  exceptionType?: string | null;
  resolutionAction?: string | null;
  resolutionEvidenceRef?: string | null;
  operatorAttestationRef?: string | null;
  borrowerContactRef?: string | null;
  retryPlanRef?: string | null;
  disputeResolutionRef?: string | null;
  retentionPolicyRef?: string | null;
  humanReviewCompleted?: boolean | null;
  metadata?: Record<string, unknown>;
};

function createNoticeExceptionTraceId(): string {
  return `notice-exception-resolution-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: NoticeExceptionResolutionRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: NoticeExceptionResolutionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function resolutionResponse(
  resolution: Awaited<
    ReturnType<typeof persistBorrowerNoticeExceptionResolution>
  >["resolution"]
) {
  return {
    id: resolution.id,
    queueItemId: resolution.queueItemId,
    receiptId: resolution.receiptId,
    deliveryId: resolution.deliveryId,
    decisionNoticeId: resolution.decisionNoticeId,
    applicationId: resolution.applicationId,
    borrowerId: resolution.borrowerId,
    tenantId: resolution.tenantId,
    exceptionType: resolution.exceptionType,
    resolutionAction: resolution.resolutionAction,
    resolutionStatus: resolution.resolutionStatus,
    queueStatusBefore: resolution.queueStatusBefore,
    queueStatusAfter: resolution.queueStatusAfter,
    resolutionEvidenceRef: resolution.resolutionEvidenceRef,
    operatorAttestationRef: resolution.operatorAttestationRef,
    borrowerContactRef: resolution.borrowerContactRef,
    retryPlanRef: resolution.retryPlanRef,
    disputeResolutionRef: resolution.disputeResolutionRef,
    retentionPolicyRef: resolution.retentionPolicyRef,
    resolutionAllowed: resolution.resolutionAllowed,
    queueCompleted: resolution.queueCompleted,
    retryAuthorized: resolution.retryAuthorized,
    borrowerDisclosureAllowed: resolution.borrowerDisclosureAllowed,
    externalProviderActionPerformed: resolution.externalProviderActionPerformed,
    humanReviewCompleted: resolution.humanReviewCompleted,
    resolvedAt: resolution.resolvedAt,
    createdAt: resolution.createdAt,
    updatedAt: resolution.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createNoticeExceptionTraceId();

  try {
    const body = (await req.json()) as NoticeExceptionResolutionRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower-notice.exception-resolve",
      module: "api.notices.exceptions.resolve",
      traceId,
      schemaVersion: "borrower-notice-exception-resolutions-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/notices/exceptions/resolve",
        applicationId: body.applicationId ?? null,
        queueItemId: body.queueItemId ?? null,
        receiptId: body.receiptId ?? null,
        externalProviderActionPerformed: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_EXCEPTION_RESOLUTION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Borrower notice exception resolution was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.exceptions.resolve",
        metadata: {
          route: "/api/notices/exceptions/resolve",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/exceptions/resolve",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked borrower notice exception resolution.",
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
      allowedRoles: ["operator", "admin", "governance"],
      operation: "borrower-notice.exception-resolve",
      module: "api.notices.exceptions.resolve",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_EXCEPTION_RESOLUTION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice exception resolution was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.exceptions.resolve",
        metadata: {
          route: "/api/notices/exceptions/resolve",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/exceptions/resolve",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for borrower notice exception resolution.",
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
      operation: "borrower-notice.exception-resolve",
      module: "api.notices.exceptions.resolve",
      traceId,
      resourceType: "borrower_notice_exception_resolution",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType:
          "BORROWER_NOTICE_EXCEPTION_RESOLUTION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice exception resolution was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.exceptions.resolve",
        metadata: {
          route: "/api/notices/exceptions/resolve",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/exceptions/resolve",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this borrower notice exception record.",
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
      operation: "borrower-notice.exception-resolve",
      module: "api.notices.exceptions.resolve",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-exception-resolution-api-v0.1.0",
          "src/app/api/notices/exceptions/resolve/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-exception-resolutions-v0.1.0",
          "src/db/schema/borrowerNoticeExceptionResolutions.ts",
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
          "borrower-notice-exception-resolution-runtime-v0.1.0",
          "src/lib/notices/borrowerNoticeExceptionResolutionStore.ts",
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
        queueItemId: body.queueItemId ?? null,
        receiptId: body.receiptId ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        exceptionType: body.exceptionType ?? null,
        resolutionAction: body.resolutionAction ?? null,
        resolutionEvidenceRef: body.resolutionEvidenceRef ?? null,
        operatorAttestationRef: body.operatorAttestationRef ?? null,
        borrowerContactRef: body.borrowerContactRef ?? null,
        retryPlanRef: body.retryPlanRef ?? null,
        disputeResolutionRef: body.disputeResolutionRef ?? null,
        retentionPolicyRef: body.retentionPolicyRef ?? null,
        humanReviewCompleted: body.humanReviewCompleted ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-exceptions-resolve-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-notice-exception-resolution"],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "resolution-record-only",
          "external-provider-action-not-performed-by-runtime",
          "requires-controlled-disclosure-review",
        ],
        redactionRequirements: [
          "redact-provider-and-contact-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const noticeExceptionResolution =
      await persistBorrowerNoticeExceptionResolution({
        traceId,
        queueItemId: body.queueItemId,
        receiptId: body.receiptId,
        applicationId: body.applicationId,
        borrowerId: body.borrowerId,
        tenantId: body.tenantId,
        actorId: actor,
        exceptionType: body.exceptionType,
        resolutionAction: body.resolutionAction,
        resolutionEvidenceRef: body.resolutionEvidenceRef,
        operatorAttestationRef: body.operatorAttestationRef,
        borrowerContactRef: body.borrowerContactRef,
        retryPlanRef: body.retryPlanRef,
        disputeResolutionRef: body.disputeResolutionRef,
        retentionPolicyRef: body.retentionPolicyRef,
        humanReviewCompleted: body.humanReviewCompleted,
        metadata: {
          ...(body.metadata ?? {}),
          access,
          recordAccess,
        },
      });

    const classifiedOutput = classifyRecord(
      {
        resolutionId: noticeExceptionResolution.resolution.id,
        queueItemId: noticeExceptionResolution.resolution.queueItemId,
        receiptId: noticeExceptionResolution.resolution.receiptId,
        resolutionStatus:
          noticeExceptionResolution.resolution.resolutionStatus,
        resolutionAllowed: noticeExceptionResolution.resolutionAllowed,
        queueCompleted: noticeExceptionResolution.queueCompleted,
        retryAuthorized:
          noticeExceptionResolution.resolution.retryAuthorized,
        externalProviderActionPerformed:
          noticeExceptionResolution.resolution.externalProviderActionPerformed,
        gates: noticeExceptionResolution.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-exceptions-resolve-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-notice-exception-resolution"],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "resolution-record-only",
          "requires-governed-export-context",
        ],
        redactionRequirements: [
          "redact-provider-and-contact-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(noticeExceptionResolution.resolution.id),
      outputType: "borrower_notice_exception_resolution",
      audience: "governance",
      claimType: "fact",
      summary:
        "Borrower notice exception resolution controls were evaluated against queue status, receipt state, operator attestation, resolution evidence, retention, retry, contact, and dispute gates.",
      ruleVersion: "borrower-notice-exception-resolution-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !noticeExceptionResolution.resolutionAllowed,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(noticeExceptionResolution.receipt.id),
          sourceType: "document",
          sourceName: "borrower-notice-delivery-receipt",
          sourceVersion: "borrower-notice-delivery-receipts-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        resolutionId: noticeExceptionResolution.resolution.id,
        queueItemId: noticeExceptionResolution.resolution.queueItemId,
        receiptId: noticeExceptionResolution.resolution.receiptId,
        resolutionAllowed: noticeExceptionResolution.resolutionAllowed,
        queueCompleted: noticeExceptionResolution.queueCompleted,
        externalProviderActionPerformed: false,
        gates: noticeExceptionResolution.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: noticeExceptionResolution.resolutionAllowed
        ? "BORROWER_NOTICE_EXCEPTION_RESOLUTION_APPROVED"
        : "BORROWER_NOTICE_EXCEPTION_RESOLUTION_BLOCKED",
      domain: "operations",
      severity: noticeExceptionResolution.resolutionAllowed ? "INFO" : "WARN",
      message: noticeExceptionResolution.resolutionAllowed
        ? "Borrower notice exception was resolved and the operator queue item was completed without external provider action."
        : "Borrower notice exception resolution was blocked by governance gates.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.notices.exceptions.resolve",
      metadata: {
        resolutionId: noticeExceptionResolution.resolution.id,
        queueItemId: noticeExceptionResolution.resolution.queueItemId,
        receiptId: noticeExceptionResolution.resolution.receiptId,
        resolutionStatus:
          noticeExceptionResolution.resolution.resolutionStatus,
        resolutionAllowed: noticeExceptionResolution.resolutionAllowed,
        queueCompleted: noticeExceptionResolution.queueCompleted,
        externalProviderActionPerformed: false,
        gates: noticeExceptionResolution.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "borrower_notice_exception_resolution_input",
          resourceId: body.queueItemId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/exceptions/resolve",
            stage: "input",
          },
        },
        {
          resourceType: "borrower_notice_exception_resolution_output",
          resourceId: String(noticeExceptionResolution.resolution.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/exceptions/resolve",
            stage: "output",
            queueItemId: noticeExceptionResolution.resolution.queueItemId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_notice_exception_resolution",
        targetId: String(noticeExceptionResolution.resolution.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion:
          "borrower-notice-exception-resolution-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          resolutionId: noticeExceptionResolution.resolution.id,
          queueItemId: noticeExceptionResolution.resolution.queueItemId,
          resolutionAllowed: noticeExceptionResolution.resolutionAllowed,
          queueCompleted: noticeExceptionResolution.queueCompleted,
          externalProviderActionPerformed: false,
          gates: noticeExceptionResolution.gates,
        },
        metadata: {
          route: "/api/notices/exceptions/resolve",
          operation: "borrower-notice.exception-resolve",
        },
      },
      metadata: {
        route: "/api/notices/exceptions/resolve",
        operation: "borrower-notice.exception-resolve",
      },
    });

    return NextResponse.json({
      ok: true,
      resolution: resolutionResponse(noticeExceptionResolution.resolution),
      result: {
        resolutionAllowed: noticeExceptionResolution.resolutionAllowed,
        resolutionStatus:
          noticeExceptionResolution.resolution.resolutionStatus,
        queueCompleted: noticeExceptionResolution.queueCompleted,
        queueStatusAfter:
          noticeExceptionResolution.resolution.queueStatusAfter,
        retryAuthorized:
          noticeExceptionResolution.resolution.retryAuthorized,
        borrowerDisclosureAllowed:
          noticeExceptionResolution.resolution.borrowerDisclosureAllowed,
        externalProviderActionPerformed:
          noticeExceptionResolution.resolution.externalProviderActionPerformed,
        gates: noticeExceptionResolution.gates,
        message: noticeExceptionResolution.resolutionAllowed
          ? "Borrower notice exception resolution was approved and the operator queue item was completed. No external provider action was performed."
          : "Borrower notice exception resolution is blocked. The operator queue item remains open.",
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
      eventType: "BORROWER_NOTICE_EXCEPTION_RESOLUTION_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Borrower notice exception resolution encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.notices.exceptions.resolve",
      metadata: {
        route: "/api/notices/exceptions/resolve",
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice exception resolution error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/notices/exceptions/resolve",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice exception resolution error.",
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
