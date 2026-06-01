import "dotenv/config";

import { Pool } from "pg";

/**
 * Review Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for review record reads.
 * - Vol II: verifies human-review, adverse-action, transition, appeal, and
 *   final-action posture are protected from cross-borrower disclosure.
 * - Vol III: checks replay-safe, record-scoped reads before dashboards use
 *   regulated review data.
 * - Vol IV: supports operator verification for review monitoring and audit prep.
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
  humanReview?: {
    id?: string;
    status?: string;
  };
  adverseActionReview?: {
    id?: string;
    adverseActionStatus?: string;
  } | null;
  transition?: {
    id?: string;
    transitionStatus?: string;
  };
  result?: {
    transitionAllowed?: boolean;
  };
  reviews?: Array<{
    humanReview?: {
      id?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      status?: string;
      finalActionAllowed?: boolean;
    };
    adverseActionReviews?: Array<{
      id?: string;
      adverseActionStatus?: string;
      noticeStatus?: string;
      finalNoticeAllowed?: boolean;
    }>;
    transitions?: Array<{
      id?: string;
      transitionStatus?: string;
      finalActionAllowed?: boolean;
      finalNoticeAllowed?: boolean;
      borrowerDisclosureAllowed?: boolean;
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
      `Review admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
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
      `Review admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Review admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Review admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for review admin read smoke testing.");
  }

  const runId = `review-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;
  const underwriterId = `${runId}-underwriter`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Review Admin Read Smoke Farm",
    acreage: 112,
    county: "Wake",
    state: "NC",
    requestedAmount: 390000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Review admin read smoke onboarding did not create an application.");
  }

  const review = await post("/api/reviews/human", {
    role: "operator",
    userId: operatorId,
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
      "Smoke test candidate requires governed review admin-read coverage.",
    metadata: {
      smokeRunId: runId,
    },
  });
  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Review admin read smoke did not create review records.");
  }

  const transition = await post("/api/reviews/transition", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    humanReviewWorkflowId,
    adverseActionReviewId,
    transitionType: "APPROVE_FOR_FINAL_ACTION",
    requestedStatus: "APPROVED_FOR_FINAL_ACTION",
    reviewOutcome: "DENY",
    reviewerRole: "authorized-underwriter",
    reviewerAttestationRef: `attestation://${runId}/underwriter-final-review`,
    approvalAuthorityRef: `authority://${runId}/underwriter-final-action`,
    disclosureReviewCompleted: true,
    appealRightsPrepared: true,
    reasonCodes: ["INSUFFICIENT_CASH_FLOW", "COLLATERAL_REVIEW_REQUIRED"],
    explanationSummary:
      "Underwriter completed review transition gates for admin-read smoke coverage.",
    metadata: {
      smokeRunId: runId,
    },
  });
  const transitionId = transition.transition?.id;

  if (!transitionId || transition.result?.transitionAllowed !== true) {
    throw new Error("Review admin read smoke did not create an approved transition.");
  }

  const scopedRead = await get("/api/reviews/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    humanReviewWorkflowId,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const scopedRecord = scopedRead.reviews?.[0];

  if (!scopedTraceId || scopedRead.count !== 1) {
    throw new Error("Review admin scoped read did not return exactly one record.");
  }

  if (
    scopedRecord?.humanReview?.id !== humanReviewWorkflowId ||
    scopedRecord.humanReview.applicationId !== applicationId ||
    scopedRecord.humanReview.borrowerId !== borrowerId ||
    scopedRecord.humanReview.tenantId !== tenantId ||
    scopedRecord.adverseActionReviews?.[0]?.id !== adverseActionReviewId ||
    scopedRecord.transitions?.[0]?.id !== transitionId ||
    scopedRecord.application?.id !== applicationId ||
    scopedRecord.property?.county !== "Wake"
  ) {
    throw new Error("Review admin scoped read returned the wrong review, application, or property summary.");
  }

  const tenantRead = await get("/api/reviews/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    limit: 10,
  });

  if (
    !tenantRead.reviews?.some(
      (record) => record.humanReview?.id === humanReviewWorkflowId
    )
  ) {
    throw new Error("Review admin tenant read did not include the expected review.");
  }

  const transitionRead = await get("/api/reviews/admin", {
    role: "underwriter",
    userId: underwriterId,
    tenantId,
    borrowerId,
    transitionId,
  });

  if (
    transitionRead.count !== 1 ||
    transitionRead.reviews?.[0]?.transitions?.[0]?.id !== transitionId
  ) {
    throw new Error("Review admin transition-scoped read did not include the expected transition.");
  }

  const deniedRead = await get(
    "/api/reviews/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      humanReviewWorkflowId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Review admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/reviews/admin",
    {
      role: "operator",
      userId: operatorId,
      humanReviewWorkflowId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Review admin missing-scope denial did not return a governance trace.");
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
      throw new Error("Review admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          humanReviewWorkflowId,
          adverseActionReviewId,
          transitionId,
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
    console.log("Review admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown review admin read smoke test error."
  );
  process.exit(1);
});
