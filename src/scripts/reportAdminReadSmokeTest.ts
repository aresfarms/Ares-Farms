import "dotenv/config";

import { Pool } from "pg";

/**
 * Report Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for report record reads.
 * - Vol II: verifies borrower report, disclosure, advisory-only,
 *   human-review, and regulatory-use boundaries remain controlled.
 * - Vol III: checks replay-safe, record-scoped reads before dashboards,
 *   borrower portals, or export workflows consume report records.
 * - Vol IV: supports report review, escalation, retention, audit
 *   preparation, and operational evidence preservation.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   controlled disclosure, and export governance.
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
  reportRecord?: {
    id?: string;
    reportId?: string;
    reportType?: string;
    reportStatus?: string;
    applicationId?: string | null;
    borrowerId?: string | null;
    tenantId?: string | null;
    advisoryOnly?: boolean;
    officialUseAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    humanReviewRequired?: boolean;
    externalReportGenerated?: boolean;
  };
  reportRecords?: Array<{
    report?: {
      id?: string;
      reportId?: string;
      reportType?: string;
      reportStatus?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      advisoryOnly?: boolean;
      officialUseAllowed?: boolean;
      borrowerDisclosureAllowed?: boolean;
      humanReviewRequired?: boolean;
      externalReportGenerated?: boolean;
    };
    application?: {
      id?: string;
    } | null;
    property?: {
      county?: string | null;
      state?: string | null;
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
      `Report admin read smoke POST returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Report admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Report admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      `Report admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Report admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Report admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for report admin read smoke testing."
    );
  }

  const runId = `report-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Report Admin Read Smoke Farm",
    acreage: 141,
    county: "Wake",
    state: "NC",
    requestedAmount: 388000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Report admin read smoke onboarding did not create an application.");
  }

  const generated = await post("/api/reports/pdf", {
    role: "operator",
    userId: operatorId,
    borrowerId,
    tenantId,
    applicationId,
    reportType: "STANDARD",
    payload: {
      score: 0.72,
      programFamily: "USDA_FSA_REVIEW",
      advisoryOnly: true,
    },
    metadata: {
      smokeRunId: runId,
      scenario: "admin-read-report-generation",
    },
  });
  const reportId = generated.reportRecord?.reportId;
  const reportRecordId = generated.reportRecord?.id;

  if (
    !reportId ||
    !reportRecordId ||
    generated.reportRecord?.advisoryOnly !== true ||
    generated.reportRecord.officialUseAllowed !== false ||
    generated.reportRecord.borrowerDisclosureAllowed !== false ||
    generated.reportRecord.humanReviewRequired !== true ||
    generated.reportRecord.externalReportGenerated !== false
  ) {
    throw new Error("Report generation did not create a governed advisory report record.");
  }

  const scopedRead = await get("/api/reports/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    reportId,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const record = scopedRead.reportRecords?.[0];

  if (!scopedTraceId || scopedRead.count !== 1 || !record) {
    throw new Error("Report admin scoped read did not return exactly one record.");
  }

  if (
    record.report?.id !== reportRecordId ||
    record.report.reportId !== reportId ||
    record.report.applicationId !== applicationId ||
    record.report.borrowerId !== borrowerId ||
    record.report.tenantId !== tenantId ||
    record.report.reportType !== "STANDARD" ||
    record.report.advisoryOnly !== true ||
    record.report.officialUseAllowed !== false ||
    record.report.borrowerDisclosureAllowed !== false ||
    record.report.humanReviewRequired !== true ||
    record.report.externalReportGenerated !== false ||
    record.application?.id !== applicationId ||
    record.property?.county !== "Wake"
  ) {
    throw new Error("Report admin scoped read returned an incomplete report lifecycle record.");
  }

  const applicationRead = await get("/api/reports/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    reportType: "STANDARD",
    limit: 10,
  });

  if (
    !applicationRead.reportRecords?.some(
      (item) => item.report?.reportId === reportId
    )
  ) {
    throw new Error("Report admin application read did not include the generated report.");
  }

  const deniedRead = await get(
    "/api/reports/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      reportId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Report admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/reports/admin",
    {
      role: "operator",
      userId: operatorId,
      reportId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Report admin missing-scope denial did not return a governance trace.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const reportRows = await pool.query(
      `
        select id, report_id, report_type, report_status, application_id,
               borrower_id, tenant_id, advisory_only, official_use_allowed,
               borrower_disclosure_allowed, human_review_required,
               external_report_generated, classification, replay_ref
        from report_records
        where id = $1
      `,
      [reportRecordId]
    );
    const reportRow = reportRows.rows[0];

    if (!reportRow) {
      throw new Error("Report record row was not persisted.");
    }

    if (
      reportRow.advisory_only !== true ||
      reportRow.official_use_allowed !== false ||
      reportRow.borrower_disclosure_allowed !== false ||
      reportRow.human_review_required !== true ||
      reportRow.external_report_generated !== false
    ) {
      throw new Error("Report record row did not preserve report governance gates.");
    }

    const evidence = await evidenceCounts(pool, scopedTraceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Report admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          reportRecordId,
          reportId,
          applicationId,
          tenantId,
          borrowerId,
          scopedTraceId,
          deniedTraceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Report admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown report admin read smoke test error."
  );
  process.exit(1);
});
