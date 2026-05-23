import crypto from "crypto";

import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

/**
 * Canonical Ledger Replay Verifier
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes replay as a constitutional audit control.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulated evidentiary reconstruction of ledger state.
 *
 * - Vol III: Technical Infrastructure
 *   Uses deterministic hashing and canonical database access.
 *
 * - Vol IV: Operational Runbooks
 *   Provides an executable verification path for operational recovery.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Supports replayability, observability, explainability, anomaly detection,
 *   version control, and audit-chain integrity.
 *
 * Build Rule:
 * This script must not mutate production ledger state.
 * It verifies deterministic reconstruction only.
 */

type LedgerRow = {
  id: string;
  event_type: string | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: unknown;
  prev_hash: string | null;
  event_hash: string | null;
  created_at: string | Date | null;
};

type ReplayResult = {
  verified: boolean;
  checkedRows: number;
  failedAt: string | null;
  expectedHash: string | null;
  actualHash: string | null;
  timestamp: string;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function computeEventHash(row: LedgerRow): string {
  const canonicalPayload = {
    id: row.id,
    event_type: row.event_type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    payload: row.payload,
    prev_hash: row.prev_hash,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  };

  return crypto
    .createHash("sha256")
    .update(stableStringify(canonicalPayload))
    .digest("hex");
}

export async function replayCanonicalLedger(): Promise<ReplayResult> {
  const result = await db.execute(sql`
    SELECT
      id,
      event_type,
      entity_type,
      entity_id,
      payload,
      prev_hash,
      event_hash,
      created_at
    FROM audit_events
    ORDER BY created_at ASC, id ASC
  `);

  const rows = Array.isArray(result) ? (result as LedgerRow[]) : [];

  for (const row of rows) {
    const expectedHash = computeEventHash(row);

    if (row.event_hash !== expectedHash) {
      return {
        verified: false,
        checkedRows: rows.indexOf(row) + 1,
        failedAt: row.id,
        expectedHash,
        actualHash: row.event_hash,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return {
    verified: true,
    checkedRows: rows.length,
    failedAt: null,
    expectedHash: null,
    actualHash: null,
    timestamp: new Date().toISOString(),
  };
}

async function main() {
  const result = await replayCanonicalLedger();
  console.log(JSON.stringify(result, null, 2));

  if (!result.verified) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        verified: false,
        error: error instanceof Error ? error.message : "Unknown replay error",
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  process.exitCode = 1;
});
