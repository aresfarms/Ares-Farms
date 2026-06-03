import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistExternalConnectorRequest } from "@/lib/connectors/externalDataConnectorStore";
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
 * External Data Source Check API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed source authority before external data can influence
 *   platform behavior.
 *
 * - Vol II: Regulatory Governance
 *   Prevents ungoverned reliance on USDA, SBA, property, borrower, or
 *   institutional external data.
 *
 * - Vol III: Technical Infrastructure
 *   Records replay-safe connector governance without performing live external
 *   calls before connector certification.
 *
 * - Vol IV: Operational Runbooks
 *   Supports connector review, outage handling, escalation, certification,
 *   and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces source authority, classification, consent, observability,
 *   replayability, version lineage, and evidence preservation.
 */

type SourceCheckRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  sourceId?: string | null;
  source?: string | null;
  connectorType?: string | null;
  queryType?: string | null;
  role?: string | null;
  query?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

function createConnectorTraceId(): string {
  return `connector-source-check-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: SourceCheckRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: SourceCheckRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function requestedSourceId(body: SourceCheckRequest): string {
  return body.sourceId ?? body.source ?? body.connectorType ?? "";
}

export async function POST(req: NextRequest) {
  const traceId = createConnectorTraceId();

  try {
    const body = (await req.json()) as SourceCheckRequest;
    const actor = actorId(body);
    const sourceId = requestedSourceId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "external-data.source-check",
      module: "api.connectors.source-check",
      traceId,
      schemaVersion: "external-data-source-check-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/connectors/source-check",
        sourceId,
        queryType: body.queryType ?? null,
        liveCallExpected: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EXTERNAL_CONNECTOR_RUNTIME_BLOCKED",
        domain: "connector",
        severity: "WARN",
        message: "External connector source check was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.source-check",
        metadata: {
          route: "/api/connectors/source-check",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/source-check",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked external source check.",
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
        "user",
        "borrower",
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "external-data.source-check",
      module: "api.connectors.source-check",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EXTERNAL_CONNECTOR_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "External connector source check was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.source-check",
        metadata: {
          route: "/api/connectors/source-check",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/source-check",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for external source checks.",
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
      operation: "external-data.source-check",
      module: "api.connectors.source-check",
      traceId,
      resourceType: "connector_request",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "EXTERNAL_CONNECTOR_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "External connector source check was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.source-check",
        metadata: {
          route: "/api/connectors/source-check",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/source-check",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this application connector record.",
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
      operation: "external-data.source-check",
      module: "api.connectors.source-check",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "external-data-source-check-v0.1.0",
          "src/app/api/connectors/source-check/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "external-data-connectors-v0.1.0",
          "src/db/schema/externalDataConnectors.ts",
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
          "api",
          "external-data-connector-runtime-v0.1.0",
          "src/lib/connectors/externalDataConnectorStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        sourceId,
        queryType: body.queryType ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        query: body.query ?? {},
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-connectors-source-check-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "regulated-external-source-review",
          "connector-certification-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-official-external-source-data",
          "requires-live-connector-certification-before-use",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-borrower-and-property-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-external-source-review-consent"],
      }
    );

    const connector = await persistExternalConnectorRequest({
      traceId,
      sourceId,
      queryType: body.queryType ?? "",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      requestPayload: body.query ?? {},
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        connectorRunId: connector.connectorRun.id,
        sourceId: connector.connectorRun.sourceId,
        sourceName: connector.connectorRun.sourceName,
        queryType: connector.connectorRun.queryType,
        status: connector.connectorRun.status,
        liveCallPerformed: connector.connectorRun.liveCallPerformed,
        humanReviewRequired: connector.connectorRun.humanReviewRequired,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-connectors-source-check-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "regulated-external-source-review",
          "connector-certification-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "advisory-governance-record-only",
          "not-official-external-source-data",
          "requires-certified-live-connector-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-borrower-and-property-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-external-source-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(connector.connectorRun.id),
      outputType: "external_data_source_check",
      audience: "governance",
      claimType: "fact",
      summary:
        "External source governance was recorded without performing a live USDA, SBA, or property-record call.",
      ruleVersion: "external-data-connector-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: connector.connectorRun.sourceId,
          sourceType: "connector",
          sourceName: connector.connectorRun.sourceName,
          sourceVersion: connector.connectorRun.sourceVersion,
          replayRef: traceId,
        },
      ],
      metadata: {
        connectorRunId: connector.connectorRun.id,
        status: connector.connectorRun.status,
        liveCallPerformed: connector.connectorRun.liveCallPerformed,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "EXTERNAL_CONNECTOR_SOURCE_CHECK_RECORDED",
      domain: "connector",
      severity: "INFO",
      message:
        "External source governance was recorded without live connector execution.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.connectors.source-check",
      metadata: {
        connectorRunId: connector.connectorRun.id,
        sourceId: connector.connectorRun.sourceId,
        queryType: connector.connectorRun.queryType,
        status: connector.connectorRun.status,
        liveCallPerformed: connector.connectorRun.liveCallPerformed,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "external_connector_input",
          resourceId: String(connector.connectorRun.id),
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/source-check",
            stage: "input",
            sourceId: connector.connectorRun.sourceId,
          },
        },
        {
          resourceType: "external_connector_output",
          resourceId: String(connector.connectorRun.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/source-check",
            stage: "output",
            sourceId: connector.connectorRun.sourceId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "external_data_connector_request",
        targetId: String(connector.connectorRun.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "external-data-source-check-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          connectorRunId: connector.connectorRun.id,
          sourceId: connector.connectorRun.sourceId,
          liveCallPerformed: connector.connectorRun.liveCallPerformed,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/connectors/source-check",
          operation: "external-data.source-check",
        },
      },
      metadata: {
        route: "/api/connectors/source-check",
        operation: "external-data.source-check",
      },
    });

    return NextResponse.json({
      ok: true,
      source: connector.source,
      connectorRun: connector.connectorRun,
      result: connector.normalizedResult,
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
      eventType: "EXTERNAL_CONNECTOR_SOURCE_CHECK_ERROR",
      domain: "connector",
      severity: "ERROR",
      message: "External source check encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.connectors.source-check",
      metadata: {
        route: "/api/connectors/source-check",
        error:
          error instanceof Error
            ? error.message
            : "Unknown external source check error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/connectors/source-check",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown external source check error.",
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
