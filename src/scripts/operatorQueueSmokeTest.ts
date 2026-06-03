import "dotenv/config";

import { Pool } from "pg";

/**
 * Operator Review Queue Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable operational review authority is durable.
 * - Vol II: verifies regulated application-linked work can be queued before
 *   borrower, lender, sponsor, or agency-facing reliance.
 * - Vol III: checks replay-safe queue persistence and governed listing.
 * - Vol IV: supports repeatable operator verification for review queues.
 * - Vol V: enforces classification, observability, replayability,
 *   source authority, controlled disclosure, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  queueItem?: {
    id?: string;
    queueType?: string;
    sourceType?: string;
    applicationId?: string;
    tenantId?: string;
    status?: string;
    priority?: string;
  };
  queueItems?: Array<{
    id?: string;
    applicationId?: string;
    tenantId?: string;
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
      `Operator queue smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function get(path: string): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`);
  const json = (await response.json()) as RouteJson;

  if (response.status < 200 || response.status >= 300 || json.ok !== true) {
    throw new Error(
      `Operator queue smoke GET failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for operator queue smoke testing.");
  }

  const runId = `operator-queue-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Operator Queue Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 365000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Operator queue smoke onboarding did not create application.");
  }

  const queue = await post("/api/queues/operator", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    queueType: "DOCUMENT_REVIEW",
    sourceType: "application_document",
    sourceId: `${runId}-document`,
    sourceTraceId: `${runId}-source-trace`,
    priority: "HIGH",
    reviewReason:
      "Smoke test document metadata requires operator queue review before workflow expansion.",
    requiredRole: "operator",
    metadata: {
      smokeRunId: runId,
    },
  });

  const queueItemId = queue.queueItem?.id;
  const queueTraceId = queue.governance?.traceId;

  if (!queueItemId || !queueTraceId) {
    throw new Error("Operator queue creation did not return durable queue evidence.");
  }

  if (queue.queueItem?.status !== "OPEN") {
    throw new Error("Operator queue item was not opened.");
  }

  const list = await get(
    `/api/queues/operator?role=operator&tenantId=${encodeURIComponent(
      tenantId
    )}&status=OPEN&queueType=DOCUMENT_REVIEW&limit=10`
  );

  const listed = list.queueItems?.some((item) => item.id === queueItemId);

  if (!listed) {
    throw new Error("Operator queue list did not return the created queue item.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const queueRows = await pool.query(
      `
        select id, queue_type, source_type, application_id, borrower_id,
               tenant_id, status, priority, escalation_status,
               classification, replay_ref
        from operator_review_queue_items
        where id = $1
      `,
      [queueItemId]
    );
    const queueItem = queueRows.rows[0];

    if (!queueItem) {
      throw new Error("Operator queue item row was not persisted.");
    }

    if (queueItem.application_id !== applicationId) {
      throw new Error("Operator queue item was not attached to the application.");
    }

    if (queueItem.status !== "OPEN") {
      throw new Error("Persisted operator queue item was not open.");
    }

    const evidence = await evidenceCounts(pool, queueTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Operator queue governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          queueItem,
          queueTraceId,
          listTraceId: list.governance?.traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Operator review queue governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown operator queue smoke test error."
  );
  process.exit(1);
});
