import "dotenv/config";

import { Pool } from "pg";
import { createPostgresSslConfig } from "@/lib/db/postgresSsl";

/**
 * Backend Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms governed runtime surfaces remain accountable.
 * - Vol II: checks regulated evidence is preserved for backend operations.
 * - Vol III: verifies routes create durable version, classification,
 *   observability, and replay evidence where required.
 * - Vol IV: gives operators one repeatable backend verification command.
 * - Vol V: enforces canonical evidence, replay, version, classification,
 *   source-authority, rule, overlay, human-review, and adverse-action
 *   discipline before frontend/module expansion.
 *
 * Usage:
 * 1. Start the app in another terminal: npm run dev
 * 2. Run this command: npm run smoke:backend
 */

type HttpMethod = "GET" | "POST";

type SmokeTest = {
  name: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  requiresClassification?: boolean;
  validate: (json: Record<string, unknown>, status: number) => boolean;
};

type EvidenceCounts = {
  version_registry: number;
  data_classification_registry: number;
  observability_events: number;
  replay_verification: number;
};

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const smokeRunId = `backend-smoke-${Date.now()}`;

const smokeTests: SmokeTest[] = [
  {
    name: "test-score",
    method: "GET",
    path: "/api/test-score",
    requiresClassification: true,
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "auth-init",
    method: "POST",
    path: "/api/auth/init",
    requiresClassification: true,
    body: {
      email: `${smokeRunId}@aresfarms.test`,
      name: "Backend Smoke User",
      role: "operator",
      metadata: {
        smokeRunId,
      },
    },
    validate: (json, status) => {
      return (
        status === 200 &&
        json.ok === true &&
        typeof (json.user as { id?: unknown } | undefined)?.id === "string"
      );
    },
  },
  {
    name: "user-read",
    method: "GET",
    path: "/api/user",
    requiresClassification: true,
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "rank",
    method: "POST",
    path: "/api/rank",
    requiresClassification: true,
    body: {
      borrowerId: smokeRunId,
      applications: [
        {
          id: `${smokeRunId}-farm-a`,
          tenantId: `${smokeRunId}-farm-a`,
          score: 10,
          liquidity: 8,
          acreage: 30,
          risk: 4,
        },
        {
          id: `${smokeRunId}-farm-b`,
          tenantId: `${smokeRunId}-farm-b`,
          score: 5,
          liquidity: 10,
          acreage: 20,
          risk: 2,
        },
      ],
    },
    validate: (json, status) => {
      return (
        status === 200 &&
        json.ok === true &&
        Array.isArray(json.ranked) &&
        json.ranked.length === 2
      );
    },
  },
  {
    name: "recommend",
    method: "POST",
    path: "/api/recommend",
    requiresClassification: true,
    body: {
      borrowerId: smokeRunId,
      applicationId: `${smokeRunId}-application`,
      requestedPrograms: ["USDA_FSA_REVIEW"],
    },
    validate: (json, status) => {
      return status === 200 && json.ok === true && json.advisoryOnly === true;
    },
  },
  {
    name: "onboard",
    method: "POST",
    path: "/api/onboard",
    requiresClassification: true,
    body: {
      borrowerId: smokeRunId,
      tenantId: `${smokeRunId}-tenant`,
      applicationId: `${smokeRunId}-application`,
      farmName: "Backend Smoke Farm",
      county: "Wake",
      state: "NC",
      acreage: 50,
    },
    validate: (json, status) => {
      return status === 200 && json.ok === true && json.accepted === true;
    },
  },
  {
    name: "connector-source-check",
    method: "POST",
    path: "/api/connectors/source-check",
    requiresClassification: true,
    body: {
      role: "operator",
      borrowerId: smokeRunId,
      tenantId: `${smokeRunId}-tenant`,
      applicationId: `${smokeRunId}-application`,
      sourceId: "usda-fsa",
      queryType: "program_reference",
      query: {
        state: "NC",
        county: "Wake",
        programFamily: "farm-service-review",
      },
      metadata: {
        smokeRunId,
      },
    },
    validate: (json, status) => {
      const connectorRun = json.connectorRun as
        | { id?: unknown; liveCallPerformed?: unknown }
        | undefined;
      const result = json.result as
        | { advisoryOnly?: unknown; liveCallPerformed?: unknown }
        | undefined;

      return (
        status === 200 &&
        json.ok === true &&
        typeof connectorRun?.id === "string" &&
        connectorRun.liveCallPerformed === false &&
        result?.advisoryOnly === true &&
        result.liveCallPerformed === false
      );
    },
  },
  {
    name: "rule-overlay-evaluate",
    method: "POST",
    path: "/api/rules/evaluate",
    requiresClassification: true,
    body: {
      role: "operator",
      borrowerId: smokeRunId,
      tenantId: `${smokeRunId}-tenant`,
      applicationId: `${smokeRunId}-application`,
      operation: "regulated-eligibility-review",
      facts: {
        state: "NC",
        county: "Wake",
        acreage: 50,
        revenue: 125000,
        requestedProgram: "USDA_FSA_REVIEW",
      },
      metadata: {
        smokeRunId,
      },
    },
    validate: (json, status) => {
      const ruleEvaluation = json.ruleEvaluation as
        | {
            id?: unknown;
            advisoryOnly?: unknown;
            humanReviewRequired?: unknown;
          }
        | undefined;

      return (
        status === 200 &&
        json.ok === true &&
        typeof ruleEvaluation?.id === "string" &&
        ruleEvaluation.advisoryOnly === true &&
        ruleEvaluation.humanReviewRequired === true
      );
    },
  },
  {
    name: "human-review-queue",
    method: "POST",
    path: "/api/reviews/human",
    requiresClassification: true,
    body: {
      role: "operator",
      borrowerId: smokeRunId,
      tenantId: `${smokeRunId}-tenant`,
      applicationId: `${smokeRunId}-application`,
      reviewType: "regulated_decision_review",
      sourceType: "rule_overlay_evaluation",
      sourceId: `${smokeRunId}-rule-evaluation`,
      sourceTraceId: `${smokeRunId}-source-trace`,
      priority: "HIGH",
      requiredReviewerRole: "authorized-underwriter",
      candidateOutcome: "DENIAL_REVIEW",
      adverseActionCandidate: true,
      reasonCodes: ["ADVERSE_ACTION_REVIEW_REQUIRED"],
      explanationSummary:
        "Backend smoke candidate requires human review before any adverse-action notice.",
      metadata: {
        smokeRunId,
      },
    },
    validate: (json, status) => {
      const humanReview = json.humanReview as
        | {
            id?: unknown;
            finalActionAllowed?: unknown;
            humanReviewRequired?: unknown;
          }
        | undefined;
      const adverseActionReview = json.adverseActionReview as
        | {
            id?: unknown;
            noticeStatus?: unknown;
            finalNoticeAllowed?: unknown;
          }
        | null
        | undefined;

      return (
        status === 200 &&
        json.ok === true &&
        typeof humanReview?.id === "string" &&
        humanReview.finalActionAllowed === false &&
        humanReview.humanReviewRequired === true &&
        typeof adverseActionReview?.id === "string" &&
        adverseActionReview.noticeStatus === "NOT_A_NOTICE" &&
        adverseActionReview.finalNoticeAllowed === false
      );
    },
  },
  {
    name: "decision",
    method: "POST",
    path: "/api/decision",
    requiresClassification: true,
    body: {
      userId: smokeRunId,
      name: "Backend Smoke Borrower",
      location: {
        state: "NC",
        county: "Wake",
        region: "Southeast",
        country: "US",
      },
      financials: {
        revenue: 125000,
        expenses: 75000,
      },
      metadata: {
        type: "farm-loan-review",
        acres: 50,
      },
    },
    validate: (json, status) => status === 200 && json.success === true,
  },
  {
    name: "apply",
    method: "POST",
    path: "/api/apply",
    requiresClassification: true,
    body: {
      userId: smokeRunId,
      applicationId: `${smokeRunId}-application`,
      eventType: "APPLICATION_SUBMITTED",
      entityType: "application",
      entityId: `${smokeRunId}-application`,
      payload: {
        acreage: 50,
        requestedAmount: 250000,
      },
    },
    validate: (json, status) => {
      return (
        status === 200 &&
        json.ok === true &&
        typeof json.auditId === "string"
      );
    },
  },
  {
    name: "audit-export",
    method: "GET",
    path: "/api/audit/export",
    requiresClassification: true,
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "audit-verify",
    method: "GET",
    path: "/api/audit/verify",
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "ledger-read",
    method: "GET",
    path: "/api/ledger",
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "ledger-verify",
    method: "GET",
    path: "/api/ledger/verify",
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "legacy-verify-ledger",
    method: "GET",
    path: "/api/verify-ledger",
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "ledger-replay-verify",
    method: "GET",
    path: "/api/ledger/replay-verify",
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "canonical-ledger-read",
    method: "GET",
    path: "/api/ledger/canonical",
    validate: (json, status) => status === 200 && json.ok === true,
  },
  {
    name: "canonical-ledger-plan",
    method: "GET",
    path: "/api/ledger/canonical/plan",
    validate: (json, status) => status === 200 && json.ok === true,
  },
];

async function callRoute(test: SmokeTest): Promise<{
  status: number;
  json: Record<string, unknown>;
}> {
  const response = await fetch(`${baseUrl}${test.path}`, {
    method: test.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: test.method === "POST" ? JSON.stringify(test.body ?? {}) : undefined,
  });

  const json = (await response.json()) as Record<string, unknown>;

  return {
    status: response.status,
    json,
  };
}

function getTraceId(json: Record<string, unknown>): string | null {
  const governance = json.governance;

  if (
    typeof governance === "object" &&
    governance !== null &&
    "traceId" in governance &&
    typeof governance.traceId === "string"
  ) {
    return governance.traceId;
  }

  return null;
}

async function getEvidenceCounts(
  pool: Pool,
  traceId: string
): Promise<EvidenceCounts> {
  const result = {
    version_registry: 0,
    data_classification_registry: 0,
    observability_events: 0,
    replay_verification: 0,
  };

  for (const table of Object.keys(result) as Array<keyof EvidenceCounts>) {
    const rows = await pool.query(
      `select count(*)::int as count from ${table} where trace_id = $1`,
      [traceId]
    );

    result[table] = rows.rows[0].count;
  }

  return result;
}

function hasRequiredEvidence(
  test: SmokeTest,
  counts: EvidenceCounts
): boolean {
  if (counts.version_registry < 1) {
    return false;
  }

  if (counts.observability_events < 1) {
    return false;
  }

  if (counts.replay_verification < 1) {
    return false;
  }

  if (test.requiresClassification && counts.data_classification_registry < 1) {
    return false;
  }

  return true;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for backend smoke testing.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: createPostgresSslConfig(),
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  pool.on("error", (error) => {
    console.warn(
      `Backend smoke PostgreSQL idle client warning: ${error.message}`
    );
  });

  const summary = [];

  try {
    for (const test of smokeTests) {
      const { status, json } = await callRoute(test);
      const traceId = getTraceId(json);
      const routeValid = test.validate(json, status);
      const evidence = traceId
        ? await getEvidenceCounts(pool, traceId)
        : null;

      summary.push({
        name: test.name,
        status,
        routeValid,
        traceId,
        evidence,
      });

      if (!routeValid || !traceId || !evidence) {
        throw new Error(
          `Backend smoke test failed before evidence validation: ${test.name}`
        );
      }

      if (!hasRequiredEvidence(test, evidence)) {
        throw new Error(
          `Backend smoke test missing required evidence: ${test.name}`
        );
      }
    }
  } finally {
    await pool.end();
  }

  console.log(JSON.stringify(summary, null, 2));
  console.log("Backend governance smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown backend smoke test error."
  );
  process.exit(1);
});
