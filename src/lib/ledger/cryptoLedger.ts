import crypto from "crypto";

export type CryptoLedgerInput = {
  id: string;
  user_id: string;
  event_type: string;
  decision: string;
  composite_score: number;
  risk_score: number;
  input: any;
  output: any;
  trace: any;
  prev_hash: string | null;
};

/**
 * TRUE CHAINED CRYPTO HASH
 * (each event depends on previous hash → tamper-evident)
 */
export function computeLedgerHash(input: CryptoLedgerInput): string {
  const payload = {
    id: input.id,
    user_id: input.user_id,
    event_type: input.event_type,
    decision: input.decision,
    composite_score: input.composite_score,
    risk_score: input.risk_score,
    input: input.input,
    output: input.output,
    trace: input.trace,
    prev_hash: input.prev_hash,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}
