import "dotenv/config";

import { Pool } from "pg";

/**
 * Live Action Readiness Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for live-action readiness reads.
 * - Vol II: verifies borrower, tenant, source, credential, consent, and
 *   regulated-action boundaries remain controlled.
 * - Vol III: checks replay-safe, record-scoped reads before dashboards use
 *   live-action promotion state.
 * - Vol IV: supports runbook, rollback, monitoring, incident response,
 *   dry-run, human approval, and audit-evidence review.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   controlled disclosure, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  count?: number;
  application?: {
    id?: string;
  };
  adapter?: {
    adapterId?: string;
  };
  connectorRun?: {
    id?: string;
  };
  execution?: {
    id?: string;
  };
  review?: {
    id?: string;
    actionType?: string;
  };
  result?: {
    certificationStatus?: string;
    liveCallsAllowed?: boolean;
    liveCallPerformed?: boolean;
    officialDataFetched?: boolean;
    executionAllowed?: boolean;
    readinessStatus?: string;
    readyForLiveAction?: boolean;
    externalActionPerformed?: boolean;
    liveActionPerformed?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
  };
  readinessRecords?: Array<{
    review?: {
      id?: string;
      actionType?: string;
      readinessStatus?: string;
      targetExecutionId?: string;
      targetAdapterId?: string | null;
      targetSourceId?: string | null;
      targetTenantId?: string | null;
      targetApplicationId?: string | null;
      targetBorrowerId?: string | null;
      productionCredentialVaultRef?: string | null;
      liveAdapterImplementationRef?: string | null;
      readyForLiveAction?: boolean;
      externalActionPerformed?: boolean;
      liveActionPerformed?: boolean;
      regulatedDecisionImpactAllowed?: boolean;
    };
    application?: {
      id?: string;
    } | null;
    property?: {
      county?: string | null;
      state?: string | null;
    } | null;
  }>;
  governance?: {
    traceId?: string;
  };
};

async function post(
  path: string,
  body: Record<string, unknown>,
  expectedStatus = 200
): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as RouteJson;

  if (response.status !== expectedStatus) {
    throw new Error(
      `Live action readiness admin read smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Live action readiness admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Live action readiness admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function get(
  path: string,
  query: Record<string, string | number | boolean | null | undefined>,
  expectedStatus = 200
): Promise<RouteJson> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  }

  const response = await fetch(`${baseUrl}${path}?${params.toString()}`, {
    method: "GET",
  });
  const json = (await response.json()) as RouteJson;

  if (response.status !== expectedStatus) {
    throw new Error(
      `Live action readiness admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Live action readiness admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Live action readiness admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function evidenceCounts(pool: Pool, traceId: string) {
  const result: Record<string, number> = {};

  for (const table of [
    "version_registry",
    "data_classification_registry",
    "observability_events",
    "replay_verification",
  ]) {
    const rows = await pool.query(
      `select count(*)::int as count from ${table} where trace_id = $1`,
      [traceId]
    );

    result[table] = rows.rows[0].count;
  }

  return result;
}

function readinessRefs(runId: string) {
  return {
    productionCredentialVaultRef: `vault://${runId}/external-connector/credentials`,
    liveAdapterImplementationRef: `adapter://${runId}/external-connector/live-implementation`,
    productionRunbookApprovalRef: `runbook://${runId}/external-connector/approved`,
    dryRunEvidenceRef: `dry-run://${runId}/external-connector/evidence`,
    rollbackPlanRef: `rollback://${runId}/external-connector/plan`,
    incidentResponsePlanRef: `incident://${runId}/external-connector/response`,
    monitoringPlanRef: `monitoring://${runId}/external-connector/plan`,
    auditEvidenceExportRef: `audit-export://${runId}/external-connector/packet`,
    humanApprovalRef: `approval://${runId}/external-connector/human`,
  };
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for live action readiness admin read smoke testing."
    );
  }

  const runId = `live-action-readiness-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;
  const governanceId = `${runId}-governance`;
  const adapterId = `${runId}-certified-usda`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Live Action Readiness Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 488000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Live action readiness admin read smoke onboarding did not create an application."
    );
  }

  const adapter = await post("/api/connectors/adapters", {
    role: "operator",
    userId: operatorId,
    adapterId,
    adapterName: "Live Action Readiness Admin Read USDA Adapter",
    adapterType: "USDA",
    sourceId: "usda-fsa",
    sourceAuthorityRef: `source-authority://${runId}/usda-fsa`,
    certificationStatus: "CERTIFIED",
    credentialRef: `credential://${runId}/usda-fsa`,
    credentialStatus: "APPROVED",
    outagePolicyRef: `outage://${runId}/usda-fsa`,
    outageStatus: "TESTED",
    replayPolicyRef: `replay://${runId}/usda-fsa`,
    replayStatus: "VERIFIED",
    schemaContractVersion: "usda-fsa-schema-contract-v0.1.0",
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-live-action-certified-adapter",
    },
  });

  if (
    adapter.result?.certificationStatus !== "CERTIFIED" ||
    adapter.result.liveCallsAllowed !== true ||
    adapter.result.liveCallPerformed !== false
  ) {
    throw new Error(
      "Live action readiness admin read smoke adapter did not certify safely."
    );
  }

  const sourceCheck = await post("/api/connectors/source-check", {
    role: "operator",
    userId: operatorId,
    borrowerId,
    tenantId,
    applicationId,
    sourceId: "usda-fsa",
    queryType: "program_reference",
    query: {
      state: "NC",
      county: "Wake",
      programFamily: "farm-service-review",
    },
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-live-action-source-check",
    },
  });
  const connectorRunId = sourceCheck.connectorRun?.id;

  if (!connectorRunId) {
    throw new Error(
      "Live action readiness admin read smoke source check did not create a connector run."
    );
  }

  const execution = await post("/api/connectors/execution", {
    role: "operator",
    userId: operatorId,
    borrowerId,
    tenantId,
    applicationId,
    connectorRunId,
    adapterId,
    sourceId: "usda-fsa",
    executionRef: `connector-execution://${runId}/authorized`,
    operationalRunbookRef: `runbook://${runId}/usda-fsa-execution`,
    operationalRunbookStatus: "APPROVED",
    consentRef: `consent://${runId}/borrower-external-source-review`,
    consentStatus: "VERIFIED",
    isolationRef: `isolation://${runId}/external-connector-boundary`,
    isolationStatus: "VERIFIED",
    schemaContractStatus: "VERIFIED",
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-live-action-execution-not-called",
    },
  });
  const executionId = execution.execution?.id;

  if (
    !executionId ||
    execution.result?.executionAllowed !== true ||
    execution.result.liveCallPerformed !== false ||
    execution.result.officialDataFetched !== false
  ) {
    throw new Error(
      "Live action readiness admin read smoke execution was not authorized safely."
    );
  }

  const readiness = await post("/api/governance/live-action-readiness", {
    role: "governance",
    actorId: governanceId,
    tenantId,
    actionType: "EXTERNAL_CONNECTOR_CALL",
    targetExecutionId: executionId,
    ...readinessRefs(runId),
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-live-action-ready-not-called",
    },
  });
  const reviewId = readiness.review?.id;

  if (
    !reviewId ||
    readiness.result?.readinessStatus !==
      "LIVE_ACTION_PROMOTION_READY_NOT_EXECUTED" ||
    readiness.result.readyForLiveAction !== true ||
    readiness.result.externalActionPerformed !== false ||
    readiness.result.liveActionPerformed !== false
  ) {
    throw new Error(
      "Live action readiness admin read smoke did not create a safe readiness review."
    );
  }

  const scopedRead = await get("/api/governance/live-action-readiness/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    reviewId,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const record = scopedRead.readinessRecords?.[0];

  if (!scopedTraceId || scopedRead.count !== 1 || !record?.review) {
    throw new Error(
      "Live action readiness admin scoped read did not return exactly one record."
    );
  }

  if (
    record.review.id !== reviewId ||
    record.review.actionType !== "EXTERNAL_CONNECTOR_CALL" ||
    record.review.readinessStatus !==
      "LIVE_ACTION_PROMOTION_READY_NOT_EXECUTED" ||
    record.review.targetExecutionId !== executionId ||
    record.review.targetAdapterId !== adapterId ||
    record.review.targetSourceId !== "usda-fsa" ||
    record.review.targetTenantId !== tenantId ||
    record.review.targetApplicationId !== applicationId ||
    record.review.targetBorrowerId !== borrowerId ||
    record.review.readyForLiveAction !== true ||
    record.review.externalActionPerformed !== false ||
    record.review.liveActionPerformed !== false ||
    record.review.regulatedDecisionImpactAllowed !== false ||
    !record.review.productionCredentialVaultRef ||
    !record.review.liveAdapterImplementationRef ||
    record.application?.id !== applicationId ||
    record.property?.county !== "Wake"
  ) {
    throw new Error(
      "Live action readiness admin scoped read returned incomplete readiness controls."
    );
  }

  const executionRead = await get(
    "/api/governance/live-action-readiness/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId,
      targetExecutionId: executionId,
      includeApplication: true,
      includeProperty: true,
    }
  );

  if (
    executionRead.count !== 1 ||
    executionRead.readinessRecords?.[0]?.review?.id !== reviewId
  ) {
    throw new Error(
      "Live action readiness admin execution-scoped read did not return the expected review."
    );
  }

  const deniedRead = await get(
    "/api/governance/live-action-readiness/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      reviewId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error(
      "Live action readiness admin denied read did not return a governance trace."
    );
  }

  const missingScopeRead = await get(
    "/api/governance/live-action-readiness/admin",
    {
      role: "operator",
      userId: operatorId,
      reviewId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error(
      "Live action readiness admin missing-scope denial did not return a governance trace."
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const evidence = await evidenceCounts(pool, scopedTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error(
        "Live action readiness admin read governance evidence was incomplete."
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          connectorRunId,
          adapterId,
          executionId,
          reviewId,
          applicationId,
          tenantId,
          borrowerId,
          scopedTraceId,
          deniedTraceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Live action readiness admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown live action readiness admin read smoke test error."
  );
  process.exit(1);
});
