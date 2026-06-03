import "dotenv/config";

import { Pool } from "pg";

/**
 * Human Review Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable human review authority is durable.
 * - Vol II: verifies adverse-action candidates are not final notices and
 *   require borrower-protection review.
 * - Vol III: checks replay-safe review workflow persistence.
 * - Vol IV: supports repeatable operator verification for review queues.
 * - Vol V: enforces explainability, classification, observability,
 *   replayability, source authority, versioning, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  humanReview?: {
    id?: string;
    status?: string;
    applicationId?: string;
    finalActionAllowed?: boolean;
    adverseActionCandidate?: boolean;
    humanReviewRequired?: boolean;
  };
  adverseActionReview?: {
    id?: string;
    noticeStatus?: string;
    finalNoticeAllowed?: boolean;
    finalActionAllowed?: boolean;
    humanReviewRequired?: boolean;
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
      `Human review smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for human review smoke testing.");
  }

  const runId = `human-review-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Human Review Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 410000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Human review smoke onboarding did not create an application.");
  }

  const review = await post("/api/reviews/human", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    reviewType: "regulated_decision_review",
    sourceType: "rule_overlay_evaluation",
    sourceId: `${runId}-rule-evaluation`,
    sourceTraceId: `${runId}-source-trace`,
    priority: "HIGH",
    requiredReviewerRole: "authorized-underwriter",
    candidateOutcome: "DENIAL_REVIEW",
    adverseActionCandidate: true,
    reasonCodes: ["ADVERSE_ACTION_REVIEW_REQUIRED"],
    explanationSummary:
      "Smoke test candidate requires human review before any adverse-action notice.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;
  const traceId = review.governance?.traceId;

  if (!humanReviewId || !adverseActionReviewId || !traceId) {
    throw new Error("Human review workflow did not return durable review evidence.");
  }

  if (review.humanReview?.finalActionAllowed !== false) {
    throw new Error("Human review workflow unexpectedly allowed final action.");
  }

  if (review.adverseActionReview?.finalNoticeAllowed !== false) {
    throw new Error("Adverse-action review unexpectedly allowed final notice.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const humanRows = await pool.query(
      `
        select id, application_id, status, candidate_outcome,
               final_action_allowed, adverse_action_candidate,
               human_review_required, classification, replay_ref
        from human_review_workflows
        where id = $1
      `,
      [humanReviewId]
    );
    const humanReview = humanRows.rows[0];

    if (!humanReview) {
      throw new Error("Human review workflow row was not persisted.");
    }

    if (humanReview.application_id !== applicationId) {
      throw new Error("Human review workflow was not attached to the expected application.");
    }

    if (humanReview.final_action_allowed !== false) {
      throw new Error("Persisted human review workflow allowed final action.");
    }

    const adverseRows = await pool.query(
      `
        select id, human_review_workflow_id, application_id,
               adverse_action_status, notice_status, final_notice_allowed,
               final_action_allowed, human_review_required,
               classification, replay_ref
        from adverse_action_reviews
        where id = $1
      `,
      [adverseActionReviewId]
    );
    const adverseActionReview = adverseRows.rows[0];

    if (!adverseActionReview) {
      throw new Error("Adverse-action candidate row was not persisted.");
    }

    if (adverseActionReview.notice_status !== "NOT_A_NOTICE") {
      throw new Error("Adverse-action candidate was incorrectly treated as a notice.");
    }

    if (adverseActionReview.final_notice_allowed !== false) {
      throw new Error("Persisted adverse-action candidate allowed final notice.");
    }

    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Human review governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          humanReview,
          adverseActionReview,
          traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Human review governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown human review smoke test error."
  );
  process.exit(1);
});
