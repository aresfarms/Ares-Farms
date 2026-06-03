import "dotenv/config";

import { Pool } from "pg";

/**
 * Partner Workflow Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for lender and sponsor workflow reads.
 * - Vol II: verifies partner workflow, diligence, certification, disclosure,
 *   and commitment posture remain advisory and controlled.
 * - Vol III: checks replay-safe, record-scoped reads before partner/admin
 *   dashboards use institutional workflow data.
 * - Vol IV: supports operator verification for due diligence, escalation,
 *   assignment, recovery, and audit preparation.
 * - Vol V: enforces classification, observability, replay, versioning,
 *   controlled disclosure, and evidence preservation.
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
  workflow?: {
    id?: string;
    partnerType?: string;
    partnerId?: string;
    applicationId?: string;
    advisoryOnly?: boolean;
    finalActionAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  partnerWorkflows?: Array<{
    workflow?: {
      id?: string;
      partnerType?: string;
      partnerId?: string;
      applicationId?: string | null;
      borrowerId?: string | null;
      tenantId?: string | null;
      commitmentStatus?: string;
      dueDiligenceStatus?: string;
      disclosureStatus?: string;
      certificationStatus?: string;
      advisoryOnly?: boolean;
      finalActionAllowed?: boolean;
      borrowerDisclosureAllowed?: boolean;
      humanReviewRequired?: boolean;
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

async function post(path: string, body: Record<string, unknown>): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as RouteJson;

  if (response.status < 200 || response.status >= 300 || json.ok !== true) {
    throw new Error(
      `Partner workflow admin read smoke POST failed: ${path} ${response.status} ${JSON.stringify(
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
      `Partner workflow admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Partner workflow admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Partner workflow admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for partner workflow admin read smoke testing.");
  }

  const runId = `partner-workflow-admin-read-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const operatorId = `${runId}-operator`;
  const lenderId = `${runId}-lender`;
  const sponsorId = `${runId}-sponsor`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Partner Workflow Admin Read Smoke Farm",
    acreage: 202,
    county: "Wake",
    state: "NC",
    requestedAmount: 575000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Partner workflow admin read smoke onboarding did not create an application.");
  }

  const lender = await post("/api/partners/workflows", {
    role: "lender",
    userId: lenderId,
    partnerType: "LENDER",
    partnerId: lenderId,
    partnerName: "Admin Read Smoke Community Lender",
    borrowerId,
    tenantId,
    applicationId,
    workflowType: "LENDER_REVIEW",
    workflowStage: "DUE_DILIGENCE",
    priority: "HIGH",
    requestedAmount: 575000,
    programType: "USDA_FSA_REVIEW",
    metadata: {
      smokeRunId: runId,
    },
  });

  const sponsor = await post("/api/partners/workflows", {
    role: "sponsor",
    userId: sponsorId,
    partnerType: "SPONSOR",
    partnerId: sponsorId,
    partnerName: "Admin Read Smoke Sponsor Partner",
    borrowerId,
    tenantId,
    applicationId,
    workflowType: "SPONSORSHIP_REVIEW",
    workflowStage: "REVIEW",
    priority: "NORMAL",
    programType: "SPONSOR_SUPPORT_REVIEW",
    metadata: {
      smokeRunId: runId,
    },
  });
  const lenderWorkflowId = lender.workflow?.id;
  const sponsorWorkflowId = sponsor.workflow?.id;

  if (!lenderWorkflowId || !sponsorWorkflowId) {
    throw new Error("Partner workflow admin read smoke did not create partner workflows.");
  }

  const scopedRead = await get("/api/partners/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    borrowerId,
    applicationId,
    workflowId: lenderWorkflowId,
    includeApplication: true,
    includeProperty: true,
  });
  const scopedTraceId = scopedRead.governance?.traceId;
  const scopedRecord = scopedRead.partnerWorkflows?.[0];

  if (!scopedTraceId || scopedRead.count !== 1) {
    throw new Error("Partner workflow admin scoped read did not return exactly one record.");
  }

  if (
    scopedRecord?.workflow?.id !== lenderWorkflowId ||
    scopedRecord.workflow.applicationId !== applicationId ||
    scopedRecord.workflow.borrowerId !== borrowerId ||
    scopedRecord.workflow.tenantId !== tenantId ||
    scopedRecord.workflow.partnerType !== "LENDER" ||
    scopedRecord.workflow.partnerId !== lenderId ||
    scopedRecord.workflow.finalActionAllowed !== false ||
    scopedRecord.workflow.borrowerDisclosureAllowed !== false ||
    scopedRecord.workflow.humanReviewRequired !== true ||
    scopedRecord.application?.id !== applicationId ||
    scopedRecord.property?.county !== "Wake"
  ) {
    throw new Error("Partner workflow admin scoped read returned the wrong workflow, application, or property summary.");
  }

  const tenantRead = await get("/api/partners/admin", {
    role: "operator",
    userId: operatorId,
    tenantId,
    applicationId,
    limit: 10,
  });

  if (
    !tenantRead.partnerWorkflows?.some(
      (record) => record.workflow?.id === lenderWorkflowId
    ) ||
    !tenantRead.partnerWorkflows?.some(
      (record) => record.workflow?.id === sponsorWorkflowId
    )
  ) {
    throw new Error("Partner workflow admin tenant read did not include expected workflows.");
  }

  const lenderRead = await get("/api/partners/admin", {
    role: "lender",
    userId: lenderId,
    tenantId,
    borrowerId,
    workflowId: lenderWorkflowId,
    partnerType: "LENDER",
    partnerId: lenderId,
  });

  if (
    lenderRead.count !== 1 ||
    lenderRead.partnerWorkflows?.[0]?.workflow?.id !== lenderWorkflowId
  ) {
    throw new Error("Partner workflow admin lender read did not include the expected lender workflow.");
  }

  const deniedRead = await get(
    "/api/partners/admin",
    {
      role: "operator",
      userId: operatorId,
      tenantId,
      borrowerId: `${runId}-wrong-borrower`,
      workflowId: lenderWorkflowId,
    },
    403
  );
  const deniedTraceId = deniedRead.governance?.traceId;

  if (!deniedTraceId) {
    throw new Error("Partner workflow admin denied read did not return a governance trace.");
  }

  const missingScopeRead = await get(
    "/api/partners/admin",
    {
      role: "operator",
      userId: operatorId,
      workflowId: lenderWorkflowId,
    },
    403
  );

  if (!missingScopeRead.governance?.traceId) {
    throw new Error("Partner workflow admin missing-scope denial did not return a governance trace.");
  }

  const partnerMismatchRead = await get(
    "/api/partners/admin",
    {
      role: "lender",
      userId: lenderId,
      tenantId,
      partnerType: "SPONSOR",
      partnerId: sponsorId,
      workflowId: sponsorWorkflowId,
    },
    403
  );

  if (!partnerMismatchRead.governance?.traceId) {
    throw new Error("Partner workflow admin partner-mismatch denial did not return a governance trace.");
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
      throw new Error("Partner workflow admin read governance evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          lenderWorkflowId,
          sponsorWorkflowId,
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
    console.log("Partner workflow admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown partner workflow admin read smoke test error."
  );
  process.exit(1);
});
