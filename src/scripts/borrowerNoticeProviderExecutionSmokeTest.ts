import "dotenv/config";

import { Pool } from "pg";

/**
 * Borrower Notice Provider Execution Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority before provider execution.
 * - Vol II: verifies adverse-action, appeal, borrower-disclosure, retry,
 *   returned-mail, failed-delivery, dispute, redaction, and retention
 *   protections remain intact.
 * - Vol III: checks replay-safe provider execution authorization without
 *   uncontrolled external provider transmission.
 * - Vol IV: supports provider runbook, outage, retry, returned-mail,
 *   failed-delivery, dispute, recovery, escalation, and audit verification.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   schema contracts, consent, isolation, controlled disclosure, and evidence.
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
    executionStatus?: string;
    providerExecutionAllowed?: boolean;
    externalProviderActionPerformed?: boolean;
  };
  result?: {
    transitionAllowed?: boolean;
    finalNoticeAllowed?: boolean;
    deliveryAllowed?: boolean;
    externalDeliveryPerformed?: boolean;
    providerExecutionAllowed?: boolean;
    executionStatus?: string;
    externalProviderActionPerformed?: boolean;
    deliveryStatusAfterExecution?: string;
    gates?: Record<string, unknown>;
  };
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
      `Notice provider execution smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Notice provider execution smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Notice provider execution smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for borrower notice provider execution smoke testing."
    );
  }

  const runId = `borrower-notice-provider-execution-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const underwriterId = `${runId}-underwriter`;
  const providerId = `provider://${runId}/secure-portal`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Notice Provider Execution Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 435000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Notice provider execution onboarding did not create an application.");
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
      "Smoke test candidate requires transition before provider execution.",
    metadata: {
      smokeRunId: runId,
    },
  });
  const humanReviewWorkflowId = review.humanReview?.id;
  const adverseActionReviewId = review.adverseActionReview?.id;

  if (!humanReviewWorkflowId || !adverseActionReviewId) {
    throw new Error("Notice provider execution did not create review records.");
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
      "Underwriter completed transition gates for provider execution smoke test.",
    metadata: {
      smokeRunId: runId,
    },
  });

  if (transition.result?.transitionAllowed !== true) {
    throw new Error("Notice provider execution transition did not pass gates.");
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
      "Finalization approved for controlled provider execution smoke test.",
    noticeSummary:
      "Approved for controlled delivery handling only. External provider execution is separately gated.",
    metadata: {
      smokeRunId: runId,
      reviewTransitionId: transition.transition?.id,
    },
  });
  const decisionNoticeId = finalization.decisionNotice?.id;

  if (!decisionNoticeId || finalization.result?.finalNoticeAllowed !== true) {
    throw new Error("Notice provider execution finalization did not approve final notice.");
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
    deliveryProviderRef: providerId,
    deliveryProviderConfigured: true,
    metadata: {
      smokeRunId: runId,
      scenario: "provider-execution-ready-delivery",
    },
  });
  const deliveryId = delivery.delivery?.id;

  if (!deliveryId || delivery.result?.deliveryAllowed !== true) {
    throw new Error("Notice provider execution delivery was not ready.");
  }

  if (delivery.result?.externalDeliveryPerformed !== false) {
    throw new Error("Notice delivery unexpectedly performed provider execution.");
  }

  const blockedExecution = await post("/api/notices/provider-execution", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    deliveryId,
    providerId,
    providerType: "SECURE_PORTAL",
    providerAdapterStatus: "PENDING_REVIEW",
    credentialStatus: "MISSING",
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-provider-execution",
    },
  });

  if (blockedExecution.result?.providerExecutionAllowed !== false) {
    throw new Error("Incomplete provider controls unexpectedly allowed execution.");
  }

  if (blockedExecution.result?.externalProviderActionPerformed !== false) {
    throw new Error("Blocked provider execution unexpectedly performed external action.");
  }

  const execution = await post("/api/notices/provider-execution", {
    role: "underwriter",
    userId: underwriterId,
    borrowerId,
    tenantId,
    applicationId,
    deliveryId,
    providerId,
    providerType: "SECURE_PORTAL",
    providerAdapterStatus: "APPROVED",
    providerExecutionRef: `provider-execution://${runId}/authorized`,
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
      scenario: "authorized-provider-execution-not-sent",
    },
  });
  const executionId = execution.execution?.id;
  const executionTraceId = execution.governance?.traceId;

  if (!executionId || !executionTraceId) {
    throw new Error("Provider execution did not return durable evidence.");
  }

  if (execution.result?.providerExecutionAllowed !== true) {
    throw new Error("Complete provider controls did not authorize execution.");
  }

  if (
    execution.result?.executionStatus !==
    "PROVIDER_EXECUTION_AUTHORIZED_NOT_SENT"
  ) {
    throw new Error("Provider execution did not record authorized-not-sent status.");
  }

  if (execution.result?.externalProviderActionPerformed !== false) {
    throw new Error("Provider execution performed an external provider action.");
  }

  const deniedExecution = await post(
    "/api/notices/provider-execution",
    {
      role: "underwriter",
      userId: underwriterId,
      borrowerId: `${runId}-wrong-borrower`,
      tenantId,
      applicationId,
      deliveryId,
      providerId,
      providerType: "SECURE_PORTAL",
    },
    403
  );

  if (!deniedExecution.governance?.traceId) {
    throw new Error("Denied provider execution did not return a governance trace.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const executionRows = await pool.query(
      `
        select id, delivery_id, application_id, provider_id,
               execution_status, provider_execution_allowed,
               external_provider_action_performed, delivery_provider_configured,
               provider_adapter_approved, credential_approved,
               outage_policy_tested, retry_policy_attached,
               returned_mail_policy_attached, failed_delivery_policy_attached,
               dispute_intake_attached, replay_policy_verified,
               schema_contract_verified, consent_verified,
               isolation_verified, operational_runbook_approved,
               classification, replay_ref
        from borrower_notice_provider_executions
        where id = $1
      `,
      [executionId]
    );
    const executionRow = executionRows.rows[0];

    if (!executionRow) {
      throw new Error("Borrower notice provider execution row was not persisted.");
    }

    if (executionRow.provider_execution_allowed !== true) {
      throw new Error("Provider execution row was not marked allowed.");
    }

    if (executionRow.external_provider_action_performed !== false) {
      throw new Error("Provider execution row performed an external action.");
    }

    const deliveryRows = await pool.query(
      `
        select id, delivery_status, delivery_provider_configured,
               external_delivery_performed
        from borrower_notice_deliveries
        where id = $1
      `,
      [deliveryId]
    );
    const deliveryRow = deliveryRows.rows[0];

    if (
      !deliveryRow ||
      deliveryRow.delivery_status !== "PROVIDER_EXECUTION_AUTHORIZED_NOT_SENT" ||
      deliveryRow.delivery_provider_configured !== true ||
      deliveryRow.external_delivery_performed !== false
    ) {
      throw new Error("Provider execution did not update delivery authorization state safely.");
    }

    const evidence = await evidenceCounts(pool, executionTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Borrower notice provider execution evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          deliveryId,
          executionId,
          execution: executionRow,
          delivery: deliveryRow,
          executionTraceId,
          evidence,
          gates: execution.result?.gates,
        },
        null,
        2
      )
    );
    console.log("Borrower notice provider execution smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown borrower notice provider execution smoke test error."
  );
  process.exit(1);
});
