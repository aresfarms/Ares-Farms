import "dotenv/config";

import { Pool } from "pg";

/**
 * Rule Overlay Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms constitutional rule and overlay authority is durable.
 * - Vol II: verifies eligibility/adverse-action boundaries remain advisory
 *   and human-review gated.
 * - Vol III: checks replay-safe rule and overlay evaluation persistence.
 * - Vol IV: supports repeatable operator verification for rule review.
 * - Vol V: enforces rule versioning, overlay precedence, explainability,
 *   classification, observability, replayability, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  ruleEvaluation?: {
    id?: string;
    applicationId?: string;
    resultStatus?: string;
    finalEffect?: string;
    advisoryOnly?: boolean;
    humanReviewRequired?: boolean;
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
      `Rule overlay smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for rule overlay smoke testing.");
  }

  const runId = `rule-overlay-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Rule Overlay Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 315000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Rule overlay smoke onboarding did not create an application.");
  }

  const evaluation = await post("/api/rules/evaluate", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    operation: "regulated-eligibility-review",
    facts: {
      state: "NC",
      county: "Wake",
      acreage: 42,
      revenue: 185000,
      requestedProgram: "USDA_FSA_REVIEW",
    },
    metadata: {
      smokeRunId: runId,
    },
  });

  const evaluationId = evaluation.ruleEvaluation?.id;
  const traceId = evaluation.governance?.traceId;

  if (!evaluationId || !traceId) {
    throw new Error("Rule overlay evaluation did not return durable evidence.");
  }

  if (evaluation.ruleEvaluation?.advisoryOnly !== true) {
    throw new Error("Rule overlay evaluation was not marked advisory only.");
  }

  if (evaluation.ruleEvaluation?.humanReviewRequired !== true) {
    throw new Error("Rule overlay evaluation did not require human review.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const evaluationRows = await pool.query(
      `
        select id, operation, application_id, result_status, final_effect,
               advisory_only, human_review_required, classification, replay_ref
        from rule_evaluation_runs
        where id = $1
      `,
      [evaluationId]
    );
    const ruleEvaluation = evaluationRows.rows[0];

    if (!ruleEvaluation) {
      throw new Error("Rule overlay evaluation row was not persisted.");
    }

    if (ruleEvaluation.application_id !== applicationId) {
      throw new Error("Rule overlay evaluation was not attached to the expected application.");
    }

    if (ruleEvaluation.advisory_only !== true) {
      throw new Error("Persisted rule overlay evaluation was not advisory only.");
    }

    if (ruleEvaluation.human_review_required !== true) {
      throw new Error("Persisted rule overlay evaluation did not require human review.");
    }

    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Rule overlay governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          ruleEvaluation,
          traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Rule overlay governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown rule overlay smoke test error."
  );
  process.exit(1);
});
