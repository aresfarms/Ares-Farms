import "dotenv/config";

import { Pool } from "pg";

/**
 * Borrower Notice Exception Resolution Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms notice exception closure requires accountable authority.
 * - Vol II: verifies failed-delivery, retry, dispute, retention, and
 *   borrower-disclosure controls before operator queue completion.
 * - Vol III: checks replay-safe exception resolution and queue lifecycle
 *   persistence.
 * - Vol IV: supports repeatable operator verification for failed-delivery
 *   recovery, dispute handling, escalation, and audit preparation.
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
  transition?: {
    id?: string;
  };
  decisionNotice?: {
    id?: string;
  };
  delivery?: {
    id?: string;
  };
  receipt?: {
    id?: string;
  };
  operatorQueueItem?: {
    id?: string;
  } | null;
  resolution?: {
    id?: string;
  };
  result?: {
    transitionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    deliveryAllowed?: boolean;
    receiptAccepted?: boolean;
    operatorReviewRequired?: boolean;
    operatorQueueItemCreated?: boolean;
    resolutionAllowed?: boolean;
    resolutionStatus?: string;
    queueCompleted?: boolean;
    queueStatusAfter?: string;
    retryAuthorized?: boolean;
    externalProviderActionPerformed?: boolean;
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
      `Notice exception resolution smoke route failed: ${path} ${response.status} ${JSON.stringify(
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

async function createApprovedNotice(runId: string) {
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const underwriterId = `${runId}-underwriter`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Notice Exception Resolution Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 410000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Exception resolution smoke onboarding did not create an application.");
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
      "Smoke test candidate requires transition before exception resolution.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Exception resolution smoke did not create review records.");
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
      "Underwriter completed transition gates for exception resolution smoke test.",
    metadata: {
      smokeRunId: runId,
    },
  });

  if (transition.result?.transitionAllowed !== true) {
    throw new Error("Review transition did not pass gates.");
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
      "Finalization approved for controlled notice exception resolution smoke test.",
    noticeSummary:
      "Approved for controlled delivery exception resolution testing.",
    metadata: {
      smokeRunId: runId,
      reviewTransitionId: transition.transition?.id,
    },
  });

  const decisionNoticeId = finalization.decisionNotice?.id;

  if (!decisionNoticeId) {
    throw new Error("Approved finalization did not return a decision notice.");
  }

  if (finalization.result?.finalNoticeAllowed !== true) {
    throw new Error("Approved finalization did not allow final notice issuance.");
  }

  return {
    applicationId,
    tenantId,
    borrowerId,
    underwriterId,
    operatorId: `${runId}-operator`,
    decisionNoticeId,
  };
}

async function createFailedNoticeException(input: {
  runId: string;
  applicationId: string;
  tenantId: string;
  borrowerId: string;
  underwriterId: string;
  decisionNoticeId: string;
}) {
  const delivery = await post("/api/notices/deliver", {
    role: "underwriter",
    userId: input.underwriterId,
    borrowerId: input.borrowerId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    decisionNoticeId: input.decisionNoticeId,
    noticeType: "ADVERSE_ACTION_NOTICE",
    deliveryChannel: "SECURE_PORTAL",
    noticePacketRef: `notice-packet://${input.runId}/exception-resolution`,
    redactionProfileRef: `redaction://${input.runId}/profile`,
    redactionStatus: "REDACTION_APPROVED",
    appealPacketRef: `appeal://${input.runId}/packet`,
    retentionPolicyRef: `retention://${input.runId}/policy`,
    deliveryTrackingRef: `tracking://${input.runId}/exception-resolution`,
    deliveryProviderRef: "provider://secure-portal/governed-provider",
    deliveryProviderConfigured: true,
    metadata: {
      smokeRunId: input.runId,
      scenario: "exception-resolution-delivery",
    },
  });
  const deliveryId = delivery.delivery?.id;

  if (!deliveryId || delivery.result?.deliveryAllowed !== true) {
    throw new Error("Exception resolution smoke did not create governed delivery.");
  }

  const receipt = await post("/api/notices/receipts", {
    role: "underwriter",
    userId: input.underwriterId,
    borrowerId: input.borrowerId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    deliveryId,
    receiptType: "DELIVERY_FAILURE",
    deliveryOutcome: "FAILED",
    providerStatus: "failed",
    failureReasonCode: "SECURE_PORTAL_DELIVERY_FAILED",
    providerEventId: `provider-event://${input.runId}/failed`,
    receiptEvidenceRef: `receipt-evidence://${input.runId}/failed`,
    deliveryTrackingRef: `tracking://${input.runId}/exception-resolution`,
    retryPolicyRef: `retry-policy://${input.runId}/notice-delivery`,
    retryRequired: true,
    metadata: {
      smokeRunId: input.runId,
      scenario: "exception-resolution-failed-receipt",
    },
  });

  if (
    !receipt.receipt?.id ||
    !receipt.operatorQueueItem?.id ||
    receipt.result?.receiptAccepted !== true ||
    receipt.result.operatorQueueItemCreated !== true
  ) {
    throw new Error("Exception resolution smoke did not create exception queue item.");
  }

  return {
    deliveryId,
    receiptId: receipt.receipt.id,
    queueItemId: receipt.operatorQueueItem.id,
  };
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for borrower notice exception resolution smoke testing."
    );
  }

  const runId = `borrower-notice-exception-resolution-smoke-${Date.now()}`;
  const approvedNotice = await createApprovedNotice(runId);
  const exception = await createFailedNoticeException({
    runId,
    ...approvedNotice,
  });

  const blockedResolution = await post("/api/notices/exceptions/resolve", {
    role: "operator",
    userId: approvedNotice.operatorId,
    borrowerId: approvedNotice.borrowerId,
    tenantId: approvedNotice.tenantId,
    applicationId: approvedNotice.applicationId,
    queueItemId: exception.queueItemId,
    receiptId: exception.receiptId,
    exceptionType: "DELIVERY_FAILED",
    resolutionAction: "AUTHORIZE_RETRY",
    resolutionEvidenceRef: `resolution-evidence://${runId}/blocked`,
    retryPlanRef: `retry-plan://${runId}/notice-delivery`,
    humanReviewCompleted: true,
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-missing-attestation",
    },
  });

  if (blockedResolution.result?.resolutionAllowed !== false) {
    throw new Error("Incomplete notice exception resolution was not blocked.");
  }

  if (blockedResolution.result?.queueCompleted !== false) {
    throw new Error("Blocked notice exception resolution completed the queue item.");
  }

  const approvedResolution = await post("/api/notices/exceptions/resolve", {
    role: "operator",
    userId: approvedNotice.operatorId,
    borrowerId: approvedNotice.borrowerId,
    tenantId: approvedNotice.tenantId,
    applicationId: approvedNotice.applicationId,
    queueItemId: exception.queueItemId,
    receiptId: exception.receiptId,
    exceptionType: "DELIVERY_FAILED",
    resolutionAction: "AUTHORIZE_RETRY",
    resolutionEvidenceRef: `resolution-evidence://${runId}/approved`,
    operatorAttestationRef: `operator-attestation://${runId}/retry-authorized`,
    retryPlanRef: `retry-plan://${runId}/notice-delivery`,
    retentionPolicyRef: `retention://${runId}/policy`,
    humanReviewCompleted: true,
    metadata: {
      smokeRunId: runId,
      scenario: "approved-retry-resolution",
    },
  });

  const resolutionId = approvedResolution.resolution?.id;
  const resolutionTraceId = approvedResolution.governance?.traceId;

  if (!resolutionId || !resolutionTraceId) {
    throw new Error("Approved exception resolution did not return durable evidence.");
  }

  if (approvedResolution.result?.resolutionAllowed !== true) {
    throw new Error("Approved exception resolution did not pass gates.");
  }

  if (approvedResolution.result?.queueCompleted !== true) {
    throw new Error("Approved exception resolution did not complete the queue.");
  }

  if (approvedResolution.result?.retryAuthorized !== true) {
    throw new Error("Approved exception resolution did not authorize retry.");
  }

  if (approvedResolution.result?.externalProviderActionPerformed !== false) {
    throw new Error("Exception resolution performed an external provider action.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const resolutionRows = await pool.query(
      `
        select id, queue_item_id, receipt_id, delivery_id, application_id,
               exception_type, resolution_action, resolution_status,
               resolution_allowed, queue_completed, retry_authorized,
               external_provider_action_performed, classification, replay_ref
        from borrower_notice_exception_resolutions
        where id = $1
      `,
      [resolutionId]
    );
    const resolutionRow = resolutionRows.rows[0];

    if (!resolutionRow) {
      throw new Error("Notice exception resolution row was not persisted.");
    }

    if (
      resolutionRow.resolution_status !== "RESOLUTION_APPROVED" ||
      resolutionRow.resolution_allowed !== true ||
      resolutionRow.queue_completed !== true ||
      resolutionRow.retry_authorized !== true ||
      resolutionRow.external_provider_action_performed !== false
    ) {
      throw new Error("Notice exception resolution row did not record approved retry closure.");
    }

    const blockedRows = await pool.query(
      `
        select resolution_status, resolution_allowed, queue_completed
        from borrower_notice_exception_resolutions
        where id = $1
      `,
      [blockedResolution.resolution?.id]
    );
    const blockedRow = blockedRows.rows[0];

    if (
      !blockedRow ||
      blockedRow.resolution_status !== "RESOLUTION_BLOCKED" ||
      blockedRow.resolution_allowed !== false ||
      blockedRow.queue_completed !== false
    ) {
      throw new Error("Blocked notice exception resolution was not persisted as blocked.");
    }

    const queueRows = await pool.query(
      `
        select id, status, completed_at
        from operator_review_queue_items
        where id = $1
      `,
      [exception.queueItemId]
    );
    const queueRow = queueRows.rows[0];

    if (!queueRow || queueRow.status !== "COMPLETED" || !queueRow.completed_at) {
      throw new Error("Notice exception queue item was not completed.");
    }

    const deliveryRows = await pool.query(
      `
        select id, delivery_status
        from borrower_notice_deliveries
        where id = $1
      `,
      [exception.deliveryId]
    );
    const deliveryRow = deliveryRows.rows[0];

    if (
      !deliveryRow ||
      deliveryRow.delivery_status !== "DELIVERY_RETRY_AUTHORIZED"
    ) {
      throw new Error("Notice delivery was not marked retry authorized.");
    }

    const evidence = await evidenceCounts(pool, resolutionTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Notice exception resolution evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blockedResolution: blockedRow,
          resolution: resolutionRow,
          queue: queueRow,
          delivery: deliveryRow,
          resolutionTraceId,
          evidence,
          gates: approvedResolution.result?.gates,
        },
        null,
        2
      )
    );
    console.log("Borrower notice exception resolution smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown borrower notice exception resolution smoke test error."
  );
  process.exit(1);
});
