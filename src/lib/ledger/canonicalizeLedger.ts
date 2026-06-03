import { AuditEvent } from "@/lib/db/schema";

export type CanonicalLedgerEntry = AuditEvent & {
  canonical: {
    isGenesis: boolean;
    isBroken: boolean;
    repairHint?: string;
    computedHash: string | null;
    expectedPrevHash: string | null;
  };
};

/**
 * Canonical repair layer (READ-ONLY)
 * - Does NOT mutate DB
 * - Produces normalized ledger view for compliance + audit replay
 */
export function canonicalizeLedger(
  entries: AuditEvent[]
): CanonicalLedgerEntry[] {
  let prevHash: string | null = null;

  return entries.map((entry, index) => {
    const isGenesis = index === 0;

    const expectedPrevHash = isGenesis ? null : prevHash;

    const isBroken =
      !isGenesis &&
      !!entry.prevHash &&
      entry.prevHash !== expectedPrevHash;

    const computedHash = entry.eventHash ?? null;

    const canonical: CanonicalLedgerEntry["canonical"] = {
      isGenesis,
      isBroken,
      expectedPrevHash,
      computedHash,
      repairHint: isBroken
        ? "CHAIN_MISMATCH_DETECTED"
        : undefined,
    };

    prevHash = entry.eventHash ?? prevHash;

    return {
      ...entry,
      canonical,
    };
  });
}
