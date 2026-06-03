import { and, desc, eq } from "drizzle-orm";

import {
  applications,
  properties,
  sovereignConsentGatewayRecords,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Sovereign Consent Gateway Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol II §3.21: supports compliance review for tribal sovereign land
 *   regulatory workflows.
 * - Vol V CANON-CONSENT-001 v7.0: reads ConsentGatewayRecords as Level 5
 *   immutable audit artifacts.
 * - Vol V CANON-SOVEREIGNTY-001: preserves Level 5 sovereign defaults and
 *   scope-limited operational exception posture.
 */

export type ListSovereignConsentGatewayAdminRecordsInput = {
  recordId?: string | null;
  gatewayRecordId?: string | null;
  gatewayId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  tribalNation?: string | null;
  gatewayStatus?: string | null;
  gatewayActive?: boolean | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type SovereignConsentGatewayAdminRecord = {
  gatewayRecord: typeof sovereignConsentGatewayRecords.$inferSelect;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type SovereignConsentGatewayAdminScopeRecord = {
  recordId?: string | null;
  gatewayRecordId?: string | null;
  gatewayId?: string | null;
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

async function loadApplication(
  gatewayRecord: typeof sovereignConsentGatewayRecords.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !gatewayRecord.applicationIdScope) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, gatewayRecord.applicationIdScope))
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

export async function getSovereignConsentGatewayAdminScopeRecord(input: {
  recordId?: string | null;
  gatewayRecordId?: string | null;
  gatewayId?: string | null;
  applicationId?: string | null;
}): Promise<SovereignConsentGatewayAdminScopeRecord | null> {
  const filters = [
    normalizeText(input.recordId)
      ? eq(sovereignConsentGatewayRecords.id, normalizeText(input.recordId) ?? "")
      : undefined,
    normalizeText(input.gatewayRecordId)
      ? eq(
          sovereignConsentGatewayRecords.gatewayRecordId,
          normalizeText(input.gatewayRecordId) ?? ""
        )
      : undefined,
    normalizeText(input.gatewayId)
      ? eq(
          sovereignConsentGatewayRecords.gatewayId,
          normalizeText(input.gatewayId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          sovereignConsentGatewayRecords.applicationIdScope,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  if (filters.length === 0) {
    return null;
  }

  const rows = await db
    .select()
    .from(sovereignConsentGatewayRecords)
    .where(and(...filters))
    .limit(1);
  const gatewayRecord = rows[0] ?? null;

  if (!gatewayRecord) {
    return null;
  }

  return {
    recordId: gatewayRecord.id,
    gatewayRecordId: gatewayRecord.gatewayRecordId,
    gatewayId: gatewayRecord.gatewayId,
    applicationId: gatewayRecord.applicationIdScope,
    borrowerId: gatewayRecord.borrowerId,
    tenantId: gatewayRecord.tenantId,
  };
}

export async function listSovereignConsentGatewayAdminRecords(
  input: ListSovereignConsentGatewayAdminRecordsInput
): Promise<SovereignConsentGatewayAdminRecord[]> {
  const filters = [
    normalizeText(input.recordId)
      ? eq(sovereignConsentGatewayRecords.id, normalizeText(input.recordId) ?? "")
      : undefined,
    normalizeText(input.gatewayRecordId)
      ? eq(
          sovereignConsentGatewayRecords.gatewayRecordId,
          normalizeText(input.gatewayRecordId) ?? ""
        )
      : undefined,
    normalizeText(input.gatewayId)
      ? eq(
          sovereignConsentGatewayRecords.gatewayId,
          normalizeText(input.gatewayId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          sovereignConsentGatewayRecords.applicationIdScope,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(
          sovereignConsentGatewayRecords.borrowerId,
          normalizeText(input.borrowerId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(
          sovereignConsentGatewayRecords.tenantId,
          normalizeText(input.tenantId) ?? ""
        )
      : undefined,
    normalizeText(input.tribalNation)
      ? eq(
          sovereignConsentGatewayRecords.tribalNation,
          normalizeText(input.tribalNation) ?? ""
        )
      : undefined,
    normalizeStatus(input.gatewayStatus)
      ? eq(
          sovereignConsentGatewayRecords.gatewayStatus,
          normalizeStatus(input.gatewayStatus) ?? ""
        )
      : undefined,
    typeof input.gatewayActive === "boolean"
      ? eq(sovereignConsentGatewayRecords.gatewayActive, input.gatewayActive)
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(sovereignConsentGatewayRecords)
        .where(whereClause)
        .orderBy(desc(sovereignConsentGatewayRecords.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(sovereignConsentGatewayRecords)
        .orderBy(desc(sovereignConsentGatewayRecords.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: SovereignConsentGatewayAdminRecord[] = [];

  for (const gatewayRecord of rows) {
    const application = await loadApplication(
      gatewayRecord,
      input.includeApplication !== false
    );

    records.push({
      gatewayRecord,
      application,
      property: await loadProperty(
        application,
        input.includeProperty !== false
      ),
    });
  }

  return records;
}
