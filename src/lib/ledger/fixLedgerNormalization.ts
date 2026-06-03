import crypto from "crypto";

/**
 * Ledger Normalization and Repair Helpers
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes deterministic ledger repair authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports evidentiary consistency and regulated audit repair.
 *
 * - Vol III: Technical Infrastructure
 *   Provides canonical normalization, hashing, and signing helpers.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational ledger repair, replay, and recovery procedures.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, observability, explainability, anomaly review,
 *   version governance, and simulation/sandbox equivalence.
 */

export type LedgerEntry = {
  id: string;
  eventType?: string | null;
  event_type?: string | null;
  entityType?: string | null;
  entity_type?: string | null;
  entityId?: string | null;
  entity_id?: string | null;
  payload?: unknown;
  prevHash?: string | null;
  prev_hash?: string | null;
  eventHash?: string | null;
  event_hash?: string | null;
  hash?: string | null;
  signature?: string | null;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  [key: string]: unknown;
};

export type NormalizedLedgerEntry = LedgerEntry & {
  eventType: string | null;
  entityType: string | null;
  entityId: string | null;
  prevHash: string | null;
  eventHash: string;
  hash: string;
  signature: string;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function computeEventHash(entry: LedgerEntry): string {
  const canonicalPayload = {
    id: entry.id,
    eventType: entry.eventType ?? entry.event_type ?? null,
    entityType: entry.entityType ?? entry.entity_type ?? null,
    entityId: entry.entityId ?? entry.entity_id ?? null,
    payload: entry.payload ?? null,
    prevHash: entry.prevHash ?? entry.prev_hash ?? null,
    createdAt:
      entry.createdAt instanceof Date
        ? entry.createdAt.toISOString()
        : entry.createdAt ?? entry.created_at ?? null,
  };

  return crypto
    .createHash("sha256")
    .update(stableStringify(canonicalPayload))
    .digest("hex");
}

export function signEvent(entry: LedgerEntry): string {
  return crypto
    .createHash("sha256")
    .update(`ares-ledger-signature:${computeEventHash(entry)}`)
    .digest("hex");
}

export function fixLedgerNormalization(
  entry: LedgerEntry
): NormalizedLedgerEntry {
  const eventHash = entry.eventHash ?? entry.event_hash ?? computeEventHash(entry);
  const signature = entry.signature ?? signEvent({ ...entry, eventHash });

  return {
    ...entry,
    eventType: entry.eventType ?? entry.event_type ?? null,
    entityType: entry.entityType ?? entry.entity_type ?? null,
    entityId: entry.entityId ?? entry.entity_id ?? null,
    prevHash: entry.prevHash ?? entry.prev_hash ?? null,
    eventHash,
    hash: entry.hash ?? eventHash,
    signature,
  };
}
