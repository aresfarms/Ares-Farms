import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistBorrowerNoticeProviderExecution } from "@/lib/notices/borrowerNoticeProviderExecutionStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Notice Provider Execution API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before any notice provider
 *   execution action is authorized.
 *
 * - Vol II: Preserves adverse-action, appeal, borrower-disclosure,
 *   delivery tracking, retry, returned-mail, failed-delivery, dispute,
 *   redaction, and retention boundaries.
 *
 * - Vol III: Records replay-safe provider execution authorization without
 *   uncontrolled external provider transmission.
 *
 * - Vol IV: Supports provider runbooks, outage handling, retry handling,
 *   returned-mail handling, failed-delivery response, dispute intake,
 *   recovery, escalation, and audit preparation.
 *
 * - Vol V: Enforces classification, explainability, observability,
 *   replayability, version lineage, schema contracts, consent, isolation,
 *   controlled disclosure, and evidence preservation.
 */

type NoticeProviderExecutionRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  deliveryId?: string | null;
  providerId?: string | null;
  providerType?: string | null;
  providerAdapterStatus?: string | null;
  providerExecutionRef?: string | null;
  providerEventId?: string | null;
  providerResponseRef?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  retryPolicyRef?: string | null;
  returnedMailPolicyRef?: string | null;
  failedDeliveryPolicyRef?: string | null;
  disputeIntakeRef?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  schemaContractVersion?: string | null;
  schemaContractStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  metadata?: Record<string, unknown>;
};

function createNoticeProviderExecutionTraceId(): string {
  return `notice-provider-execution-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: NoticeProviderExecutionRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: NoticeProviderExecutionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function executionResponse(
  execution: Awaited<
    ReturnType<typeof persistBorrowerNoticeProviderExecution>
  >["execution"]
) {
  return {
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
  };
}

export async function POST(req: NextRequest) {
  const traceId = createNoticeProviderExecutionTraceId();

  try {
    const body = (await req.json()) as NoticeProviderExecutionRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower-notice.provider-execution",
      module: "api.notices.provider-execution",
      traceId,
      schemaVersion: "borrower-notice-provider-executions-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/notices/provider-execution",
        applicationId: body.applicationId ?? null,
        deliveryId: body.deliveryId ?? null,
        providerId: body.providerId ?? null,
        externalProviderActionExpected: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_PROVIDER_EXECUTION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Borrower notice provider execution was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.provider-execution",
        metadata: {
          route: "/api/notices/provider-execution",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/provider-execution",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked borrower notice provider execution.",
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
      allowedRoles: ["operator", "underwriter", "admin", "governance"],
      operation: "borrower-notice.provider-execution",
      module: "api.notices.provider-execution",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_PROVIDER_EXECUTION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice provider execution was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.provider-execution",
        metadata: {
          route: "/api/notices/provider-execution",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/provider-execution",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for borrower notice provider execution.",
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
      operation: "borrower-notice.provider-execution",
      module: "api.notices.provider-execution",
      traceId,
      resourceType: "borrower_notice_delivery",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_PROVIDER_EXECUTION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice provider execution was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.provider-execution",
        metadata: {
          route: "/api/notices/provider-execution",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/provider-execution",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this borrower notice provider execution record.",
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
      operation: "borrower-notice.provider-execution",
      module: "api.notices.provider-execution",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-provider-execution-api-v0.1.0",
          "src/app/api/notices/provider-execution/route.ts",
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
          "borrower-notice-provider-execution-runtime-v0.1.0",
          "src/lib/notices/borrowerNoticeProviderExecutionStore.ts",
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
        deliveryId: body.deliveryId ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        providerId: body.providerId ?? null,
        providerType: body.providerType ?? null,
        providerAdapterStatus: body.providerAdapterStatus ?? null,
        credentialStatus: body.credentialStatus ?? null,
        outageStatus: body.outageStatus ?? null,
        replayStatus: body.replayStatus ?? null,
        operationalRunbookStatus: body.operationalRunbookStatus ?? null,
        schemaContractVersion: body.schemaContractVersion ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-provider-execution-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-borrower-notice-provider-execution",
          "adverse-action-notice-delivery",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "requires-approved-provider-adapter",
          "requires-retry-return-failure-dispute-runbooks",
          "requires-schema-consent-isolation-controls",
          "external-provider-action-not-performed-by-dev-runtime",
        ],
        redactionRequirements: [
          "redact-provider-credential-references-before-public-disclosure",
          "redact-internal-provider-runbook-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const providerExecution = await persistBorrowerNoticeProviderExecution({
      traceId,
      deliveryId: body.deliveryId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      providerId: body.providerId,
      providerType: body.providerType,
      providerAdapterStatus: body.providerAdapterStatus,
      providerExecutionRef: body.providerExecutionRef,
      providerEventId: body.providerEventId,
      providerResponseRef: body.providerResponseRef,
      credentialRef: body.credentialRef,
      credentialStatus: body.credentialStatus,
      retryPolicyRef: body.retryPolicyRef,
      returnedMailPolicyRef: body.returnedMailPolicyRef,
      failedDeliveryPolicyRef: body.failedDeliveryPolicyRef,
      disputeIntakeRef: body.disputeIntakeRef,
      outagePolicyRef: body.outagePolicyRef,
      outageStatus: body.outageStatus,
      replayPolicyRef: body.replayPolicyRef,
      replayStatus: body.replayStatus,
      operationalRunbookRef: body.operationalRunbookRef,
      operationalRunbookStatus: body.operationalRunbookStatus,
      schemaContractVersion: body.schemaContractVersion,
      schemaContractStatus: body.schemaContractStatus,
      consentRef: body.consentRef,
      consentStatus: body.consentStatus,
      isolationRef: body.isolationRef,
      isolationStatus: body.isolationStatus,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        executionId: providerExecution.execution.id,
        deliveryId: providerExecution.execution.deliveryId,
        executionStatus: providerExecution.executionStatus,
        providerExecutionAllowed:
          providerExecution.providerExecutionAllowed,
        externalProviderActionPerformed:
          providerExecution.execution.externalProviderActionPerformed,
        gates: providerExecution.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-provider-execution-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-borrower-notice-provider-execution",
          "adverse-action-notice-delivery",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "provider-execution-record-only",
          "external-provider-action-not-performed-by-dev-runtime",
          "requires-provider-event-receipt-before-delivered-status",
        ],
        redactionRequirements: [
          "redact-provider-credential-references-before-public-disclosure",
          "redact-internal-provider-runbook-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(providerExecution.execution.id),
      outputType: "borrower_notice_provider_execution_control",
      audience: "governance",
      claimType: "fact",
      summary:
        "Borrower notice provider execution controls were evaluated against delivery readiness, provider adapter approval, credentials, outage, retry, returned-mail, failed-delivery, dispute, replay, schema, consent, isolation, and operational runbook gates.",
      ruleVersion: "borrower-notice-provider-execution-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired:
        !providerExecution.providerExecutionAllowed,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(providerExecution.delivery.id),
          sourceType: "human_review",
          sourceName: "borrower-notice-delivery",
          sourceVersion: "borrower-notice-deliveries-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        executionId: providerExecution.execution.id,
        deliveryId: providerExecution.execution.deliveryId,
        providerExecutionAllowed:
          providerExecution.providerExecutionAllowed,
        externalProviderActionPerformed: false,
        gates: providerExecution.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: providerExecution.providerExecutionAllowed
        ? "BORROWER_NOTICE_PROVIDER_EXECUTION_AUTHORIZED"
        : "BORROWER_NOTICE_PROVIDER_EXECUTION_BLOCKED",
      domain: "operations",
      severity: providerExecution.providerExecutionAllowed ? "INFO" : "WARN",
      message: providerExecution.providerExecutionAllowed
        ? "Borrower notice provider execution was authorized. No external provider action was performed by this runtime."
        : "Borrower notice provider execution controls blocked provider execution.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.notices.provider-execution",
      metadata: {
        executionId: providerExecution.execution.id,
        deliveryId: providerExecution.execution.deliveryId,
        executionStatus: providerExecution.executionStatus,
        providerExecutionAllowed:
          providerExecution.providerExecutionAllowed,
        externalProviderActionPerformed: false,
        gates: providerExecution.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "borrower_notice_provider_execution_input",
          resourceId: body.deliveryId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/provider-execution",
            stage: "input",
          },
        },
        {
          resourceType: "borrower_notice_provider_execution_output",
          resourceId: String(providerExecution.execution.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/provider-execution",
            stage: "output",
            deliveryId: providerExecution.execution.deliveryId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_notice_provider_execution",
        targetId: String(providerExecution.execution.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "borrower-notice-provider-execution-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          executionId: providerExecution.execution.id,
          providerExecutionAllowed:
            providerExecution.providerExecutionAllowed,
          executionStatus: providerExecution.executionStatus,
          externalProviderActionPerformed: false,
          gates: providerExecution.gates,
        },
        metadata: {
          route: "/api/notices/provider-execution",
          operation: "borrower-notice.provider-execution",
        },
      },
      metadata: {
        route: "/api/notices/provider-execution",
        operation: "borrower-notice.provider-execution",
      },
    });

    return NextResponse.json({
      ok: true,
      execution: executionResponse(providerExecution.execution),
      result: {
        providerExecutionAllowed:
          providerExecution.providerExecutionAllowed,
        executionStatus: providerExecution.executionStatus,
        externalProviderActionPerformed:
          providerExecution.execution.externalProviderActionPerformed,
        deliveryStatusAfterExecution:
          providerExecution.delivery.deliveryStatus,
        gates: providerExecution.gates,
        message: providerExecution.providerExecutionAllowed
          ? "Borrower notice provider execution is authorized. No external provider action was performed by this runtime."
          : "Borrower notice provider execution is blocked. This record is not an external delivery event.",
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
      eventType: "BORROWER_NOTICE_PROVIDER_EXECUTION_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Borrower notice provider execution encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.notices.provider-execution",
      metadata: {
        route: "/api/notices/provider-execution",
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice provider execution error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/notices/provider-execution",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice provider execution error.",
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
