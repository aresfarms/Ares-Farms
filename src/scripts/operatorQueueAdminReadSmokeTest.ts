import "dotenv/config";

import { Pool } from "pg";

/**
 * Operator Queue Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for operator queue reads.
 * - Vol II: verifies borrower, application, queue, escalation, assignment,
 *   and review posture stay under controlled disclosure.
 * - Vol III: checks replay-safe, record-scoped reads before operator/admin
 *   dashboards consume sensitive queue workflow data.
 * - Vol IV: supports operational verification for queues, escalation,
 *   backlog review, recovery, and audit preparation.
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
  queueItem?: {
    id?: string;
    queueType?: string;
    sourceType?: string;
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
    status?: string;
    priority?: string;
  };
  queueItems?: Array<{
    queueItem?: {
      id?: string;
      queueType?: string;
      sourceType?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      status?: string;
      priority?: string;
      escalationStatus?: string;
      requiredRole?: string;
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
      `Operator queue admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
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
      `Operator queue admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Operator queue admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Operator queue admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for operator queue admin read smoke testing.");
  }

  const runId = `operator-queue-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Operator Queue Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 415000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Operator queue admin read smoke onboarding did not create an application.");
  }

  const queue = await post("/api/queues/operator", {
    role: "operator",
    userId: operatorId,
    borrowerId,
    tenantId,
    applicationId,
    queueType: "DOCUMENT_REVIEW",
    sourceType: "application_document",
    sourceId: `${runId}-document`,
    sourceTraceId: `${runId}-source-trace`,
    priority: "HIGH",
    reviewReason:
      "Smoke test queue record requires governed admin read before dashboard exposure.",
    requiredRole: "operator",
    metadata: {
      smokeRunId: runId,
    },
  });
  const queueItemId = queue.queueItem?.id;

  if (!queueItemId) {
    throw new Error("Operator queue admin read smoke did not create a queue item.");
  }

  const scopedRead = await get("/api/queues/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    queueItemId,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const scopedRecord = scopedRead.queueItems?.[0];

  if (!scopedTraceId || scopedRead.count !== 1) {
    throw new Error("Operator queue admin scoped read did not return exactly one record.");
  }

  if (
    scopedRecord?.queueItem?.id !== queueItemId ||
    scopedRecord.queueItem.applicationId !== applicationId ||
    scopedRecord.queueItem.borrowerId !== borrowerId ||
    scopedRecord.queueItem.tenantId !== tenantId ||
    scopedRecord.queueItem.queueType !== "DOCUMENT_REVIEW" ||
    scopedRecord.queueItem.status !== "OPEN" ||
    scopedRecord.queueItem.priority !== "HIGH" ||
    scopedRecord.queueItem.requiredRole !== "operator" ||
    scopedRecord.application?.id !== applicationId ||
    scopedRecord.property?.county !== "Wake"
  ) {
    throw new Error("Operator queue admin scoped read returned the wrong queue, application, or property summary.");
  }

  const tenantRead = await get("/api/queues/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    applicationId,
    queueType: "DOCUMENT_REVIEW",
    status: "OPEN",
    limit: 10,
  });

  if (
    !tenantRead.queueItems?.some(
      (record) => record.queueItem?.id === queueItemId
    )
  ) {
    throw new Error("Operator queue admin tenant read did not include the expected queue item.");
  }

  const deniedRead = await get(
    "/api/queues/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      queueItemId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Operator queue admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/queues/admin",
    {
      role: "operator",
      userId: operatorId,
      queueItemId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Operator queue admin missing-scope denial did not return a governance trace.");
  }

  const wrongTenantRead = await get(
    "/api/queues/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId: `${runId}-wrong-tenant`,
      queueItemId,
    },
    403
  );

  if (!wrongTenantRead.governance?.traceId) {
    throw new Error("Operator queue admin wrong-tenant denial did not return a governance trace.");
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
      throw new Error("Operator queue admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          queueItemId,
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
    console.log("Operator queue admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown operator queue admin read smoke test error."
  );
  process.exit(1);
});
