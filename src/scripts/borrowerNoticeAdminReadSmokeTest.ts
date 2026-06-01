import "dotenv/config";

import { Pool } from "pg";

/**
 * Borrower Notice Admin Read Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for notice lifecycle reads.
 * - Vol II: verifies borrower/adverse-action notice records are not exposed
 *   outside governed application and tenant scope.
 * - Vol III: checks deterministic record-authorized read behavior.
 * - Vol IV: supports dashboard-safe operator/admin monitoring and audit prep.
 * - Vol V: enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
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
  execution?: {
    id?: string;
    providerExecutionAllowed?: boolean;
    externalProviderActionPerformed?: boolean;
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
  count?: number;
  noticeRecords?: Array<{
    delivery?: {
      id?: string;
      applicationId?: string;
      deliveryStatus?: string;
    };
    providerExecutions?: Array<{
      id?: string;
      executionStatus?: string;
      providerExecutionAllowed?: boolean;
      externalProviderActionPerformed?: boolean;
    }>;
    receipts?: Array<{
      id?: string;
      deliveryOutcome?: string;
    }>;
    resolutions?: Array<{
      id?: string;
      resolutionStatus?: string;
    }>;
  }>;
  result?: {
    transitionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    deliveryAllowed?: boolean;
    providerExecutionAllowed?: boolean;
    externalProviderActionPerformed?: boolean;
    receiptAccepted?: boolean;
    operatorQueueItemCreated?: boolean;
    resolutionAllowed?: boolean;
    queueCompleted?: boolean;
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
      `Notice admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function get(path: string): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`);
  const json = (await response.json()) as RouteJson;

  if (response.status < 200 || response.status >= 300 || json.ok !== true) {
    throw new Error(
      `Notice admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function getDenied(path: string): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`);
  const json = (await response.json()) as RouteJson;

  if (response.status !== 403 || json.ok !== false) {
    throw new Error(
      `Notice admin read denial smoke failed: ${path} ${response.status} ${JSON.stringify(
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

async function createNoticeLifecycle(runId: string) {
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const underwriterId = `${runId}-underwriter`;
  const operatorId = `${runId}-operator`;
  const providerId = `provider://${runId}/secure-portal`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Notice Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 410000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Notice admin read smoke onboarding did not create application.");
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
      "Smoke test candidate requires transition before notice admin read.",
    metadata: {
      smokeRunId: runId,
    },
  });

  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Notice admin read smoke did not create review records.");
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
      "Underwriter completed transition gates for notice admin read smoke test.",
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
      "Finalization approved for controlled notice admin read smoke test.",
    noticeSummary:
      "Approved for controlled delivery lifecycle read testing.",
    metadata: {
      smokeRunId: runId,
      reviewTransitionId: transition.transition?.id,
    },
  });
  const decisionNoticeId = finalization.decisionNotice?.id;

  if (!decisionNoticeId || finalization.result?.finalNoticeAllowed !== true) {
    throw new Error("Finalization did not produce an approved notice.");
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
    noticePacketRef: `notice-packet://${runId}/admin-read`,
    redactionProfileRef: `redaction://${runId}/profile`,
    redactionStatus: "REDACTION_APPROVED",
    appealPacketRef: `appeal://${runId}/packet`,
    retentionPolicyRef: `retention://${runId}/policy`,
    deliveryTrackingRef: `tracking://${runId}/admin-read`,
    deliveryProviderRef: providerId,
    deliveryProviderConfigured: true,
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-delivery",
    },
  });
  const deliveryId = delivery.delivery?.id;

  if (!deliveryId || delivery.result?.deliveryAllowed !== true) {
    throw new Error("Notice admin read smoke did not create governed delivery.");
  }

  const providerExecution = await post("/api/notices/provider-execution", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    deliveryId,
    providerId,
    providerType: "SECURE_PORTAL",
    providerAdapterStatus: "APPROVED",
    providerExecutionRef: `provider-execution://${runId}/admin-read`,
    credentialRef: `credential://${runId}/notice-provider`,
    credentialStatus: "APPROVED",
    retryPolicyRef: `retry-policy://${runId}/notice-provider`,
    returnedMailPolicyRef: `returned-mail://${runId}/policy`,
    failedDeliveryPolicyRef: `failed-delivery://${runId}/policy`,
    disputeIntakeRef: `dispute-intake://${runId}/policy`,
    outagePolicyRef: `outage://${runId}/notice-provider`,
    outageStatus: "TESTED",
    replayPolicyRef: `replay://${runId}/provider-execution`,
    replayStatus: "VERIFIED",
    operationalRunbookRef: `runbook://${runId}/notice-provider`,
    operationalRunbookStatus: "APPROVED",
    schemaContractVersion: "notice-provider-schema-contract-v0.1.0",
    schemaContractStatus: "VERIFIED",
    consentRef: `consent://${runId}/borrower-processing`,
    consentStatus: "VERIFIED",
    isolationRef: `isolation://${runId}/provider-boundary`,
    isolationStatus: "VERIFIED",
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-provider-execution",
    },
  });
  const providerExecutionId = providerExecution.execution?.id;

  if (
    !providerExecutionId ||
    providerExecution.result?.providerExecutionAllowed !== true ||
    providerExecution.result?.externalProviderActionPerformed !== false
  ) {
    throw new Error(
      "Notice admin read smoke did not create provider execution authorization."
    );
  }

  const receipt = await post("/api/notices/receipts", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    deliveryId,
    receiptType: "DELIVERY_FAILURE",
    deliveryOutcome: "FAILED",
    providerStatus: "failed",
    failureReasonCode: "SECURE_PORTAL_DELIVERY_FAILED",
    providerEventId: `provider-event://${runId}/failed`,
    receiptEvidenceRef: `receipt-evidence://${runId}/failed`,
    deliveryTrackingRef: `tracking://${runId}/admin-read`,
    retryPolicyRef: `retry-policy://${runId}/notice-delivery`,
    retryRequired: true,
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-failed-receipt",
    },
  });
  const receiptId = receipt.receipt?.id;
  const queueItemId = receipt.operatorQueueItem?.id;

  if (
    !receiptId ||
    !queueItemId ||
    receipt.result?.receiptAccepted !== true ||
    receipt.result.operatorQueueItemCreated !== true
  ) {
    throw new Error("Notice admin read smoke did not create receipt and queue records.");
  }

  const resolution = await post("/api/notices/exceptions/resolve", {
    role: "operator",
    userId: operatorId,
    borrowerId,
    tenantId,
    applicationId,
    queueItemId,
    receiptId,
    exceptionType: "DELIVERY_FAILED",
    resolutionAction: "AUTHORIZE_RETRY",
    resolutionEvidenceRef: `resolution-evidence://${runId}/approved`,
    operatorAttestationRef: `operator-attestation://${runId}/retry-authorized`,
    retryPlanRef: `retry-plan://${runId}/notice-delivery`,
    retentionPolicyRef: `retention://${runId}/policy`,
    humanReviewCompleted: true,
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-resolution",
    },
  });
  const resolutionId = resolution.resolution?.id;

  if (!resolutionId || resolution.result?.resolutionAllowed !== true) {
    throw new Error("Notice admin read smoke did not create resolution record.");
  }

  return {
    applicationId,
    tenantId,
    borrowerId,
    operatorId,
    deliveryId,
    providerExecutionId,
    receiptId,
    resolutionId,
  };
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for borrower notice admin read smoke testing."
    );
  }

  const runId = `borrower-notice-admin-read-smoke-${Date.now()}`;
  const lifecycle = await createNoticeLifecycle(runId);
  const query = new URLSearchParams({
    role: "operator",
    userId: lifecycle.operatorId,
    tenantId: lifecycle.tenantId,
    borrowerId: lifecycle.borrowerId,
    applicationId: lifecycle.applicationId,
    includeProviderExecutions: "true",
    includeReceipts: "true",
    includeResolutions: "true",
    limit: "10",
  });
  const noticeRead = await get(`/api/notices/admin?${query.toString()}`);
  const traceId = noticeRead.governance?.traceId;

  if (!traceId) {
    throw new Error("Notice admin read did not return governance trace.");
  }

  if (!noticeRead.count || noticeRead.count < 1) {
    throw new Error("Notice admin read did not return notice records.");
  }

  const record = noticeRead.noticeRecords?.find(
    (item) => item.delivery?.id === lifecycle.deliveryId
  );

  if (!record) {
    throw new Error("Notice admin read did not include the target delivery.");
  }

  const receiptFound = record.receipts?.some(
    (receipt) => receipt.id === lifecycle.receiptId
  );
  const providerExecutionFound = record.providerExecutions?.some(
    (execution) =>
      execution.id === lifecycle.providerExecutionId &&
      execution.providerExecutionAllowed === true &&
      execution.externalProviderActionPerformed === false
  );
  const resolutionFound = record.resolutions?.some(
    (resolution) => resolution.id === lifecycle.resolutionId
  );

  if (!providerExecutionFound || !receiptFound || !resolutionFound) {
    throw new Error(
      "Notice admin read did not include provider execution, receipt, and resolution records."
    );
  }

  const deniedQuery = new URLSearchParams({
    role: "operator",
    userId: lifecycle.operatorId,
    tenantId: lifecycle.tenantId,
    borrowerId: `${runId}-wrong-borrower`,
    applicationId: lifecycle.applicationId,
    limit: "10",
  });
  const denied = await getDenied(`/api/notices/admin?${deniedQuery.toString()}`);

  if (!denied.governance?.traceId) {
    throw new Error("Denied notice admin read did not return governance evidence.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Notice admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          count: noticeRead.count,
          deliveryId: lifecycle.deliveryId,
          providerExecutionId: lifecycle.providerExecutionId,
          receiptId: lifecycle.receiptId,
          resolutionId: lifecycle.resolutionId,
          traceId,
          deniedTraceId: denied.governance.traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Borrower notice admin read smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown borrower notice admin read smoke test error."
  );
  process.exit(1);
});
