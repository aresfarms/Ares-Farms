import { db } from "@/lib/db";

/**
 * OPTION C RULE:
 * Canonical view is a pure projection of audit_events.
 * NO transformation side-effects, NO persistence logic.
 */

export async function buildCanonicalView() {
  const res = await db.execute(`
    SELECT
      id,
      user_id,
      event_type,
      decision,
      composite_score,
      risk_score,
      input,
      output,
      trace,
      prev_hash,
      event_hash,
      created_at
    FROM audit_events
    ORDER BY created_at ASC
  `);

  return res.rows ?? [];
}
