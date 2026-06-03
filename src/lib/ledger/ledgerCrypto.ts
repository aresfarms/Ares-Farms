import crypto from "crypto";
import { LedgerEntry } from "./ledgerContract";

/**
 * LEDGER CRYPTO ENGINE
 * - single deterministic hashing implementation
 * - used by BOTH validator + rebuild script
 * - guarantees cross-layer consistency
 */

function stableStringify(obj: any): string {
  // enforce deterministic key order for JSON stability
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export function computeEventHash(entry: LedgerEntry, prevHash: string | null) {
  const payload = {
    id: entry.id,
    userId: entry.userId,
    eventType: entry.eventType,
    decision: entry.decision,
    compositeScore: entry.compositeScore,
    riskScore: entry.riskScore,

    input: entry.input ?? {},
    output: entry.output ?? {},
    trace: entry.trace ?? {},

    prevHash,
  };

  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}
