import { and, desc, eq } from "drizzle-orm";

import {
  applications,
  certifiedConnectorAdapters,
  externalConnectorExecutions,
  externalDataConnectorRuns,
  externalDataSources,
  properties,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Connector Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for external connector reads.
 * - Vol II: Protects USDA, SBA, property, borrower, credential, consent,
 *   adapter, source-authority, and operational-control records.
 * - Vol III: Provides deterministic record-scoped connector lifecycle reads
 *   before dashboards consume source, adapter, or execution state.
 * - Vol IV: Supports connector monitoring, outage review, certification
 *   review, recovery, escalation, and audit preparation.
 * - Vol V: Enforces source authority, classification, observability, replay,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

export type ListConnectorAdminRecordsInput = {
  connectorRunId?: string | null;
  executionId?: string | null;
  adapterId?: string | null;
  sourceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  connectorType?: string | null;
  queryType?: string | null;
  status?: string | null;
  executionStatus?: string | null;
  certificationStatus?: string | null;
  limit?: number | null;
  includeSource?: boolean | null;
  includeAdapters?: boolean | null;
  includeExecutions?: boolean | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type ConnectorAdminRecord = {
  connectorRun: typeof externalDataConnectorRuns.$inferSelect;
  source: typeof externalDataSources.$inferSelect | null;
  adapters: Array<typeof certifiedConnectorAdapters.$inferSelect>;
  executions: Array<typeof externalConnectorExecutions.$inferSelect>;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type ConnectorAdminScopeRecord = {
  connectorRunId?: string | null;
  executionId?: string | null;
  adapterId?: string | null;
  sourceId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

function normalizeStatus(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

async function connectorRunIdForExecution(
  executionId?: string | null
): Promise<string | null> {
  const normalizedExecutionId = normalizeText(executionId);

  if (!normalizedExecutionId) {
    return null;
  }

  const rows = await db
    .select()
    .from(externalConnectorExecutions)
    .where(eq(externalConnectorExecutions.id, normalizedExecutionId))
    .limit(1);

  return rows[0]?.connectorRunId ?? null;
}

async function loadSource(
  connectorRun: typeof externalDataConnectorRuns.$inferSelect,
  includeSource: boolean
): Promise<typeof externalDataSources.$inferSelect | null> {
  if (!includeSource) {
    return null;
  }

  const rows = await db
    .select()
    .from(externalDataSources)
    .where(eq(externalDataSources.id, connectorRun.sourceId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadAdapters(input: {
  connectorRun: typeof externalDataConnectorRuns.$inferSelect;
  includeAdapters: boolean;
  adapterId?: string | null;
  certificationStatus?: string | null;
}): Promise<Array<typeof certifiedConnectorAdapters.$inferSelect>> {
  if (!input.includeAdapters) {
    return [];
  }

  const filters = [
    eq(certifiedConnectorAdapters.sourceId, input.connectorRun.sourceId),
    normalizeText(input.adapterId)
      ? eq(certifiedConnectorAdapters.adapterId, normalizeText(input.adapterId) ?? "")
      : undefined,
    normalizeStatus(input.certificationStatus)
      ? eq(
          certifiedConnectorAdapters.certificationStatus,
          normalizeStatus(input.certificationStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return db
    .select()
    .from(certifiedConnectorAdapters)
    .where(and(...filters))
    .orderBy(desc(certifiedConnectorAdapters.createdAt));
}

async function loadExecutions(input: {
  connectorRun: typeof externalDataConnectorRuns.$inferSelect;
  includeExecutions: boolean;
  executionId?: string | null;
  adapterId?: string | null;
  executionStatus?: string | null;
}): Promise<Array<typeof externalConnectorExecutions.$inferSelect>> {
  if (!input.includeExecutions) {
    return [];
  }

  const filters = [
    eq(externalConnectorExecutions.connectorRunId, input.connectorRun.id),
    normalizeText(input.executionId)
      ? eq(externalConnectorExecutions.id, normalizeText(input.executionId) ?? "")
      : undefined,
    normalizeText(input.adapterId)
      ? eq(externalConnectorExecutions.adapterId, normalizeText(input.adapterId) ?? "")
      : undefined,
    normalizeStatus(input.executionStatus)
      ? eq(
          externalConnectorExecutions.executionStatus,
          normalizeStatus(input.executionStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return db
    .select()
    .from(externalConnectorExecutions)
    .where(and(...filters))
    .orderBy(desc(externalConnectorExecutions.createdAt));
}

async function loadApplication(
  connectorRun: typeof externalDataConnectorRuns.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !connectorRun.applicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, connectorRun.applicationId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadProperty(
  application: typeof applications.$inferSelect | null,
  includeProperty: boolean
): Promise<typeof properties.$inferSelect | null> {
  if (!includeProperty || !application?.propertyId) {
    return null;
  }

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.id, application.propertyId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getConnectorAdminScopeRecord(input: {
  connectorRunId?: string | null;
  executionId?: string | null;
  applicationId?: string | null;
}): Promise<ConnectorAdminScopeRecord | null> {
  const normalizedExecutionId = normalizeText(input.executionId);

  if (normalizedExecutionId) {
    const rows = await db
      .select()
      .from(externalConnectorExecutions)
      .where(eq(externalConnectorExecutions.id, normalizedExecutionId))
      .limit(1);
    const execution = rows[0] ?? null;

    if (execution) {
      return {
        connectorRunId: execution.connectorRunId,
        executionId: execution.id,
        adapterId: execution.adapterId,
        sourceId: execution.sourceId,
        applicationId: execution.applicationId,
        borrowerId: execution.borrowerId,
        tenantId: execution.tenantId,
      };
    }
  }

  const normalizedConnectorRunId = normalizeText(input.connectorRunId);

  if (normalizedConnectorRunId) {
    const rows = await db
      .select()
      .from(externalDataConnectorRuns)
      .where(eq(externalDataConnectorRuns.id, normalizedConnectorRunId))
      .limit(1);
    const connectorRun = rows[0] ?? null;

    if (connectorRun) {
      return {
        connectorRunId: connectorRun.id,
        executionId: null,
        adapterId: null,
        sourceId: connectorRun.sourceId,
        applicationId: connectorRun.applicationId,
        borrowerId: connectorRun.borrowerId,
        tenantId: connectorRun.tenantId,
      };
    }
  }

  const normalizedApplicationId = normalizeText(input.applicationId);

  if (normalizedApplicationId) {
    return {
      connectorRunId: null,
      executionId: null,
      adapterId: null,
      sourceId: null,
      applicationId: normalizedApplicationId,
      borrowerId: null,
      tenantId: null,
    };
  }

  return null;
}

export async function listConnectorAdminRecords(
  input: ListConnectorAdminRecordsInput
): Promise<ConnectorAdminRecord[]> {
  const executionConnectorRunId = await connectorRunIdForExecution(
    input.executionId
  );
  const connectorRunId =
    normalizeText(input.connectorRunId) ?? executionConnectorRunId;
  const filters = [
    connectorRunId
      ? eq(externalDataConnectorRuns.id, connectorRunId)
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          externalDataConnectorRuns.applicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(
          externalDataConnectorRuns.borrowerId,
          normalizeText(input.borrowerId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(externalDataConnectorRuns.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.sourceId)
      ? eq(externalDataConnectorRuns.sourceId, normalizeText(input.sourceId) ?? "")
      : undefined,
    normalizeStatus(input.connectorType)
      ? eq(
          externalDataConnectorRuns.connectorType,
          normalizeStatus(input.connectorType) ?? ""
        )
      : undefined,
    normalizeText(input.queryType)
      ? eq(
          externalDataConnectorRuns.queryType,
          normalizeText(input.queryType) ?? ""
        )
      : undefined,
    normalizeStatus(input.status)
      ? eq(externalDataConnectorRuns.status, normalizeStatus(input.status) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const connectorRuns = whereClause
    ? await db
        .select()
        .from(externalDataConnectorRuns)
        .where(whereClause)
        .orderBy(desc(externalDataConnectorRuns.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(externalDataConnectorRuns)
        .orderBy(desc(externalDataConnectorRuns.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: ConnectorAdminRecord[] = [];

  for (const connectorRun of connectorRuns) {
    const application = await loadApplication(
      connectorRun,
      input.includeApplication !== false
    );

    records.push({
      connectorRun,
      source: await loadSource(connectorRun, input.includeSource !== false),
      adapters: await loadAdapters({
        connectorRun,
        includeAdapters: input.includeAdapters !== false,
        adapterId: input.adapterId,
        certificationStatus: input.certificationStatus,
      }),
      executions: await loadExecutions({
        connectorRun,
        includeExecutions: input.includeExecutions !== false,
        executionId: input.executionId,
        adapterId: input.adapterId,
        executionStatus: input.executionStatus,
      }),
      application,
      property: await loadProperty(application, input.includeProperty !== false),
    });
  }

  return records;
}
