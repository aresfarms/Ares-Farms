import "dotenv/config";

import { Pool } from "pg";

/**
 * Regulated Decision Notice Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms final regulated action remains constitutionally gated.
 * - Vol II: verifies adverse-action, appeal, borrower explanation,
 *   disclosure, and notice boundaries remain blocked until approved.
 * - Vol III: checks replay-safe final decision control persistence.
 * - Vol IV: supports repeatable operator verification for notice controls.
 * - Vol V: enforces classification, explainability, observability,
 *   replayability, version lineage, controlled disclosure, and evidence.
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
  };
  adverseActionReview?: {
    id?: string;
  } | null;
  decisionNotice?: {
    id?: string;
    finalDecisionStatus?: string;
    noticeStatus?: string;
    finalActionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  result?: {
    finalActionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    finalDecisionStatus?: string;
    noticeStatus?: string;
    borrowerDisclosureAllowed?: boolean;
    gates?: Record<string, unknown>;
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
      `Regulated decision notice smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for regulated decision notice smoke testing."
    );
  }

  const runId = `regulated-decision-notice-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Regulated Decision Notice Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 390000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Regulated decision smoke onboarding did not create an application."
    );
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
      "Smoke test candidate requires human review before any final notice.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error(
      "Regulated decision smoke did not create human/adverse review records."
    );
  }

  const finalization = await post("/api/decisions/finalize", {
    role: "underwriter",
    userId: `${runId}-underwriter`,
    borrowerId,
    tenantId,
    applicationId,
    humanReviewWorkflowId,
    adverseActionReviewId,
    decisionType: "ADVERSE_ACTION_NOTICE",
    requestedOutcome: "DENY",
    finalActionRequested: true,
    disclosureStatus: "APPROVED_FOR_BORROWER_DISCLOSURE",
    appealRightsIncluded: true,
    reasonCodes: ["INSUFFICIENT_CASH_FLOW", "COLLATERAL_REVIEW_REQUIRED"],
    explanationSummary:
      "This smoke test checks that queued review records cannot become final notices.",
    noticeSummary:
      "Blocked smoke-test notice. This is not a borrower-disclosable final notice.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const decisionNoticeId = finalization.decisionNotice?.id;
  const traceId = finalization.governance?.traceId;

  if (!decisionNoticeId || !traceId) {
    throw new Error("Regulated decision finalization did not return evidence.");
  }

  if (finalization.result?.finalActionAllowed !== false) {
    throw new Error("Queued human review unexpectedly allowed final action.");
  }

  if (finalization.result?.finalNoticeAllowed !== false) {
    throw new Error("Queued adverse-action review unexpectedly allowed notice.");
  }

  if (finalization.result?.noticeStatus !== "FINAL_NOTICE_BLOCKED") {
    throw new Error("Regulated notice was not blocked as expected.");
  }

  if (finalization.result?.borrowerDisclosureAllowed !== false) {
    throw new Error("Blocked finalization unexpectedly allowed borrower disclosure.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const noticeRows = await pool.query(
      `
        select id, application_id, human_review_workflow_id,
               adverse_action_review_id, final_decision_status,
               notice_status, final_action_allowed, final_notice_allowed,
               borrower_disclosure_allowed, human_review_required,
               adverse_action_required, appeal_rights_included,
               classification, replay_ref
        from regulated_decision_notices
        where id = $1
      `,
      [decisionNoticeId]
    );
    const decisionNotice = noticeRows.rows[0];

    if (!decisionNotice) {
      throw new Error("Regulated decision notice row was not persisted.");
    }

    if (decisionNotice.application_id !== applicationId) {
      throw new Error("Regulated decision notice used the wrong application.");
    }

    if (decisionNotice.final_action_allowed !== false) {
      throw new Error("Persisted regulated decision allowed final action.");
    }

    if (decisionNotice.final_notice_allowed !== false) {
      throw new Error("Persisted regulated decision allowed final notice.");
    }

    if (decisionNotice.notice_status !== "FINAL_NOTICE_BLOCKED") {
      throw new Error("Persisted regulated decision notice was not blocked.");
    }

    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Regulated decision notice evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          decisionNotice,
          traceId,
          evidence,
          gates: finalization.result?.gates,
        },
        null,
        2
      )
    );
    console.log("Regulated decision notice smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown regulated decision notice smoke test error."
  );
  process.exit(1);
});
