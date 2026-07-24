import { listAuditLedgerAdminRecords } from "@/lib/ledger/auditLedgerAdminStore";

import { writeAuditLedger } from "./writeAuditLedger";

export type AuditEvent = {
  traceId: string;
  eventType?: string;
  event_type?: string;
  payload?: unknown;
  metadata?: unknown;
  timestamp?: string;
  createdAt?: string | Date | null;
  sourceTable?: string;
  [key: string]: unknown;
};

export const auditLedger = {
  async write(event: AuditEvent) {
    return writeAuditLedger("audit_events", {
      ...event,
      traceId: event.traceId,
      metadata:
        event.metadata &&
        typeof event.metadata === "object" &&
        !Array.isArray(event.metadata)
          ? (event.metadata as Record<string, unknown>)
          : undefined,
      timestamp: event.timestamp ?? new Date().toISOString(),
    });
  },
};

export async function getTrace(traceId: string): Promise<AuditEvent[]> {
  const normalized = traceId.trim();
  if (!normalized) return [];

  const records = await listAuditLedgerAdminRecords({
    traceId: normalized,
    includeCanonicalLedger: true,
    includeCanonicalMeta: false,
    includeReplay: true,
    includeObservability: true,
    limit: 250,
  });

  return [
    ...records.auditEvents.map((row) => ({
      ...row,
      traceId: normalized,
      eventType: row.eventType ?? undefined,
      timestamp: row.createdAt?.toISOString(),
      sourceTable: "audit_events",
    })),
    ...records.canonicalLedgerRows.map((row) => ({
      ...row,
      traceId: normalized,
      eventType: row.eventType ?? undefined,
      timestamp: row.createdAt?.toISOString(),
      sourceTable: "canonical_ledger",
    })),
    ...records.replayRows.map((row) => ({
      ...row,
      traceId: row.traceId,
      eventType: "REPLAY_VERIFICATION",
      timestamp: row.createdAt?.toISOString(),
      sourceTable: "replay_verification",
    })),
    ...records.observabilityRows.map((row) => ({
      ...row,
      traceId: row.traceId,
      eventType: row.eventType,
      timestamp: row.createdAt?.toISOString(),
      sourceTable: "observability_events",
    })),
  ].sort((a, b) =>
    String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? "")),
  );
}
