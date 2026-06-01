import "dotenv/config";

import { Pool } from "pg";

/**
 * Certified Connector Adapter Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms connector-promotion authority is controlled.
 * - Vol II: verifies external data cannot become regulated fact through an
 *   uncertified USDA, SBA, property, borrower, or institutional adapter.
 * - Vol III: checks replay-safe adapter certification persistence.
 * - Vol IV: verifies credential, outage, isolation, escalation, and operator
 *   audit-readiness controls.
 * - Vol V: enforces source authority, consent, classification,
 *   observability, replayability, version lineage, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  adapter?: {
    id?: string;
    adapterId?: string;
    sourceId?: string;
    certificationStatus?: string;
    liveCallsAllowed?: boolean;
  };
  result?: {
    certificationStatus?: string;
    liveCallsAllowed?: boolean;
    liveCallPerformed?: boolean;
    officialDataFetched?: boolean;
    controls?: Record<string, unknown>;
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
      `Certified connector smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for certified connector smoke testing."
    );
  }

  const runId = `certified-connector-smoke-${Date.now()}`;
  const blockedAdapterId = `${runId}-blocked-usda`;
  const certifiedAdapterId = `${runId}-certified-usda`;

  const blocked = await post("/api/connectors/adapters", {
    role: "operator",
    userId: `${runId}-operator`,
    adapterId: blockedAdapterId,
    adapterName: "USDA FSA Blocked Smoke Adapter",
    adapterType: "USDA",
    sourceId: "usda-fsa",
    certificationStatus: "CERTIFIED",
    credentialStatus: "MISSING",
    outageStatus: "NOT_TESTED",
    replayStatus: "NOT_VERIFIED",
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-missing-controls",
    },
  });

  if (blocked.result?.liveCallsAllowed !== false) {
    throw new Error("Blocked adapter unexpectedly allowed live calls.");
  }

  if (blocked.result?.certificationStatus !== "CERTIFICATION_BLOCKED") {
    throw new Error("Blocked adapter did not record a blocked certification.");
  }

  if (blocked.result?.liveCallPerformed !== false) {
    throw new Error("Blocked adapter certification performed a live call.");
  }

  const certified = await post("/api/connectors/adapters", {
    role: "operator",
    userId: `${runId}-operator`,
    adapterId: certifiedAdapterId,
    adapterName: "USDA FSA Certified Smoke Adapter",
    adapterType: "USDA",
    sourceId: "usda-fsa",
    sourceAuthorityRef: "master-volume-source-authority-usda-fsa-v0.1.0",
    certificationStatus: "CERTIFIED",
    credentialRef: "vault://connectors/usda-fsa/smoke",
    credentialStatus: "APPROVED",
    outagePolicyRef: "runbook://connectors/usda-fsa/outage-v0.1.0",
    outageStatus: "TESTED",
    replayPolicyRef: "replay://connectors/usda-fsa/replay-v0.1.0",
    replayStatus: "VERIFIED",
    schemaContractVersion: "usda-fsa-schema-contract-v0.1.0",
    metadata: {
      smokeRunId: runId,
      scenario: "certified-controls-complete",
    },
  });

  const adapterId = certified.adapter?.id;
  const traceId = certified.governance?.traceId;

  if (!adapterId || !traceId) {
    throw new Error("Certified adapter route did not return durable evidence.");
  }

  if (certified.result?.certificationStatus !== "CERTIFIED") {
    throw new Error("Certified adapter did not reach CERTIFIED status.");
  }

  if (certified.result?.liveCallsAllowed !== true) {
    throw new Error("Certified adapter did not allow live-call eligibility.");
  }

  if (certified.result?.liveCallPerformed !== false) {
    throw new Error("Certified adapter route unexpectedly performed a live call.");
  }

  if (certified.result?.officialDataFetched !== false) {
    throw new Error("Certified adapter route unexpectedly fetched official data.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const adapterRows = await pool.query(
      `
        select id, adapter_id, source_id, certification_status,
               live_calls_allowed, credential_status, outage_status,
               replay_status, schema_contract_version, classification,
               replay_ref
        from certified_connector_adapters
        where adapter_id = $1
      `,
      [certifiedAdapterId]
    );
    const adapter = adapterRows.rows[0];

    if (!adapter) {
      throw new Error("Certified connector adapter row was not persisted.");
    }

    if (adapter.certification_status !== "CERTIFIED") {
      throw new Error("Certified connector adapter persisted the wrong status.");
    }

    if (adapter.live_calls_allowed !== true) {
      throw new Error("Certified connector adapter did not persist live eligibility.");
    }

    if (adapter.credential_status !== "APPROVED") {
      throw new Error("Certified connector adapter did not persist credential approval.");
    }

    if (adapter.outage_status !== "TESTED") {
      throw new Error("Certified connector adapter did not persist outage testing.");
    }

    if (adapter.replay_status !== "VERIFIED") {
      throw new Error("Certified connector adapter did not persist replay verification.");
    }

    const sourceRows = await pool.query(
      `
        select id, live_calls_allowed, metadata
        from external_data_sources
        where id = $1
      `,
      ["usda-fsa"]
    );
    const source = sourceRows.rows[0];

    if (!source) {
      throw new Error("Certified connector source row was not persisted.");
    }

    if (source.live_calls_allowed !== true) {
      throw new Error("External source was not marked live-call eligible.");
    }

    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Certified connector governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blocked: {
            adapterId: blockedAdapterId,
            certificationStatus: blocked.result?.certificationStatus,
            liveCallsAllowed: blocked.result?.liveCallsAllowed,
            liveCallPerformed: blocked.result?.liveCallPerformed,
          },
          certified: {
            adapter,
            traceId,
            evidence,
          },
          source,
        },
        null,
        2
      )
    );
    console.log("Certified connector adapter smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown certified connector smoke test error."
  );
  process.exit(1);
});
