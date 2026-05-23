import {
  LedgerEntry,
  fixLedgerNormalization,
  computeEventHash,
  signEvent,
} from "./fixLedgerNormalization";

/**
 * Full ledger repair pass
 * - fixes broken eventHash
 * - rebuilds prevHash chain
 * - re-signs all entries
 */
export function repairLedgerEntries(entries: LedgerEntry[]) {
  const repaired: LedgerEntry[] = [];

  let prevHash = "GENESIS";

  for (const entry of entries) {
    const normalized = fixLedgerNormalization(entry);

    const eventHash = computeEventHash({
      ...normalized,
      prevHash,
    });

    const signedEntry: LedgerEntry = {
      ...entry,

      userId: entry.userId ?? "anonymous",
      compositeScore: String(entry.compositeScore),
      riskScore: String(entry.riskScore),

      input: entry.input ?? {},
      output: entry.output ?? {},
      trace: entry.trace ?? {},

      prevHash,
      eventHash,

      hash: signEvent({
        ...normalized,
        prevHash,
        eventHash,
      }),
    };

    repaired.push(signedEntry);

    prevHash = eventHash;
  }

  return repaired;
}
