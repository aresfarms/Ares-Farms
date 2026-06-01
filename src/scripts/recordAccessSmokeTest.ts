import "dotenv/config";

import { Pool } from "pg";

/**
 * Record-Level Access Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable access to specific governed records.
 * - Vol II: verifies borrower/application records cannot be crossed by
 *   mismatched borrower or tenant scope.
 * - Vol III: checks deterministic denial behavior for application-linked
 *   backend routes.
 * - Vol IV: supports repeatable operator verification before dashboards,
 *   portals, review queues, or disclosure surfaces are expanded.
 * - Vol V: enforces controlled disclosure, observability, replayability,
 *   source authority, classification boundaries, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  governance?: {
    traceId?: string;
    recordAccess?: {
      allowed?: boolean;
      deniedScopes?: string[];
    };
  };
};

type DenialCase = {
  name: string;
  path: string;
  body: Record<string, unknown>;
  expectedDeniedScope: string;
};

async function post(path: string, body: Record<string, unknown>): Promise<{
  status: number;
  json: RouteJson;
}> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    json: (await response.json()) as RouteJson,
  };
}

async function postOk(path: string, body: Record<string, unknown>): Promise<RouteJson> {
  const { status, json } = await post(path, body);

  if (status < 200 || status >= 300 || json.ok !== true) {
    throw new Error(
      `Record access setup route failed: ${path} ${status} ${JSON.stringify(json)}`
    );
  }

  return json;
}

async function postDenied(input: DenialCase): Promise<RouteJson> {
  const { status, json } = await post(input.path, input.body);

  if (status !== 403 || json.ok !== false) {
    throw new Error(
      `Record access denial failed: ${input.name} ${status} ${JSON.stringify(
        json
      )}`
    );
  }

  const recordAccess = json.governance?.recordAccess;

  if (recordAccess?.allowed !== false) {
    throw new Error(
      `Record access denial did not return a denied recordAccess decision: ${
        input.name
      } ${JSON.stringify(json)}`
    );
  }

  if (!recordAccess.deniedScopes?.includes(input.expectedDeniedScope)) {
    throw new Error(
      `Record access denial did not include expected scope "${
        input.expectedDeniedScope
      }": ${input.name} ${JSON.stringify(json)}`
    );
  }

  if (!json.governance?.traceId) {
    throw new Error(`Record access denial did not return traceId: ${input.name}`);
  }

  return json;
}

async function evidenceCount(pool: Pool, traceId: string): Promise<number> {
  const rows = await pool.query(
    "select count(*)::int as count from observability_events where trace_id = $1",
    [traceId]
  );

  return rows.rows[0].count;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for record access smoke testing.");
  }

  const runId = `record-access-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const blockedTenantId = `${runId}-blocked-tenant`;
  const blockedBorrowerId = `${runId}-blocked-borrower`;

  const onboard = await postOk("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Record Access Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 205000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Record access smoke onboarding did not create application.");
  }

  const denialCases: DenialCase[] = [
    {
      name: "onboard-existing-application-cross-record-denied",
      path: "/api/onboard",
      expectedDeniedScope: "borrowerId",
      body: {
        role: "borrower",
        borrowerId: blockedBorrowerId,
        tenantId,
        applicationId,
        farmName: "Blocked Record Access Update",
        county: "Wake",
        state: "NC",
        requestedAmount: 205000,
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "apply-existing-application-cross-record-denied",
      path: "/api/apply",
      expectedDeniedScope: "borrowerId",
      body: {
        role: "borrower",
        borrowerId: blockedBorrowerId,
        tenantId,
        applicationId,
        eventType: "APPLICATION_SUBMITTED",
        entityType: "application",
        entityId: applicationId,
        payload: {
          requestedAmount: 205000,
        },
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "document-borrower-cross-record-denied",
      path: "/api/documents/submit",
      expectedDeniedScope: "borrowerId",
      body: {
        role: "borrower",
        borrowerId: blockedBorrowerId,
        tenantId,
        applicationId,
        documentType: "farm_operating_plan",
        documentName: "Blocked Farm Operating Plan",
        fileName: "blocked-plan.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        checksum: `${runId}-blocked-checksum`,
        storageUri: `governed://documents/${runId}/blocked-plan.pdf`,
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "document-storage-handoff-borrower-cross-record-denied",
      path: "/api/documents/storage-handoff",
      expectedDeniedScope: "borrowerId",
      body: {
        role: "borrower",
        borrowerId: blockedBorrowerId,
        tenantId,
        applicationId,
        documentType: "farm_operating_plan",
        documentName: "Blocked Storage Handoff",
        fileName: "blocked-storage-handoff.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        checksum: `${runId}-blocked-storage-checksum`,
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "connector-tenant-cross-record-denied",
      path: "/api/connectors/source-check",
      expectedDeniedScope: "tenantId",
      body: {
        role: "operator",
        borrowerId,
        tenantId: blockedTenantId,
        applicationId,
        sourceId: "usda-fsa",
        queryType: "program_reference",
        query: {
          state: "NC",
          county: "Wake",
        },
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "rule-evaluation-tenant-cross-record-denied",
      path: "/api/rules/evaluate",
      expectedDeniedScope: "tenantId",
      body: {
        role: "operator",
        borrowerId,
        tenantId: blockedTenantId,
        applicationId,
        operation: "regulated-eligibility-review",
        facts: {
          state: "NC",
          county: "Wake",
          acreage: 42,
        },
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "human-review-tenant-cross-record-denied",
      path: "/api/reviews/human",
      expectedDeniedScope: "tenantId",
      body: {
        role: "operator",
        borrowerId,
        tenantId: blockedTenantId,
        applicationId,
        reviewType: "regulated_decision_review",
        sourceType: "rule_overlay_evaluation",
        sourceId: `${runId}-blocked-rule-evaluation`,
        priority: "HIGH",
        candidateOutcome: "DENIAL_REVIEW",
        adverseActionCandidate: true,
        reasonCodes: ["ADVERSE_ACTION_REVIEW_REQUIRED"],
        metadata: {
          smokeRunId: runId,
        },
      },
    },
    {
      name: "partner-workflow-borrower-cross-record-denied",
      path: "/api/partners/workflows",
      expectedDeniedScope: "borrowerId",
      body: {
        role: "lender",
        userId: `${runId}-blocked-lender`,
        partnerType: "LENDER",
        partnerId: `${runId}-blocked-lender`,
        partnerName: "Blocked Cross-Record Lender",
        borrowerId: blockedBorrowerId,
        tenantId,
        applicationId,
        workflowType: "LENDER_REVIEW",
        workflowStage: "DUE_DILIGENCE",
        priority: "HIGH",
        metadata: {
          smokeRunId: runId,
        },
      },
    },
  ];

  const denials = [];

  for (const denialCase of denialCases) {
    const denied = await postDenied(denialCase);

    denials.push({
      name: denialCase.name,
      traceId: denied.governance?.traceId,
      deniedScopes: denied.governance?.recordAccess?.deniedScopes ?? [],
    });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    for (const denial of denials) {
      const traceId = denial.traceId;

      if (!traceId) {
        throw new Error(`Missing traceId for denial ${denial.name}.`);
      }

      const count = await evidenceCount(pool, traceId);

      if (count < 1) {
        throw new Error(
          `Record access denial did not persist observability evidence: ${denial.name}`
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          applicationId,
          denials,
        },
        null,
        2
      )
    );
    console.log("Record-level access governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown record access smoke test error."
  );
  process.exit(1);
});
