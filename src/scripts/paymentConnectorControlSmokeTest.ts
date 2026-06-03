import "dotenv/config";

import { Pool } from "pg";

/**
 * Payment Connector Control Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms payment connector promotion remains accountable and
 *   separate from regulated decisions.
 * - Vol II: verifies tenant, billing, credential, refund, dispute, and
 *   entitlement metadata stay controlled.
 * - Vol III: checks replay-safe certification and execution authorization
 *   without live payment processor capture.
 * - Vol IV: supports outage handling, refund/dispute response,
 *   reconciliation, recovery, escalation, and audit preparation.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   connector governance, consent, schema, and isolation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  adapter?: {
    id?: string;
    adapterId?: string;
    certificationStatus?: string;
    livePaymentsAllowed?: boolean;
    livePaymentCaptured?: boolean;
  };
  execution?: {
    id?: string;
    adapterId?: string;
    billingEventId?: string | null;
    sessionId?: string | null;
    tenantId?: string | null;
    executionStatus?: string;
    executionAllowed?: boolean;
    paymentProcessorActionPerformed?: boolean;
    livePaymentCaptured?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
  };
  billingEvent?: {
    id?: string;
    billingEventId?: string;
    eventType?: string;
    eventStatus?: string;
    sessionId?: string | null;
    tenantId?: string | null;
    paymentConnectorLiveMode?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
  };
  result?: {
    certificationStatus?: string;
    livePaymentsAllowed?: boolean;
    livePaymentCaptured?: boolean;
    executionStatus?: string;
    executionAllowed?: boolean;
    paymentProcessorActionPerformed?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
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
      `Payment connector control smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Payment connector control smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Payment connector control smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for payment connector control smoke testing."
    );
  }

  const runId = `payment-connector-control-smoke-${Date.now()}`;
  const tenantId = `${runId}-tenant`;
  const operatorId = `${runId}-operator`;
  const adapterId = `${runId}-stripe-adapter`;

  const checkout = await post("/api/checkout", {
    productName: "Ares Farms governed access",
    price: 2500,
    tenantId,
    userId: operatorId,
    metadata: {
      smokeRunId: runId,
    },
  });
  const checkoutBillingEventId = checkout.billingEvent?.billingEventId;
  const checkoutSessionId = checkout.billingEvent?.sessionId;

  if (!checkoutBillingEventId || !checkoutSessionId) {
    throw new Error("Payment connector smoke checkout did not create a billing event.");
  }

  const blockedAdapter = await post("/api/billing/connectors", {
    role: "operator",
    userId: operatorId,
    tenantId,
    adapterId: `${adapterId}-blocked`,
    adapterName: "Blocked Stripe Payment Adapter",
    processorName: "Stripe",
    processorType: "STRIPE",
    processorEnvironment: "TEST",
    certificationStatus: "CERTIFIED",
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-missing-payment-controls",
    },
  });

  if (
    blockedAdapter.result?.certificationStatus !== "CERTIFICATION_BLOCKED" ||
    blockedAdapter.result.livePaymentsAllowed !== false ||
    blockedAdapter.result.livePaymentCaptured !== false
  ) {
    throw new Error("Incomplete payment adapter controls unexpectedly certified.");
  }

  const certifiedAdapter = await post("/api/billing/connectors", {
    role: "operator",
    userId: operatorId,
    tenantId,
    adapterId,
    adapterName: "Certified Stripe Payment Adapter",
    processorName: "Stripe",
    processorType: "STRIPE",
    processorEnvironment: "TEST",
    paymentAuthorityRef: `payment-authority://${runId}/stripe`,
    certificationStatus: "CERTIFIED",
    credentialRef: `credential://${runId}/stripe`,
    credentialStatus: "APPROVED",
    webhookSecretRef: `webhook-secret://${runId}/stripe`,
    webhookSignatureStatus: "VERIFIED",
    outagePolicyRef: `outage://${runId}/stripe`,
    outageStatus: "TESTED",
    replayPolicyRef: `replay://${runId}/stripe`,
    replayStatus: "VERIFIED",
    schemaContractVersion: "stripe-payment-schema-contract-v0.1.0",
    refundPolicyRef: `refund://${runId}/stripe`,
    refundPolicyStatus: "APPROVED",
    disputePolicyRef: `dispute://${runId}/stripe`,
    disputePolicyStatus: "APPROVED",
    reconciliationPolicyRef: `reconciliation://${runId}/stripe`,
    reconciliationPolicyStatus: "APPROVED",
    metadata: {
      smokeRunId: runId,
      scenario: "certified-payment-adapter",
    },
  });
  const certificationTraceId = certifiedAdapter.governance?.traceId;

  if (!certificationTraceId || !certifiedAdapter.adapter?.id) {
    throw new Error("Payment connector certification did not return durable evidence.");
  }

  if (
    certifiedAdapter.result?.certificationStatus !== "CERTIFIED" ||
    certifiedAdapter.result.livePaymentsAllowed !== true ||
    certifiedAdapter.result.livePaymentCaptured !== false
  ) {
    throw new Error("Complete payment adapter controls did not certify.");
  }

  const blockedExecution = await post("/api/billing/execution", {
    role: "operator",
    userId: operatorId,
    tenantId,
    adapterId,
    billingEventId: checkoutBillingEventId,
    sessionId: checkoutSessionId,
    plan: "pro",
    amountTotal: 2500,
    currency: "usd",
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-missing-payment-execution-controls",
    },
  });

  if (
    blockedExecution.result?.executionAllowed !== false ||
    blockedExecution.result.paymentProcessorActionPerformed !== false ||
    blockedExecution.result.livePaymentCaptured !== false ||
    blockedExecution.result.regulatedDecisionImpactAllowed !== false
  ) {
    throw new Error("Incomplete payment execution controls unexpectedly allowed capture.");
  }

  const authorizedExecution = await post("/api/billing/execution", {
    role: "operator",
    userId: operatorId,
    tenantId,
    adapterId,
    billingEventId: checkoutBillingEventId,
    sessionId: checkoutSessionId,
    plan: "pro",
    amountTotal: 2500,
    currency: "usd",
    executionRef: `payment-execution://${runId}/authorized`,
    paymentProcessorRef: `payment-processor://${runId}/stripe`,
    operationalRunbookRef: `runbook://${runId}/stripe-payment-execution`,
    operationalRunbookStatus: "APPROVED",
    schemaContractStatus: "VERIFIED",
    consentRef: `consent://${runId}/borrower-payment`,
    consentStatus: "VERIFIED",
    isolationRef: `isolation://${runId}/payment-boundary`,
    isolationStatus: "VERIFIED",
    metadata: {
      smokeRunId: runId,
      scenario: "authorized-payment-execution-not-captured",
    },
  });
  const executionId = authorizedExecution.execution?.id;
  const executionTraceId = authorizedExecution.governance?.traceId;
  const executionBillingEventId =
    authorizedExecution.billingEvent?.billingEventId;

  if (!executionId || !executionTraceId || !executionBillingEventId) {
    throw new Error("Payment execution did not return durable evidence.");
  }

  if (
    authorizedExecution.result?.executionAllowed !== true ||
    authorizedExecution.result.executionStatus !==
      "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED" ||
    authorizedExecution.result.paymentProcessorActionPerformed !== false ||
    authorizedExecution.result.livePaymentCaptured !== false ||
    authorizedExecution.result.regulatedDecisionImpactAllowed !== false
  ) {
    throw new Error("Complete payment execution controls did not authorize without capture.");
  }

  const deniedExecution = await post(
    "/api/billing/execution",
    {
      role: "operator",
      userId: operatorId,
      adapterId,
      billingEventId: checkoutBillingEventId,
      sessionId: checkoutSessionId,
    },
    403
  );

  if (!deniedExecution.governance?.traceId) {
    throw new Error("Denied payment execution did not return a governance trace.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const adapterRows = await pool.query(
      `
        select id, adapter_id, certification_status, live_payments_allowed,
               credential_status, webhook_signature_status,
               live_payment_captured, classification, replay_ref
        from payment_connector_adapters
        where adapter_id = $1
        order by created_at desc
        limit 1
      `,
      [adapterId]
    );
    const adapterRow = adapterRows.rows[0];

    if (
      !adapterRow ||
      adapterRow.certification_status !== "CERTIFIED" ||
      adapterRow.live_payments_allowed !== true ||
      adapterRow.live_payment_captured !== false
    ) {
      throw new Error("Certified payment connector adapter row was not persisted correctly.");
    }

    const executionRows = await pool.query(
      `
        select id, adapter_id, billing_event_id, session_id, tenant_id,
               execution_status, execution_allowed,
               payment_processor_action_performed, live_payment_captured,
               regulated_decision_impact_allowed,
               adapter_certified, live_payments_allowed,
               webhook_signature_verified, schema_contract_verified,
               consent_verified, isolation_verified,
               operational_runbook_approved, refund_policy_approved,
               dispute_policy_approved, reconciliation_policy_approved,
               classification, replay_ref
        from payment_connector_executions
        where id = $1
      `,
      [executionId]
    );
    const executionRow = executionRows.rows[0];

    if (
      !executionRow ||
      executionRow.execution_status !==
        "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED" ||
      executionRow.execution_allowed !== true ||
      executionRow.payment_processor_action_performed !== false ||
      executionRow.live_payment_captured !== false ||
      executionRow.regulated_decision_impact_allowed !== false ||
      executionRow.webhook_signature_verified !== true ||
      executionRow.operational_runbook_approved !== true
    ) {
      throw new Error("Payment connector execution row was not persisted correctly.");
    }

    const billingRows = await pool.query(
      `
        select id, billing_event_id, event_type, event_status, tenant_id,
               session_id, payment_connector_live_mode,
               regulated_decision_impact_allowed
        from billing_events
        where billing_event_id = $1
      `,
      [executionBillingEventId]
    );
    const billingRow = billingRows.rows[0];

    if (
      !billingRow ||
      billingRow.event_type !== "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED" ||
      billingRow.payment_connector_live_mode !== false ||
      billingRow.regulated_decision_impact_allowed !== false
    ) {
      throw new Error("Payment execution billing event was not persisted correctly.");
    }

    const certificationEvidence = await evidenceCounts(
      pool,
      certificationTraceId
    );
    const executionEvidence = await evidenceCounts(pool, executionTraceId);

    if (
      certificationEvidence.version_registry < 1 ||
      certificationEvidence.data_classification_registry < 1 ||
      certificationEvidence.observability_events < 1 ||
      certificationEvidence.replay_verification < 1 ||
      executionEvidence.version_registry < 1 ||
      executionEvidence.data_classification_registry < 1 ||
      executionEvidence.observability_events < 1 ||
      executionEvidence.replay_verification < 1
    ) {
      throw new Error("Payment connector control governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          tenantId,
          adapterId,
          checkoutBillingEventId,
          checkoutSessionId,
          executionId,
          executionBillingEventId,
          certificationTraceId,
          executionTraceId,
          certificationEvidence,
          executionEvidence,
        },
        null,
        2
      )
    );
    console.log("Payment connector control governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown payment connector control smoke test error."
  );
  process.exit(1);
});
