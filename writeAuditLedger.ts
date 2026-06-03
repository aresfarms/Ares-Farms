import postgres from "postgres";
import crypto from "crypto";
import { randomUUID } from "crypto";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
});

// ------------------------------
// SAFE NORMALIZATION
// ------------------------------
function safeJson(v: any) {
  if (v === undefined || v === null) return {};
  return typeof v === "object" ? v : { value: v };
}

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ------------------------------
// GET LAST HASH (CHAIN LINK)
// ------------------------------
async function getLastHash() {
  const rows = await sql`
    select event_hash
    from audit_events
    order by created_at desc
    limit 1
  `;

  return rows?.[0]?.event_hash ?? "GENESIS";
}

// ------------------------------
// MAIN WRITER (CHAINED LEDGER)
// ------------------------------
export async function writeAuditEvent(input: {
  userId: string;
  eventType: string;
  decision: string;
  compositeScore: number;
  riskScore: number;
  input?: any;
  output?: any;
  trace?: any;
}) {
  const prevHash = await getLastHash();

  const normalized = {
    userId: input.userId,
    eventType: input.eventType,
    decision: input.decision,
    compositeScore: Number(input.compositeScore ?? 0),
    riskScore: Number(input.riskScore ?? 0),
    input: safeJson(input.input),
    output: safeJson(input.output),
    trace: safeJson(input.trace),
    prevHash,
  };

  // deterministic canonical string
  const canonical = JSON.stringify(normalized);

  const eventHash = hash(canonical);

  const id = randomUUID();

  const [row] = await sql`
    insert into audit_events (
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
      event_hash
    )
    values (
      ${id},
      ${normalized.userId},
      ${normalized.eventType},
      ${normalized.decision},
      ${normalized.compositeScore},
      ${normalized.riskScore},
      ${normalized.input},
      ${normalized.output},
      ${normalized.trace},
      ${prevHash},
      ${eventHash}
    )
    returning *
  `;

  return row;
}
