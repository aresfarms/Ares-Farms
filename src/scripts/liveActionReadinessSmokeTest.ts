import "dotenv/config";

import { randomUUID } from "node:crypto";
import { Pool } from "pg";

/**
 * Live Action Readiness Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority before live action promotion.
 * - Vol II: verifies live source calls, notice sends, and payment capture
 *   remain blocked unless regulatory and tenant controls are complete.
 * - Vol III: checks replay-safe readiness evidence without performing live
 *   external actions.
 * - Vol IV: requires runbook, rollback, incident response, monitoring,
 *   dry-run, audit export, and human approval evidence.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   consent, isolation, source authority, and controlled disclosure.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  review?: {
    id?: string;
    actionType?: string;
    readinessStatus?: string;
    targetExecutionId?: string;
    targetTenantId?: string | null;
    readyForLiveAction?: boolean;
    externalActionPerformed?: boolean;
    liveActionPerformed?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
  };
  result?: {
    readinessStatus?: string;
    readyForLiveAction?: boolean;
    gates?: Record<string, unknown>;
    blockerReasons?: string[];
    externalActionPerformed?: boolean;
    liveActionPerformed?: boolean;
    regulatedDecisionImpactAllowed?: boolean;
  };
  governance?: {
    traceId?: string;
  };
};

type SeededExecutionIds = {
  tenantId: string;
  externalExecutionId: string;
  noticeExecutionId: string;
  paymentExecutionId: string;
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
      `Live action readiness smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Live action readiness smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Live action readiness smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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

function readinessRefs(runId: string, actionType: string) {
  return {
    productionCredentialVaultRef: `vault://${runId}/${actionType}/credentials`,
    liveAdapterImplementationRef: `adapter://${runId}/${actionType}/implementation`,
    productionRunbookApprovalRef: `runbook://${runId}/${actionType}/approved`,
    dryRunEvidenceRef: `dry-run://${runId}/${actionType}/evidence`,
    rollbackPlanRef: `rollback://${runId}/${actionType}/plan`,
    incidentResponsePlanRef: `incident://${runId}/${actionType}/response`,
    monitoringPlanRef: `monitoring://${runId}/${actionType}/plan`,
    auditEvidenceExportRef: `audit-export://${runId}/${actionType}/packet`,
    humanApprovalRef: `approval://${runId}/${actionType}/human`,
  };
}

async function seedExecutionRecords(
  pool: Pool,
  runId: string
): Promise<SeededExecutionIds> {
  const tenantId = `${runId}-tenant`;
  const applicationId = `${runId}-application`;
  const borrowerId = `${runId}-borrower`;
  const actorId = `${runId}-governance`;
  const externalExecutionId = randomUUID();
  const connectorRunId = randomUUID();
  const noticeExecutionId = randomUUID();
  const deliveryId = randomUUID();
  const paymentExecutionId = randomUUID();

  await pool.query(
    `
      insert into external_connector_executions (
        id, connector_run_id, adapter_id, source_id, source_name,
        connector_type, query_type, application_id, borrower_id,
        tenant_id, actor_id, execution_status, execution_ref,
        source_authority_ref, credential_ref, outage_policy_ref,
        replay_policy_ref, operational_runbook_ref,
        schema_contract_version, consent_ref, isolation_ref,
        connector_run_found, application_matches, source_matches,
        connector_run_not_previously_live, source_live_calls_allowed,
        adapter_found, adapter_source_matches, adapter_certified,
        adapter_live_calls_allowed, source_authority_present,
        credential_approved, outage_policy_tested, replay_policy_verified,
        schema_contract_verified, consent_verified, isolation_verified,
        operational_runbook_approved, execution_allowed,
        live_call_performed, official_data_fetched, human_review_required,
        execution_authorized_at, governance_version, classification,
        replay_ref, trace_id, source, metadata
      )
      values (
        $1, $2, $3, 'usda-fsa', 'USDA FSA',
        'USDA', 'program_reference', $4, $5,
        $6, $7, 'LIVE_CONNECTOR_EXECUTION_AUTHORIZED_NOT_CALLED', $8,
        $9, $10, $11,
        $12, $13,
        'usda-fsa-schema-contract-v0.1.0', $14, $15,
        true, true, true,
        true, true,
        true, true, true,
        true, true,
        true, true, true,
        true, true, true,
        true, true,
        false, false, false,
        now(), 'master-volumes-runtime-v0.1.0', 'CONFIDENTIAL',
        $16, $17, 'live-action-readiness-smoke', $18::jsonb
      )
    `,
    [
      externalExecutionId,
      connectorRunId,
      `${runId}-usda-adapter`,
      applicationId,
      borrowerId,
      tenantId,
      actorId,
      `execution://${runId}/external`,
      `authority://${runId}/usda`,
      `credential://${runId}/usda`,
      `outage://${runId}/usda`,
      `replay://${runId}/usda`,
      `runbook://${runId}/external`,
      `consent://${runId}/usda`,
      `isolation://${runId}/usda`,
      `replay://${runId}/external`,
      `trace://${runId}/external`,
      JSON.stringify({ smokeRunId: runId }),
    ]
  );

  await pool.query(
    `
      insert into borrower_notice_provider_executions (
        id, delivery_id, application_id, borrower_id, tenant_id,
        actor_id, provider_id, provider_type, delivery_channel,
        execution_status, provider_execution_ref, credential_ref,
        retry_policy_ref, returned_mail_policy_ref,
        failed_delivery_policy_ref, dispute_intake_ref,
        outage_policy_ref, replay_policy_ref, operational_runbook_ref,
        schema_contract_version, consent_ref, isolation_ref,
        delivery_allowed_snapshot, borrower_disclosure_allowed_snapshot,
        delivery_provider_configured, provider_adapter_approved,
        credential_approved, outage_policy_tested, retry_policy_attached,
        returned_mail_policy_attached, failed_delivery_policy_attached,
        dispute_intake_attached, replay_policy_verified,
        schema_contract_verified, consent_verified, isolation_verified,
        operational_runbook_approved, provider_execution_allowed,
        external_provider_action_performed, human_review_required,
        execution_authorized_at, governance_version, classification,
        replay_ref, trace_id, source, metadata
      )
      values (
        $1, $2, $3, $4, $5,
        $6, $7, 'SECURE_PORTAL', 'SECURE_PORTAL',
        'PROVIDER_EXECUTION_AUTHORIZED_NOT_SENT', $8, $9,
        $10, $11,
        $12, $13,
        $14, $15, $16,
        'notice-provider-schema-contract-v0.1.0', $17, $18,
        true, true,
        true, true,
        true, true, true,
        true, true,
        true, true,
        true, true, true,
        true, true,
        false, false,
        now(), 'master-volumes-runtime-v0.1.0', 'CONFIDENTIAL',
        $19, $20, 'live-action-readiness-smoke', $21::jsonb
      )
    `,
    [
      noticeExecutionId,
      deliveryId,
      applicationId,
      borrowerId,
      tenantId,
      actorId,
      `provider://${runId}/secure-portal`,
      `provider-execution://${runId}/notice`,
      `credential://${runId}/notice`,
      `retry://${runId}/notice`,
      `returned-mail://${runId}/notice`,
      `failed-delivery://${runId}/notice`,
      `dispute://${runId}/notice`,
      `outage://${runId}/notice`,
      `replay://${runId}/notice`,
      `runbook://${runId}/notice`,
      `consent://${runId}/notice`,
      `isolation://${runId}/notice`,
      `replay://${runId}/notice`,
      `trace://${runId}/notice`,
      JSON.stringify({ smokeRunId: runId }),
    ]
  );

  await pool.query(
    `
      insert into payment_connector_executions (
        id, adapter_id, billing_event_id, session_id, tenant_id,
        actor_id, user_id, plan, amount_total, currency,
        execution_status, execution_ref, payment_processor_ref,
        payment_authority_ref, credential_ref, webhook_secret_ref,
        outage_policy_ref, replay_policy_ref, operational_runbook_ref,
        schema_contract_version, consent_ref, isolation_ref,
        refund_policy_ref, dispute_policy_ref, reconciliation_policy_ref,
        adapter_found, adapter_certified, live_payments_allowed,
        payment_authority_present, credential_ref_present,
        credential_approved, webhook_secret_present,
        webhook_signature_verified, outage_policy_present,
        outage_policy_tested, replay_policy_present,
        replay_policy_verified, schema_contract_present,
        schema_contract_verified, consent_ref_present, consent_verified,
        isolation_ref_present, isolation_verified,
        operational_runbook_present, operational_runbook_approved,
        refund_policy_present, refund_policy_approved,
        dispute_policy_present, dispute_policy_approved,
        reconciliation_policy_present, reconciliation_policy_approved,
        execution_allowed, payment_processor_action_performed,
        live_payment_captured, regulated_decision_impact_allowed,
        human_review_required, execution_authorized_at,
        governance_version, classification, replay_ref, trace_id,
        source, metadata
      )
      values (
        $1, $2, $3, $4, $5,
        $6, $6, 'pro', 2500, 'usd',
        'PAYMENT_EXECUTION_AUTHORIZED_NOT_CAPTURED', $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        'stripe-payment-schema-contract-v0.1.0', $15, $16,
        $17, $18, $19,
        true, true, true,
        true, true,
        true, true,
        true, true,
        true, true,
        true, true,
        true, true, true,
        true, true,
        true, true,
        true, true,
        true, true,
        true, true,
        true, false,
        false, false,
        false, now(),
        'master-volumes-runtime-v0.1.0', 'RESTRICTED', $20, $21,
        'live-action-readiness-smoke', $22::jsonb
      )
    `,
    [
      paymentExecutionId,
      `${runId}-stripe-adapter`,
      `billing-event-${runId}`,
      `checkout-session-${runId}`,
      tenantId,
      actorId,
      `execution://${runId}/payment`,
      `processor://${runId}/stripe`,
      `payment-authority://${runId}/stripe`,
      `credential://${runId}/stripe`,
      `webhook://${runId}/stripe`,
      `outage://${runId}/stripe`,
      `replay://${runId}/stripe`,
      `runbook://${runId}/stripe`,
      `consent://${runId}/stripe`,
      `isolation://${runId}/stripe`,
      `refund://${runId}/stripe`,
      `dispute://${runId}/stripe`,
      `reconciliation://${runId}/stripe`,
      `replay://${runId}/payment`,
      `trace://${runId}/payment`,
      JSON.stringify({ smokeRunId: runId }),
    ]
  );

  return {
    tenantId,
    externalExecutionId,
    noticeExecutionId,
    paymentExecutionId,
  };
}

function assertReadyReview(json: RouteJson, actionType: string): string {
  const traceId = json.governance?.traceId;

  if (!traceId || !json.review?.id) {
    throw new Error(`${actionType} readiness review did not return evidence.`);
  }

  if (json.review.actionType !== actionType) {
    throw new Error(`${actionType} readiness review action type mismatch.`);
  }

  if (
    json.result?.readinessStatus !==
      "LIVE_ACTION_PROMOTION_READY_NOT_EXECUTED" ||
    json.result.readyForLiveAction !== true ||
    json.result.externalActionPerformed !== false ||
    json.result.liveActionPerformed !== false ||
    json.result.regulatedDecisionImpactAllowed !== false
  ) {
    throw new Error(
      `${actionType} readiness review did not pass safe promotion gates.`
    );
  }

  return traceId;
}

async function main(): Promise<void> {
  // Confirm the target is THIS app (200 + brand marker) before smoke assertions:
  // a foreign/stale server yields confusing API-404 failures and no server yields
  // opaque connection errors. Fail CLEARLY instead — a smoke gate must never pass
  // vacuously, so this is a loud exit 1, not a skip.
  const smokeHome = await fetch(`${baseUrl}/`).then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") })).catch(() => null);
  if (!smokeHome || smokeHome.status !== 200 || !/Furlong/.test(smokeHome.body)) {
    console.error(`✗ ${baseUrl} is not a confirmed Furlong server (status ${smokeHome?.status ?? "unreachable"}) — refusing to smoke-test a foreign/stale/absent server.`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for live action readiness smoke testing."
    );
  }

  const runId = `live-action-readiness-smoke-${Date.now()}`;
  const actorId = `${runId}-governance`;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const seeded = await seedExecutionRecords(pool, runId);

    const externalReady = await post(
      "/api/governance/live-action-readiness",
      {
        role: "governance",
        actorId,
        tenantId: seeded.tenantId,
        actionType: "EXTERNAL_CONNECTOR_CALL",
        targetExecutionId: seeded.externalExecutionId,
        ...readinessRefs(runId, "external-connector-call"),
        metadata: {
          smokeRunId: runId,
          scenario: "external-connector-ready-not-called",
        },
      }
    );
    const externalTraceId = assertReadyReview(
      externalReady,
      "EXTERNAL_CONNECTOR_CALL"
    );

    const noticeReady = await post(
      "/api/governance/live-action-readiness",
      {
        role: "governance",
        actorId,
        tenantId: seeded.tenantId,
        actionType: "NOTICE_PROVIDER_SEND",
        targetExecutionId: seeded.noticeExecutionId,
        ...readinessRefs(runId, "notice-provider-send"),
        metadata: {
          smokeRunId: runId,
          scenario: "notice-provider-ready-not-sent",
        },
      }
    );
    const noticeTraceId = assertReadyReview(
      noticeReady,
      "NOTICE_PROVIDER_SEND"
    );

    const paymentReady = await post(
      "/api/governance/live-action-readiness",
      {
        role: "governance",
        actorId,
        tenantId: seeded.tenantId,
        actionType: "PAYMENT_PROCESSOR_CAPTURE",
        targetExecutionId: seeded.paymentExecutionId,
        ...readinessRefs(runId, "payment-processor-capture"),
        metadata: {
          smokeRunId: runId,
          scenario: "payment-processor-ready-not-captured",
        },
      }
    );
    const paymentTraceId = assertReadyReview(
      paymentReady,
      "PAYMENT_PROCESSOR_CAPTURE"
    );

    const blockedReview = await post(
      "/api/governance/live-action-readiness",
      {
        role: "governance",
        actorId,
        tenantId: seeded.tenantId,
        actionType: "PAYMENT_PROCESSOR_CAPTURE",
        targetExecutionId: seeded.paymentExecutionId,
        metadata: {
          smokeRunId: runId,
          scenario: "blocked-missing-live-promotion-refs",
        },
      }
    );

    if (
      blockedReview.result?.readinessStatus !==
        "LIVE_ACTION_PROMOTION_BLOCKED" ||
      blockedReview.result.readyForLiveAction !== false ||
      !blockedReview.result.blockerReasons?.includes(
        "productionCredentialVaultPresent"
      )
    ) {
      throw new Error("Missing production refs did not block readiness review.");
    }

    const deniedWrongTenant = await post(
      "/api/governance/live-action-readiness",
      {
        role: "governance",
        actorId,
        tenantId: `${runId}-wrong-tenant`,
        actionType: "EXTERNAL_CONNECTOR_CALL",
        targetExecutionId: seeded.externalExecutionId,
        ...readinessRefs(runId, "wrong-tenant"),
      },
      403
    );

    if (!deniedWrongTenant.governance?.traceId) {
      throw new Error("Wrong-tenant readiness denial did not return trace.");
    }

    const deniedRole = await post(
      "/api/governance/live-action-readiness",
      {
        role: "operator",
        actorId,
        tenantId: seeded.tenantId,
        actionType: "EXTERNAL_CONNECTOR_CALL",
        targetExecutionId: seeded.externalExecutionId,
        ...readinessRefs(runId, "operator-denied"),
      },
      403
    );

    if (!deniedRole.governance?.traceId) {
      throw new Error("Role-denied readiness review did not return trace.");
    }

    const reviewRows = await pool.query(
      `
        select action_type, readiness_status, ready_for_live_action,
               regulated_decision_impact_allowed,
               external_action_performed, live_action_performed
        from live_action_readiness_reviews
        where trace_id = any($1::text[])
        order by action_type
      `,
      [[externalTraceId, noticeTraceId, paymentTraceId]]
    );

    if (reviewRows.rowCount !== 3) {
      throw new Error("Live action readiness reviews were not persisted.");
    }

    for (const row of reviewRows.rows) {
      if (
        row.readiness_status !== "LIVE_ACTION_PROMOTION_READY_NOT_EXECUTED" ||
        row.ready_for_live_action !== true ||
        row.regulated_decision_impact_allowed !== false ||
        row.external_action_performed !== false ||
        row.live_action_performed !== false
      ) {
        throw new Error(
          `Unsafe live action readiness row persisted: ${JSON.stringify(row)}`
        );
      }
    }

    const evidence = await evidenceCounts(pool, paymentTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Live action readiness evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          externalExecutionId: seeded.externalExecutionId,
          noticeExecutionId: seeded.noticeExecutionId,
          paymentExecutionId: seeded.paymentExecutionId,
          traces: {
            externalTraceId,
            noticeTraceId,
            paymentTraceId,
          },
          readinessReviews: reviewRows.rows,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Live action readiness governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown live action readiness smoke test error."
  );
  process.exit(1);
});
