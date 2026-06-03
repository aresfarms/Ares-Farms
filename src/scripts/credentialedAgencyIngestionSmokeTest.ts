import "dotenv/config";

import { Pool } from "pg";

/**
 * Credentialed Agency Ingestion Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I §3.37: verifies AI-assisted authenticated source access can only
 *   be prepared as a bounded instrument of a credentialed human actor.
 * - Vol II §3.25: confirms ToS, license, isolation, residency, and anti-bulk
 *   controls before any credentialed agency session can proceed.
 * - Vol III TECH-CONN-001: checks credential_vault_refs and
 *   credentialed_scraping_events are durable canonical connector records.
 * - Vol IV OPS-CONN-002: verifies blocked pre-sessions create circuit-breaker
 *   posture and governed evidence without transmitting an external request.
 * - Vol V CANON-EXTSOURCE-001: enforces source trust, provenance, replay,
 *   authorization, and Tier 1 advisory-only constraints.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  credential?: {
    id?: string;
    vaultRefId?: string;
    holdingActorId?: string;
    renewalStatus?: string;
  };
  ingestionEvent?: {
    id?: string;
    scrapingEventId?: string;
    applicationIdScope?: string;
    borrowerId?: string | null;
    tenantId?: string | null;
    sourceType?: string;
    sourceTrustClassification?: string;
    tosComplianceAttestation?: boolean;
    whitelistVerified?: boolean;
    readyForSession?: boolean;
    sessionOutcome?: string;
    externalRequestTransmitted?: boolean;
    dataProcessedByEngine?: boolean;
    circuitBreakerTriggered?: boolean;
    antiBulkAcquisitionSatisfied?: boolean;
    aiTier?: string;
  };
  result?: {
    readyForSession?: boolean;
    sessionOutcome?: string;
    gates?: Record<string, unknown>;
    blockerReasons?: string[];
    externalRequestTransmitted?: boolean;
    dataProcessedByEngine?: boolean;
    circuitBreakerTriggered?: boolean;
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
      `Credentialed ingestion smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Credentialed ingestion smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Credentialed ingestion smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
  scenario: string;
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
    vaultRefId: `vault://${input.runId}/${input.scenario}/usda-farmers-gov`,
    credentialType: "SESSION_TOKEN",
    externalPlatform: "USDA Farmers.gov",
    holdingActorId: input.operatorId,
    licenseType: "credentialed-human-agency-access",
    licenseScope: {
      applicationId: input.applicationId,
      borrowerId: input.borrowerId,
      permittedCategories: [
        "farm-record-summary",
        "program-eligibility-reference",
      ],
    },
    expiryTimestamp: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    renewalStatus: "ACTIVE",
    acquisitionMethod: "SESSION",
    sourceType: "CREDENTIALED_SESSION",
    sourceTrustClassification: "ADVISORY",
    requestedDataCategories: [
      "farm-record-summary",
      "program-eligibility-reference",
    ],
    humanAuthorizationRef: `human-auth://${input.runId}/${input.scenario}`,
    sourceAuthorityRef: `source-authority://${input.runId}/farmers-gov`,
    dataResidencyZone: "US",
    sovereigntyClassification: "NON_SOVEREIGN_APPLICATION_SCOPED",
    tosComplianceAttestationRef: `tos://${input.runId}/${input.scenario}`,
    tosPermitsAccess: true,
    licenseAuthorizesCategories: true,
    useWithinLicenseScope: true,
    whitelistApproved: true,
    baselineSyncRef: `baseline-sync://${input.runId}/${input.scenario}`,
    isolationBoundaryConfirmed: true,
    provenanceEnvelopeRef: `provenance://${input.runId}/${input.scenario}`,
    bulkAcquisitionRequested: false,
    metadata: {
      smokeRunId: input.runId,
      scenario: input.scenario,
      officialDataFetched: false,
    },
  };
}

function assertNoExternalAction(json: RouteJson, label: string): void {
  if (
    json.result?.externalRequestTransmitted !== false ||
    json.result?.dataProcessedByEngine !== false ||
    json.ingestionEvent?.externalRequestTransmitted !== false ||
    json.ingestionEvent?.dataProcessedByEngine !== false
  ) {
    throw new Error(`${label} unexpectedly transmitted or processed data.`);
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for credentialed ingestion smoke testing."
    );
  }

  const runId = `credentialed-ingestion-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Credentialed Agency Ingestion Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 325000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Credentialed ingestion onboarding did not create an application."
    );
  }

  const blocked = await post("/api/connectors/credentialed-ingestion", {
    ...completeCredentialedIngestionPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
      operatorId,
      scenario: "blocked-whitelist-and-tos",
    }),
    whitelistApproved: false,
    tosComplianceAttestationRef: null,
    tosPermitsAccess: false,
    metadata: {
      smokeRunId: runId,
      scenario: "blocked-whitelist-and-tos",
    },
  });

  const blockedTraceId = blocked.governance?.traceId;
  const blockedEventId = blocked.ingestionEvent?.id;

  if (!blockedTraceId || !blockedEventId) {
    throw new Error(
      "Blocked credentialed ingestion did not return durable evidence."
    );
  }

  if (
    blocked.result?.readyForSession !== false ||
    blocked.result?.sessionOutcome !== "WHITELIST_VIOLATION" ||
    blocked.result?.circuitBreakerTriggered !== true
  ) {
    throw new Error(
      "Blocked credentialed ingestion did not create expected circuit-breaker posture."
    );
  }

  assertNoExternalAction(blocked, "Blocked credentialed ingestion");

  const ready = await post(
    "/api/connectors/credentialed-ingestion",
    completeCredentialedIngestionPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
      operatorId,
      scenario: "ready-not-started",
    })
  );

  const readyTraceId = ready.governance?.traceId;
  const readyEventId = ready.ingestionEvent?.id;
  const readyVaultRef = ready.credential?.vaultRefId;

  if (!readyTraceId || !readyEventId || !readyVaultRef) {
    throw new Error(
      "Ready credentialed ingestion did not return durable evidence."
    );
  }

  if (
    ready.result?.readyForSession !== true ||
    ready.result?.sessionOutcome !==
      "CREDENTIALED_INGESTION_READY_NOT_STARTED" ||
    ready.result?.circuitBreakerTriggered !== false ||
    ready.ingestionEvent?.aiTier !== "TIER_1_ADVISORY" ||
    ready.ingestionEvent?.tosComplianceAttestation !== true ||
    ready.ingestionEvent?.whitelistVerified !== true ||
    ready.ingestionEvent?.antiBulkAcquisitionSatisfied !== true
  ) {
    throw new Error(
      "Complete credentialed ingestion controls did not produce ready-not-started advisory posture."
    );
  }

  assertNoExternalAction(ready, "Ready credentialed ingestion");

  const denied = await post(
    "/api/connectors/credentialed-ingestion",
    {
      ...completeCredentialedIngestionPayload({
        runId,
        applicationId,
        borrowerId,
        tenantId,
        operatorId,
        scenario: "denied-cross-tenant",
      }),
      tenantId: `${runId}-wrong-tenant`,
    },
    403
  );

  if (!denied.governance?.traceId) {
    throw new Error(
      "Denied credentialed ingestion did not return a governance trace."
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const eventRows = await pool.query(
      `
        select id, scraping_event_id, application_id_scope, borrower_id,
               tenant_id, source_type, source_trust_classification,
               tos_compliance_attestation, whitelist_verified,
               baseline_sync_logged, isolation_boundary_confirmed,
               credential_valid, credential_expired, credential_revoked,
               circuit_breaker_triggered, sev2_event_ref, session_outcome,
               ready_for_session, external_request_transmitted,
               data_processed_by_engine, bulk_acquisition_requested,
               anti_bulk_acquisition_satisfied, ai_tier, gate_snapshot,
               blocker_reasons, classification, replay_ref
        from credentialed_scraping_events
        where id = $1
      `,
      [readyEventId]
    );
    const readyEvent = eventRows.rows[0];

    if (!readyEvent) {
      throw new Error("Credentialed scraping event row was not persisted.");
    }

    if (
      readyEvent.ready_for_session !== true ||
      readyEvent.session_outcome !==
        "CREDENTIALED_INGESTION_READY_NOT_STARTED" ||
      readyEvent.external_request_transmitted !== false ||
      readyEvent.data_processed_by_engine !== false ||
      readyEvent.ai_tier !== "TIER_1_ADVISORY"
    ) {
      throw new Error(
        "Credentialed scraping event row did not preserve ready-not-started posture."
      );
    }

    const credentialRows = await pool.query(
      `
        select id, vault_ref_id, credential_type, external_platform,
               holding_actor_id, license_type, renewal_status,
               revocation_event_ref, classification, replay_ref
        from credential_vault_refs
        where vault_ref_id = $1
      `,
      [readyVaultRef]
    );
    const credential = credentialRows.rows[0];

    if (!credential) {
      throw new Error("Credential vault reference row was not persisted.");
    }

    if (
      credential.holding_actor_id !== operatorId ||
      credential.renewal_status !== "ACTIVE"
    ) {
      throw new Error(
        "Credential vault reference did not preserve credential ownership posture."
      );
    }

    const blockedEvidence = await evidenceCounts(pool, blockedTraceId);
    const readyEvidence = await evidenceCounts(pool, readyTraceId);

    for (const [label, counts] of [
      ["blocked", blockedEvidence],
      ["ready", readyEvidence],
    ] as const) {
      if (
        counts.version_registry < 1 ||
        counts.data_classification_registry < 1 ||
        counts.observability_events < 1 ||
        counts.replay_verification < 1
      ) {
        throw new Error(
          `${label} credentialed ingestion evidence was incomplete.`
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          blockedEventId,
          readyEventId,
          credential,
          readyEvent,
          blockedTraceId,
          readyTraceId,
          blockedEvidence,
          readyEvidence,
          readyGates: ready.result?.gates,
          blockedBlockers: blocked.result?.blockerReasons,
        },
        null,
        2
      )
    );
    console.log("Credentialed Agency Ingestion smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown credentialed ingestion smoke test error."
  );
  process.exit(1);
});
