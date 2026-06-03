import "dotenv/config";

import { Pool } from "pg";

/**
 * Connector Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for connector lifecycle reads.
 * - Vol II: verifies USDA/SBA/property connector, credential reference,
 *   consent, source-authority, adapter, and execution records remain
 *   controlled.
 * - Vol III: checks replay-safe, record-scoped reads before dashboards use
 *   external connector lifecycle data.
 * - Vol IV: supports operator verification for certification, outage,
 *   recovery, escalation, and audit preparation.
 * - Vol V: enforces source authority, classification, observability, replay,
 *   versioning, controlled disclosure, and evidence preservation.
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
    id?: string;
    adapterId?: string;
    certificationStatus?: string;
    liveCallsAllowed?: boolean;
  };
  connectorRun?: {
    id?: string;
    sourceId?: string;
    status?: string;
    liveCallPerformed?: boolean;
  };
  execution?: {
    id?: string;
    executionStatus?: string;
    executionAllowed?: boolean;
    liveCallPerformed?: boolean;
    officialDataFetched?: boolean;
  };
  connectorRecords?: Array<{
    connectorRun?: {
      id?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      sourceId?: string;
      status?: string;
      liveCallPerformed?: boolean;
    };
    source?: {
      id?: string;
      liveCallsAllowed?: boolean;
    } | null;
    adapters?: Array<{
      id?: string;
      adapterId?: string;
      certificationStatus?: string;
      liveCallsAllowed?: boolean;
      credentialRef?: string | null;
    }>;
    executions?: Array<{
      id?: string;
      executionStatus?: string;
      executionAllowed?: boolean;
      liveCallPerformed?: boolean;
      officialDataFetched?: boolean;
      schemaContractVerified?: boolean;
      consentVerified?: boolean;
      isolationVerified?: boolean;
      operationalRunbookApproved?: boolean;
    }>;
    application?: {
      id?: string;
    } | null;
    property?: {
      county?: string | null;
      state?: string | null;
    } | null;
  }>;
  result?: {
    certificationStatus?: string;
    liveCallsAllowed?: boolean;
    liveCallPerformed?: boolean;
    officialDataFetched?: boolean;
    executionAllowed?: boolean;
    executionStatus?: string;
    connectorRunStatus?: string;
  };
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
      `Connector admin read smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Connector admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Connector admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Connector admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Connector admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Connector admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for connector admin read smoke testing."
    );
  }

  const runId = `connector-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;
  const adapterId = `${runId}-certified-usda`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Connector Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 462000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Connector admin read smoke onboarding did not create an application.");
  }

  const adapter = await post("/api/connectors/adapters", {
    role: "operator",
    userId: operatorId,
    adapterId,
    adapterName: "Connector Admin Read USDA Adapter",
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
      scenario: "admin-read-certified-adapter",
    },
  });

  if (
    adapter.result?.certificationStatus !== "CERTIFIED" ||
    adapter.result.liveCallsAllowed !== true ||
    adapter.result.liveCallPerformed !== false
  ) {
    throw new Error("Connector admin read smoke adapter did not certify safely.");
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
      scenario: "admin-read-source-check",
    },
  });
  const connectorRunId = sourceCheck.connectorRun?.id;

  if (!connectorRunId) {
    throw new Error("Connector admin read smoke source check did not create a connector run.");
  }

  const blockedExecution = await post("/api/connectors/execution", {
    role: "operator",
    userId: operatorId,
    borrowerId,
    tenantId,
    applicationId,
    connectorRunId,
    adapterId,
    sourceId: "usda-fsa",
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-blocked-execution-controls",
    },
  });

  if (blockedExecution.result?.executionAllowed !== false) {
    throw new Error("Connector admin read smoke incomplete execution controls unexpectedly allowed execution.");
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
      scenario: "admin-read-authorized-execution-not-called",
    },
  });
  const executionId = execution.execution?.id;

  if (
    !executionId ||
    execution.result?.executionAllowed !== true ||
    execution.result.liveCallPerformed !== false ||
    execution.result.officialDataFetched !== false
  ) {
    throw new Error("Connector admin read smoke execution was not authorized safely.");
  }

  const scopedRead = await get("/api/connectors/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    connectorRunId,
    includeSource: true,
    includeAdapters: true,
    includeExecutions: true,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const record = scopedRead.connectorRecords?.[0];

  if (!scopedTraceId || scopedRead.count !== 1 || !record) {
    throw new Error("Connector admin scoped read did not return exactly one record.");
  }

  const adapterFound = record.adapters?.some(
    (item) =>
      item.adapterId === adapterId &&
      item.certificationStatus === "CERTIFIED" &&
      item.liveCallsAllowed === true
  );
  const executionFound = record.executions?.some(
    (item) =>
      item.id === executionId &&
      item.executionAllowed === true &&
      item.liveCallPerformed === false &&
      item.officialDataFetched === false &&
      item.schemaContractVerified === true &&
      item.consentVerified === true &&
      item.isolationVerified === true &&
      item.operationalRunbookApproved === true
  );

  if (
    record.connectorRun?.id !== connectorRunId ||
    record.connectorRun.applicationId !== applicationId ||
    record.connectorRun.borrowerId !== borrowerId ||
    record.connectorRun.tenantId !== tenantId ||
    record.connectorRun.liveCallPerformed !== false ||
    record.source?.id !== "usda-fsa" ||
    record.source.liveCallsAllowed !== true ||
    adapterFound !== true ||
    executionFound !== true ||
    record.application?.id !== applicationId ||
    record.property?.county !== "Wake"
  ) {
    throw new Error("Connector admin scoped read returned incomplete lifecycle records.");
  }

  const executionRead = await get("/api/connectors/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    executionId,
    includeSource: true,
    includeAdapters: true,
    includeExecutions: true,
  });

  if (
    executionRead.count !== 1 ||
    executionRead.connectorRecords?.[0]?.executions?.[0]?.id !== executionId
  ) {
    throw new Error("Connector admin execution-scoped read did not return the expected execution.");
  }

  const deniedRead = await get(
    "/api/connectors/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      connectorRunId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Connector admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/connectors/admin",
    {
      role: "operator",
      userId: operatorId,
      connectorRunId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Connector admin missing-scope denial did not return a governance trace.");
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
      throw new Error("Connector admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          connectorRunId,
          adapterId,
          executionId,
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
    console.log("Connector admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown connector admin read smoke test error."
  );
  process.exit(1);
});
