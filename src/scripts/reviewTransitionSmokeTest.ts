import "dotenv/config";

import { Pool } from "pg";

/**
 * Review Transition Control Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms human-review transitions are accountable.
 * - Vol II: verifies adverse-action, appeal, disclosure, explanation,
 *   and final-action approval gates before finalization can pass.
 * - Vol III: checks replay-safe review transition persistence.
 * - Vol IV: supports repeatable operator verification for underwriter
 *   approval, escalation resolution, and audit preparation.
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
    status?: string;
    finalActionAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  adverseActionReview?: {
    id?: string;
    adverseActionStatus?: string;
    noticeStatus?: string;
    finalActionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    humanReviewRequired?: boolean;
  } | null;
  transition?: {
    id?: string;
    transitionStatus?: string;
    finalActionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
  };
  decisionNotice?: {
    id?: string;
  };
  result?: {
    transitionAllowed?: boolean;
    finalActionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    finalDecisionStatus?: string;
    noticeStatus?: string;
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
      `Review transition smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for review transition smoke testing.");
  }

  const runId = `review-transition-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const underwriterId = `${runId}-underwriter`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Review Transition Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 425000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Review transition smoke onboarding did not create an application.");
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
      "Smoke test candidate requires underwriter transition before finalization.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Review transition smoke did not create review records.");
  }

  const blockedTransition = await post("/api/reviews/transition", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    humanReviewWorkflowId,
    adverseActionReviewId,
    transitionType: "APPROVE_FOR_FINAL_ACTION",
    reviewOutcome: "DENY",
    reviewerRole: "authorized-underwriter",
    disclosureReviewCompleted: true,
    appealRightsPrepared: true,
    reasonCodes: ["INSUFFICIENT_CASH_FLOW"],
    explanationSummary:
      "Blocked smoke transition is missing attestation and authority references.",
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-missing-authority",
    },
  });

  if (blockedTransition.result?.transitionAllowed !== false) {
    throw new Error("Incomplete review transition unexpectedly passed gates.");
  }

  if (blockedTransition.transition?.transitionStatus !== "TRANSITION_BLOCKED") {
    throw new Error("Incomplete review transition was not blocked.");
  }

  const approvedTransition = await post("/api/reviews/transition", {
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
      "Underwriter completed review transition gates for adverse-action finalization.",
    metadata: {
      smokeRunId: runId,
      scenario: "approved-transition",
    },
  });

  const transitionId = approvedTransition.transition?.id;
  const transitionTraceId = approvedTransition.governance?.traceId;

  if (!transitionId || !transitionTraceId) {
    throw new Error("Approved review transition did not return durable evidence.");
  }

  if (approvedTransition.result?.transitionAllowed !== true) {
    throw new Error("Complete review transition did not pass gates.");
  }

  if (approvedTransition.humanReview?.status !== "APPROVED_FOR_FINAL_ACTION") {
    throw new Error("Human review was not approved for final action.");
  }

  if (approvedTransition.adverseActionReview?.adverseActionStatus !== "APPROVED_FOR_NOTICE") {
    throw new Error("Adverse-action review was not approved for notice preparation.");
  }

  const finalization = await post("/api/decisions/finalize", {
    role: "underwriter",
    userId: underwriterId,
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
      "Finalization passed after approved review transition controls.",
    noticeSummary:
      "Approved for controlled issuance only. Delivery workflow has not run.",
    metadata: {
      smokeRunId: runId,
      reviewTransitionId: transitionId,
    },
  });

  const decisionNoticeId = finalization.decisionNotice?.id;
  const finalizationTraceId = finalization.governance?.traceId;

  if (!decisionNoticeId || !finalizationTraceId) {
    throw new Error("Approved finalization did not return durable evidence.");
  }

  if (finalization.result?.finalActionAllowed !== true) {
    throw new Error("Approved review transition did not unlock final action.");
  }

  if (finalization.result?.finalNoticeAllowed !== true) {
    throw new Error("Approved review transition did not unlock final notice approval.");
  }

  if (
    finalization.result?.finalDecisionStatus !==
    "FINAL_ACTION_APPROVED_FOR_EXECUTION"
  ) {
    throw new Error("Final decision status was not approved for execution.");
  }

  if (
    finalization.result?.noticeStatus !==
    "FINAL_NOTICE_APPROVED_FOR_ISSUANCE"
  ) {
    throw new Error("Final notice status was not approved for controlled issuance.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const transitionRows = await pool.query(
      `
        select id, human_review_workflow_id, adverse_action_review_id,
               transition_status, final_action_allowed, final_notice_allowed,
               borrower_disclosure_allowed, human_review_required,
               classification, replay_ref
        from review_transition_controls
        where id = $1
      `,
      [transitionId]
    );
    const transition = transitionRows.rows[0];

    if (!transition) {
      throw new Error("Review transition control row was not persisted.");
    }

    if (transition.transition_status !== "APPROVED_FOR_FINAL_ACTION") {
      throw new Error("Persisted review transition did not approve final action.");
    }

    if (transition.final_action_allowed !== true) {
      throw new Error("Persisted review transition did not allow final action.");
    }

    if (transition.final_notice_allowed !== true) {
      throw new Error("Persisted review transition did not allow final notice.");
    }

    if (transition.borrower_disclosure_allowed !== false) {
      throw new Error("Review transition unexpectedly performed borrower disclosure.");
    }

    const finalRows = await pool.query(
      `
        select id, final_decision_status, notice_status,
               final_action_allowed, final_notice_allowed,
               borrower_disclosure_allowed, classification, replay_ref
        from regulated_decision_notices
        where id = $1
      `,
      [decisionNoticeId]
    );
    const finalDecision = finalRows.rows[0];

    if (!finalDecision) {
      throw new Error("Final regulated decision notice row was not persisted.");
    }

    if (finalDecision.final_action_allowed !== true) {
      throw new Error("Persisted final decision did not allow final action.");
    }

    if (finalDecision.final_notice_allowed !== true) {
      throw new Error("Persisted final decision did not approve notice issuance.");
    }

    const transitionEvidence = await evidenceCounts(pool, transitionTraceId);
    const finalizationEvidence = await evidenceCounts(pool, finalizationTraceId);

    for (const [label, evidence] of [
      ["transition", transitionEvidence],
      ["finalization", finalizationEvidence],
    ] as const) {
      if (
        evidence.version_registry < 1 ||
        evidence.data_classification_registry < 1 ||
        evidence.observability_events < 1 ||
        evidence.replay_verification < 1
      ) {
        throw new Error(`${label} governance evidence was incomplete.`);
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blockedTransition: {
            transitionStatus: blockedTransition.transition?.transitionStatus,
            transitionAllowed: blockedTransition.result?.transitionAllowed,
          },
          transition,
          finalDecision,
          transitionTraceId,
          finalizationTraceId,
          transitionEvidence,
          finalizationEvidence,
        },
        null,
        2
      )
    );
    console.log("Review transition control smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown review transition smoke test error."
  );
  process.exit(1);
});
