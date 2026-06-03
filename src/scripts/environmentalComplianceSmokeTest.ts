import "dotenv/config";

import { Pool } from "pg";

/**
 * Environmental Compliance Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: ROLE-ARCH-001 Environmental Engineering Spoke isolation.
 * - Vol II: regulated NEPA / USDA environmental review posture.
 * - Vol III: TECH-CONN-001 environmental_compliance_records persistence.
 * - Vol IV: OPS-BORROWER-JOURNEY-001 Steps 2.5-2.7.
 * - Vol V: CANON-ECON-001 fee disclosure and CANON-SOVEREIGNTY-001
 *   provider license verification.
 * - Vol VI: build conformance, backend coverage, and module readiness.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type EnvironmentalRouteJson = Record<string, unknown> & {
  ok?: boolean;
  complianceRecord?: {
    complianceRecordId?: string;
    tenantId?: string;
    assessmentRequirementStatus?: string;
    assessmentOutcome?: string;
    loanPathwayAdvancementAllowed?: boolean;
    officialReportGenerated?: boolean;
    liveExternalActionPerformed?: boolean;
  };
  result?: {
    environmentalAssessmentTriggered?: boolean;
    loanPathwayAdvancementAllowed?: boolean;
    blockerReasons?: string[];
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
): Promise<EnvironmentalRouteJson> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as EnvironmentalRouteJson;

  if (response.status !== expectedStatus) {
    throw new Error(
      `Environmental compliance smoke returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Environmental compliance smoke route failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Environmental compliance smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for environmental compliance smoke test."
    );
  }

  const runId = `environmental-compliance-smoke-${Date.now()}`;
  const tenantId = `${runId}-tenant`;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const complete = await post("/api/governance/environmental-compliance", {
      role: "governance",
      actorId: `${runId}-governance`,
      tenantId,
      borrowerId: `${runId}-borrower`,
      applicationId: `${runId}-application`,
      journeyId: `${runId}-journey`,
      pathwayType: "USDA_BI_REAL_ESTATE",
      triggeringPathway: "USDA_BI_REAL_ESTATE_REAL_PROPERTY_COLLATERAL",
      realPropertyCollateral: true,
      assessmentType: "PHASE_I_ESA",
      assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
      providerName: "Environmental Engineering Spoke",
      providerLicenseRef: `license://${runId}/nc-environmental-firm`,
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
      auditAnchorRef: `audit://${runId}/environmental-clearance`,
      metadata: {
        smokeRunId: runId,
        advisoryOnly: true,
      },
    });

    const blocked = await post("/api/governance/environmental-compliance", {
      role: "governance",
      actorId: `${runId}-governance`,
      tenantId,
      borrowerId: `${runId}-borrower`,
      applicationId: `${runId}-blocked-application`,
      journeyId: `${runId}-blocked-journey`,
      pathwayType: "REAP_INSTALLATION",
      triggeringPathway: "REAP_INSTALLATION_ENVIRONMENTAL_REVIEW",
      environmentalStatuteTriggered: true,
      assessmentType: "NEPA_SCREENING",
      assessmentProviderType: "APPROVED_EXTERNAL_FIRM",
      assessmentOutcome: "ESCALATED",
      feeAmount: 75000,
      feeDisclosureRef: `fee-disclosure://${runId}/blocked`,
      feeDisclosedBeforeInitiation: true,
      borrowerExternalFirmRightPreserved: true,
      noFeeSurchargeOrPreference: true,
      spokeIsolationConfirmed: true,
      bankerSpokeIsolated: true,
      auditAnchorRef: `audit://${runId}/blocked`,
      escalationRef: `escalation://${runId}/license-review`,
    });

    const exempt = await post("/api/governance/environmental-compliance", {
      role: "operator",
      actorId: `${runId}-operator`,
      tenantId,
      borrowerId: `${runId}-borrower`,
      applicationId: `${runId}-equipment-application`,
      journeyId: `${runId}-equipment-journey`,
      pathwayType: "EQUIPMENT_FINANCING",
      equipmentAssetValue: 42500,
      realPropertyCollateral: false,
      metadata: {
        smokeRunId: runId,
        pathwayExemptionExpected: true,
      },
    });

    await post(
      "/api/governance/environmental-compliance",
      {
        role: "borrower",
        actorId: `${runId}-borrower`,
        tenantId,
        borrowerId: `${runId}-borrower`,
        applicationId: `${runId}-denied-application`,
        journeyId: `${runId}-denied-journey`,
        pathwayType: "USDA_BI_REAL_ESTATE",
        realPropertyCollateral: true,
      },
      403
    );

    const completeTraceId = complete.governance?.traceId;
    assert(Boolean(completeTraceId), "Complete response must include traceId.");

    assert(
      complete.result?.environmentalAssessmentTriggered === true,
      "Triggered environmental pathway should be marked triggered."
    );
    assert(
      complete.result?.loanPathwayAdvancementAllowed === true,
      "Complete environmental lineage should allow pathway advancement."
    );
    assert(
      complete.result?.officialEnvironmentalReportGenerated === false &&
        complete.result?.liveExternalActionPerformed === false,
      "Smoke must not generate official reports or perform live external action."
    );
    assert(
      blocked.result?.loanPathwayAdvancementAllowed === false,
      "Missing provider license verification must block pathway advancement."
    );
    assert(
      (blocked.result?.blockerReasons ?? []).includes(
        "providerLicenseRefPresent"
      ) ||
        (blocked.result?.blockerReasons ?? []).includes(
          "providerLicenseVerified"
        ),
      "Blocked pathway must cite provider license gate failure."
    );
    assert(
      exempt.result?.environmentalAssessmentTriggered === false &&
        exempt.result?.loanPathwayAdvancementAllowed === true,
      "Micro equipment financing without real property should record exemption."
    );

    const tableCounts = await pool.query(
      `
        select
          (select count(*)::int from environmental_compliance_records where tenant_id = $1) as environmental_records,
          (select count(*)::int from borrower_protection_fee_controls where tenant_id = $1) as fee_controls
      `,
      [tenantId]
    );
    const evidence = await evidenceCounts(pool, completeTraceId as string);

    assert(
      tableCounts.rows[0].environmental_records >= 3,
      "Environmental compliance records were not persisted."
    );
    assert(
      tableCounts.rows[0].fee_controls >= 3,
      "Borrower protection fee controls were not persisted."
    );
    assert(
      evidence.version_registry >= 1 &&
        evidence.data_classification_registry >= 1 &&
        evidence.observability_events >= 1 &&
        evidence.replay_verification >= 1,
      "Environmental compliance route evidence was not persisted."
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          completeTraceId,
          completeStatus:
            complete.complianceRecord?.assessmentRequirementStatus,
          blockedStatus:
            blocked.complianceRecord?.assessmentRequirementStatus,
          exemptStatus:
            exempt.complianceRecord?.assessmentRequirementStatus,
          environmentalRecords: tableCounts.rows[0].environmental_records,
          feeControls: tableCounts.rows[0].fee_controls,
          evidence,
          message: "Environmental compliance governance smoke test passed.",
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
      : "Unknown environmental compliance smoke test error."
  );
  process.exit(1);
});
