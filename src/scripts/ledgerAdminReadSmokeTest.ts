import "dotenv/config";

import crypto from "crypto";
import { Pool } from "pg";

/**
 * Audit/Ledger Admin Read Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms accountable authority for audit and ledger inspection.
 * - Vol II: verifies regulated audit evidence is not exposed through broad
 *   non-authorized reads.
 * - Vol III: checks deterministic, replay-safe admin reads across audit
 *   events, canonical ledger projections, and canonical metadata.
 * - Vol IV: supports examination preparation, repair planning, escalation,
 *   and operational evidence preservation.
 * - Vol V: enforces classification, observability, replay, versioning, source
 *   authority, controlled disclosure, and export governance.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  count?: number;
  auditEventCount?: number;
  canonicalLedgerCount?: number;
  canonicalMetaCount?: number;
  auditEvents?: Array<{
    id?: string;
    eventType?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    eventHash?: string | null;
    classification?: string | null;
    source?: string | null;
  }>;
  governance?: {
    traceId?: string;
  };
};

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
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
      `Ledger admin read smoke GET returned unexpected status: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 200 && expectedStatus < 300 && json.ok !== true) {
    throw new Error(
      `Ledger admin read smoke GET failed: ${path} ${response.status} ${JSON.stringify(
        json
      )}`
    );
  }

  if (expectedStatus >= 400 && json.ok !== false) {
    throw new Error(
      `Ledger admin read smoke denial did not return ok=false: ${path} ${response.status} ${JSON.stringify(
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
      "DATABASE_URL is required for ledger admin read smoke testing."
    );
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const runId = `ledger-admin-read-smoke-${Date.now()}`;
  const auditEventId = crypto.randomUUID();
  const entityId = `${runId}-application`;
  const auditorId = `${runId}-auditor`;

  try {
    const chainHead = await pool.query(
      `
        select event_hash
        from audit_events
        order by created_at desc
        limit 1
      `
    );
    const previousHash = chainHead.rows[0]?.event_hash ?? "GENESIS";
    const sealedEventHash = sha256(`${runId}:${previousHash}:audit-event`);

    await pool.query(
      `
        insert into audit_events (
          id,
          user_id,
          event_type,
          entity_type,
          entity_id,
          decision,
          composite_score,
          risk_score,
          input,
          output,
          payload,
          trace,
          prev_hash,
          event_hash,
          hash,
          classification,
          source,
          created_at
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::jsonb,
          $10::jsonb,
          $11::jsonb,
          $12::jsonb,
          $13,
          $14,
          $14,
          $15,
          $16,
          now()
        )
      `,
      [
        auditEventId,
        auditorId,
        "LEDGER_ADMIN_READ_SMOKE_EVENT",
        "application",
        entityId,
        "AUDIT_LEDGER_ADMIN_READ_SMOKE",
        0,
        0,
        JSON.stringify({
          runId,
          smokeInput: true,
        }),
        JSON.stringify({
          expectedAdminRead: true,
        }),
        JSON.stringify({
          runId,
          tenantId: `${runId}-tenant`,
          borrowerId: `${runId}-borrower`,
          applicationId: entityId,
          advisoryOnly: true,
        }),
        JSON.stringify({
          traceId: `${runId}-source-trace`,
          replayRef: `${runId}-replay-ref`,
        }),
        previousHash,
        sealedEventHash,
        "RESTRICTED",
        "ledger-admin-read-smoke",
      ]
    );

    const scopedRead = await get("/api/ledger/admin", {
      role: "auditor",
      userId: auditorId,
      entityId,
      includeCanonicalLedger: true,
      includeCanonicalMeta: true,
      limit: 10,
    });

    const auditEvent = scopedRead.auditEvents?.find(
      (record) => record.id === auditEventId
    );

    if (
      scopedRead.auditEventCount !== 1 ||
      !auditEvent ||
      auditEvent.entityId !== entityId ||
      auditEvent.eventHash !== sealedEventHash ||
      auditEvent.source !== "ledger-admin-read-smoke" ||
      auditEvent.classification !== "RESTRICTED"
    ) {
      throw new Error(
        `Ledger admin read did not return the expected bounded audit event: ${JSON.stringify(
          scopedRead
        )}`
      );
    }

    await get(
      "/api/ledger/admin",
      {
        role: "operator",
        userId: `${runId}-operator`,
        entityId,
      },
      403
    );

    await get(
      "/api/ledger/admin",
      {
        role: "auditor",
        userId: auditorId,
      },
      403
    );

    const traceId = scopedRead.governance?.traceId;

    if (!traceId) {
      throw new Error("Ledger admin read did not return a governance trace ID.");
    }

    const evidence = await evidenceCounts(pool, traceId);

    if (
      evidence.version_registry < 1 ||
      evidence.data_classification_registry < 1 ||
      evidence.observability_events < 1 ||
      evidence.replay_verification < 1
    ) {
      throw new Error(
        `Ledger admin read did not persist complete governance evidence: ${JSON.stringify(
          evidence
        )}`
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          auditEventId,
          entityId,
          eventHash: sealedEventHash,
          scopedTraceId: traceId,
          count: scopedRead.count,
          auditEventCount: scopedRead.auditEventCount,
          canonicalLedgerCount: scopedRead.canonicalLedgerCount,
          canonicalMetaCount: scopedRead.canonicalMetaCount,
          evidence,
        },
        null,
        2
      )
    );
    console.log("Audit/ledger admin read governance smoke test passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
