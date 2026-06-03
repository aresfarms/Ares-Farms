import "dotenv/config";

import { Pool } from "pg";

/**
 * Borrower Notice Delivery Receipt Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms receipt evidence remains authority-gated.
 * - Vol II: verifies delivery, failure, return, retry, and dispute controls.
 * - Vol III: checks replay-safe notice receipt lifecycle persistence.
 * - Vol IV: supports repeatable operator verification for failed-delivery
 *   response, dispute intake, recovery, escalation, and audit preparation.
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
    queueType?: string;
    sourceType?: string;
    sourceId?: string;
    status?: string;
    priority?: string;
    escalationStatus?: string;
  } | null;
  result?: {
    transitionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    deliveryAllowed?: boolean;
    receiptAccepted?: boolean;
    receiptStatus?: string;
    deliveryOutcome?: string;
    deliveryStatusAfterReceipt?: string;
    providerDeliveryEventRecorded?: boolean;
    operatorQueueItemCreated?: boolean;
    operatorQueueItemId?: string | null;
    externalDeliveryPerformedByRuntime?: boolean;
    retryRequired?: boolean;
    operatorReviewRequired?: boolean;
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
      `Borrower notice receipt smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    farmName: "Borrower Notice Receipt Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 390000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Notice receipt smoke onboarding did not create an application.");
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
      "Smoke test candidate requires transition before receipt intake.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Notice receipt smoke did not create review records.");
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
      "Underwriter completed transition gates for notice receipt smoke test.",
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
      "Finalization approved for controlled borrower notice receipt smoke test.",
    noticeSummary:
      "Approved for controlled delivery receipt intake testing.",
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
    decisionNoticeId,
  };
}

async function createDelivery(input: {
  runId: string;
  applicationId: string;
  tenantId: string;
  borrowerId: string;
  underwriterId: string;
  decisionNoticeId: string;
  deliveryProviderConfigured: boolean;
  scenario: string;
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
    noticePacketRef: `notice-packet://${input.runId}/${input.scenario}`,
    redactionProfileRef: `redaction://${input.runId}/profile`,
    redactionStatus: "REDACTION_APPROVED",
    appealPacketRef: `appeal://${input.runId}/packet`,
    retentionPolicyRef: `retention://${input.runId}/policy`,
    deliveryTrackingRef: `tracking://${input.runId}/${input.scenario}`,
    deliveryProviderRef: "provider://secure-portal/governed-provider",
    deliveryProviderConfigured: input.deliveryProviderConfigured,
    metadata: {
      smokeRunId: input.runId,
      scenario: input.scenario,
    },
  });

  if (!delivery.delivery?.id) {
    throw new Error("Notice receipt smoke delivery did not return an id.");
  }

  if (delivery.result?.deliveryAllowed !== true) {
    throw new Error("Notice receipt smoke delivery did not pass gates.");
  }

  return delivery;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for borrower notice receipt smoke testing."
    );
  }

  const runId = `borrower-notice-receipt-smoke-${Date.now()}`;
  const approvedNotice = await createApprovedNotice(runId);

  const blockedDelivery = await createDelivery({
    runId,
    ...approvedNotice,
    deliveryProviderConfigured: false,
    scenario: "provider-not-configured",
  });
  const blockedDeliveryId = blockedDelivery.delivery?.id;

  if (!blockedDeliveryId) {
    throw new Error("Blocked receipt delivery setup did not return an id.");
  }

  const blockedReceipt = await post("/api/notices/receipts", {
    role: "underwriter",
    userId: approvedNotice.underwriterId,
    borrowerId: approvedNotice.borrowerId,
    tenantId: approvedNotice.tenantId,
    applicationId: approvedNotice.applicationId,
    deliveryId: blockedDeliveryId,
    receiptType: "DELIVERY_CONFIRMATION",
    deliveryOutcome: "DELIVERED",
    providerStatus: "delivered",
    providerEventId: `provider-event://${runId}/blocked`,
    receiptEvidenceRef: `receipt-evidence://${runId}/blocked`,
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-provider-not-configured",
    },
  });

  if (blockedReceipt.result?.receiptAccepted !== false) {
    throw new Error("Receipt intake accepted a non-configured provider delivery.");
  }

  if (blockedReceipt.result?.externalDeliveryPerformedByRuntime !== false) {
    throw new Error("Blocked receipt performed an external provider action.");
  }

  const acceptedDelivery = await createDelivery({
    runId,
    ...approvedNotice,
    deliveryProviderConfigured: true,
    scenario: "provider-configured",
  });
  const acceptedDeliveryId = acceptedDelivery.delivery?.id;

  if (!acceptedDeliveryId) {
    throw new Error("Accepted receipt delivery setup did not return an id.");
  }

  const acceptedReceipt = await post("/api/notices/receipts", {
    role: "underwriter",
    userId: approvedNotice.underwriterId,
    borrowerId: approvedNotice.borrowerId,
    tenantId: approvedNotice.tenantId,
    applicationId: approvedNotice.applicationId,
    deliveryId: acceptedDeliveryId,
    receiptType: "DELIVERY_CONFIRMATION",
    deliveryOutcome: "DELIVERED",
    providerStatus: "delivered",
    providerEventId: `provider-event://${runId}/accepted`,
    receiptEvidenceRef: `receipt-evidence://${runId}/accepted`,
    deliveryTrackingRef: `tracking://${runId}/provider-configured`,
    metadata: {
      smokeRunId: runId,
      scenario: "accepted-delivery-receipt",
    },
  });

  const receiptId = acceptedReceipt.receipt?.id;
  const receiptTraceId = acceptedReceipt.governance?.traceId;

  if (!receiptId || !receiptTraceId) {
    throw new Error("Accepted notice receipt did not return durable evidence.");
  }

  if (acceptedReceipt.result?.receiptAccepted !== true) {
    throw new Error("Accepted notice receipt did not pass gates.");
  }

  if (
    acceptedReceipt.result?.receiptStatus !== "RECEIPT_ACCEPTED" ||
    acceptedReceipt.result.deliveryOutcome !== "DELIVERED"
  ) {
    throw new Error("Accepted notice receipt did not record delivered status.");
  }

  if (acceptedReceipt.result?.providerDeliveryEventRecorded !== true) {
    throw new Error("Accepted notice receipt did not record provider event evidence.");
  }

  if (acceptedReceipt.result?.externalDeliveryPerformedByRuntime !== false) {
    throw new Error("Accepted receipt performed an external provider action.");
  }

  if (acceptedReceipt.result?.operatorQueueItemCreated !== false) {
    throw new Error("Delivered receipt unexpectedly created an operator queue item.");
  }

  const failedDelivery = await createDelivery({
    runId,
    ...approvedNotice,
    deliveryProviderConfigured: true,
    scenario: "provider-failed",
  });
  const failedDeliveryId = failedDelivery.delivery?.id;

  if (!failedDeliveryId) {
    throw new Error("Failed receipt delivery setup did not return an id.");
  }

  const failedReceipt = await post("/api/notices/receipts", {
    role: "underwriter",
    userId: approvedNotice.underwriterId,
    borrowerId: approvedNotice.borrowerId,
    tenantId: approvedNotice.tenantId,
    applicationId: approvedNotice.applicationId,
    deliveryId: failedDeliveryId,
    receiptType: "DELIVERY_FAILURE",
    deliveryOutcome: "FAILED",
    providerStatus: "failed",
    failureReasonCode: "SECURE_PORTAL_DELIVERY_FAILED",
    providerEventId: `provider-event://${runId}/failed`,
    receiptEvidenceRef: `receipt-evidence://${runId}/failed`,
    deliveryTrackingRef: `tracking://${runId}/provider-failed`,
    retryPolicyRef: `retry-policy://${runId}/notice-delivery`,
    retryRequired: true,
    metadata: {
      smokeRunId: runId,
      scenario: "failed-delivery-receipt",
    },
  });

  const failedReceiptId = failedReceipt.receipt?.id;
  const failedQueueItemId = failedReceipt.operatorQueueItem?.id;

  if (!failedReceiptId || !failedQueueItemId) {
    throw new Error("Failed notice receipt did not create operator queue evidence.");
  }

  if (failedReceipt.result?.receiptAccepted !== true) {
    throw new Error("Failed notice receipt did not pass receipt gates.");
  }

  if (failedReceipt.result?.operatorReviewRequired !== true) {
    throw new Error("Failed notice receipt did not require operator review.");
  }

  if (failedReceipt.result?.operatorQueueItemCreated !== true) {
    throw new Error("Failed notice receipt did not create an operator queue item.");
  }

  if (failedReceipt.operatorQueueItem?.queueType !== "NOTICE_DELIVERY_REVIEW") {
    throw new Error("Failed notice receipt created the wrong queue type.");
  }

  if (failedReceipt.operatorQueueItem?.sourceId !== failedReceiptId) {
    throw new Error("Failed notice receipt queue item was not linked to the receipt.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const receiptRows = await pool.query(
      `
        select id, delivery_id, application_id, receipt_status,
               delivery_outcome, provider_delivery_event_recorded,
               external_delivery_performed_by_runtime, retry_required,
               operator_review_required, classification, replay_ref
        from borrower_notice_delivery_receipts
        where id = $1
      `,
      [receiptId]
    );
    const receiptRow = receiptRows.rows[0];

    if (!receiptRow) {
      throw new Error("Borrower notice receipt row was not persisted.");
    }

    if (receiptRow.application_id !== approvedNotice.applicationId) {
      throw new Error("Borrower notice receipt used the wrong application.");
    }

    if (receiptRow.receipt_status !== "RECEIPT_ACCEPTED") {
      throw new Error("Borrower notice receipt was not marked accepted.");
    }

    if (receiptRow.external_delivery_performed_by_runtime !== false) {
      throw new Error("Borrower notice receipt performed a provider action.");
    }

    const deliveryRows = await pool.query(
      `
        select id, delivery_status, external_delivery_performed
        from borrower_notice_deliveries
        where id = $1
      `,
      [acceptedDeliveryId]
    );
    const deliveryRow = deliveryRows.rows[0];

    if (
      !deliveryRow ||
      deliveryRow.delivery_status !== "DELIVERY_RECEIPT_CONFIRMED" ||
      deliveryRow.external_delivery_performed !== true
    ) {
      throw new Error("Borrower notice delivery lifecycle was not updated.");
    }

    const failedReceiptRows = await pool.query(
      `
        select id, receipt_status, delivery_outcome, retry_required,
               operator_review_required
        from borrower_notice_delivery_receipts
        where id = $1
      `,
      [failedReceiptId]
    );
    const failedReceiptRow = failedReceiptRows.rows[0];

    if (
      !failedReceiptRow ||
      failedReceiptRow.receipt_status !== "RECEIPT_ACCEPTED" ||
      failedReceiptRow.delivery_outcome !== "FAILED" ||
      failedReceiptRow.retry_required !== true ||
      failedReceiptRow.operator_review_required !== true
    ) {
      throw new Error("Failed receipt exception state was not persisted.");
    }

    const queueRows = await pool.query(
      `
        select id, queue_type, source_type, source_id, application_id,
               tenant_id, status, priority, escalation_status
        from operator_review_queue_items
        where id = $1
      `,
      [failedQueueItemId]
    );
    const queueItem = queueRows.rows[0];

    if (
      !queueItem ||
      queueItem.queue_type !== "NOTICE_DELIVERY_REVIEW" ||
      queueItem.source_type !== "borrower_notice_delivery_receipt" ||
      queueItem.source_id !== failedReceiptId ||
      queueItem.status !== "OPEN" ||
      queueItem.priority !== "HIGH"
    ) {
      throw new Error("Notice receipt operator queue item was not persisted correctly.");
    }

    const evidence = await evidenceCounts(pool, receiptTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Borrower notice receipt evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blockedReceipt: {
            id: blockedReceipt.receipt?.id,
            receiptAccepted: blockedReceipt.result?.receiptAccepted,
            externalDeliveryPerformedByRuntime:
              blockedReceipt.result?.externalDeliveryPerformedByRuntime,
          },
          receipt: receiptRow,
          failedReceipt: failedReceiptRow,
          queueItem,
          delivery: deliveryRow,
          receiptTraceId,
          evidence,
          gates: acceptedReceipt.result?.gates,
        },
        null,
        2
      )
    );
    console.log("Borrower notice receipt smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown borrower notice receipt smoke test error."
  );
  process.exit(1);
});
