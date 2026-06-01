import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import {
  ConnectorAdminRecord,
  getConnectorAdminScopeRecord,
  listConnectorAdminRecords,
} from "@/lib/connectors/connectorAdminStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Connector Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for external connector reads.
 *
 * - Vol II: Protects USDA, SBA, property, borrower, credential, consent,
 *   source-authority, adapter, and execution-control records.
 *
 * - Vol III: Provides replay-safe, record-scoped connector lifecycle reads
 *   before operator, underwriter, auditor, or governance dashboards consume
 *   connector state.
 *
 * - Vol IV: Supports connector monitoring, outage review, certification
 *   review, recovery, escalation, and audit preparation.
 *
 * - Vol V: Enforces source authority, classification, observability,
 *   replayability, version lineage, controlled disclosure, and evidence
 *   preservation.
 */

type ConnectorAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  connectorRunId?: string | null;
  executionId?: string | null;
  adapterId?: string | null;
  sourceId?: string | null;
  connectorType?: string | null;
  queryType?: string | null;
  status?: string | null;
  executionStatus?: string | null;
  certificationStatus?: string | null;
  limit: number;
  includeSource: boolean;
  includeAdapters: boolean;
  includeExecutions: boolean;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createConnectorAdminTraceId(): string {
  return `connector-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): ConnectorAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    connectorRunId: normalizeText(params.get("connectorRunId")),
    executionId: normalizeText(params.get("executionId")),
    adapterId: normalizeText(params.get("adapterId")),
    sourceId: normalizeText(params.get("sourceId")),
    connectorType: normalizeText(params.get("connectorType")),
    queryType: normalizeText(params.get("queryType")),
    status: normalizeText(params.get("status")),
    executionStatus: normalizeText(params.get("executionStatus")),
    certificationStatus: normalizeText(params.get("certificationStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeSource: normalizeBoolean(params.get("includeSource"), true),
    includeAdapters: normalizeBoolean(params.get("includeAdapters"), true),
    includeExecutions: normalizeBoolean(params.get("includeExecutions"), true),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: ConnectorAdminQuery): boolean {
  return !(
    privilegedRole(query.role) ||
    query.tenantId ||
    query.applicationId
  );
}

function sourceResponse(record: ConnectorAdminRecord) {
  if (!record.source) {
    return null;
  }

  return {
    id: record.source.id,
    sourceName: record.source.sourceName,
    sourceType: record.source.sourceType,
    authorityLevel: record.source.authorityLevel,
    status: record.source.status,
    liveCallsAllowed: record.source.liveCallsAllowed,
    sourceVersion: record.source.sourceVersion,
    governanceVersion: record.source.governanceVersion,
    classification: record.source.classification,
    replayRef: record.source.replayRef,
    metadata: record.source.metadata,
    createdAt: record.source.createdAt,
    updatedAt: record.source.updatedAt,
  };
}

function connectorRunResponse(record: ConnectorAdminRecord) {
  return {
    id: record.connectorRun.id,
    sourceId: record.connectorRun.sourceId,
    sourceName: record.connectorRun.sourceName,
    connectorType: record.connectorRun.connectorType,
    queryType: record.connectorRun.queryType,
    applicationId: record.connectorRun.applicationId,
    borrowerId: record.connectorRun.borrowerId,
    tenantId: record.connectorRun.tenantId,
    propertyId: record.connectorRun.propertyId,
    actorId: record.connectorRun.actorId,
    status: record.connectorRun.status,
    liveCallPerformed: record.connectorRun.liveCallPerformed,
    humanReviewRequired: record.connectorRun.humanReviewRequired,
    requestPayload: record.connectorRun.requestPayload,
    normalizedResult: record.connectorRun.normalizedResult,
    sourceVersion: record.connectorRun.sourceVersion,
    governanceVersion: record.connectorRun.governanceVersion,
    classification: record.connectorRun.classification,
    replayRef: record.connectorRun.replayRef,
    traceId: record.connectorRun.traceId,
    requestedAt: record.connectorRun.requestedAt,
    completedAt: record.connectorRun.completedAt,
    createdAt: record.connectorRun.createdAt,
    updatedAt: record.connectorRun.updatedAt,
  };
}

function adapterResponse(record: ConnectorAdminRecord) {
  return record.adapters.map((adapter) => ({
    id: adapter.id,
    adapterId: adapter.adapterId,
    adapterName: adapter.adapterName,
    adapterType: adapter.adapterType,
    sourceId: adapter.sourceId,
    sourceName: adapter.sourceName,
    sourceType: adapter.sourceType,
    sourceAuthorityRef: adapter.sourceAuthorityRef,
    certificationStatus: adapter.certificationStatus,
    liveCallsAllowed: adapter.liveCallsAllowed,
    credentialRef: adapter.credentialRef,
    credentialStatus: adapter.credentialStatus,
    credentialVaultRequired: adapter.credentialVaultRequired,
    outagePolicyRef: adapter.outagePolicyRef,
    outageStatus: adapter.outageStatus,
    replayPolicyRef: adapter.replayPolicyRef,
    replayStatus: adapter.replayStatus,
    schemaContractVersion: adapter.schemaContractVersion,
    connectorConsentRequired: adapter.connectorConsentRequired,
    isolationRequired: adapter.isolationRequired,
    humanReviewRequired: adapter.humanReviewRequired,
    lastCertifiedAt: adapter.lastCertifiedAt,
    revokedAt: adapter.revokedAt,
    governanceVersion: adapter.governanceVersion,
    classification: adapter.classification,
    replayRef: adapter.replayRef,
    traceId: adapter.traceId,
    createdAt: adapter.createdAt,
    updatedAt: adapter.updatedAt,
  }));
}

function executionResponse(record: ConnectorAdminRecord) {
  return record.executions.map((execution) => ({
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
    actorId: execution.actorId,
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
    sourceLiveCallsAllowed: execution.sourceLiveCallsAllowed,
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
    governanceVersion: execution.governanceVersion,
    classification: execution.classification,
    replayRef: execution.replayRef,
    traceId: execution.traceId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  }));
}

function applicationResponse(record: ConnectorAdminRecord) {
  if (!record.application) {
    return null;
  }

  return {
    id: record.application.id,
    borrowerId: record.application.borrowerId,
    tenantId: record.application.tenantId,
    propertyId: record.application.propertyId,
    status: record.application.status,
    reviewStatus: record.application.reviewStatus,
    decisionStatus: record.application.decisionStatus,
    classification: record.application.classification,
    replayRef: record.application.replayRef,
  };
}

function propertyResponse(record: ConnectorAdminRecord) {
  if (!record.property) {
    return null;
  }

  return {
    id: record.property.id,
    tenantId: record.property.tenantId,
    name: record.property.name,
    city: record.property.city,
    state: record.property.state,
    county: record.property.county,
    country: record.property.country,
    classification: record.property.classification,
    replayRef: record.property.replayRef,
  };
}

async function evaluateRecordAccessForRecords(input: {
  records: ConnectorAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: ConnectorAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    if (!record.connectorRun.applicationId) {
      continue;
    }

    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "connector.admin-read",
        module: "api.connectors.admin",
        traceId: input.traceId,
        resourceType: "connector_request",
        applicationId: record.connectorRun.applicationId,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: input.query.userId,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createConnectorAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "connector.admin-read",
      module: "api.connectors.admin",
      traceId,
      schemaVersion: "connector-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/connectors/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        connectorRunId: query.connectorRunId,
        executionId: query.executionId,
        sourceId: query.sourceId,
        liveCallExpected: false,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "connector.admin-read",
      module: "api.connectors.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Connector admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.admin",
        metadata: {
          route: "/api/connectors/admin",
          runtimeGuard,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for connector admin reads or is missing governed scope.",
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

    const versionRuntime = evaluateVersionRuntime({
      operation: "connector.admin-read",
      module: "api.connectors.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "connector-admin-read-api-v0.1.0",
          "src/app/api/connectors/admin/route.ts",
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
          "schema",
          "external-connector-executions-v0.1.0",
          "src/db/schema/externalConnectorExecutions.ts",
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
          "connector-admin-read-runtime-v0.1.0",
          "src/lib/connectors/connectorAdminStore.ts",
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

    const scopeRecord = await getConnectorAdminScopeRecord({
      connectorRunId: query.connectorRunId,
      executionId: query.executionId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "connector.admin-read",
          module: "api.connectors.admin",
          traceId,
          resourceType: "connector_request",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Connector admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.admin",
        metadata: {
          route: "/api/connectors/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this connector record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess: requestedRecordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const records = await listConnectorAdminRecords({
      connectorRunId: query.connectorRunId,
      executionId: query.executionId,
      adapterId: query.adapterId,
      sourceId: query.sourceId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      connectorType: query.connectorType,
      queryType: query.queryType,
      status: query.status,
      executionStatus: query.executionStatus,
      certificationStatus: query.certificationStatus,
      limit: query.limit,
      includeSource: query.includeSource,
      includeAdapters: query.includeAdapters,
      includeExecutions: query.includeExecutions,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
    });
    const recordAccess = await evaluateRecordAccessForRecords({
      records,
      access,
      query,
      traceId,
    });
    const deniedRecordAccess = recordAccess.filter((decision) => !decision.allowed);

    if (deniedRecordAccess.length > 0) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Connector admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.admin",
        metadata: {
          route: "/api/connectors/admin",
          deniedCount: deniedRecordAccess.length,
          access,
          deniedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for one or more connector records.",
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

    const connectorRecords = records.map((record) => ({
      connectorRun: connectorRunResponse(record),
      source: sourceResponse(record),
      adapters: adapterResponse(record),
      executions: executionResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: connectorRecords.length,
        query: {
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          connectorRunId: query.connectorRunId,
          executionId: query.executionId,
          adapterId: query.adapterId,
          sourceId: query.sourceId,
          connectorType: query.connectorType,
          queryType: query.queryType,
          status: query.status,
          executionStatus: query.executionStatus,
          certificationStatus: query.certificationStatus,
          includeSource: query.includeSource,
          includeAdapters: query.includeAdapters,
          includeExecutions: query.includeExecutions,
          includeApplication: query.includeApplication,
          includeProperty: query.includeProperty,
        },
        connectorRecords,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-connectors-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-connector-lifecycle-read",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-official-external-source-data",
          "credential-references-only",
          "requires-governed-dashboard-access",
          "requires-redaction-before-public-disclosure",
        ],
        redactionRequirements: [
          "redact-borrower-property-and-credential-references-before-public-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "CONNECTOR_ADMIN_READ",
      domain: "connector",
      severity: "INFO",
      message:
        "Connector lifecycle records were read through governed record-scoped controls without live external calls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.connectors.admin",
      metadata: {
        route: "/api/connectors/admin",
        rowCount: connectorRecords.length,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        connectorRunId: query.connectorRunId,
        executionId: query.executionId,
        sourceId: query.sourceId,
        liveCallPerformed: false,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "connector_admin_read",
          resourceId:
            query.connectorRunId ??
            query.executionId ??
            query.applicationId ??
            query.sourceId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/admin",
            rowCount: connectorRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "connector_admin_read",
        targetId:
          query.connectorRunId ??
          query.executionId ??
          query.applicationId ??
          query.sourceId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "connector-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: connectorRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: connectorRecords.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          connectorRunId: query.connectorRunId,
          executionId: query.executionId,
          sourceId: query.sourceId,
          liveCallPerformed: false,
        },
        metadata: {
          route: "/api/connectors/admin",
          operation: "connector.admin-read",
        },
      },
      metadata: {
        route: "/api/connectors/admin",
        operation: "connector.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: connectorRecords.length,
      connectorRecords,
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
      eventType: "CONNECTOR_ADMIN_READ_ERROR",
      domain: "connector",
      severity: "ERROR",
      message: "Connector admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.connectors.admin",
      metadata: {
        route: "/api/connectors/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown connector admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/connectors/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown connector admin read error.",
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
