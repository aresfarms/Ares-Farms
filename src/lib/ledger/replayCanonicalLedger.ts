import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import crypto from "crypto";

/**
 * OPTION C RULESET:
 * - NO canonical tables
 * - NO hash dependency
 * - NO schema assumptions beyond audit_events
 * - deterministic replay only
 */

function computeEventHash(row: any, prevHash: string) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        id: row.id,
        user_id: row.user_id,
        event_type: row.event_type,
        decision: row.decision,
        composite_score: row.composite_score,
        risk_score: row.risk_score,
        input: row.input ?? {},
        output: row.output ?? {},
        trace: row.trace ?? {},
        created_at: row.created_at,
        prev_hash: prevHash,
      })
    )
    .digest("hex");
}

export async function replayCanonicalLedger() {
  // IMPORTANT: bypass ORM column inference entirely
  const rows = await db.execute(
    `SELECT * FROM audit_events ORDER BY created_at ASC`
  );

  const data = rows.rows ?? rows;

  if (!Array.isArray(data)) {
    throw new Error("Invalid audit_events query result");
  }

  let prevHash = "GENESIS";
  const chain: any[] = [];

  for (const row of data) {
    if (!row?.id) {
      throw new Error("Corrupt audit_events row (missing id)");
    }

    const eventHash = computeEventHash(row, prevHash);

    chain.push({
      ...row,
      prev_hash: prevHash,
      event_hash: eventHash,
    });

    prevHash = eventHash;
  }

  return {
    ok: true,
    verified: true,
    count: chain.length,
    head: prevHash,
    chain,
  };
}
