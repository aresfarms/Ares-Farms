import "dotenv/config";

import { Pool } from "pg";

/**
 * Payment Connector Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for payment connector lifecycle reads.
 * - Vol II: verifies tenant, billing, credential, refund, dispute,
 *   reconciliation, and entitlement-adjacent metadata stay controlled.
 * - Vol III: checks replay-safe payment connector admin reads before
 *   dashboards or operator workflows consume these records.
 * - Vol IV: supports connector review, payment recovery, dispute/refund
 *   oversight, reconciliation, audit preparation, and escalation.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   connector governance, controlled disclosure, and evidence review.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  count?: number;
  billingEvent?: {
    billingEventId?: string;
    sessionId?: string | null;
  };
  adapter?: {
    id?: string;
    adapterId?: string;
  };
  execution?: {
    id?: string;
    executionStatus?: string;
  };
  paymentConnectors?: Array<{
    adapter?: {
      id?: string;
      adapterId?: string;
      certificationStatus?: string;
      livePaymentsAllowed?: boolean;
      livePaymentCaptured?: boolean;
    };
    executions?: Array<{
      id?: string;
      adapterId?: string;
      tenantId?: string | null;
      billingEventId?: string | null;
      sessionId?: string | null;
      executionStatus?: string;
      executionAllowed?: boolean;
      paymentProcessorActionPerformed?: boolean;
      livePaymentCaptured?: boolean;
      regulatedDecisionImpactAllowed?: boolean;
      webhookSignatureVerified?: boolean;
      operationalRunbookApproved?: boolean;
    }>;
    billingEvents?: Array<{
      id?: string;
      billingEventId?: string;
      eventType?: string;
      eventStatus?: string;
      tenantId?: string | null;
      sessionId?: string | null;
      paymentConnectorLiveMode?: boolean;
      regulatedDecisionImpactAllowed?: boolean;
    }>;
  }>;
  result?: {
    certificationStatus?: string;
    livePaymentsAllowed?: boolean;
    executionStatus?: string;
    executionAllowed?: boolean;
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
      `Payment connector admin read smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Payment connector admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Payment connector admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Payment connector admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Payment connector admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Payment connector admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for payment connector admin read smoke testing."
    );
  }

  const runId = `payment-connector-admin-read-smoke-${Date.now()}`;
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
    throw new Error("Payment connector admin read checkout did not create a billing event.");
  }

  const adapter = await post("/api/billing/connectors", {
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
      scenario: "admin-read-certified-payment-adapter",
    },
  });

  if (
    adapter.result?.certificationStatus !== "CERTIFIED" ||
    adapter.result.livePaymentsAllowed !== true
  ) {
    throw new Error("Payment connector admin read setup did not certify adapter.");
  }

  const execution = await post("/api/billing/execution", {
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
      scenario: "admin-read-authorized-payment-execution",
    },
  });
  const executionId = execution.execution?.id;
  const executionBillingEventId = execution.billingEvent?.billingEventId;

  if (
    !executionId ||
    !executionBillingEventId ||
    execution.result?.executionStatus !==
      "PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED" ||
    execution.result.executionAllowed !== true
  ) {
    throw new Error("Payment connector admin read setup did not authorize execution.");
  }

  const scopedRead = await get("/api/billing/connectors/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    adapterId,
    includeExecutions: true,
    includeBillingEvents: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const record = scopedRead.paymentConnectors?.[0];

  if (!scopedTraceId || scopedRead.count !== 1 || !record) {
    throw new Error("Payment connector admin scoped read did not return one record.");
  }

  if (
    record.adapter?.adapterId !== adapterId ||
    record.adapter.certificationStatus !== "CERTIFIED" ||
    record.adapter.livePaymentsAllowed !== true ||
    record.adapter.livePaymentCaptured !== false
  ) {
    throw new Error("Payment connector admin read returned incomplete adapter controls.");
  }

  const executionRecord = record.executions?.find(
    (item) => item.id === executionId
  );

  if (
    !executionRecord ||
    executionRecord.tenantId !== tenantId ||
    executionRecord.billingEventId !== checkoutBillingEventId ||
    executionRecord.sessionId !== checkoutSessionId ||
    executionRecord.executionAllowed !== true ||
    executionRecord.paymentProcessorActionPerformed !== false ||
    executionRecord.livePaymentCaptured !== false ||
    executionRecord.regulatedDecisionImpactAllowed !== false ||
    executionRecord.webhookSignatureVerified !== true ||
    executionRecord.operationalRunbookApproved !== true
  ) {
    throw new Error("Payment connector admin read returned incomplete execution controls.");
  }

  if (
    !record.billingEvents?.some(
      (item) => item.billingEventId === executionBillingEventId
    )
  ) {
    throw new Error("Payment connector admin read did not include payment execution billing evidence.");
  }

  const executionRead = await get("/api/billing/connectors/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    executionId,
    includeExecutions: true,
    includeBillingEvents: true,
  });

  if (executionRead.count !== 1) {
    throw new Error("Payment connector admin read by executionId did not return one record.");
  }

  const deniedRead = await get(
    "/api/billing/connectors/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId: `${runId}-wrong-tenant`,
      executionId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Payment connector admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/billing/connectors/admin",
    {
      role: "operator",
      userId: operatorId,
      executionId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Payment connector admin missing-scope denial did not return a governance trace.");
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
        select id, tenant_id, execution_status, execution_allowed,
               payment_processor_action_performed, live_payment_captured,
               regulated_decision_impact_allowed
        from payment_connector_executions
        where id = $1
      `,
      [executionId]
    );
    const executionRow = executionRows.rows[0];

    if (
      !executionRow ||
      executionRow.tenant_id !== tenantId ||
      executionRow.execution_allowed !== true ||
      executionRow.payment_processor_action_performed !== false ||
      executionRow.live_payment_captured !== false ||
      executionRow.regulated_decision_impact_allowed !== false
    ) {
      throw new Error("Payment connector execution row was not persisted for admin read.");
    }

    const evidence = await evidenceCounts(pool, scopedTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Payment connector admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          tenantId,
          adapterId,
          executionId,
          checkoutBillingEventId,
          executionBillingEventId,
          scopedTraceId,
          deniedTraceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Payment connector admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown payment connector admin read smoke test error."
  );
  process.exit(1);
});
