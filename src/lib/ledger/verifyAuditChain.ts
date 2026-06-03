import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { sha256 } from "./cryptoSeal";

export async function verifyAuditChain() {
  const res = await db.execute(sql`
    SELECT *
    FROM canonical_promotion_events
    ORDER BY id ASC;
  `);

  const rows = res.rows as any[];

  let prevHash: string | null = null;
  let brokenIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const expected = sha256(
      JSON.stringify(
        {
          event_type: row.event_type,
          status: row.status,
          version_from: row.version_from,
          version_to: row.version_to,
          metadata: row.metadata,
          prevHash,
        },
        Object.keys(row).sort()
      )
    );

    const stored = row.metadata?.event_hash;

    if (stored && stored !== expected) {
      brokenIndex = i;
      break;
    }

    prevHash = stored ?? expected;
  }

  return {
    healthy: brokenIndex === -1,
    brokenIndex,
    total: rows.length,
  };
}
