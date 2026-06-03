import "dotenv/config";

import { Pool } from "pg";

/**
 * Application Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for application record reads.
 * - Vol II: verifies borrower/application/property records are protected from
 *   cross-borrower and cross-tenant disclosure.
 * - Vol III: checks replay-safe, record-scoped reads before dashboards use
 *   application data.
 * - Vol IV: supports operator verification for monitoring and audit prep.
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
    propertyId?: string | null;
  };
  applications?: Array<{
    application?: {
      id?: string;
      borrowerId?: string | null;
      tenantId?: string | null;
      status?: string;
    };
    property?: {
      id?: string;
      state?: string | null;
      county?: string | null;
    } | null;
  }>;
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
      `Application admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
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
      `Application admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Application admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Application admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for application admin read smoke testing.");
  }

  const runId = `application-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Application Admin Read Smoke Farm",
    acreage: 145,
    county: "Wake",
    state: "NC",
    requestedAmount: 310000,
    requestedPrograms: ["USDA_FSA_REVIEW", "SBA_REVIEW"],
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId || !onboard.application.propertyId) {
    throw new Error("Application admin read smoke onboarding did not create an application and property.");
  }

  const scopedRead = await get("/api/applications/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const scopedRecord = scopedRead.applications?.[0];

  if (!scopedTraceId || scopedRead.count !== 1) {
    throw new Error("Application admin scoped read did not return exactly one record.");
  }

  if (
    scopedRecord?.application?.id !== applicationId ||
    scopedRecord.application.borrowerId !== borrowerId ||
    scopedRecord.application.tenantId !== tenantId ||
    scopedRecord.property?.county !== "Wake"
  ) {
    throw new Error("Application admin scoped read returned the wrong application or property summary.");
  }

  const tenantRead = await get("/api/applications/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    limit: 10,
  });

  if (
    !tenantRead.applications?.some(
      (record) => record.application?.id === applicationId
    )
  ) {
    throw new Error("Application admin tenant read did not include the expected application.");
  }

  const deniedRead = await get(
    "/api/applications/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      applicationId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Application admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/applications/admin",
    {
      role: "operator",
      userId: operatorId,
      applicationId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Application admin missing-scope denial did not return a governance trace.");
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
      throw new Error("Application admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
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
    console.log("Application admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown application admin read smoke test error."
  );
  process.exit(1);
});
