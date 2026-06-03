import "dotenv/config";

import { createHash } from "node:crypto";
import { Pool } from "pg";

/**
 * Document Storage Handoff Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms governed storage intent authority before raw file movement.
 * - Vol II: verifies borrower document storage remains controlled, consented,
 *   classified, and reviewable.
 * - Vol III: checks replay-safe handoff persistence without accepting raw
 *   binary content into API runtime.
 * - Vol IV: supports repeatable operator verification for document upload
 *   recovery, escalation, chain-of-custody, and audit preparation.
 * - Vol V: enforces source authority, classification, observability,
 *   replayability, version lineage, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  application?: {
    id?: string;
  };
  handoff?: {
    id?: string;
    applicationId?: string;
    borrowerId?: string | null;
    tenantId?: string | null;
    storageUri?: string;
    objectKey?: string;
    handoffToken?: string;
    handoffStatus?: string;
    rawContentAccepted?: boolean;
    providerConfigured?: boolean;
  };
  governance?: {
    traceId?: string;
  };
};

async function postAny(path: string, body: Record<string, unknown>): Promise<{
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
  const { status, json } = await postAny(path, body);

  if (status < 200 || status >= 300 || json.ok !== true) {
    throw new Error(
      `Document storage handoff smoke route failed: ${path} ${status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
      "DATABASE_URL is required for document storage handoff smoke testing."
    );
  }

  const runId = `document-storage-handoff-smoke-${Date.now()}`;
  const applicationId = `${runId}-application`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;

  const onboard = await postOk("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Document Storage Handoff Smoke Farm",
    county: "Wake",
    state: "NC",
    requestedAmount: 285000,
    metadata: {
      smokeRunId: runId,
    },
  });

  if (onboard.application?.id !== applicationId) {
    throw new Error(
      "Document storage handoff smoke onboarding did not create an application."
    );
  }

  const handoff = await postOk("/api/documents/storage-handoff", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    documentType: "farm_operating_plan",
    documentName: "Farm Operating Plan",
    fileName: "farm-operating-plan.pdf",
    mimeType: "application/pdf",
    byteSize: 8192,
    checksum: `${runId}-checksum`,
    metadata: {
      smokeRunId: runId,
    },
  });

  const handoffId = handoff.handoff?.id;
  const handoffToken = handoff.handoff?.handoffToken;
  const traceId = handoff.governance?.traceId;

  if (!handoffId || !handoffToken || !traceId) {
    throw new Error("Document storage handoff did not return durable evidence.");
  }

  if (handoff.handoff?.rawContentAccepted !== false) {
    throw new Error("Document storage handoff unexpectedly accepted raw content.");
  }

  if (handoff.handoff?.providerConfigured !== false) {
    throw new Error("Document storage handoff unexpectedly marked provider configured.");
  }

  const rawRejected = await postAny("/api/documents/storage-handoff", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    documentType: "tax_return",
    documentName: "Blocked Raw Tax Return",
    fileName: "blocked-tax-return.pdf",
    mimeType: "application/pdf",
    byteSize: 1024,
    fileContent: "blocked-raw-content",
    metadata: {
      smokeRunId: runId,
    },
  });

  if (rawRejected.status !== 400 || rawRejected.json.ok !== false) {
    throw new Error(
      `Raw content was not rejected by storage handoff route: ${
        rawRejected.status
      } ${JSON.stringify(rawRejected.json)}`
    );
  }

  const rawRejectedTraceId = rawRejected.json.governance?.traceId;

  if (!rawRejectedTraceId) {
    throw new Error("Raw-content rejection did not return trace evidence.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const handoffRows = await pool.query(
      `
        select id, application_id, borrower_id, tenant_id, document_type,
               storage_uri, object_key, upload_token_hash, handoff_status,
               raw_content_accepted, provider_configured, classification,
               replay_ref
        from document_storage_handoffs
        where id = $1
      `,
      [handoffId]
    );
    const handoffRow = handoffRows.rows[0];

    if (!handoffRow) {
      throw new Error("Document storage handoff row was not persisted.");
    }

    if (handoffRow.application_id !== applicationId) {
      throw new Error("Document storage handoff was not attached to application.");
    }

    if (handoffRow.raw_content_accepted !== false) {
      throw new Error("Persisted handoff incorrectly accepted raw content.");
    }

    if (handoffRow.upload_token_hash !== hashToken(handoffToken)) {
      throw new Error("Persisted handoff token hash did not match returned token.");
    }

    const evidence = await evidenceCounts(pool, traceId);
    const rawEvidenceRows = await pool.query(
      `
        select count(*)::int as count
        from observability_events
        where trace_id = $1
      `,
      [rawRejectedTraceId]
    );

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error("Document storage handoff governance evidence was incomplete.");
    }

    if (rawEvidenceRows.rows[0].count < 1) {
      throw new Error("Raw-content rejection did not persist observability evidence.");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          handoff: handoffRow,
          traceId,
          rawRejectedTraceId,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Document storage handoff governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown document storage handoff smoke test error."
  );
  process.exit(1);
});
