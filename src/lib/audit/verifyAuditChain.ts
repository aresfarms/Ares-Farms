import crypto from "crypto";

type LedgerEntry = {
  eventHash: string;
  prevHash: string | null;
  userId: string;
  eventType: string;
  decision: string;
  compositeScore: number;
  riskScore: number;
  input: any;
  output: any;
  trace: any;
};

export function verifyAuditChain(entries: LedgerEntry[]) {
  let brokenIndex: number | null = null;
  let chainValid = true;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const prev = entries[i + 1];

    const expectedPrevHash = prev ? prev.eventHash : "GENESIS";

    if (entry.prevHash !== expectedPrevHash) {
      chainValid = false;
      brokenIndex = i;
      break;
    }

    const payload = {
      userId: entry.userId,
      eventType: entry.eventType,
      decision: entry.decision,
      compositeScore: entry.compositeScore,
      riskScore: entry.riskScore,
      input: entry.input,
      output: entry.output,
      trace: entry.trace ?? {},
      prevHash: entry.prevHash,
    };

    const computed = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    if (computed !== entry.eventHash) {
      chainValid = false;
      brokenIndex = i;
      break;
    }
  }

  return {
    chainValid,
    brokenIndex,
  };
}
