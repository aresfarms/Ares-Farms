import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistBorrowerNoticeReceipt } from "@/lib/notices/borrowerNoticeReceiptStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Notice Delivery Receipt API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before receipt evidence is accepted.
 *
 * - Vol II: Preserves borrower notice, adverse-action, appeal, disclosure,
 *   failed-delivery, return, retry, and dispute controls.
 *
 * - Vol III: Records replay-safe delivery receipt lifecycle evidence without
 *   performing any live external provider action.
 *
 * - Vol IV: Supports delivery monitoring, failed-delivery response, dispute
 *   intake, recovery, escalation, and audit preparation.
 *
 * - Vol V: Enforces classification, explainability, observability,
 *   replayability, version lineage, controlled disclosure, and evidence
 *   preservation.
 */

type BorrowerNoticeReceiptRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  deliveryId?: string | null;
  receiptType?: string | null;
  deliveryOutcome?: string | null;
  providerStatus?: string | null;
  failureReasonCode?: string | null;
  providerEventId?: string | null;
  receiptEvidenceRef?: string | null;
  deliveryTrackingRef?: string | null;
  disputeCaseRef?: string | null;
  retryPolicyRef?: string | null;
  retryRequired?: boolean | null;
  receiptReceivedAt?: string | null;
  metadata?: Record<string, unknown>;
};

function createNoticeReceiptTraceId(): string {
  return `notice-receipt-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: BorrowerNoticeReceiptRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: BorrowerNoticeReceiptRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function receiptResponse(
  receipt: Awaited<ReturnType<typeof persistBorrowerNoticeReceipt>>["receipt"]
) {
  return {
    id: receipt.id,
    deliveryId: receipt.deliveryId,
    decisionNoticeId: receipt.decisionNoticeId,
    applicationId: receipt.applicationId,
    borrowerId: receipt.borrowerId,
    tenantId: receipt.tenantId,
    receiptType: receipt.receiptType,
    deliveryChannel: receipt.deliveryChannel,
    deliveryOutcome: receipt.deliveryOutcome,
    receiptStatus: receipt.receiptStatus,
    providerStatus: receipt.providerStatus,
    failureReasonCode: receipt.failureReasonCode,
    disputeStatus: receipt.disputeStatus,
    deliveryProviderRef: receipt.deliveryProviderRef,
    providerEventId: receipt.providerEventId,
    receiptEvidenceRef: receipt.receiptEvidenceRef,
    deliveryTrackingRef: receipt.deliveryTrackingRef,
    retentionPolicyRef: receipt.retentionPolicyRef,
    disputeCaseRef: receipt.disputeCaseRef,
    retryPolicyRef: receipt.retryPolicyRef,
    receiptAccepted: receipt.receiptAccepted,
    providerDeliveryEventRecorded: receipt.providerDeliveryEventRecorded,
    externalDeliveryPerformedByRuntime:
      receipt.externalDeliveryPerformedByRuntime,
    retryRequired: receipt.retryRequired,
    operatorReviewRequired: receipt.operatorReviewRequired,
    receiptReceivedAt: receipt.receiptReceivedAt,
    deliveryConfirmedAt: receipt.deliveryConfirmedAt,
    failureRecordedAt: receipt.failureRecordedAt,
    returnedAt: receipt.returnedAt,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  };
}

function operatorQueueItemResponse(
  queueItem: Awaited<
    ReturnType<typeof persistBorrowerNoticeReceipt>
  >["operatorQueueItem"]
) {
  if (!queueItem) {
    return null;
  }

  return {
    id: queueItem.id,
    queueType: queueItem.queueType,
    sourceType: queueItem.sourceType,
    sourceId: queueItem.sourceId,
    sourceTraceId: queueItem.sourceTraceId,
    applicationId: queueItem.applicationId,
    borrowerId: queueItem.borrowerId,
    tenantId: queueItem.tenantId,
    status: queueItem.status,
    priority: queueItem.priority,
    escalationStatus: queueItem.escalationStatus,
    reviewReason: queueItem.reviewReason,
    requiredRole: queueItem.requiredRole,
    createdAt: queueItem.createdAt,
    updatedAt: queueItem.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createNoticeReceiptTraceId();

  try {
    const body = (await req.json()) as BorrowerNoticeReceiptRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower-notice.receipt-intake",
      module: "api.notices.receipts",
      traceId,
      schemaVersion: "borrower-notice-delivery-receipts-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/notices/receipts",
        applicationId: body.applicationId ?? null,
        deliveryId: body.deliveryId ?? null,
        externalProviderActionPerformed: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_RECEIPT_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Borrower notice delivery receipt intake was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.receipts",
        metadata: {
          route: "/api/notices/receipts",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/receipts",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked borrower notice receipt intake.",
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
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "borrower-notice.receipt-intake",
      module: "api.notices.receipts",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_RECEIPT_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice delivery receipt intake was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.receipts",
        metadata: {
          route: "/api/notices/receipts",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/receipts",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for borrower notice receipt intake.",
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
      operation: "borrower-notice.receipt-intake",
      module: "api.notices.receipts",
      traceId,
      resourceType: "borrower_notice_delivery_receipt",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_RECEIPT_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice delivery receipt intake was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.receipts",
        metadata: {
          route: "/api/notices/receipts",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/receipts",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this borrower notice receipt record.",
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
      operation: "borrower-notice.receipt-intake",
      module: "api.notices.receipts",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-receipt-api-v0.1.0",
          "src/app/api/notices/receipts/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-delivery-receipts-v0.1.0",
          "src/db/schema/borrowerNoticeDeliveryReceipts.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-deliveries-v0.1.0",
          "src/db/schema/borrowerNoticeDeliveries.ts",
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
          "borrower-notice-receipt-runtime-v0.1.0",
          "src/lib/notices/borrowerNoticeReceiptStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "operator-review-queue-runtime-v0.1.0",
          "src/lib/queues/operatorReviewQueueStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        deliveryId: body.deliveryId ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        receiptType: body.receiptType ?? null,
        deliveryOutcome: body.deliveryOutcome ?? null,
        providerStatus: body.providerStatus ?? null,
        failureReasonCode: body.failureReasonCode ?? null,
        providerEventId: body.providerEventId ?? null,
        receiptEvidenceRef: body.receiptEvidenceRef ?? null,
        disputeCaseRef: body.disputeCaseRef ?? null,
        retryPolicyRef: body.retryPolicyRef ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-receipts-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-borrower-notice-receipt-intake",
          "delivery-failure-review",
          "delivery-dispute-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "receipt-record-only",
          "external-provider-action-not-performed-by-runtime",
          "requires-controlled-disclosure-review",
        ],
        redactionRequirements: [
          "redact-provider-event-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const noticeReceipt = await persistBorrowerNoticeReceipt({
      traceId,
      deliveryId: body.deliveryId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      receiptType: body.receiptType,
      deliveryOutcome: body.deliveryOutcome,
      providerStatus: body.providerStatus,
      failureReasonCode: body.failureReasonCode,
      providerEventId: body.providerEventId,
      receiptEvidenceRef: body.receiptEvidenceRef,
      deliveryTrackingRef: body.deliveryTrackingRef,
      disputeCaseRef: body.disputeCaseRef,
      retryPolicyRef: body.retryPolicyRef,
      retryRequired: body.retryRequired,
      receiptReceivedAt: body.receiptReceivedAt,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        receiptId: noticeReceipt.receipt.id,
        deliveryId: noticeReceipt.receipt.deliveryId,
        receiptStatus: noticeReceipt.receipt.receiptStatus,
        deliveryOutcome: noticeReceipt.receipt.deliveryOutcome,
        receiptAccepted: noticeReceipt.receiptAccepted,
        retryRequired: noticeReceipt.receipt.retryRequired,
        operatorReviewRequired: noticeReceipt.receipt.operatorReviewRequired,
        operatorQueueItemId: noticeReceipt.operatorQueueItem?.id ?? null,
        externalDeliveryPerformedByRuntime:
          noticeReceipt.receipt.externalDeliveryPerformedByRuntime,
        gates: noticeReceipt.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-receipts-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-borrower-notice-receipt-intake",
          "delivery-failure-review",
          "delivery-dispute-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "receipt-record-only",
          "requires-operational-review-before-borrower-disclosure",
        ],
        redactionRequirements: [
          "redact-provider-event-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(noticeReceipt.receipt.id),
      outputType: "borrower_notice_delivery_receipt",
      audience: "governance",
      claimType: "fact",
      summary:
        "Borrower notice delivery receipt controls were evaluated against delivery readiness, provider configuration, receipt evidence, tracking, retention, and lifecycle outcome gates.",
      ruleVersion: "borrower-notice-receipt-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired:
        !noticeReceipt.receiptAccepted ||
        noticeReceipt.receipt.operatorReviewRequired,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(noticeReceipt.delivery.id),
          sourceType: "document",
          sourceName: "borrower-notice-delivery",
          sourceVersion: "borrower-notice-deliveries-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        receiptId: noticeReceipt.receipt.id,
        deliveryId: noticeReceipt.receipt.deliveryId,
        receiptAccepted: noticeReceipt.receiptAccepted,
        deliveryOutcome: noticeReceipt.receipt.deliveryOutcome,
        operatorQueueItemId: noticeReceipt.operatorQueueItem?.id ?? null,
        externalDeliveryPerformedByRuntime: false,
        gates: noticeReceipt.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: noticeReceipt.receiptAccepted
        ? "BORROWER_NOTICE_RECEIPT_ACCEPTED"
        : "BORROWER_NOTICE_RECEIPT_BLOCKED",
      domain: "operations",
      severity: noticeReceipt.receiptAccepted ? "INFO" : "WARN",
      message: noticeReceipt.receiptAccepted
        ? "Borrower notice delivery receipt was accepted as governed lifecycle evidence. No external provider action was performed by runtime."
        : "Borrower notice delivery receipt intake was blocked by lifecycle controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.notices.receipts",
      metadata: {
        receiptId: noticeReceipt.receipt.id,
        deliveryId: noticeReceipt.receipt.deliveryId,
        receiptStatus: noticeReceipt.receipt.receiptStatus,
        deliveryOutcome: noticeReceipt.receipt.deliveryOutcome,
        deliveryStatusAfterReceipt: noticeReceipt.deliveryStatusAfterReceipt,
        receiptAccepted: noticeReceipt.receiptAccepted,
        externalDeliveryPerformedByRuntime: false,
        operatorQueueItemId: noticeReceipt.operatorQueueItem?.id ?? null,
        gates: noticeReceipt.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "borrower_notice_receipt_input",
          resourceId: body.deliveryId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/receipts",
            stage: "input",
          },
        },
        {
          resourceType: "borrower_notice_receipt_output",
          resourceId: String(noticeReceipt.receipt.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/receipts",
            stage: "output",
            deliveryId: noticeReceipt.receipt.deliveryId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_notice_delivery_receipt",
        targetId: String(noticeReceipt.receipt.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "borrower-notice-receipt-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          receiptId: noticeReceipt.receipt.id,
          deliveryId: noticeReceipt.receipt.deliveryId,
          receiptAccepted: noticeReceipt.receiptAccepted,
          receiptStatus: noticeReceipt.receipt.receiptStatus,
          deliveryOutcome: noticeReceipt.receipt.deliveryOutcome,
          operatorQueueItemId: noticeReceipt.operatorQueueItem?.id ?? null,
          externalDeliveryPerformedByRuntime: false,
          gates: noticeReceipt.gates,
        },
        metadata: {
          route: "/api/notices/receipts",
          operation: "borrower-notice.receipt-intake",
        },
      },
      metadata: {
        route: "/api/notices/receipts",
        operation: "borrower-notice.receipt-intake",
      },
    });

    return NextResponse.json({
      ok: true,
      receipt: receiptResponse(noticeReceipt.receipt),
      operatorQueueItem: operatorQueueItemResponse(
        noticeReceipt.operatorQueueItem
      ),
      result: {
        receiptAccepted: noticeReceipt.receiptAccepted,
        receiptStatus: noticeReceipt.receipt.receiptStatus,
        deliveryOutcome: noticeReceipt.receipt.deliveryOutcome,
        deliveryStatusAfterReceipt: noticeReceipt.deliveryStatusAfterReceipt,
        retryRequired: noticeReceipt.receipt.retryRequired,
        operatorReviewRequired: noticeReceipt.receipt.operatorReviewRequired,
        providerDeliveryEventRecorded:
          noticeReceipt.receipt.providerDeliveryEventRecorded,
        operatorQueueItemCreated: Boolean(noticeReceipt.operatorQueueItem),
        operatorQueueItemId: noticeReceipt.operatorQueueItem?.id ?? null,
        externalDeliveryPerformedByRuntime:
          noticeReceipt.receipt.externalDeliveryPerformedByRuntime,
        gates: noticeReceipt.gates,
        message: noticeReceipt.receiptAccepted
          ? "Borrower notice receipt was accepted as governed lifecycle evidence. No external provider action was performed by runtime."
          : "Borrower notice receipt intake is blocked. This record is not accepted delivery evidence.",
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
      eventType: "BORROWER_NOTICE_RECEIPT_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Borrower notice delivery receipt intake encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.notices.receipts",
      metadata: {
        route: "/api/notices/receipts",
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice receipt intake error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/notices/receipts",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice receipt intake error.",
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
