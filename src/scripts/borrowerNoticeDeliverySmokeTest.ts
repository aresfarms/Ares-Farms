import "dotenv/config";

import { Pool } from "pg";

/**
 * Borrower Notice Delivery Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms borrower notice delivery remains constitutionally gated.
 * - Vol II: verifies adverse-action, appeal, redaction, retention,
 *   delivery tracking, and borrower-disclosure controls.
 * - Vol III: checks replay-safe notice packet and delivery-state persistence.
 * - Vol IV: supports repeatable operator verification for notice delivery
 *   monitoring, dispute handling, recovery, and audit preparation.
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
    deliveryStatus?: string;
    deliveryAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    externalDeliveryPerformed?: boolean;
  };
  result?: {
    transitionAllowed?: boolean;
    finalActionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    deliveryAllowed?: boolean;
    deliveryStatus?: string;
    externalDeliveryPerformed?: boolean;
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
      `Borrower notice delivery smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for borrower notice delivery smoke testing."
    );
  }

  const runId = `borrower-notice-delivery-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const underwriterId = `${runId}-underwriter`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Borrower Notice Delivery Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 425000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Notice delivery smoke onboarding did not create an application.");
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
      "Smoke test candidate requires transition before notice delivery.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Notice delivery smoke did not create review records.");
  }

  const blockedFinalization = await post("/api/decisions/finalize", {
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
      "Blocked finalization should not allow notice delivery.",
    noticeSummary:
      "Blocked notice packet. This is not borrower-disclosable.",
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-before-transition",
    },
  });

  const blockedDecisionNoticeId = blockedFinalization.decisionNotice?.id;

  if (!blockedDecisionNoticeId) {
    throw new Error("Blocked finalization did not return a decision notice.");
  }

  const blockedDelivery = await post("/api/notices/deliver", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    decisionNoticeId: blockedDecisionNoticeId,
    noticeType: "ADVERSE_ACTION_NOTICE",
    deliveryChannel: "SECURE_PORTAL",
    noticePacketRef: `notice-packet://${runId}/blocked`,
    redactionProfileRef: `redaction://${runId}/profile`,
    redactionStatus: "REDACTION_APPROVED",
    appealPacketRef: `appeal://${runId}/packet`,
    retentionPolicyRef: `retention://${runId}/policy`,
    deliveryTrackingRef: `tracking://${runId}/blocked`,
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-delivery",
    },
  });

  if (blockedDelivery.result?.deliveryAllowed !== false) {
    throw new Error("Blocked finalization unexpectedly allowed notice delivery.");
  }

  if (blockedDelivery.result?.externalDeliveryPerformed !== false) {
    throw new Error("Blocked delivery unexpectedly performed external delivery.");
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
      "Underwriter completed transition gates for notice delivery smoke test.",
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
      "Finalization approved for controlled borrower notice delivery smoke test.",
    noticeSummary:
      "Approved for controlled delivery only. External provider delivery has not run.",
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

  const delivery = await post("/api/notices/deliver", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    decisionNoticeId,
    noticeType: "ADVERSE_ACTION_NOTICE",
    deliveryChannel: "SECURE_PORTAL",
    noticePacketRef: `notice-packet://${runId}/approved`,
    redactionProfileRef: `redaction://${runId}/profile`,
    redactionStatus: "REDACTION_APPROVED",
    appealPacketRef: `appeal://${runId}/packet`,
    retentionPolicyRef: `retention://${runId}/policy`,
    deliveryTrackingRef: `tracking://${runId}/approved`,
    deliveryProviderRef: "provider://secure-portal/pending",
    deliveryProviderConfigured: false,
    metadata: {
      smokeRunId: runId,
      scenario: "approved-delivery-record",
    },
  });

  const deliveryId = delivery.delivery?.id;
  const deliveryTraceId = delivery.governance?.traceId;

  if (!deliveryId || !deliveryTraceId) {
    throw new Error("Approved notice delivery did not return durable evidence.");
  }

  if (delivery.result?.deliveryAllowed !== true) {
    throw new Error("Approved notice delivery did not pass gates.");
  }

  if (delivery.result?.externalDeliveryPerformed !== false) {
    throw new Error("Approved notice delivery unexpectedly performed external delivery.");
  }

  if (delivery.result?.deliveryStatus !== "CONTROLLED_DELIVERY_READY") {
    throw new Error("Approved notice delivery did not record ready status.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const deliveryRows = await pool.query(
      `
        select id, decision_notice_id, application_id, delivery_status,
               notice_packet_status, redaction_status, appeal_packet_status,
               retention_status, delivery_allowed, borrower_disclosure_allowed,
               external_delivery_performed, delivery_provider_configured,
               classification, replay_ref
        from borrower_notice_deliveries
        where id = $1
      `,
      [deliveryId]
    );
    const deliveryRow = deliveryRows.rows[0];

    if (!deliveryRow) {
      throw new Error("Borrower notice delivery row was not persisted.");
    }

    if (deliveryRow.application_id !== applicationId) {
      throw new Error("Borrower notice delivery used the wrong application.");
    }

    if (deliveryRow.delivery_allowed !== true) {
      throw new Error("Borrower notice delivery was not marked allowed.");
    }

    if (deliveryRow.borrower_disclosure_allowed !== true) {
      throw new Error("Borrower notice delivery was not borrower-disclosable.");
    }

    if (deliveryRow.external_delivery_performed !== false) {
      throw new Error("Borrower notice delivery performed an external send.");
    }

    const blockedDeliveryId = blockedDelivery.delivery?.id;

    if (!blockedDeliveryId) {
      throw new Error("Blocked notice delivery did not return a row id.");
    }

    const blockedRows = await pool.query(
      `
        select id, delivery_status, delivery_allowed,
               external_delivery_performed
        from borrower_notice_deliveries
        where id = $1
      `,
      [blockedDeliveryId]
    );
    const blockedRow = blockedRows.rows[0];

    if (!blockedRow || blockedRow.delivery_allowed !== false) {
      throw new Error("Blocked borrower notice delivery was not persisted as blocked.");
    }

    const evidence = await evidenceCounts(pool, deliveryTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Borrower notice delivery evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blockedDelivery: {
            id: blockedRow.id,
            deliveryStatus: blockedRow.delivery_status,
            deliveryAllowed: blockedRow.delivery_allowed,
            externalDeliveryPerformed: blockedRow.external_delivery_performed,
          },
          delivery: deliveryRow,
          deliveryTraceId,
          evidence,
          gates: delivery.result?.gates,
        },
        null,
        2
      )
    );
    console.log("Borrower notice delivery smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown borrower notice delivery smoke test error."
  );
  process.exit(1);
});
