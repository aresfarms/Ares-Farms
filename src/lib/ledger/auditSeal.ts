import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createEventHash } from "./cryptoSeal";

async function getLastAuditHash() {
  const res = await db.execute(sql`
    SELECT event_hash
    FROM canonical_promotion_events
    ORDER BY id DESC
    LIMIT 1;
  `);

  return (res.rows?.[0] as any)?.event_hash ?? null;
}

export async function writeSealedAuditEvent(input: {
  event_type: string;
  status: string;
  version_from?: number;
  version_to?: number;
  metadata?: any;
}) {
  const prevHash = await getLastAuditHash();

  const eventHash = createEventHash(input, prevHash);

  await db.execute(sql`
    INSERT INTO canonical_promotion_events (
      event_type,
      status,
      version_from,
      version_to,
      metadata
    )
    VALUES (
      ${input.event_type},
      ${input.status},
      ${input.version_from ?? null},
      ${input.version_to ?? null},
      ${JSON.stringify(input.metadata ?? {})}
    );
  `);

  // store hash separately via update (or extend schema later)
  await db.execute(sql`
    UPDATE canonical_promotion_events
    SET metadata = jsonb_set(
      metadata,
      '{event_hash}',
      to_jsonb(${eventHash})
    )
    WHERE id = (
      SELECT MAX(id) FROM canonical_promotion_events
    );
  `);

  return eventHash;
}
