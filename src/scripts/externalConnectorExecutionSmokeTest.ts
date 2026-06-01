import "dotenv/config";

import { Pool } from "pg";

/**
 * External Connector Execution Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority before external connector execution.
 * - Vol II: verifies USDA/SBA/property source data cannot become regulated
 *   fact without certified execution controls.
 * - Vol III: checks replay-safe execution authorization without live external
 *   calls or official data fetches.
 * - Vol IV: supports credential, outage, retry/recovery, isolation,
 *   escalation, and audit verification.
 * - Vol V: enforces source authority, classification, observability, replay,
 *   versioning, schema contracts, consent, isolation, and evidence.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
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
  result?: {
    certificationStatus?: string;
    liveCallsAllowed?: boolean;
    liveCallPerformed?: boolean;
    officialDataFetched?: boolean;
    executionAllowed?: boolean;
    executionStatus?: string;
    connectorRunStatus?: string;
    gates?: Record<string, unknown>;
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
      `External connector execution smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `External connector execution smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `External connector execution smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for external connector execution smoke testing."
    );
  }

  const runId = `external-connector-execution-smoke-${Date.now()}`;
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
    farmName: "External Connector Execution Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 455000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("External connector execution onboarding did not create an application.");
  }

  const adapter = await post("/api/connectors/adapters", {
    role: "operator",
    userId: operatorId,
    adapterId,
    adapterName: "USDA FSA Execution Smoke Adapter",
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
      scenario: "execution-certified-adapter",
    },
  });

  if (
    adapter.result?.certificationStatus !== "CERTIFIED" ||
    adapter.result?.liveCallsAllowed !== true ||
    adapter.result?.liveCallPerformed !== false
  ) {
    throw new Error("External connector execution adapter did not certify without a live call.");
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
      scenario: "execution-source-check",
    },
  });
  const connectorRunId = sourceCheck.connectorRun?.id;

  if (!connectorRunId) {
    throw new Error("External connector execution source check did not create a connector run.");
  }

  if (sourceCheck.result?.liveCallPerformed !== false) {
    throw new Error("External connector source check unexpectedly performed a live call.");
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
      scenario: "blocked-missing-execution-controls",
    },
  });

  if (blockedExecution.result?.executionAllowed !== false) {
    throw new Error("Incomplete connector execution controls unexpectedly allowed execution.");
  }

  if (
    blockedExecution.result?.liveCallPerformed !== false ||
    blockedExecution.result?.officialDataFetched !== false
  ) {
    throw new Error("Blocked connector execution unexpectedly performed a live call or official data fetch.");
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
      scenario: "authorized-execution-not-called",
    },
  });
  const executionId = execution.execution?.id;
  const executionTraceId = execution.governance?.traceId;

  if (!executionId || !executionTraceId) {
    throw new Error("External connector execution did not return durable evidence.");
  }

  if (execution.result?.executionAllowed !== true) {
    throw new Error("Complete connector execution controls did not authorize execution.");
  }

  if (
    execution.result?.executionStatus !==
    "LIVE_CONNECTOR_EXECUTION_AUTHORIZED_NOT_CALLED"
  ) {
    throw new Error("External connector execution did not record authorized-not-called status.");
  }

  if (
    execution.result?.liveCallPerformed !== false ||
    execution.result?.officialDataFetched !== false
  ) {
    throw new Error("External connector execution performed a live call or official data fetch.");
  }

  const deniedExecution = await post(
    "/api/connectors/execution",
    {
      role: "operator",
      userId: operatorId,
      borrowerId: `${runId}-wrong-borrower`,
      tenantId,
      applicationId,
      connectorRunId,
      adapterId,
      sourceId: "usda-fsa",
    },
    403
  );

  if (!deniedExecution.governance?.traceId) {
    throw new Error("Denied connector execution did not return a governance trace.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const executionRows = await pool.query(
      `
        select id, connector_run_id, adapter_id, source_id, application_id,
               execution_status, execution_allowed, live_call_performed,
               official_data_fetched, source_live_calls_allowed,
               adapter_certified, adapter_live_calls_allowed,
               source_authority_present, credential_approved,
               outage_policy_tested, replay_policy_verified,
               schema_contract_verified, consent_verified,
               isolation_verified, operational_runbook_approved,
               classification, replay_ref
        from external_connector_executions
        where id = $1
      `,
      [executionId]
    );
    const executionRow = executionRows.rows[0];

    if (!executionRow) {
      throw new Error("External connector execution row was not persisted.");
    }

    if (executionRow.execution_allowed !== true) {
      throw new Error("External connector execution row was not marked allowed.");
    }

    if (
      executionRow.live_call_performed !== false ||
      executionRow.official_data_fetched !== false
    ) {
      throw new Error("External connector execution row performed a live call or official fetch.");
    }

    const connectorRows = await pool.query(
      `
        select id, status, live_call_performed, human_review_required,
               normalized_result
        from external_data_connector_runs
        where id = $1
      `,
      [connectorRunId]
    );
    const connectorRun = connectorRows.rows[0];

    if (
      !connectorRun ||
      connectorRun.status !== "LIVE_CONNECTOR_EXECUTION_AUTHORIZED_NOT_CALLED" ||
      connectorRun.live_call_performed !== false ||
      connectorRun.human_review_required !== true
    ) {
      throw new Error("External connector execution did not update connector run safely.");
    }

    const evidence = await evidenceCounts(pool, executionTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("External connector execution evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          connectorRunId,
          executionId,
          execution: executionRow,
          connectorRun,
          executionTraceId,
          evidence,
          gates: execution.result?.gates,
        },
        null,
        2
      )
    );
    console.log("External connector execution smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown external connector execution smoke test error."
  );
  process.exit(1);
});
