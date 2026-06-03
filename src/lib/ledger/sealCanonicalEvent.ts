import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { computeLedgerHash } from "@/lib/ledger/cryptoLedger";

type SealInput = {
  id: string;
  userId: string;
  eventType: string;
  decision: string;
  compositeScore: number;
  riskScore: number;
  input: any;
  output: any;
  trace?: any;
};

/**
 * Fetch latest hash in chain
 */
async function getLastHash(): Promise<string | null> {
  const res = await db.execute(sql`
    SELECT event_hash
    FROM canonical_ledger_v2
    ORDER BY created_at DESC
    LIMIT 1;
  `);

  return (res.rows[0] as any)?.event_hash ?? null;
}

/**
 * FINAL WRITE PATH (cryptographically chained + DB-safe)
 */
export async function sealCanonicalEvent(data: SealInput) {
  const prevHash = await getLastHash();

  const eventHash = computeLedgerHash({
    id: data.id,
    user_id: data.userId,
    event_type: data.eventType,
    decision: data.decision,
    composite_score: data.compositeScore,
    risk_score: data.riskScore,
    input: data.input,
    output: data.output,
    trace: data.trace ?? {},
    prev_hash: prevHash,
  });

  await db.execute(sql`
    INSERT INTO canonical_ledger_v2 (
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
    )
    VALUES (
      ${data.id},
      ${data.userId},
      ${data.eventType},
      ${data.decision},
      ${data.compositeScore},
      ${data.riskScore},
      ${JSON.stringify(data.input)}::jsonb,
      ${JSON.stringify(data.output)}::jsonb,
      ${JSON.stringify(data.trace ?? {})}::jsonb,
      ${prevHash},
      ${eventHash},
      NOW()
    );
  `);

  return {
    id: data.id,
    prevHash,
    eventHash,
  };
}
