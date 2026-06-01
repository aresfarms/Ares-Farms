import { and, desc, eq } from "drizzle-orm";

import {
  billingEvents,
  paymentConnectorAdapters,
  paymentConnectorExecutions,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Payment Connector Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for payment connector lifecycle reads.
 * - Vol II: Protects tenant, billing, credential, refund, dispute,
 *   reconciliation, and entitlement-adjacent metadata.
 * - Vol III: Provides deterministic, replay-safe payment connector lifecycle
 *   reads before dashboards or operator workflows consume these records.
 * - Vol IV: Supports connector review, payment recovery, dispute/refund
 *   oversight, reconciliation, audit preparation, and escalation.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, connector governance, controlled disclosure, and evidence review.
 */

export type ListPaymentConnectorAdminRecordsInput = {
  adapterId?: string | null;
  executionId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
  tenantId?: string | null;
  processorType?: string | null;
  certificationStatus?: string | null;
  executionStatus?: string | null;
  limit?: number | null;
  includeExecutions?: boolean | null;
  includeBillingEvents?: boolean | null;
};

export type PaymentConnectorAdminRecord = {
  adapter: typeof paymentConnectorAdapters.$inferSelect;
  executions: Array<typeof paymentConnectorExecutions.$inferSelect>;
  billingEvents: Array<typeof billingEvents.$inferSelect>;
};

export type PaymentConnectorAdminScopeRecord = {
  adapterId?: string | null;
  executionId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
  tenantId?: string | null;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeStatus(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

async function adapterIdForExecution(
  executionId?: string | null
): Promise<string | null> {
  const normalizedExecutionId = normalizeText(executionId);

  if (!normalizedExecutionId) {
    return null;
  }

  const rows = await db
    .select()
    .from(paymentConnectorExecutions)
    .where(eq(paymentConnectorExecutions.id, normalizedExecutionId))
    .limit(1);

  return rows[0]?.adapterId ?? null;
}

async function adapterIdForSession(
  sessionId?: string | null
): Promise<string | null> {
  const normalizedSessionId = normalizeText(sessionId);

  if (!normalizedSessionId) {
    return null;
  }

  const rows = await db
    .select()
    .from(paymentConnectorExecutions)
    .where(eq(paymentConnectorExecutions.sessionId, normalizedSessionId))
    .orderBy(desc(paymentConnectorExecutions.createdAt))
    .limit(1);

  return rows[0]?.adapterId ?? null;
}

async function adapterIdForBillingEvent(
  billingEventId?: string | null
): Promise<string | null> {
  const normalizedBillingEventId = normalizeText(billingEventId);

  if (!normalizedBillingEventId) {
    return null;
  }

  const executionRows = await db
    .select()
    .from(paymentConnectorExecutions)
    .where(eq(paymentConnectorExecutions.billingEventId, normalizedBillingEventId))
    .orderBy(desc(paymentConnectorExecutions.createdAt))
    .limit(1);

  if (executionRows[0]?.adapterId) {
    return executionRows[0].adapterId;
  }

  const billingRows = await db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.billingEventId, normalizedBillingEventId))
    .limit(1);
  const sessionId = billingRows[0]?.sessionId ?? null;

  return adapterIdForSession(sessionId);
}

async function loadExecutions(input: {
  adapterId: string;
  executionId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
  tenantId?: string | null;
  executionStatus?: string | null;
  includeExecutions: boolean;
}): Promise<Array<typeof paymentConnectorExecutions.$inferSelect>> {
  if (!input.includeExecutions) {
    return [];
  }

  const filters = [
    eq(paymentConnectorExecutions.adapterId, input.adapterId),
    normalizeText(input.executionId)
      ? eq(paymentConnectorExecutions.id, normalizeText(input.executionId) ?? "")
      : undefined,
    normalizeText(input.billingEventId)
      ? eq(
          paymentConnectorExecutions.billingEventId,
          normalizeText(input.billingEventId) ?? ""
        )
      : undefined,
    normalizeText(input.sessionId)
      ? eq(
          paymentConnectorExecutions.sessionId,
          normalizeText(input.sessionId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(
          paymentConnectorExecutions.tenantId,
          normalizeText(input.tenantId) ?? ""
        )
      : undefined,
    normalizeStatus(input.executionStatus)
      ? eq(
          paymentConnectorExecutions.executionStatus,
          normalizeStatus(input.executionStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return db
    .select()
    .from(paymentConnectorExecutions)
    .where(and(...filters))
    .orderBy(desc(paymentConnectorExecutions.createdAt));
}

async function loadBillingEvents(
  executions: Array<typeof paymentConnectorExecutions.$inferSelect>,
  includeBillingEvents: boolean
): Promise<Array<typeof billingEvents.$inferSelect>> {
  if (!includeBillingEvents || executions.length === 0) {
    return [];
  }

  const eventMap = new Map<string, typeof billingEvents.$inferSelect>();

  for (const execution of executions) {
    if (execution.billingEventId) {
      const rows = await db
        .select()
        .from(billingEvents)
        .where(eq(billingEvents.billingEventId, execution.billingEventId))
        .orderBy(desc(billingEvents.createdAt));

      for (const row of rows) {
        eventMap.set(row.id, row);
      }
    }

    if (execution.sessionId) {
      const rows = await db
        .select()
        .from(billingEvents)
        .where(eq(billingEvents.sessionId, execution.sessionId))
        .orderBy(desc(billingEvents.createdAt));

      for (const row of rows) {
        eventMap.set(row.id, row);
      }
    }

    const executionEventRows = await db
      .select()
      .from(billingEvents)
      .where(eq(billingEvents.traceId, execution.traceId ?? ""))
      .orderBy(desc(billingEvents.createdAt));

    for (const row of executionEventRows) {
      eventMap.set(row.id, row);
    }
  }

  return Array.from(eventMap.values()).sort((left, right) => {
    const leftDate = left.createdAt?.getTime() ?? 0;
    const rightDate = right.createdAt?.getTime() ?? 0;

    return rightDate - leftDate;
  });
}

function executionScoped(input: ListPaymentConnectorAdminRecordsInput): boolean {
  return Boolean(
    normalizeText(input.executionId) ||
      normalizeText(input.billingEventId) ||
      normalizeText(input.sessionId) ||
      normalizeText(input.tenantId) ||
      normalizeStatus(input.executionStatus)
  );
}

export async function getPaymentConnectorAdminScopeRecord(input: {
  executionId?: string | null;
  billingEventId?: string | null;
  sessionId?: string | null;
}): Promise<PaymentConnectorAdminScopeRecord | null> {
  const normalizedExecutionId = normalizeText(input.executionId);

  if (normalizedExecutionId) {
    const rows = await db
      .select()
      .from(paymentConnectorExecutions)
      .where(eq(paymentConnectorExecutions.id, normalizedExecutionId))
      .limit(1);
    const execution = rows[0] ?? null;

    if (execution) {
      return {
        adapterId: execution.adapterId,
        executionId: execution.id,
        billingEventId: execution.billingEventId,
        sessionId: execution.sessionId,
        tenantId: execution.tenantId,
      };
    }
  }

  const normalizedBillingEventId = normalizeText(input.billingEventId);

  if (normalizedBillingEventId) {
    const executionRows = await db
      .select()
      .from(paymentConnectorExecutions)
      .where(eq(paymentConnectorExecutions.billingEventId, normalizedBillingEventId))
      .orderBy(desc(paymentConnectorExecutions.createdAt))
      .limit(1);
    const execution = executionRows[0] ?? null;

    if (execution) {
      return {
        adapterId: execution.adapterId,
        executionId: execution.id,
        billingEventId: execution.billingEventId,
        sessionId: execution.sessionId,
        tenantId: execution.tenantId,
      };
    }

    const billingRows = await db
      .select()
      .from(billingEvents)
      .where(eq(billingEvents.billingEventId, normalizedBillingEventId))
      .limit(1);
    const billingEvent = billingRows[0] ?? null;

    if (billingEvent) {
      return {
        adapterId: await adapterIdForSession(billingEvent.sessionId),
        executionId: null,
        billingEventId: billingEvent.billingEventId,
        sessionId: billingEvent.sessionId,
        tenantId: billingEvent.tenantId,
      };
    }
  }

  const normalizedSessionId = normalizeText(input.sessionId);

  if (normalizedSessionId) {
    const executionRows = await db
      .select()
      .from(paymentConnectorExecutions)
      .where(eq(paymentConnectorExecutions.sessionId, normalizedSessionId))
      .orderBy(desc(paymentConnectorExecutions.createdAt))
      .limit(1);
    const execution = executionRows[0] ?? null;

    if (execution) {
      return {
        adapterId: execution.adapterId,
        executionId: execution.id,
        billingEventId: execution.billingEventId,
        sessionId: execution.sessionId,
        tenantId: execution.tenantId,
      };
    }
  }

  return null;
}

export async function listPaymentConnectorAdminRecords(
  input: ListPaymentConnectorAdminRecordsInput
): Promise<PaymentConnectorAdminRecord[]> {
  const adapterId =
    normalizeText(input.adapterId) ??
    (await adapterIdForExecution(input.executionId)) ??
    (await adapterIdForBillingEvent(input.billingEventId)) ??
    (await adapterIdForSession(input.sessionId));
  const adapterFilters = [
    adapterId ? eq(paymentConnectorAdapters.adapterId, adapterId) : undefined,
    normalizeStatus(input.processorType)
      ? eq(
          paymentConnectorAdapters.processorType,
          normalizeStatus(input.processorType) ?? ""
        )
      : undefined,
    normalizeStatus(input.certificationStatus)
      ? eq(
          paymentConnectorAdapters.certificationStatus,
          normalizeStatus(input.certificationStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));
  const whereClause =
    adapterFilters.length > 0 ? and(...adapterFilters) : undefined;
  const adapters = whereClause
    ? await db
        .select()
        .from(paymentConnectorAdapters)
        .where(whereClause)
        .orderBy(desc(paymentConnectorAdapters.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(paymentConnectorAdapters)
        .orderBy(desc(paymentConnectorAdapters.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: PaymentConnectorAdminRecord[] = [];

  for (const adapter of adapters) {
    const executions = await loadExecutions({
      adapterId: adapter.adapterId,
      executionId: input.executionId,
      billingEventId: input.billingEventId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      executionStatus: input.executionStatus,
      includeExecutions: input.includeExecutions !== false,
    });

    if (executionScoped(input) && executions.length === 0) {
      continue;
    }

    records.push({
      adapter,
      executions,
      billingEvents: await loadBillingEvents(
        executions,
        input.includeBillingEvents !== false
      ),
    });
  }

  return records;
}
