import "dotenv/config";

import { Pool } from "pg";

/**
 * Credentialed Agency Ingestion Admin Read Smoke Test
 *
 * Master Volume Governance:
 * - Vol I §3.37: verifies accountable review of credentialed agency
 *   ingestion records.
 * - Vol II §3.25: confirms credential, ToS, license, whitelist, isolation,
 *   and anti-bulk evidence is record-scoped.
 * - Vol III TECH-CONN-001: reads canonical credentialed_scraping_events and
 *   credential_vault_refs without external requests.
 * - Vol IV OPS-CONN-002: supports inspection of circuit-breaker posture.
 * - Vol V CANON-EXTSOURCE-001: preserves advisory-only, replay-safe,
 *   provenance-aware controlled disclosure.
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
  credential?: {
    vaultRefId?: string;
  };
  ingestionEvent?: {
    id?: string;
    applicationIdScope?: string;
  };
  credentialedIngestionRecords?: Array<{
    ingestionEvent?: {
      id?: string;
      applicationIdScope?: string;
      borrowerId?: string | null;
      tenantId?: string | null;
      readyForSession?: boolean;
      externalRequestTransmitted?: boolean;
      dataProcessedByEngine?: boolean;
      aiTier?: string;
    };
    credential?: {
      vaultRefId?: string;
      renewalStatus?: string;
    } | null;
    application?: {
      id?: string;
    } | null;
  }>;
  result?: {
    readyForSession?: boolean;
    sessionOutcome?: string;
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
      `Credentialed ingestion admin smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Credentialed ingestion admin smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Credentialed ingestion admin smoke POST denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Credentialed ingestion admin smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Credentialed ingestion admin smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Credentialed ingestion admin smoke GET denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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

function completeCredentialedIngestionPayload(input: {
  runId: string;
  applicationId: string;
  borrowerId: string;
  tenantId: string;
  operatorId: string;
}) {
  return {
    role: "operator",
    userId: input.operatorId,
    actorId: input.operatorId,
    initiatingActorId: input.operatorId,
    borrowerId: input.borrowerId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    externalTargetDomain: "farmers.gov",
    vaultRefId: `vault://${input.runId}/admin-read/usda-farmers-gov`,
    credentialType: "SESSION_TOKEN",
    externalPlatform: "USDA Farmers.gov",
    holdingActorId: input.operatorId,
    licenseType: "credentialed-human-agency-access",
    licenseScope: {
      applicationId: input.applicationId,
      borrowerId: input.borrowerId,
      permittedCategories: ["farm-record-summary"],
    },
    expiryTimestamp: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    renewalStatus: "ACTIVE",
    acquisitionMethod: "SESSION",
    sourceType: "CREDENTIALED_SESSION",
    sourceTrustClassification: "ADVISORY",
    requestedDataCategories: ["farm-record-summary"],
    humanAuthorizationRef: `human-auth://${input.runId}/admin-read`,
    sourceAuthorityRef: `source-authority://${input.runId}/farmers-gov`,
    dataResidencyZone: "US",
    sovereigntyClassification: "NON_SOVEREIGN_APPLICATION_SCOPED",
    tosComplianceAttestationRef: `tos://${input.runId}/admin-read`,
    tosPermitsAccess: true,
    licenseAuthorizesCategories: true,
    useWithinLicenseScope: true,
    whitelistApproved: true,
    baselineSyncRef: `baseline-sync://${input.runId}/admin-read`,
    isolationBoundaryConfirmed: true,
    provenanceEnvelopeRef: `provenance://${input.runId}/admin-read`,
    bulkAcquisitionRequested: false,
    metadata: {
      smokeRunId: input.runId,
      scenario: "admin-read",
    },
  };
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for credentialed ingestion admin read smoke testing."
    );
  }

  const runId = `credentialed-ingestion-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Credentialed Ingestion Admin Read Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 365000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Credentialed ingestion admin read onboarding did not create an application."
    );
  }

  const ingestion = await post(
    "/api/connectors/credentialed-ingestion",
    completeCredentialedIngestionPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
      operatorId,
    })
  );
  const eventId = ingestion.ingestionEvent?.id;
  const vaultRefId = ingestion.credential?.vaultRefId;

  if (!eventId || !vaultRefId || ingestion.result?.readyForSession !== true) {
    throw new Error(
      "Credentialed ingestion admin read setup did not create a ready event."
    );
  }

  const scoped = await get("/api/connectors/credentialed-ingestion/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    eventId,
    includeCredential: true,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scoped.governance?.traceId;
  const scopedRecord = scoped.credentialedIngestionRecords?.[0];

  if (!scopedTraceId || scoped.count !== 1 || !scopedRecord) {
    throw new Error(
      "Credentialed ingestion admin read did not return the scoped event."
    );
  }

  if (
    scopedRecord.ingestionEvent?.id !== eventId ||
    scopedRecord.ingestionEvent?.applicationIdScope !== applicationId ||
    scopedRecord.ingestionEvent?.externalRequestTransmitted !== false ||
    scopedRecord.ingestionEvent?.dataProcessedByEngine !== false ||
    scopedRecord.ingestionEvent?.aiTier !== "TIER_1_ADVISORY" ||
    scopedRecord.credential?.vaultRefId !== vaultRefId ||
    scopedRecord.application?.id !== applicationId
  ) {
    throw new Error(
      "Credentialed ingestion admin read returned an unsafe or mismatched record."
    );
  }

  const denied = await get(
    "/api/connectors/credentialed-ingestion/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      eventId,
    },
    403
  );

  if (!denied.governance?.traceId) {
    throw new Error(
      "Denied credentialed ingestion admin read did not return a trace."
    );
  }

  const missingScope = await get(
    "/api/connectors/credentialed-ingestion/admin",
    {
      role: "operator",
      userId: operatorId,
    },
    403
  );

  if (!missingScope.governance?.traceId) {
    throw new Error(
      "Missing-scope credentialed ingestion admin read did not return a trace."
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
        "Credentialed ingestion admin read evidence was incomplete."
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          eventId,
          vaultRefId,
          scopedTraceId,
          deniedTraceId: denied.governance.traceId,
          missingScopeTraceId: missingScope.governance.traceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Credentialed ingestion admin read smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown credentialed ingestion admin read smoke test error."
  );
  process.exit(1);
});
