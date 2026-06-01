import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistExternalConnectorExecution } from "@/lib/connectors/externalConnectorExecutionStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * External Connector Execution API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority before external connector execution.
 *
 * - Vol II: Prevents USDA, SBA, property, borrower, or institutional source
 *   data from becoming regulated fact without certified execution controls.
 *
 * - Vol III: Records replay-safe execution authorization without performing
 *   uncontrolled live external calls or official data fetches.
 *
 * - Vol IV: Supports credential review, outage handling, retry/recovery,
 *   isolation, escalation, and audit preparation.
 *
 * - Vol V: Enforces source authority, classification, observability, replay,
 *   version lineage, schema contracts, consent, isolation, controlled
 *   disclosure, and evidence preservation.
 */

type ConnectorExecutionRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  connectorRunId?: string | null;
  adapterId?: string | null;
  sourceId?: string | null;
  executionRef?: string | null;
  operationalRunbookRef?: string | null;
  operationalRunbookStatus?: string | null;
  consentRef?: string | null;
  consentStatus?: string | null;
  isolationRef?: string | null;
  isolationStatus?: string | null;
  schemaContractStatus?: string | null;
  metadata?: Record<string, unknown>;
};

function createConnectorExecutionTraceId(): string {
  return `connector-execution-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: ConnectorExecutionRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: ConnectorExecutionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function executionResponse(
  execution: Awaited<ReturnType<typeof persistExternalConnectorExecution>>["execution"]
) {
  return {
    id: execution.id,
    connectorRunId: execution.connectorRunId,
    adapterId: execution.adapterId,
    sourceId: execution.sourceId,
    sourceName: execution.sourceName,
    connectorType: execution.connectorType,
    queryType: execution.queryType,
    applicationId: execution.applicationId,
    borrowerId: execution.borrowerId,
    tenantId: execution.tenantId,
    executionStatus: execution.executionStatus,
    executionRef: execution.executionRef,
    sourceAuthorityRef: execution.sourceAuthorityRef,
    credentialRef: execution.credentialRef,
    outagePolicyRef: execution.outagePolicyRef,
    replayPolicyRef: execution.replayPolicyRef,
    operationalRunbookRef: execution.operationalRunbookRef,
    schemaContractVersion: execution.schemaContractVersion,
    consentRef: execution.consentRef,
    isolationRef: execution.isolationRef,
    connectorRunFound: execution.connectorRunFound,
    applicationMatches: execution.applicationMatches,
    sourceMatches: execution.sourceMatches,
    connectorRunNotPreviouslyLive:
      execution.connectorRunNotPreviouslyLive,
    sourceLiveCallsAllowed: execution.sourceLiveCallsAllowed,
    adapterFound: execution.adapterFound,
    adapterSourceMatches: execution.adapterSourceMatches,
    adapterCertified: execution.adapterCertified,
    adapterLiveCallsAllowed: execution.adapterLiveCallsAllowed,
    sourceAuthorityPresent: execution.sourceAuthorityPresent,
    credentialApproved: execution.credentialApproved,
    outagePolicyTested: execution.outagePolicyTested,
    replayPolicyVerified: execution.replayPolicyVerified,
    schemaContractVerified: execution.schemaContractVerified,
    consentVerified: execution.consentVerified,
    isolationVerified: execution.isolationVerified,
    operationalRunbookApproved: execution.operationalRunbookApproved,
    executionAllowed: execution.executionAllowed,
    liveCallPerformed: execution.liveCallPerformed,
    officialDataFetched: execution.officialDataFetched,
    humanReviewRequired: execution.humanReviewRequired,
    executionAuthorizedAt: execution.executionAuthorizedAt,
    liveCallAt: execution.liveCallAt,
    classification: execution.classification,
    replayRef: execution.replayRef,
    traceId: execution.traceId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createConnectorExecutionTraceId();

  try {
    const body = (await req.json()) as ConnectorExecutionRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "external-connector.execution",
      module: "api.connectors.execution",
      traceId,
      schemaVersion: "external-connector-executions-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/connectors/execution",
        applicationId: body.applicationId ?? null,
        connectorRunId: body.connectorRunId ?? null,
        adapterId: body.adapterId ?? null,
        sourceId: body.sourceId ?? null,
        liveCallExpected: false,
        officialDataFetchExpected: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EXTERNAL_CONNECTOR_EXECUTION_RUNTIME_BLOCKED",
        domain: "connector",
        severity: "WARN",
        message:
          "External connector execution was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.execution",
        metadata: {
          route: "/api/connectors/execution",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/execution",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked external connector execution.",
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
      operation: "external-connector.execution",
      module: "api.connectors.execution",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EXTERNAL_CONNECTOR_EXECUTION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "External connector execution was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.execution",
        metadata: {
          route: "/api/connectors/execution",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/execution",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for external connector execution.",
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
      operation: "external-connector.execution",
      module: "api.connectors.execution",
      traceId,
      resourceType: "connector_request",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EXTERNAL_CONNECTOR_EXECUTION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "External connector execution was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.execution",
        metadata: {
          route: "/api/connectors/execution",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/execution",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this external connector execution record.",
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
      operation: "external-connector.execution",
      module: "api.connectors.execution",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "external-connector-execution-api-v0.1.0",
          "src/app/api/connectors/execution/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "external-connector-executions-v0.1.0",
          "src/db/schema/externalConnectorExecutions.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "external-data-connectors-v0.1.0",
          "src/db/schema/externalDataConnectors.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "certified-connector-adapters-v0.1.0",
          "src/db/schema/certifiedConnectorAdapters.ts",
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
          "external-connector-execution-runtime-v0.1.0",
          "src/lib/connectors/externalConnectorExecutionStore.ts",
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
        connectorRunId: body.connectorRunId ?? null,
        adapterId: body.adapterId ?? null,
        sourceId: body.sourceId ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        operationalRunbookStatus: body.operationalRunbookStatus ?? null,
        consentStatus: body.consentStatus ?? null,
        isolationStatus: body.isolationStatus ?? null,
        schemaContractStatus: body.schemaContractStatus ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-connectors-execution-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-external-connector-execution",
          "regulated-external-source-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "requires-certified-connector-adapter",
          "requires-source-authority-and-schema-contract",
          "requires-consent-and-isolation-controls",
          "live-call-not-performed-by-dev-runtime",
        ],
        redactionRequirements: [
          "redact-borrower-and-property-identifiers-before-public-disclosure",
          "redact-credential-references-before-public-disclosure",
        ],
        consentRequirements: ["borrower-external-source-review-consent"],
      }
    );

    const connectorExecution = await persistExternalConnectorExecution({
      traceId,
      connectorRunId: body.connectorRunId,
      adapterId: body.adapterId,
      sourceId: body.sourceId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      executionRef: body.executionRef,
      operationalRunbookRef: body.operationalRunbookRef,
      operationalRunbookStatus: body.operationalRunbookStatus,
      consentRef: body.consentRef,
      consentStatus: body.consentStatus,
      isolationRef: body.isolationRef,
      isolationStatus: body.isolationStatus,
      schemaContractStatus: body.schemaContractStatus,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        executionId: connectorExecution.execution.id,
        connectorRunId: connectorExecution.execution.connectorRunId,
        executionStatus: connectorExecution.executionStatus,
        executionAllowed: connectorExecution.executionAllowed,
        liveCallPerformed: connectorExecution.execution.liveCallPerformed,
        officialDataFetched: connectorExecution.execution.officialDataFetched,
        gates: connectorExecution.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-connectors-execution-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-external-connector-execution",
          "regulated-external-source-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "connector-execution-record-only",
          "official-data-not-fetched-by-dev-runtime",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-borrower-and-property-identifiers-before-public-disclosure",
          "redact-credential-references-before-public-disclosure",
        ],
        consentRequirements: ["borrower-external-source-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(connectorExecution.execution.id),
      outputType: "external_connector_execution_control",
      audience: "governance",
      claimType: "fact",
      summary:
        "External connector execution controls were evaluated against source authority, certified adapter, credential, outage, replay, schema contract, consent, isolation, operational runbook, and no-live-call gates.",
      ruleVersion: "external-connector-execution-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(connectorExecution.connectorRun.id),
          sourceType: "connector",
          sourceName: connectorExecution.connectorRun.sourceName,
          sourceVersion: connectorExecution.connectorRun.sourceVersion,
          replayRef: traceId,
        },
      ],
      metadata: {
        executionId: connectorExecution.execution.id,
        connectorRunId: connectorExecution.execution.connectorRunId,
        executionAllowed: connectorExecution.executionAllowed,
        liveCallPerformed: false,
        officialDataFetched: false,
        gates: connectorExecution.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: connectorExecution.executionAllowed
        ? "EXTERNAL_CONNECTOR_EXECUTION_AUTHORIZED"
        : "EXTERNAL_CONNECTOR_EXECUTION_BLOCKED",
      domain: "connector",
      severity: connectorExecution.executionAllowed ? "INFO" : "WARN",
      message: connectorExecution.executionAllowed
        ? "External connector execution was authorized. No live external call or official data fetch was performed by this runtime."
        : "External connector execution controls blocked execution authorization.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.connectors.execution",
      metadata: {
        executionId: connectorExecution.execution.id,
        connectorRunId: connectorExecution.execution.connectorRunId,
        executionStatus: connectorExecution.executionStatus,
        executionAllowed: connectorExecution.executionAllowed,
        liveCallPerformed: false,
        officialDataFetched: false,
        gates: connectorExecution.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "external_connector_execution_input",
          resourceId: body.connectorRunId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/execution",
            stage: "input",
          },
        },
        {
          resourceType: "external_connector_execution_output",
          resourceId: String(connectorExecution.execution.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/execution",
            stage: "output",
            connectorRunId: connectorExecution.execution.connectorRunId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "external_connector_execution",
        targetId: String(connectorExecution.execution.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "external-connector-execution-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          executionId: connectorExecution.execution.id,
          executionAllowed: connectorExecution.executionAllowed,
          executionStatus: connectorExecution.executionStatus,
          liveCallPerformed: false,
          officialDataFetched: false,
          gates: connectorExecution.gates,
        },
        metadata: {
          route: "/api/connectors/execution",
          operation: "external-connector.execution",
        },
      },
      metadata: {
        route: "/api/connectors/execution",
        operation: "external-connector.execution",
      },
    });

    return NextResponse.json({
      ok: true,
      execution: executionResponse(connectorExecution.execution),
      connectorRun: connectorExecution.connectorRun,
      result: {
        executionAllowed: connectorExecution.executionAllowed,
        executionStatus: connectorExecution.executionStatus,
        liveCallPerformed: connectorExecution.execution.liveCallPerformed,
        officialDataFetched:
          connectorExecution.execution.officialDataFetched,
        connectorRunStatus: connectorExecution.connectorRun.status,
        gates: connectorExecution.gates,
        message: connectorExecution.executionAllowed
          ? "External connector execution is authorized. No live external call or official data fetch was performed by this runtime."
          : "External connector execution is blocked. This record is not official external source data.",
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
      eventType: "EXTERNAL_CONNECTOR_EXECUTION_ERROR",
      domain: "connector",
      severity: "ERROR",
      message:
        "External connector execution encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.connectors.execution",
      metadata: {
        route: "/api/connectors/execution",
        error:
          error instanceof Error
            ? error.message
            : "Unknown external connector execution error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/connectors/execution",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown external connector execution error.",
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
