/**
 * Canonical Ledger Writer
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes governed canonical ledger construction authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports evidentiary audit reconstruction from regulated event records.
 *
 * - Vol III: Technical Infrastructure
 *   Provides deterministic canonical writer behavior over normalized ledger rows.
 *
 * - Vol IV: Operational Runbooks
 *   Supports rebuild, inspection, repair, and recovery procedures.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, observability, explainability, anomaly review,
 *   version governance, and simulation/sandbox equivalence.
 */

export type LedgerEntry = {
  id: string;
  eventType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
  prevHash?: string | null;
  eventHash?: string | null;
  hash?: string | null;
  classification?: string | null;
  source?: string | null;
  createdAt?: Date | string | null;

  userId?: string | null;
  decision?: unknown;
  compositeScore?: number | null;
  riskScore?: number | null;

  [key: string]: unknown;
};

export type CanonicalWriterIssue = {
  index: number;
  id: string;
  issue: "MISSING_EVENT_HASH" | "CHAIN_BREAK";
  reason: string;
};

export type CanonicalWriterResult = {
  ok: boolean;
  valid: boolean;
  brokenAt: number | null;
  issues: CanonicalWriterIssue[];
  entries: LedgerEntry[];
  updated: LedgerEntry[];
};

export function buildLedgerCanonicalWriter(
  entries: LedgerEntry[]
): CanonicalWriterResult {
  const issues: CanonicalWriterIssue[] = [];

  entries.forEach((entry, index) => {
    const currentHash = entry.eventHash ?? entry.hash ?? null;

    if (!currentHash) {
      issues.push({
        index,
        id: entry.id,
        issue: "MISSING_EVENT_HASH",
        reason: "Ledger entry is missing eventHash/hash.",
      });
    }

    if (index > 0) {
      const previousEntry = entries[index - 1];
      const previousHash =
        previousEntry.eventHash ?? previousEntry.hash ?? null;

      if (entry.prevHash && previousHash && entry.prevHash !== previousHash) {
        issues.push({
          index,
          id: entry.id,
          issue: "CHAIN_BREAK",
          reason: "Ledger entry prevHash does not match previous hash.",
        });
      }
    }
  });

  return {
    ok: issues.length === 0,
    valid: issues.length === 0,
    brokenAt: issues.length > 0 ? issues[0].index : null,
    issues,
    entries,
    updated: entries,
  };
}
