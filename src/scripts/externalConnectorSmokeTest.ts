import "dotenv/config";

import { Pool } from "pg";

/**
 * External Connector Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms external source authority is governed.
 * - Vol II: verifies USDA/SBA/property connector requests do not become
 *   unreviewed regulatory facts.
 * - Vol III: checks replay-safe connector request persistence.
 * - Vol IV: supports repeatable operator verification for connector readiness.
 * - Vol V: enforces source authority, classification, consent,
 *   observability, replayability, version lineage, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  connectorRun?: {
    id?: string;
    sourceId?: string;
    status?: string;
    liveCallPerformed?: boolean;
  };
  result?: {
    advisoryOnly?: boolean;
    liveCallPerformed?: boolean;
    officialDataFetched?: boolean;
  };
  governance?: {
    traceId?: string;
  };
};

async function post(path: string, body: Record<string, unknown>): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as RouteJson;

  if (response.status < 200 || response.status >= 300 || json.ok !== true) {
    throw new Error(
      `External connector smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for external connector smoke testing.");
  }

  const runId = `external-connector-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "External Connector Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 225000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("External connector smoke onboarding did not create an application.");
  }

  const sourceCheck = await post("/api/connectors/source-check", {
    role: "operator",
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
    },
  });

  const connectorRunId = sourceCheck.connectorRun?.id;
  const traceId = sourceCheck.governance?.traceId;

  if (!connectorRunId || !traceId) {
    throw new Error("External connector source check did not return durable evidence.");
  }

  if (sourceCheck.result?.liveCallPerformed !== false) {
    throw new Error("External connector smoke unexpectedly performed a live call.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const connectorRows = await pool.query(
      `
        select id, source_id, connector_type, query_type, application_id,
               status, live_call_performed, human_review_required,
               classification, replay_ref
        from external_data_connector_runs
        where id = $1
      `,
      [connectorRunId]
    );
    const connectorRun = connectorRows.rows[0];

    if (!connectorRun) {
      throw new Error("External connector run row was not persisted.");
    }

    if (connectorRun.application_id !== applicationId) {
      throw new Error("External connector run was not attached to the expected application.");
    }

    if (connectorRun.source_id !== "usda-fsa") {
      throw new Error("External connector run used the wrong source.");
    }

    if (connectorRun.live_call_performed !== false) {
      throw new Error("External connector run recorded an unexpected live call.");
    }

    if (connectorRun.human_review_required !== true) {
      throw new Error("External connector run did not require human review.");
    }

    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("External connector governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          connectorRun,
          traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("External connector governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown external connector smoke test error."
  );
  process.exit(1);
});
