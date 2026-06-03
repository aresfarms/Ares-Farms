import { and, desc, eq } from "drizzle-orm";

import {
  auditEvents,
  canonicalLedger,
  canonicalLedgerMeta,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Audit/Ledger Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional audit accountability and immutable
 *   evidence visibility under governed authority.
 * - Vol II: Protects regulated audit, borrower, and operational records from
 *   uncontrolled export or broad inspection.
 * - Vol III: Provides deterministic, replay-safe read access across audit
 *   events and canonical ledger projections.
 * - Vol IV: Supports audit review, recovery, repair planning, examination
 *   preparation, and operational escalation.
 * - Vol V: Enforces classification, observability, replayability, source
 *   authority, version lineage, and controlled disclosure.
 */

export type ListAuditLedgerAdminRecordsInput = {
  eventId?: string | null;
  eventType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  eventHash?: string | null;
  source?: string | null;
  classification?: string | null;
  limit?: number | null;
  includeCanonicalLedger?: boolean | null;
  includeCanonicalMeta?: boolean | null;
};

export type AuditLedgerAdminRecords = {
  auditEvents: Array<typeof auditEvents.$inferSelect>;
  canonicalLedgerRows: Array<typeof canonicalLedger.$inferSelect>;
  canonicalMeta: Array<typeof canonicalLedgerMeta.$inferSelect>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeUuid(value: unknown): string | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return UUID_PATTERN.test(normalized) ? normalized : null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

function auditFilters(input: ListAuditLedgerAdminRecordsInput) {
  const filters = [
    normalizeUuid(input.eventId)
      ? eq(auditEvents.id, normalizeUuid(input.eventId) ?? "")
      : undefined,
    normalizeText(input.eventType)
      ? eq(auditEvents.eventType, normalizeText(input.eventType) ?? "")
      : undefined,
    normalizeText(input.entityType)
      ? eq(auditEvents.entityType, normalizeText(input.entityType) ?? "")
      : undefined,
    normalizeText(input.entityId)
      ? eq(auditEvents.entityId, normalizeText(input.entityId) ?? "")
      : undefined,
    normalizeText(input.eventHash)
      ? eq(auditEvents.eventHash, normalizeText(input.eventHash) ?? "")
      : undefined,
    normalizeText(input.source)
      ? eq(auditEvents.source, normalizeText(input.source) ?? "")
      : undefined,
    normalizeText(input.classification)
      ? eq(auditEvents.classification, normalizeText(input.classification) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return filters.length > 0 ? and(...filters) : undefined;
}

function canonicalFilters(input: ListAuditLedgerAdminRecordsInput) {
  const filters = [
    normalizeText(input.eventId)
      ? eq(canonicalLedger.id, normalizeText(input.eventId) ?? "")
      : undefined,
    normalizeText(input.eventType)
      ? eq(canonicalLedger.eventType, normalizeText(input.eventType) ?? "")
      : undefined,
    normalizeText(input.entityType)
      ? eq(canonicalLedger.entityType, normalizeText(input.entityType) ?? "")
      : undefined,
    normalizeText(input.entityId)
      ? eq(canonicalLedger.entityId, normalizeText(input.entityId) ?? "")
      : undefined,
    normalizeText(input.eventHash)
      ? eq(canonicalLedger.eventHash, normalizeText(input.eventHash) ?? "")
      : undefined,
    normalizeText(input.classification)
      ? eq(
          canonicalLedger.classification,
          normalizeText(input.classification) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return filters.length > 0 ? and(...filters) : undefined;
}

export async function listAuditLedgerAdminRecords(
  input: ListAuditLedgerAdminRecordsInput
): Promise<AuditLedgerAdminRecords> {
  const limit = normalizeLimit(input.limit);
  const auditWhere = auditFilters(input);
  const canonicalWhere = canonicalFilters(input);

  const auditRows = auditWhere
    ? await db
        .select()
        .from(auditEvents)
        .where(auditWhere)
        .orderBy(desc(auditEvents.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(auditEvents)
        .orderBy(desc(auditEvents.createdAt))
        .limit(limit);

  const canonicalRows =
    input.includeCanonicalLedger === true
      ? canonicalWhere
        ? await db
            .select()
            .from(canonicalLedger)
            .where(canonicalWhere)
            .orderBy(desc(canonicalLedger.createdAt))
            .limit(limit)
        : await db
            .select()
            .from(canonicalLedger)
            .orderBy(desc(canonicalLedger.createdAt))
            .limit(limit)
      : [];

  const metaRows =
    input.includeCanonicalMeta !== false
      ? await db
          .select()
          .from(canonicalLedgerMeta)
          .orderBy(desc(canonicalLedgerMeta.createdAt))
          .limit(Math.min(limit, 10))
      : [];

  return {
    auditEvents: auditRows,
    canonicalLedgerRows: canonicalRows,
    canonicalMeta: metaRows,
  };
}
