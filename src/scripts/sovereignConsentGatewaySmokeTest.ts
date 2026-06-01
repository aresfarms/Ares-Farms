import "dotenv/config";

import { Pool } from "pg";

/**
 * Sovereign Consent Gateway Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol II §3.21: tribal sovereign land data remains Level 5 by default.
 * - Vol V CANON-CONSENT-001 v7.0: verifies scoped, time-bound,
 *   tribal-authority-initiated Level 5 Executive Waiver records.
 * - Vol V CANON-SOVEREIGNTY-001: verifies the Gateway does not change
 *   sovereign classification, fetch data, score data, or underwrite.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  gatewayRecord?: {
    id?: string;
    gatewayId?: string;
    gatewayStatus?: string;
    gatewayActive?: boolean;
    level5BaselineConfirmed?: boolean;
    level4OperationalExceptionAuthorized?: boolean;
    sovereigntyClassification?: string;
    operationalClassification?: string;
    dataAccessPerformed?: boolean;
    scoringUseAllowed?: boolean;
    underwritingUseAllowed?: boolean;
  };
  result?: {
    gatewayActive?: boolean;
    gatewayStatus?: string;
    gates?: Record<string, unknown>;
    blockerReasons?: string[];
    level5BaselineConfirmed?: boolean;
    level4OperationalExceptionAuthorized?: boolean;
    sovereigntyClassification?: string;
    operationalClassification?: string;
    dataAccessPerformed?: boolean;
    scoringUseAllowed?: boolean;
    underwritingUseAllowed?: boolean;
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
      `Sovereign Consent Gateway smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Sovereign Consent Gateway smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Sovereign Consent Gateway smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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

function gatewayPayload(input: {
  runId: string;
  applicationId: string;
  borrowerId: string;
  tenantId: string;
  scenario: string;
}) {
  return {
    role: "borrower",
    userId: input.borrowerId,
    actorId: input.borrowerId,
    borrowerId: input.borrowerId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    gatewayId: `gateway://${input.runId}/${input.scenario}`,
    initiatingAuthorityId: input.borrowerId,
    initiatingAuthorityType: "NATIVE_OPERATOR",
    initiatingAuthorityRole: "AUTHORIZED_NATIVE_OPERATOR",
    verifiedIdentityEventRef: `identity://${input.runId}/${input.scenario}`,
    affirmativeInitiationRef: `affirmative-initiation://${input.runId}/${input.scenario}`,
    tribalNation: "Smoke Test Tribal Nation",
    authorizedDataElements: [
      "parcel-boundary",
      "assessed-value",
      "geographic-designation",
    ],
    authorizedWorkflowPhases: [
      "eligibility-screening",
      "environmental-review",
      "appraisal-coordination",
    ],
    underwritingWindowClosesAt: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
    nonProprietaryOnlyConfirmed: true,
    publiclyAccessibleRegistryOnly: true,
    applicationScopeConfirmed: true,
    workflowScopeConfirmed: true,
    bulkDataAcquisitionRequested: false,
    crossTransactionSharingRequested: false,
    competitiveIntelligenceRequested: false,
    aiTrainingRequested: false,
    proprietarySovereignRecordsRequested: false,
    platformInitiated: false,
    externalLegalFrameworkReviewed: true,
    complianceOfficerId: `${input.runId}-compliance-officer`,
    complianceReviewRef: `compliance-review://${input.runId}/${input.scenario}`,
    complianceOfficerVerified: true,
    dataAccessEvents: [],
    metadata: {
      smokeRunId: input.runId,
      scenario: input.scenario,
    },
  };
}

function assertNoDataUse(json: RouteJson, label: string): void {
  if (
    json.result?.dataAccessPerformed !== false ||
    json.result?.scoringUseAllowed !== false ||
    json.result?.underwritingUseAllowed !== false ||
    json.gatewayRecord?.dataAccessPerformed !== false ||
    json.gatewayRecord?.scoringUseAllowed !== false ||
    json.gatewayRecord?.underwritingUseAllowed !== false
  ) {
    throw new Error(`${label} unexpectedly allowed sovereign data use.`);
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for Sovereign Consent Gateway smoke testing."
    );
  }

  const runId = `sovereign-consent-gateway-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Sovereign Consent Gateway Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 385000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Sovereign Consent Gateway onboarding did not create an application."
    );
  }

  const blocked = await post("/api/governance/sovereign-consent-gateway", {
    ...gatewayPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
      scenario: "blocked-platform-initiated",
    }),
    platformInitiated: true,
    affirmativeInitiationRef: null,
    externalLegalFrameworkReviewed: false,
    complianceOfficerVerified: false,
  });

  const blockedTraceId = blocked.governance?.traceId;
  const blockedRecordId = blocked.gatewayRecord?.id;

  if (!blockedTraceId || !blockedRecordId) {
    throw new Error(
      "Blocked Sovereign Consent Gateway did not return durable evidence."
    );
  }

  if (
    blocked.result?.gatewayActive !== false ||
    blocked.result?.gatewayStatus !== "GATEWAY_BLOCKED" ||
    blocked.result?.operationalClassification !== "SOVEREIGN_CONTROLLED" ||
    blocked.result?.level4OperationalExceptionAuthorized !== false
  ) {
    throw new Error(
      "Blocked Sovereign Consent Gateway did not preserve Level 5 blocked posture."
    );
  }

  assertNoDataUse(blocked, "Blocked Sovereign Consent Gateway");

  const active = await post(
    "/api/governance/sovereign-consent-gateway",
    gatewayPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
      scenario: "active-native-operator",
    })
  );

  const activeTraceId = active.governance?.traceId;
  const activeRecordId = active.gatewayRecord?.id;

  if (!activeTraceId || !activeRecordId) {
    throw new Error(
      "Active Sovereign Consent Gateway did not return durable evidence."
    );
  }

  if (
    active.result?.gatewayActive !== true ||
    active.result?.gatewayStatus !== "ACTIVE_LEVEL_5_EXECUTIVE_WAIVER" ||
    active.result?.level5BaselineConfirmed !== true ||
    active.result?.level4OperationalExceptionAuthorized !== true ||
    active.result?.sovereigntyClassification !== "SOVEREIGN_CONTROLLED" ||
    active.result?.operationalClassification !== "RESTRICTED"
  ) {
    throw new Error(
      "Complete Sovereign Consent Gateway controls did not produce bounded active posture."
    );
  }

  assertNoDataUse(active, "Active Sovereign Consent Gateway");

  const denied = await post(
    "/api/governance/sovereign-consent-gateway",
    {
      ...gatewayPayload({
        runId,
        applicationId,
        borrowerId,
        tenantId,
        scenario: "denied-cross-tenant",
      }),
      tenantId: `${runId}-wrong-tenant`,
    },
    403
  );

  if (!denied.governance?.traceId) {
    throw new Error(
      "Denied Sovereign Consent Gateway did not return a governance trace."
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const recordRows = await pool.query(
      `
        select id, gateway_id, initiating_authority_type,
               initiating_authority_role, application_id_scope,
               borrower_id, tenant_id, gateway_status, gateway_active,
               level5_baseline_confirmed,
               level4_operational_exception_authorized,
               sovereignty_classification, operational_classification,
               no_bulk_data_acquisition, no_cross_transaction_sharing,
               no_competitive_intelligence, no_ai_training_access,
               no_proprietary_sovereign_records,
               external_legal_framework_reviewed,
               compliance_officer_verified, data_access_performed,
               scoring_use_allowed, underwriting_use_allowed,
               classification, replay_ref, gate_snapshot, blocker_reasons
        from sovereign_consent_gateway_records
        where id = $1
      `,
      [activeRecordId]
    );
    const record = recordRows.rows[0];

    if (!record) {
      throw new Error("Sovereign Consent Gateway row was not persisted.");
    }

    if (
      record.gateway_active !== true ||
      record.gateway_status !== "ACTIVE_LEVEL_5_EXECUTIVE_WAIVER" ||
      record.level5_baseline_confirmed !== true ||
      record.level4_operational_exception_authorized !== true ||
      record.sovereignty_classification !== "SOVEREIGN_CONTROLLED" ||
      record.operational_classification !== "RESTRICTED" ||
      record.data_access_performed !== false ||
      record.scoring_use_allowed !== false ||
      record.underwriting_use_allowed !== false
    ) {
      throw new Error(
        "Sovereign Consent Gateway row did not preserve active bounded posture."
      );
    }

    const blockedEvidence = await evidenceCounts(pool, blockedTraceId);
    const activeEvidence = await evidenceCounts(pool, activeTraceId);

    for (const [label, counts] of [
      ["blocked", blockedEvidence],
      ["active", activeEvidence],
    ] as const) {
      if (
        counts.version_registry < 1 ||
        counts.data_classification_registry < 1 ||
        counts.observability_events < 1 ||
        counts.replay_verification < 1
      ) {
        throw new Error(
          `${label} Sovereign Consent Gateway evidence was incomplete.`
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blockedRecordId,
          activeRecordId,
          record,
          blockedTraceId,
          activeTraceId,
          blockedEvidence,
          activeEvidence,
          activeGates: active.result?.gates,
          blockedBlockers: blocked.result?.blockerReasons,
        },
        null,
        2
      )
    );
    console.log("Sovereign Consent Gateway smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown Sovereign Consent Gateway smoke test error."
  );
  process.exit(1);
});
