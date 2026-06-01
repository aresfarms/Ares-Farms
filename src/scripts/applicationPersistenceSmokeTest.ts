import "dotenv/config";

import { Pool } from "pg";

/**
 * Application Persistence Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms durable application state authority.
 * - Vol II: verifies borrower/application/property persistence for regulated review.
 * - Vol III: checks replay-safe application updates through governed API routes.
 * - Vol IV: supports repeatable operator verification for intake persistence.
 * - Vol V: enforces source authority, classification, replay, versioning,
 *   observability, and evidence preservation before frontend module expansion.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
    propertyId?: string | null;
    status?: string;
  };
  property?: {
    id?: string;
  } | null;
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
      `Application persistence smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for persistence smoke testing.");
  }

  const runId = `application-persistence-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Application Persistence Smoke Farm",
    acreage: 80,
    county: "Wake",
    state: "NC",
    requestedAmount: 250000,
    requestedPrograms: ["USDA_FSA_REVIEW"],
    metadata: {
      smokeRunId: runId,
    },
  });

  const onboardTraceId = onboard.governance?.traceId;
  const onboardPropertyId = onboard.application?.propertyId;

  if (!onboardTraceId || onboard.application?.id !== applicationId) {
    throw new Error("Onboarding did not return the persisted application.");
  }

  if (!onboardPropertyId) {
    throw new Error("Onboarding did not persist a property reference.");
  }

  const apply = await post("/api/apply", {
    role: "operator",
    userId: `${runId}-operator`,
    borrowerId,
    tenantId,
    applicationId,
    eventType: "APPLICATION_SUBMITTED",
    entityType: "application",
    entityId: applicationId,
    requestedAmount: 275000,
    payload: {
      requestedAmount: 275000,
      acreage: 80,
      operatingPlan: "Smoke test operating plan",
    },
    metadata: {
      smokeRunId: runId,
    },
  });

  const applyTraceId = apply.governance?.traceId;

  if (!applyTraceId || apply.application?.id !== applicationId) {
    throw new Error("Apply did not return the persisted application.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const applicationRows = await pool.query(
      `
        select id, tenant_id, borrower_id, property_id, status, review_status,
               decision_status, requested_amount, replay_ref
        from applications
        where id = $1
      `,
      [applicationId]
    );
    const application = applicationRows.rows[0];

    if (!application) {
      throw new Error("Application row was not persisted.");
    }

    if (application.status !== "APPLICATION_SUBMITTED") {
      throw new Error("Application row was not updated by apply route.");
    }

    if (application.property_id !== onboardPropertyId) {
      throw new Error("Application property reference was not preserved.");
    }

    const propertyRows = await pool.query(
      `
        select id, tenant_id, name, state, county, replay_ref
        from properties
        where id = $1
      `,
      [onboardPropertyId]
    );
    const property = propertyRows.rows[0];

    if (!property) {
      throw new Error("Property row was not persisted.");
    }

    const onboardEvidence = await evidenceCounts(pool, onboardTraceId);
    const applyEvidence = await evidenceCounts(pool, applyTraceId);

    for (const [label, counts] of [
      ["onboard", onboardEvidence],
      ["apply", applyEvidence],
    ] as const) {
      if (
        counts.version_registry < 1 ||
        counts.data_classification_registry < 1 ||
        counts.observability_events < 1 ||
        counts.replay_verification < 1
      ) {
        throw new Error(`${label} persistence evidence was incomplete.`);
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          application,
          property,
          onboardTraceId,
          applyTraceId,
          onboardEvidence,
          applyEvidence,
        },
        null,
        2
      )
    );
    console.log("Application persistence governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown application persistence smoke test error."
  );
  process.exit(1);
});
