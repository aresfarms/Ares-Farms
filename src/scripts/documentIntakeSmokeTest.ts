import "dotenv/config";

import { Pool } from "pg";

/**
 * Document Intake Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms governed document submission authority.
 * - Vol II: verifies regulated borrower document metadata is attached to
 *   durable application state.
 * - Vol III: checks replay-safe document metadata persistence.
 * - Vol IV: supports repeatable operator verification for document intake.
 * - Vol V: enforces classification, consent, source authority,
 *   observability, replayability, version lineage, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
    propertyId?: string | null;
  };
  document?: {
    id?: string;
    applicationId?: string;
    status?: string;
    reviewStatus?: string;
  };
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
      `Document intake smoke route failed: ${path} ${response.status} ${JSON.stringify(
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
    throw new Error("DATABASE_URL is required for document intake smoke testing.");
  }

  const runId = `document-intake-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Document Intake Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 175000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error("Document smoke onboarding did not create an application.");
  }

  const submit = await post("/api/documents/submit", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    documentType: "farm_operating_plan",
    documentName: "Farm Operating Plan",
    fileName: "farm-operating-plan.pdf",
    mimeType: "application/pdf",
    byteSize: 4096,
    checksum: `${runId}-checksum`,
    storageUri: `governed://documents/${runId}/farm-operating-plan.pdf`,
    metadata: {
      smokeRunId: runId,
    },
  });

  const documentId = submit.document?.id;
  const documentTraceId = submit.governance?.traceId;

  if (!documentId || !documentTraceId) {
    throw new Error("Document submission did not return document evidence.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const documentRows = await pool.query(
      `
        select id, application_id, borrower_id, tenant_id, document_type,
               status, review_status, classification, replay_ref
        from application_documents
        where id = $1
      `,
      [documentId]
    );
    const document = documentRows.rows[0];

    if (!document) {
      throw new Error("Document row was not persisted.");
    }

    if (document.application_id !== applicationId) {
      throw new Error("Document row was not attached to the expected application.");
    }

    if (document.status !== "RECEIVED") {
      throw new Error("Document row did not record received status.");
    }

    if (document.review_status !== "REVIEW_REQUIRED") {
      throw new Error("Document row did not require review.");
    }

    const documentEvidence = await evidenceCounts(pool, documentTraceId);

    if (
      documentEvidence.version_registry < 1 ||
      documentEvidence.data_classification_registry < 1 ||
      documentEvidence.observability_events < 1 ||
      documentEvidence.replay_verification < 1
    ) {
      throw new Error("Document submission evidence was incomplete.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          document,
          documentTraceId,
          documentEvidence,
        },
        null,
        2
      )
    );
    console.log("Document intake governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown document intake smoke test error."
  );
  process.exit(1);
});
