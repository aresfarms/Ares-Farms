/**
 * Canonical Ledger Chain Validator
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes canonical chain validation as a backend authority control.
 *
 * - Vol II: Regulatory Governance
 *   Supports evidentiary integrity and compliance-grade ledger review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides deterministic chain validation over canonical ledger entries.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational inspection, recovery planning, and remediation queues.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, observability, anomaly review, explainability,
 *   versioning, and simulation/sandbox equivalence.
 */

export type CanonicalLedgerValidationIssue = {
  index: number;
  id: string;
  issue: "CHAIN_BREAK" | "MISSING_HASH" | "INVALID_ENTRY";
  reason: string;
};

export type CanonicalLedgerValidationResult = {
  valid: boolean;
  issues: CanonicalLedgerValidationIssue[];
};

type CanonicalLedgerEntry = {
  id?: string | null;
  prevHash?: string | null;
  prev_hash?: string | null;
  eventHash?: string | null;
  event_hash?: string | null;
};

function getEntryId(entry: CanonicalLedgerEntry, index: number): string {
  return entry.id ?? `ledger-row-${index}`;
}

function getPrevHash(entry: CanonicalLedgerEntry): string | null {
  return entry.prevHash ?? entry.prev_hash ?? null;
}

function getEventHash(entry: CanonicalLedgerEntry): string | null {
  return entry.eventHash ?? entry.event_hash ?? null;
}

export function validateCanonicalChain(
  entries: CanonicalLedgerEntry[]
): CanonicalLedgerValidationResult {
  const issues: CanonicalLedgerValidationIssue[] = [];

  entries.forEach((entry, index) => {
    const eventHash = getEventHash(entry);

    if (!eventHash) {
      issues.push({
        index,
        id: getEntryId(entry, index),
        issue: "MISSING_HASH",
        reason: "Ledger entry is missing an event hash.",
      });
    }

    if (index > 0) {
      const previousEntry = entries[index - 1];
      const previousHash = getEventHash(previousEntry);
      const prevHash = getPrevHash(entry);

      if (previousHash && prevHash && prevHash !== previousHash) {
        issues.push({
          index,
          id: getEntryId(entry, index),
          issue: "CHAIN_BREAK",
          reason:
            "Ledger entry previous hash does not match prior event hash.",
        });
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}
