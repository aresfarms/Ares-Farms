import "dotenv/config";

import { Pool } from "pg";

/**
 * Sovereign Consent Gateway Admin Read Smoke Test
 *
 * Master Volume Governance:
 * - Vol II §3.21: verifies scoped compliance review for tribal sovereign
 *   land workflows.
 * - Vol V CANON-CONSENT-001 v7.0: reads ConsentGatewayRecords as Level 5
 *   immutable audit artifacts.
 * - Vol V CANON-SOVEREIGNTY-001: confirms reads preserve Level 5 baseline
 *   and do not authorize data access, scoring, or underwriting use.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  count?: number;
  application?: {
    id?: string;
  };
  gatewayRecord?: {
    id?: string;
    gatewayId?: string;
  };
  gatewayRecords?: Array<{
    gatewayRecord?: {
      id?: string;
      gatewayId?: string;
      applicationIdScope?: string;
      borrowerId?: string | null;
      tenantId?: string | null;
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
    application?: {
      id?: string;
    } | null;
  }>;
  result?: {
    gatewayActive?: boolean;
    gatewayStatus?: string;
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
      `Sovereign Consent admin smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Sovereign Consent admin smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Sovereign Consent admin smoke POST denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Sovereign Consent admin smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Sovereign Consent admin smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Sovereign Consent admin smoke GET denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
}) {
  return {
    role: "borrower",
    userId: input.borrowerId,
    actorId: input.borrowerId,
    borrowerId: input.borrowerId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    gatewayId: `gateway://${input.runId}/admin-read`,
    initiatingAuthorityId: input.borrowerId,
    initiatingAuthorityType: "NATIVE_OPERATOR",
    initiatingAuthorityRole: "AUTHORIZED_NATIVE_OPERATOR",
    verifiedIdentityEventRef: `identity://${input.runId}/admin-read`,
    affirmativeInitiationRef: `affirmative-initiation://${input.runId}/admin-read`,
    tribalNation: "Smoke Test Tribal Nation",
    authorizedDataElements: [
      "parcel-boundary",
      "assessed-value",
      "geographic-designation",
    ],
    authorizedWorkflowPhases: [
      "eligibility-screening",
      "environmental-review",
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
    complianceReviewRef: `compliance-review://${input.runId}/admin-read`,
    complianceOfficerVerified: true,
    dataAccessEvents: [],
    metadata: {
      smokeRunId: input.runId,
      scenario: "admin-read",
    },
  };
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for Sovereign Consent Gateway admin read smoke testing."
    );
  }

  const runId = `sovereign-consent-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Sovereign Consent Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 405000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Sovereign Consent admin read onboarding did not create an application."
    );
  }

  const gateway = await post(
    "/api/governance/sovereign-consent-gateway",
    gatewayPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
    })
  );
  const recordId = gateway.gatewayRecord?.id;
  const gatewayId = gateway.gatewayRecord?.gatewayId;

  if (!recordId || !gatewayId || gateway.result?.gatewayActive !== true) {
    throw new Error(
      "Sovereign Consent admin read setup did not create an active Gateway."
    );
  }

  const scoped = await get(
    "/api/governance/sovereign-consent-gateway/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId,
      applicationId,
      recordId,
      includeApplication: true,
      includeProperty: true,
    }
  );
  const scopedTraceId = scoped.governance?.traceId;
  const scopedRecord = scoped.gatewayRecords?.[0];

  if (!scopedTraceId || scoped.count !== 1 || !scopedRecord) {
    throw new Error(
      "Sovereign Consent admin read did not return the scoped Gateway."
    );
  }

  if (
    scopedRecord.gatewayRecord?.id !== recordId ||
    scopedRecord.gatewayRecord?.gatewayId !== gatewayId ||
    scopedRecord.gatewayRecord?.applicationIdScope !== applicationId ||
    scopedRecord.gatewayRecord?.gatewayStatus !==
      "ACTIVE_LEVEL_5_EXECUTIVE_WAIVER" ||
    scopedRecord.gatewayRecord?.sovereigntyClassification !==
      "SOVEREIGN_CONTROLLED" ||
    scopedRecord.gatewayRecord?.operationalClassification !== "RESTRICTED" ||
    scopedRecord.gatewayRecord?.dataAccessPerformed !== false ||
    scopedRecord.gatewayRecord?.scoringUseAllowed !== false ||
    scopedRecord.gatewayRecord?.underwritingUseAllowed !== false ||
    scopedRecord.application?.id !== applicationId
  ) {
    throw new Error(
      "Sovereign Consent admin read returned an unsafe or mismatched record."
    );
  }

  const denied = await get(
    "/api/governance/sovereign-consent-gateway/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      recordId,
    },
    403
  );

  if (!denied.governance?.traceId) {
    throw new Error(
      "Denied Sovereign Consent admin read did not return a trace."
    );
  }

  const missingScope = await get(
    "/api/governance/sovereign-consent-gateway/admin",
    {
      role: "operator",
      userId: operatorId,
    },
    403
  );

  if (!missingScope.governance?.traceId) {
    throw new Error(
      "Missing-scope Sovereign Consent admin read did not return a trace."
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const evidence = await evidenceCounts(pool, scopedTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error(
        "Sovereign Consent Gateway admin read evidence was incomplete."
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          recordId,
          gatewayId,
          scopedTraceId,
          deniedTraceId: denied.governance.traceId,
          missingScopeTraceId: missingScope.governance.traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Sovereign Consent Gateway admin read smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown Sovereign Consent Gateway admin read smoke test error."
  );
  process.exit(1);
});
