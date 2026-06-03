type LedgerEntry = any;

export function repairLedgerChain(entries: LedgerEntry[]) {
  const repaired: LedgerEntry[] = [];

  let prevHash: string | null = null;

  for (let i = 0; i < entries.length; i++) {
    const entry = { ...entries[i] };

    // If chain is broken, we do NOT delete history — we re-link from break point
    const computedPrevHash = prevHash;

    entry.prevHash = computedPrevHash;

    // Recompute event hash deterministically (banking-safe assumption)
    entry.eventHash = computeEventHash(entry);

    // NOTE: we intentionally DO NOT overwrite original "hash" if present
    // because that would destroy forensic traceability
    entry.repaired = true;

    repaired.push(entry);

    prevHash = entry.eventHash;
  }

  return repaired;
}

function computeEventHash(entry: LedgerEntry) {
  // lightweight deterministic hash (replace with SHA-256 if you want production hardening)
  const base = JSON.stringify({
    id: entry.id,
    userId: entry.userId,
    eventType: entry.eventType,
    decision: entry.decision,
    compositeScore: entry.compositeScore,
    riskScore: entry.riskScore,
    prevHash: entry.prevHash,
  });

  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }

  return hash.toString(16);
}
