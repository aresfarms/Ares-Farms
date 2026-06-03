import "dotenv/config";

import { Pool } from "pg";

/**
 * Rule Overlay Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms constitutional rule and overlay authority is readable
 *   only through governed access.
 * - Vol II: verifies eligibility, fair-lending, source-reliance,
 *   adverse-action, and human-review boundaries remain advisory.
 * - Vol III: checks replay-safe, record-scoped rule evaluation reads.
 * - Vol IV: supports operator review, escalation, amendment review,
 *   exception handling, and audit preparation.
 * - Vol V: enforces rule versioning, overlay precedence, classification,
 *   observability, replayability, and evidence preservation.
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
  ruleEvaluation?: {
    id?: string;
    applicationId?: string;
    resultStatus?: string;
    finalEffect?: string;
    advisoryOnly?: boolean;
    humanReviewRequired?: boolean;
  };
  ruleRecords?: Array<{
    ruleEvaluation?: {
      id?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      resultStatus?: string;
      finalEffect?: string;
      advisoryOnly?: boolean;
      humanReviewRequired?: boolean;
      appliedOverlayId?: string | null;
    };
    rules?: Array<{
      id?: string;
      ruleName?: string;
      ruleVersion?: string;
      decisionUse?: string;
    }>;
    overlays?: Array<{
      id?: string;
      effect?: string;
      overlayVersion?: string;
    }>;
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
      `Rule overlay admin read smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Rule overlay admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Rule overlay admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Rule overlay admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Rule overlay admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Rule overlay admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for rule overlay admin read smoke testing."
    );
  }

  const runId = `rule-overlay-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Rule Overlay Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 325000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Rule overlay admin read onboarding did not create an application."
    );
  }

  const evaluation = await post("/api/rules/evaluate", {
    role: "operator",
    userId: operatorId,
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
      scenario: "rule-overlay-admin-read-evaluation",
    },
  });
  const evaluationId = evaluation.ruleEvaluation?.id;

  if (
    !evaluationId ||
    evaluation.ruleEvaluation?.advisoryOnly !== true ||
    evaluation.ruleEvaluation.humanReviewRequired !== true
  ) {
    throw new Error(
      "Rule overlay admin read setup did not create advisory human-review-gated evaluation."
    );
  }

  const scopedRead = await get("/api/rules/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    evaluationId,
    includeRules: true,
    includeOverlays: true,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const record = scopedRead.ruleRecords?.[0];

  if (!scopedTraceId || scopedRead.count !== 1 || !record?.ruleEvaluation) {
    throw new Error(
      "Rule overlay admin scoped read did not return exactly one record."
    );
  }

  if (
    record.ruleEvaluation.id !== evaluationId ||
    record.ruleEvaluation.applicationId !== applicationId ||
    record.ruleEvaluation.borrowerId !== borrowerId ||
    record.ruleEvaluation.tenantId !== tenantId ||
    record.ruleEvaluation.advisoryOnly !== true ||
    record.ruleEvaluation.humanReviewRequired !== true ||
    record.ruleEvaluation.resultStatus !== "ESCALATED_FOR_HUMAN_REVIEW" ||
    record.ruleEvaluation.finalEffect !== "ESCALATE" ||
    !record.ruleEvaluation.appliedOverlayId ||
    !record.rules?.some(
      (rule) => rule.id === "RULE-REGULATED-DECISION-HUMAN-REVIEW"
    ) ||
    !record.overlays?.some(
      (overlay) => overlay.id === "OVERLAY-CONSTITUTIONAL-HUMAN-REVIEW"
    ) ||
    record.application?.id !== applicationId ||
    record.property?.county !== "Wake"
  ) {
    throw new Error(
      "Rule overlay admin scoped read returned incomplete rule or overlay controls."
    );
  }

  const applicationRead = await get("/api/rules/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    resultStatus: "ESCALATED_FOR_HUMAN_REVIEW",
    advisoryOnly: true,
    humanReviewRequired: true,
    limit: 10,
  });

  if (
    !applicationRead.ruleRecords?.some(
      (item) => item.ruleEvaluation?.id === evaluationId
    )
  ) {
    throw new Error(
      "Rule overlay admin application-scoped read did not include the expected evaluation."
    );
  }

  const deniedRead = await get(
    "/api/rules/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      evaluationId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error(
      "Rule overlay admin denied read did not return a governance trace."
    );
  }

  const missingScopeRead = await get(
    "/api/rules/admin",
    {
      role: "operator",
      userId: operatorId,
      evaluationId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error(
      "Rule overlay admin missing-scope denial did not return a governance trace."
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
      throw new Error("Rule overlay admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          evaluationId,
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
    console.log("Rule overlay admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown rule overlay admin read smoke test error."
  );
  process.exit(1);
});
