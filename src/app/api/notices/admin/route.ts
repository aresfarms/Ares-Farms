import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  BorrowerNoticeAdminRecord,
  listBorrowerNoticeAdminRecords,
} from "@/lib/notices/borrowerNoticeAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Notice Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for notice lifecycle reads.
 *
 * - Vol II: Protects adverse-action, appeal, delivery, retry, dispute,
 *   retention, and borrower-disclosure records from uncontrolled exposure.
 *
 * - Vol III: Provides replay-safe, record-scoped read access for notice
 *   lifecycle data before dashboards consume it.
 *
 * - Vol IV: Supports operator/admin monitoring, recovery, escalation,
 *   audit preparation, and dashboard-safe backend reads.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

type NoticeAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  deliveryId?: string | null;
  deliveryStatus?: string | null;
  limit: number;
  includeProviderExecutions: boolean;
  includeReceipts: boolean;
  includeResolutions: boolean;
};

function createNoticeAdminTraceId(): string {
  return `notice-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): NoticeAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    deliveryId: normalizeText(params.get("deliveryId")),
    deliveryStatus: normalizeText(params.get("deliveryStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeProviderExecutions: normalizeBoolean(
      params.get("includeProviderExecutions"),
      true
    ),
    includeReceipts: normalizeBoolean(params.get("includeReceipts"), true),
    includeResolutions: normalizeBoolean(
      params.get("includeResolutions"),
      true
    ),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: NoticeAdminQuery): boolean {
  return !(
    query.applicationId ||
    query.deliveryId ||
    query.tenantId ||
    privilegedRole(query.role)
  );
}

function deliveryResponse(record: BorrowerNoticeAdminRecord) {
  return {
    id: record.delivery.id,
    decisionNoticeId: record.delivery.decisionNoticeId,
    applicationId: record.delivery.applicationId,
    borrowerId: record.delivery.borrowerId,
    tenantId: record.delivery.tenantId,
    noticeType: record.delivery.noticeType,
    deliveryChannel: record.delivery.deliveryChannel,
    deliveryStatus: record.delivery.deliveryStatus,
    noticePacketStatus: record.delivery.noticePacketStatus,
    redactionStatus: record.delivery.redactionStatus,
    appealPacketStatus: record.delivery.appealPacketStatus,
    retentionStatus: record.delivery.retentionStatus,
    deliveryAllowed: record.delivery.deliveryAllowed,
    borrowerDisclosureAllowed: record.delivery.borrowerDisclosureAllowed,
    externalDeliveryPerformed: record.delivery.externalDeliveryPerformed,
    deliveryProviderConfigured: record.delivery.deliveryProviderConfigured,
    deliveryPreparedAt: record.delivery.deliveryPreparedAt,
    externalDeliveredAt: record.delivery.externalDeliveredAt,
    createdAt: record.delivery.createdAt,
    updatedAt: record.delivery.updatedAt,
  };
}

function providerExecutionResponse(record: BorrowerNoticeAdminRecord) {
  return record.providerExecutions.map((execution) => ({
    id: execution.id,
    deliveryId: execution.deliveryId,
    decisionNoticeId: execution.decisionNoticeId,
    applicationId: execution.applicationId,
    borrowerId: execution.borrowerId,
    tenantId: execution.tenantId,
    providerId: execution.providerId,
    providerType: execution.providerType,
    deliveryChannel: execution.deliveryChannel,
    executionStatus: execution.executionStatus,
    providerExecutionRef: execution.providerExecutionRef,
    providerEventId: execution.providerEventId,
    providerResponseRef: execution.providerResponseRef,
    deliveryAllowedSnapshot: execution.deliveryAllowedSnapshot,
    borrowerDisclosureAllowedSnapshot:
      execution.borrowerDisclosureAllowedSnapshot,
    deliveryProviderConfigured: execution.deliveryProviderConfigured,
    providerAdapterApproved: execution.providerAdapterApproved,
    credentialApproved: execution.credentialApproved,
    outagePolicyTested: execution.outagePolicyTested,
    retryPolicyAttached: execution.retryPolicyAttached,
    returnedMailPolicyAttached: execution.returnedMailPolicyAttached,
    failedDeliveryPolicyAttached: execution.failedDeliveryPolicyAttached,
    disputeIntakeAttached: execution.disputeIntakeAttached,
    replayPolicyVerified: execution.replayPolicyVerified,
    schemaContractVerified: execution.schemaContractVerified,
    consentVerified: execution.consentVerified,
    isolationVerified: execution.isolationVerified,
    operationalRunbookApproved: execution.operationalRunbookApproved,
    providerExecutionAllowed: execution.providerExecutionAllowed,
    externalProviderActionPerformed:
      execution.externalProviderActionPerformed,
    humanReviewRequired: execution.humanReviewRequired,
    executionAuthorizedAt: execution.executionAuthorizedAt,
    externalProviderActionAt: execution.externalProviderActionAt,
    classification: execution.classification,
    replayRef: execution.replayRef,
    traceId: execution.traceId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  }));
}

function receiptResponse(record: BorrowerNoticeAdminRecord) {
  return record.receipts.map((receipt) => ({
    id: receipt.id,
    deliveryId: receipt.deliveryId,
    receiptType: receipt.receiptType,
    deliveryOutcome: receipt.deliveryOutcome,
    receiptStatus: receipt.receiptStatus,
    providerStatus: receipt.providerStatus,
    failureReasonCode: receipt.failureReasonCode,
    disputeStatus: receipt.disputeStatus,
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
  }));
}

function resolutionResponse(record: BorrowerNoticeAdminRecord) {
  return record.resolutions.map((resolution) => ({
    id: resolution.id,
    queueItemId: resolution.queueItemId,
    receiptId: resolution.receiptId,
    deliveryId: resolution.deliveryId,
    exceptionType: resolution.exceptionType,
    resolutionAction: resolution.resolutionAction,
    resolutionStatus: resolution.resolutionStatus,
    queueStatusBefore: resolution.queueStatusBefore,
    queueStatusAfter: resolution.queueStatusAfter,
    resolutionAllowed: resolution.resolutionAllowed,
    queueCompleted: resolution.queueCompleted,
    retryAuthorized: resolution.retryAuthorized,
    borrowerDisclosureAllowed: resolution.borrowerDisclosureAllowed,
    externalProviderActionPerformed: resolution.externalProviderActionPerformed,
    humanReviewCompleted: resolution.humanReviewCompleted,
    resolvedAt: resolution.resolvedAt,
    createdAt: resolution.createdAt,
    updatedAt: resolution.updatedAt,
  }));
}

export async function GET(req: NextRequest) {
  const traceId = createNoticeAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower-notice.admin-read",
      module: "api.notices.admin",
      traceId,
      schemaVersion: "borrower-notice-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/notices/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        deliveryId: query.deliveryId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "borrower-notice.admin-read",
      module: "api.notices.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (!runtimeGuard.allowed || !access.allowed || scopeRequired(query)) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.admin",
        metadata: {
          route: "/api/notices/admin",
          runtimeGuard,
          access,
          scopeRequired: scopeRequired(query),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired(query),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for borrower notice admin reads or is missing governed scope.",
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

    const recordAccess = query.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "borrower-notice.admin-read",
          module: "api.notices.admin",
          traceId,
          resourceType: "borrower_notice_delivery",
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
        })
      : null;

    if (recordAccess && !recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.admin",
        metadata: {
          route: "/api/notices/admin",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/admin",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this borrower notice lifecycle record.",
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
      operation: "borrower-notice.admin-read",
      module: "api.notices.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-admin-read-api-v0.1.0",
          "src/app/api/notices/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-deliveries-v0.1.0",
          "src/db/schema/borrowerNoticeDeliveries.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-provider-executions-v0.1.0",
          "src/db/schema/borrowerNoticeProviderExecutions.ts",
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
          "borrower-notice-exception-resolutions-v0.1.0",
          "src/db/schema/borrowerNoticeExceptionResolutions.ts",
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
          "borrower-notice-admin-read-runtime-v0.1.0",
          "src/lib/notices/borrowerNoticeAdminStore.ts",
          traceId
        ),
      ],
    });

    const records = await listBorrowerNoticeAdminRecords({
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      deliveryId: query.deliveryId,
      deliveryStatus: query.deliveryStatus,
      limit: query.limit,
      includeProviderExecutions: query.includeProviderExecutions,
      includeReceipts: query.includeReceipts,
      includeResolutions: query.includeResolutions,
    });
    const noticeRecords = records.map((record) => ({
      delivery: deliveryResponse(record),
      providerExecutions: providerExecutionResponse(record),
      receipts: receiptResponse(record),
      resolutions: resolutionResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: noticeRecords.length,
        query: {
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          deliveryId: query.deliveryId,
          deliveryStatus: query.deliveryStatus,
          includeProviderExecutions: query.includeProviderExecutions,
          includeReceipts: query.includeReceipts,
          includeResolutions: query.includeResolutions,
        },
        noticeRecords,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-notice-lifecycle-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-notice-data",
          "requires-governed-dashboard-access",
          "requires-redaction-before-borrower-disclosure",
        ],
        redactionRequirements: [
          "redact-provider-and-internal-resolution-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "BORROWER_NOTICE_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower notice lifecycle records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.notices.admin",
      metadata: {
        route: "/api/notices/admin",
        rowCount: noticeRecords.length,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        deliveryId: query.deliveryId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "borrower_notice_admin_read",
          resourceId: query.applicationId ?? query.deliveryId ?? traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/admin",
            rowCount: noticeRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_notice_admin_read",
        targetId: query.applicationId ?? query.deliveryId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "borrower-notice-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: noticeRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: noticeRecords.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          deliveryId: query.deliveryId,
        },
        metadata: {
          route: "/api/notices/admin",
          operation: "borrower-notice.admin-read",
        },
      },
      metadata: {
        route: "/api/notices/admin",
        operation: "borrower-notice.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: noticeRecords.length,
      noticeRecords,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "BORROWER_NOTICE_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Borrower notice admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.notices.admin",
      metadata: {
        route: "/api/notices/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/notices/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice admin read error.",
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
