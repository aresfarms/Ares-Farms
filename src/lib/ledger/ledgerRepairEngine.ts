import crypto from "crypto";

type Event = any;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeEvent(e: Event) {
  return {
    id: e.id,
    user_id: e.user_id,
    event_type: e.event_type,
    decision: e.decision,
    composite_score: e.composite_score,
    risk_score: e.risk_score,
    input: e.input ?? {},
    output: e.output ?? {},
    created_at: e.created_at,
  };
}

export function repairEventChain(events: Event[]) {
  // 1. deterministic ordering
  const sorted = [...events].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const repaired: Event[] = [];
  let prevHash: string | null = null;

  for (const raw of sorted) {
    const base = normalizeEvent(raw);

    const eventHash = sha256(JSON.stringify(base));

    const clean = {
      ...raw,
      event_hash: eventHash,
      hash: eventHash,
      prev_hash: prevHash,
    };

    repaired.push(clean);
    prevHash = eventHash;
  }

  return {
    chain: repaired,
    summary: {
      total: repaired.length,
      healthy: true,
      brokenCount: 0,
    },
  };
}
