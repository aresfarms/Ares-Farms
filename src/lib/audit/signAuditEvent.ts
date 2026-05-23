import crypto from "crypto";

export type SignableAuditEvent = {
  id: string;
  userId: string;
  eventType: string;
  decision: string;

  compositeScore: number;
  riskScore: number;

  input: any;
  output: any;
  trace: any;

  prevHash: string | null;
  eventHash: string;
};

function stableStringify(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export function signAuditEvent(
  event: SignableAuditEvent,
  secret: string
): string {
  const payload = {
    id: event.id,
    userId: event.userId,
    eventType: event.eventType,
    decision: event.decision,
    compositeScore: event.compositeScore,
    riskScore: event.riskScore,
    input: event.input,
    output: event.output,
    trace: event.trace,
    prevHash: event.prevHash,
    eventHash: event.eventHash,
  };

  const normalized = stableStringify(payload);

  return crypto
    .createHmac("sha256", secret)
    .update(normalized)
    .digest("hex");
}
