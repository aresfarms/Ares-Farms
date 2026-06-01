import "dotenv/config";

import { Pool } from "pg";

/**
 * Lender and Sponsor Workflow Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms governed institutional workflow authority is durable.
 * - Vol II: verifies lender and sponsor workflows remain advisory, reviewable,
 *   and controlled before borrower disclosure or final commitment.
 * - Vol III: checks replay-safe partner workflow persistence and listing.
 * - Vol IV: supports repeatable operator verification for due diligence,
 *   escalation, assignment, recovery, and audit preparation.
 * - Vol V: enforces classification, observability, replayability,
 *   source authority, controlled disclosure, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  workflow?: {
    id?: string;
    partnerType?: string;
    partnerId?: string;
    applicationId?: string;
    status?: string;
    advisoryOnly?: boolean;
    finalActionAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  workflows?: Array<{
    id?: string;
    partnerType?: string;
    partnerId?: string;
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
      `Partner workflow smoke POST failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

async function get(path: string): Promise<RouteJson> {
  const response = await fetch(`${baseUrl}${path}`);
  const json = (await response.json()) as RouteJson;

  if (response.status < 200 || response.status >= 300 || json.ok !== true) {
    throw new Error(
      `Partner workflow smoke GET failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for partner workflow smoke testing.");
  }

  const runId = `partner-workflow-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const lenderId = `${runId}-lender`;
  const sponsorId = `${runId}-sponsor`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Partner Workflow Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 525000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Partner workflow smoke onboarding did not create application.");
  }

  const lender = await post("/api/partners/workflows", {
    role: "lender",
    userId: lenderId,
    partnerType: "LENDER",
    partnerId: lenderId,
    partnerName: "Smoke Community Lender",
    borrowerId,
    tenantId,
    applicationId,
    workflowType: "LENDER_REVIEW",
    workflowStage: "DUE_DILIGENCE",
    priority: "HIGH",
    requestedAmount: 525000,
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
    partnerName: "Smoke Sponsor Partner",
    borrowerId,
    tenantId,
    applicationId,
    workflowType: "SPONSORSHIP_REVIEW",
    workflowStage: "REVIEW",
    priority: "NORMAL",
    programType: "sponsor-support-review",
    metadata: {
      smokeRunId: runId,
    },
  });

  const lenderWorkflowId = lender.workflow?.id;
  const sponsorWorkflowId = sponsor.workflow?.id;
  const lenderTraceId = lender.governance?.traceId;
  const sponsorTraceId = sponsor.governance?.traceId;

  if (!lenderWorkflowId || !sponsorWorkflowId || !lenderTraceId || !sponsorTraceId) {
    throw new Error("Partner workflow creation did not return durable evidence.");
  }

  for (const workflow of [lender.workflow, sponsor.workflow]) {
    if (workflow?.finalActionAllowed !== false) {
      throw new Error("Partner workflow unexpectedly allowed final action.");
    }

    if (workflow?.borrowerDisclosureAllowed !== false) {
      throw new Error("Partner workflow unexpectedly allowed borrower disclosure.");
    }

    if (workflow?.humanReviewRequired !== true) {
      throw new Error("Partner workflow did not require human review.");
    }
  }

  const lenderList = await get(
    `/api/partners/workflows?role=lender&tenantId=${encodeURIComponent(
      tenantId
    )}&partnerType=LENDER&partnerId=${encodeURIComponent(
      lenderId
    )}&status=OPEN&limit=10`
  );
  const sponsorList = await get(
    `/api/partners/workflows?role=sponsor&tenantId=${encodeURIComponent(
      tenantId
    )}&partnerType=SPONSOR&partnerId=${encodeURIComponent(
      sponsorId
    )}&status=OPEN&limit=10`
  );

  if (!lenderList.workflows?.some((workflow) => workflow.id === lenderWorkflowId)) {
    throw new Error("Lender workflow list did not return created workflow.");
  }

  if (!sponsorList.workflows?.some((workflow) => workflow.id === sponsorWorkflowId)) {
    throw new Error("Sponsor workflow list did not return created workflow.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const workflowRows = await pool.query(
      `
        select id, partner_type, partner_id, application_id, borrower_id,
               tenant_id, status, commitment_status, due_diligence_status,
               disclosure_status, certification_status, advisory_only,
               final_action_allowed, borrower_disclosure_allowed,
               human_review_required, classification, replay_ref
        from partner_workflows
        where id = any($1::uuid[])
        order by partner_type
      `,
      [[lenderWorkflowId, sponsorWorkflowId]]
    );

    if (workflowRows.rows.length !== 2) {
      throw new Error("Partner workflow rows were not persisted.");
    }

    for (const workflow of workflowRows.rows) {
      if (workflow.application_id !== applicationId) {
        throw new Error("Partner workflow row was not attached to application.");
      }

      if (workflow.final_action_allowed !== false) {
        throw new Error("Persisted partner workflow allowed final action.");
      }

      if (workflow.borrower_disclosure_allowed !== false) {
        throw new Error("Persisted partner workflow allowed borrower disclosure.");
      }
    }

    const lenderEvidence = await evidenceCounts(pool, lenderTraceId);
    const sponsorEvidence = await evidenceCounts(pool, sponsorTraceId);

    for (const evidence of [lenderEvidence, sponsorEvidence]) {
      if (
        evidence.version_registry < 1 ||
        evidence.data_classification_registry < 1 ||
        evidence.observability_events < 1 ||
        evidence.replay_verification < 1
      ) {
        throw new Error("Partner workflow governance evidence was incomplete.");
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          workflows: workflowRows.rows,
          lenderTraceId,
          sponsorTraceId,
          lenderEvidence,
          sponsorEvidence,
          lenderListTraceId: lenderList.governance?.traceId,
          sponsorListTraceId: sponsorList.governance?.traceId,
        },
        null,
        2
      )
    );
    console.log("Partner workflow governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown partner workflow smoke test error."
  );
  process.exit(1);
});
