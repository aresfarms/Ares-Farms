import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";

import {
  auditEvents,
  canonicalLedger,
  canonicalLedgerMeta,
  observabilityEvents,
  replayVerification,
} from "@/db/schema";
import { db } from "@/lib/db";

export type ListAuditLedgerAdminRecordsInput = {
  eventId?: string | null;
  eventType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  eventHash?: string | null;
  source?: string | null;
  classification?: string | null;
  traceId?: string | null;
  moduleId?: string | null;
  anonymousId?: string | null;
  from?: Date | null;
  to?: Date | null;
  limit?: number | null;
  includeCanonicalLedger?: boolean | null;
  includeCanonicalMeta?: boolean | null;
  includeReplay?: boolean | null;
  includeObservability?: boolean | null;
};

export type AuditLedgerAdminRecords = {
  auditEvents: Array<typeof auditEvents.$inferSelect>;
  canonicalLedgerRows: Array<typeof canonicalLedger.$inferSelect>;
  canonicalMeta: Array<typeof canonicalLedgerMeta.$inferSelect>;
  replayRows: Array<typeof replayVerification.$inferSelect>;
  observabilityRows: Array<typeof observabilityEvents.$inferSelect>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function uuid(value: unknown): string | null {
  const normalized = text(value);
  return normalized && UUID_PATTERN.test(normalized) ? normalized : null;
}

function limitValue(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) return 25;
  return Math.min(value, 250);
}

function auditWhere(input: ListAuditLedgerAdminRecordsInput) {
  const filters = [
    uuid(input.eventId)
      ? eq(auditEvents.id, uuid(input.eventId) ?? "")
      : undefined,
    text(input.eventType)
      ? eq(auditEvents.eventType, text(input.eventType) ?? "")
      : undefined,
    text(input.entityType)
      ? eq(auditEvents.entityType, text(input.entityType) ?? "")
      : undefined,
    text(input.entityId)
      ? eq(auditEvents.entityId, text(input.entityId) ?? "")
      : undefined,
    text(input.eventHash)
      ? eq(auditEvents.eventHash, text(input.eventHash) ?? "")
      : undefined,
    text(input.source)
      ? eq(auditEvents.source, text(input.source) ?? "")
      : undefined,
    text(input.classification)
      ? eq(auditEvents.classification, text(input.classification) ?? "")
      : undefined,
    text(input.traceId)
      ? or(
          sql`${auditEvents.trace}->>'traceId' = ${text(input.traceId)}`,
          sql`${auditEvents.payload}->>'traceId' = ${text(input.traceId)}`,
          sql`${auditEvents.payload}->'metadata'->>'traceId' = ${text(input.traceId)}`,
        )
      : undefined,
    text(input.moduleId)
      ? or(
          eq(auditEvents.source, text(input.moduleId) ?? ""),
          sql`${auditEvents.trace}->>'moduleId' = ${text(input.moduleId)}`,
          sql`${auditEvents.payload}->>'moduleId' = ${text(input.moduleId)}`,
        )
      : undefined,
    text(input.anonymousId)
      ? or(
          eq(auditEvents.entityId, text(input.anonymousId) ?? ""),
          sql`${auditEvents.trace}->>'anonymousId' = ${text(input.anonymousId)}`,
          sql`${auditEvents.payload}->>'anonymousId' = ${text(input.anonymousId)}`,
          sql`${auditEvents.payload}->'data'->>'anonymousId' = ${text(input.anonymousId)}`,
        )
      : undefined,
    input.from ? gte(auditEvents.createdAt, input.from) : undefined,
    input.to ? lte(auditEvents.createdAt, input.to) : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return filters.length ? and(...filters) : undefined;
}

function canonicalWhere(input: ListAuditLedgerAdminRecordsInput) {
  const filters = [
    text(input.eventId)
      ? eq(canonicalLedger.id, text(input.eventId) ?? "")
      : undefined,
    text(input.eventType)
      ? eq(canonicalLedger.eventType, text(input.eventType) ?? "")
      : undefined,
    text(input.entityType)
      ? eq(canonicalLedger.entityType, text(input.entityType) ?? "")
      : undefined,
    text(input.entityId)
      ? eq(canonicalLedger.entityId, text(input.entityId) ?? "")
      : undefined,
    text(input.eventHash)
      ? eq(canonicalLedger.eventHash, text(input.eventHash) ?? "")
      : undefined,
    text(input.classification)
      ? eq(canonicalLedger.classification, text(input.classification) ?? "")
      : undefined,
    text(input.traceId)
      ? sql`${canonicalLedger.trace}->>'traceId' = ${text(input.traceId)}`
      : undefined,
    text(input.moduleId)
      ? sql`${canonicalLedger.trace}->>'moduleId' = ${text(input.moduleId)}`
      : undefined,
    text(input.anonymousId)
      ? sql`${canonicalLedger.trace}->>'anonymousId' = ${text(input.anonymousId)}`
      : undefined,
    input.from ? gte(canonicalLedger.createdAt, input.from) : undefined,
    input.to ? lte(canonicalLedger.createdAt, input.to) : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return filters.length ? and(...filters) : undefined;
}

function replayWhere(input: ListAuditLedgerAdminRecordsInput) {
  const filters = [
    text(input.traceId)
      ? or(
          eq(replayVerification.traceId, text(input.traceId) ?? ""),
          eq(replayVerification.replayRef, text(input.traceId) ?? ""),
        )
      : undefined,
    text(input.moduleId)
      ? or(
          eq(replayVerification.targetType, text(input.moduleId) ?? ""),
          sql`${replayVerification.metadata}->>'moduleId' = ${text(input.moduleId)}`,
          sql`${replayVerification.metadata}->>'module' = ${text(input.moduleId)}`,
        )
      : undefined,
    text(input.anonymousId)
      ? or(
          eq(replayVerification.targetId, text(input.anonymousId) ?? ""),
          sql`${replayVerification.metadata}->>'anonymousId' = ${text(input.anonymousId)}`,
        )
      : undefined,
    input.from ? gte(replayVerification.createdAt, input.from) : undefined,
    input.to ? lte(replayVerification.createdAt, input.to) : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return filters.length ? and(...filters) : undefined;
}

function observabilityWhere(input: ListAuditLedgerAdminRecordsInput) {
  const filters = [
    text(input.eventType)
      ? eq(observabilityEvents.eventType, text(input.eventType) ?? "")
      : undefined,
    text(input.traceId)
      ? or(
          eq(observabilityEvents.traceId, text(input.traceId) ?? ""),
          eq(observabilityEvents.replayRef, text(input.traceId) ?? ""),
        )
      : undefined,
    text(input.moduleId)
      ? eq(observabilityEvents.module, text(input.moduleId) ?? "")
      : undefined,
    text(input.anonymousId)
      ? or(
          eq(observabilityEvents.actorId, `anon:${text(input.anonymousId)}`),
          eq(observabilityEvents.actorId, text(input.anonymousId) ?? ""),
          sql`${observabilityEvents.metadata}->>'anonymousId' = ${text(input.anonymousId)}`,
        )
      : undefined,
    input.from ? gte(observabilityEvents.createdAt, input.from) : undefined,
    input.to ? lte(observabilityEvents.createdAt, input.to) : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return filters.length ? and(...filters) : undefined;
}

export async function listAuditLedgerAdminRecords(
  input: ListAuditLedgerAdminRecordsInput,
): Promise<AuditLedgerAdminRecords> {
  const limit = limitValue(input.limit);
  const aw = auditWhere(input);
  const cw = canonicalWhere(input);
  const rw = replayWhere(input);
  const ow = observabilityWhere(input);

  const auditQuery = db.select().from(auditEvents);
  const auditRows = await (aw ? auditQuery.where(aw) : auditQuery)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit);

  const canonicalRows = input.includeCanonicalLedger
    ? await (
        cw
          ? db.select().from(canonicalLedger).where(cw)
          : db.select().from(canonicalLedger)
      )
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

  const replayRows =
    input.includeReplay !== false
      ? await (
          rw
            ? db.select().from(replayVerification).where(rw)
            : db.select().from(replayVerification)
        )
          .orderBy(desc(replayVerification.createdAt))
          .limit(limit)
      : [];

  const observabilityRows =
    input.includeObservability !== false
      ? await (
          ow
            ? db.select().from(observabilityEvents).where(ow)
            : db.select().from(observabilityEvents)
        )
          .orderBy(desc(observabilityEvents.createdAt))
          .limit(limit)
      : [];

  return {
    auditEvents: auditRows,
    canonicalLedgerRows: canonicalRows,
    canonicalMeta: metaRows,
    replayRows,
    observabilityRows,
  };
}
