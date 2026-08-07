import "dotenv/config";

import { Pool } from "pg";

/**
 * Billing Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms billing reads remain accountable and separate from
 *   credit, financing, permitting, legal, or regulatory decisions.
 * - Vol II: verifies tenant, payment, entitlement, and regulated-service
 *   access metadata stay controlled.
 * - Vol III: checks durable replay-safe billing events before dashboards
 *   or entitlement workflows consume billing state.
 * - Vol IV: supports webhook recovery, billing review, entitlement
 *   reconciliation, incident triage, and audit preparation.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   connector governance, source authority, and human review.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  count?: number;
  billingEvent?: {
    id?: string;
    billingEventId?: string;
    eventType?: string;
    eventStatus?: string;
    tenantId?: string | null;
    sessionId?: string | null;
    entitlementId?: string | null;
    checkoutSessionCreated?: boolean;
    webhookReceived?: boolean;
    entitlementGranted?: boolean;
    paymentConnectorLiveMode?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  billingEvents?: Array<{
    billingEvent?: {
      id?: string;
      billingEventId?: string;
      eventType?: string;
      eventStatus?: string;
      tenantId?: string | null;
      sessionId?: string | null;
      entitlementId?: string | null;
      checkoutSessionCreated?: boolean;
      webhookReceived?: boolean;
      entitlementGranted?: boolean;
      paymentConnectorLiveMode?: boolean;
      regulatedDecisionImpactAllowed?: boolean;
      humanReviewRequired?: boolean;
    };
    entitlement?: {
      id?: string;
      tenantId?: string;
      plan?: string;
      active?: boolean;
      permissions?: unknown;
    } | null;
  }>;
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
      `Billing admin read smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Billing admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Billing admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function postWebhook(
  body: Record<string, unknown>,
  expectedStatus = 200
): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "billing-admin-smoke-signature",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as RouteJson;

  if (response.status !== expectedStatus) {
    throw new Error(
      `Billing admin read smoke webhook returned unexpected status: ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Billing admin read smoke webhook failed: ${response.status} ${JSON.stringify(
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
      `Billing admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Billing admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Billing admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for billing admin read smoke testing."
    );
  }

  const runId = `billing-admin-read-smoke-${Date.now()}`;
  const tenantId = `${runId}-tenant`;
  const operatorId = `${runId}-operator`;
  const reportId = `${runId}-report`;

  const checkout = await post("/api/checkout", {
    productName: "Ares Farms governed access",
    price: 2500,
    tenantId,
    reportId,
    userId: operatorId,
    metadata: {
      smokeRunId: runId,
      scenario: "billing-admin-read-checkout",
    },
  });
  const checkoutBillingEvent = checkout.billingEvent;
  const checkoutSessionId = checkoutBillingEvent?.sessionId;

  if (
    !checkoutBillingEvent?.id ||
    !checkoutBillingEvent.billingEventId ||
    checkoutBillingEvent.eventType !== "CHECKOUT_SESSION_CREATED" ||
    checkoutBillingEvent.eventStatus !== "SESSION_CREATED" ||
    checkoutBillingEvent.tenantId !== tenantId ||
    !checkoutSessionId ||
    checkoutBillingEvent.checkoutSessionCreated !== true ||
    checkoutBillingEvent.webhookReceived !== false ||
    checkoutBillingEvent.entitlementGranted !== false ||
    checkoutBillingEvent.paymentConnectorLiveMode !== false ||
    checkoutBillingEvent.regulatedDecisionImpactAllowed !== false ||
    checkoutBillingEvent.humanReviewRequired !== true
  ) {
    throw new Error("Checkout did not persist a governed billing event.");
  }

  const webhook = await postWebhook({
    type: "checkout.session.completed",
    data: {
      object: {
        id: checkoutSessionId,
        metadata: {
          tenantId,
          plan: "paid",
          sessionId: checkoutSessionId,
          smokeRunId: runId,
        },
      },
    },
  });
  const webhookBillingEvent = webhook.billingEvent;

  if (
    !webhookBillingEvent?.id ||
    !webhookBillingEvent.billingEventId ||
    webhookBillingEvent.eventType !== "STRIPE_WEBHOOK_ENTITLEMENT_GRANTED" ||
    webhookBillingEvent.eventStatus !== "ENTITLEMENT_GRANTED" ||
    webhookBillingEvent.tenantId !== tenantId ||
    webhookBillingEvent.sessionId !== checkoutSessionId ||
    !webhookBillingEvent.entitlementId ||
    webhookBillingEvent.webhookReceived !== true ||
    webhookBillingEvent.entitlementGranted !== true ||
    webhookBillingEvent.paymentConnectorLiveMode !== false ||
    webhookBillingEvent.regulatedDecisionImpactAllowed !== false ||
    webhookBillingEvent.humanReviewRequired !== true
  ) {
    throw new Error("Webhook did not persist a governed entitlement billing event.");
  }

  const scopedRead = await get("/api/billing/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    includeEntitlement: true,
    limit: 10,
  });
  const scopedTraceId = scopedRead.governance?.traceId;

  if (!scopedTraceId || !scopedRead.billingEvents || scopedRead.count! < 2) {
    throw new Error("Billing admin scoped read did not return billing events.");
  }

  const checkoutRecord = scopedRead.billingEvents.find(
    (record) =>
      record.billingEvent?.billingEventId ===
      checkoutBillingEvent.billingEventId
  );
  const webhookRecord = scopedRead.billingEvents.find(
    (record) =>
      record.billingEvent?.billingEventId ===
      webhookBillingEvent.billingEventId
  );

  if (!checkoutRecord || !webhookRecord) {
    throw new Error("Billing admin read did not include checkout and webhook events.");
  }

  if (
    webhookRecord.entitlement?.tenantId !== tenantId ||
    webhookRecord.entitlement.plan !== "pro" ||
    webhookRecord.entitlement.active !== true ||
    !Array.isArray(webhookRecord.entitlement.permissions) ||
    !webhookRecord.entitlement.permissions.includes("paid")
  ) {
    throw new Error("Billing admin read did not include the governed entitlement state.");
  }

  const byEventId = await get("/api/billing/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    billingEventId: webhookBillingEvent.billingEventId,
    includeEntitlement: true,
  });

  if (byEventId.count !== 1) {
    throw new Error("Billing admin read by billingEventId did not return one event.");
  }

  const deniedRead = await get(
    "/api/billing/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId: `${runId}-wrong-tenant`,
      billingEventId: webhookBillingEvent.billingEventId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Billing admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/billing/admin",
    {
      role: "operator",
      userId: operatorId,
      billingEventId: webhookBillingEvent.billingEventId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Billing admin missing-scope denial did not return a governance trace.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const billingRows = await pool.query(
      `
        select id, billing_event_id, event_type, event_status, tenant_id,
               session_id, entitlement_id, checkout_session_created,
               webhook_received, entitlement_granted,
               payment_connector_live_mode,
               regulated_decision_impact_allowed,
               human_review_required, classification, replay_ref
        from billing_events
        where tenant_id = $1
        order by created_at desc
      `,
      [tenantId]
    );

    if ((billingRows.rowCount ?? 0) < 2) {
      throw new Error("Billing event rows were not persisted.");
    }

    const persistedWebhook = billingRows.rows.find(
      (row) => row.billing_event_id === webhookBillingEvent.billingEventId
    );

    if (
      !persistedWebhook ||
      persistedWebhook.webhook_received !== true ||
      persistedWebhook.entitlement_granted !== true ||
      persistedWebhook.payment_connector_live_mode !== false ||
      persistedWebhook.regulated_decision_impact_allowed !== false ||
      persistedWebhook.human_review_required !== true
    ) {
      throw new Error("Persisted billing event row did not preserve governance gates.");
    }

    const evidence = await evidenceCounts(pool, scopedTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Billing admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          tenantId,
          checkoutBillingEventId: checkoutBillingEvent.billingEventId,
          webhookBillingEventId: webhookBillingEvent.billingEventId,
          checkoutSessionId,
          entitlementId: webhookBillingEvent.entitlementId,
          scopedTraceId,
          deniedTraceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Billing admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown billing admin read smoke test error."
  );
  process.exit(1);
});
