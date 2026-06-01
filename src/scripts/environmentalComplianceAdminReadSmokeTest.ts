import "dotenv/config";

import { Pool } from "pg";

/**
 * Environmental Compliance Admin Read Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: verifies Environmental Engineering Spoke / Banker Spoke isolation
 *   appears in a governed admin-read surface.
 * - Vol II: confirms environmental review remains advisory and does not
 *   become an official environmental report, permit, approval, or decision.
 * - Vol III: verifies canonical environmental_compliance_records read access
 *   through versioned, classified, observable runtime evidence.
 * - Vol IV: supports operator review, escalation, and evidence preservation.
 * - Vol V: validates borrower fee controls, provider-license posture,
 *   controlled disclosure, and no live external action.
 * - Vol VI: proves the portable environmental module consumes a backend
 *   admin-read surface instead of direct database access.
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
  complianceRecord?: {
    complianceRecordId?: string;
    assessmentRequirementStatus?: string;
  };
  environmentalComplianceRecords?: Array<{
    complianceRecord?: {
      id?: string;
      complianceRecordId?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      assessmentRequirementStatus?: string;
      assessmentOutcome?: string;
      environmentalAssessmentTriggered?: boolean;
      loanPathwayAdvancementAllowed?: boolean;
      officialReportGenerated?: boolean;
      liveExternalActionPerformed?: boolean;
    };
    feeControl?: {
      feeControlId?: string;
      disclosureStatus?: string;
      disclosedBeforeAssessment?: boolean;
      borrowerExternalFirmRightPreserved?: boolean;
      noSurchargeOrPreferenceIncentive?: boolean;
    } | null;
    application?: {
      id?: string;
    } | null;
  }>;
  result?: {
    loanPathwayAdvancementAllowed?: boolean;
    officialEnvironmentalReportGenerated?: boolean;
    liveExternalActionPerformed?: boolean;
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
      `Environmental admin smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Environmental admin smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Environmental admin smoke POST denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Environmental admin smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Environmental admin smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Environmental admin smoke GET denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
  ]) {
    const rows = await pool.query(
      `select count(*)::int as count from ${table} where trace_id = $1`,
      [traceId]
    );

    result[table] = rows.rows[0].count;
  }

  return result;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for environmental compliance admin read smoke testing."
    );
  }

  const runId = `environmental-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const actorId = `${runId}-governance`;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const onboard = await post("/api/onboard", {
      role: "borrower",
      borrowerId,
      tenantId,
      applicationId,
      farmName: "Environmental Admin Read Smoke Farm",
      county: "Wake",
      state: "NC",
      requestedAmount: 515000,
      metadata: {
        smokeRunId: runId,
      },
    });

    assert(
      onboard.application?.id === applicationId,
      "Environmental admin read onboarding did not create an application."
    );

    const environmental = await post(
      "/api/governance/environmental-compliance",
      {
        role: "governance",
        actorId,
        tenantId,
        borrowerId,
        applicationId,
        journeyId: applicationId,
        pathwayType: "USDA_BI_REAL_ESTATE",
        triggeringPathway: "USDA_BI_REAL_ESTATE_REAL_PROPERTY_COLLATERAL",
        realPropertyCollateral: true,
        assessmentType: "PHASE_I_ESA",
        assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
        providerName: "Environmental Engineering Spoke",
        providerLicenseRef: `license://${runId}/state-environmental-provider`,
        providerLicenseVerified: true,
        assessmentOutcome: "CLEARED",
        feeAmount: 225000,
        standardMarketRateAmount: 250000,
        feeDisclosureRef: `fee-disclosure://${runId}/phase-i`,
        feeDisclosedBeforeInitiation: true,
        borrowerExternalFirmRightPreserved: true,
        noFeeSurchargeOrPreference: true,
        spokeIsolationConfirmed: true,
        bankerSpokeIsolated: true,
        auditAnchorRef: `audit://${runId}/environmental-lineage`,
        metadata: {
          smokeRunId: runId,
          advisoryOnly: true,
          officialEnvironmentalReportGenerated: false,
          liveExternalActionPerformed: false,
        },
      }
    );

    const complianceRecordId =
      environmental.complianceRecord?.complianceRecordId;
    assert(
      Boolean(complianceRecordId),
      "Environmental compliance route did not return complianceRecordId."
    );

    const adminRead = await get(
      "/api/governance/environmental-compliance/admin",
      {
        role: "governance",
        userId: actorId,
        applicationId,
        tenantId,
        includeApplication: true,
        includeProperty: true,
        includeFeeControl: true,
      }
    );

    const first = adminRead.environmentalComplianceRecords?.[0];
    const adminTraceId = adminRead.governance?.traceId;

    assert(Boolean(adminTraceId), "Admin read must return traceId.");
    assert((adminRead.count ?? 0) >= 1, "Admin read returned no records.");
    assert(
      first?.complianceRecord?.applicationId === applicationId,
      "Admin read did not return the expected application scope."
    );
    assert(
      first?.complianceRecord?.loanPathwayAdvancementAllowed === true,
      "Admin read did not preserve pathway advancement posture."
    );
    assert(
      first?.complianceRecord?.officialReportGenerated === false &&
        first?.complianceRecord?.liveExternalActionPerformed === false,
      "Admin read must preserve no official report and no live action posture."
    );
    assert(
      first?.feeControl?.disclosedBeforeAssessment === true &&
        first?.feeControl?.borrowerExternalFirmRightPreserved === true &&
        first?.feeControl?.noSurchargeOrPreferenceIncentive === true,
      "Admin read did not expose borrower fee-protection controls."
    );

    await get(
      "/api/governance/environmental-compliance/admin",
      {
        role: "operator",
        userId: `${runId}-operator`,
      },
      403
    );

    await get(
      "/api/governance/environmental-compliance/admin",
      {
        role: "operator",
        userId: `${runId}-operator`,
        applicationId,
        tenantId: `${runId}-wrong-tenant`,
      },
      403
    );

    const evidence = await evidenceCounts(pool, adminTraceId as string);

    assert(
      evidence.version_registry >= 1 &&
        evidence.data_classification_registry >= 1 &&
        evidence.observability_events >= 1,
      "Environmental compliance admin read evidence was not persisted."
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          adminTraceId,
          count: adminRead.count,
          complianceRecordId,
          assessmentRequirementStatus:
            first?.complianceRecord?.assessmentRequirementStatus,
          evidence,
          message:
            "Environmental compliance admin read smoke test passed.",
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown environmental compliance admin read smoke test error."
  );
  process.exit(1);
});
