import { and, desc, eq } from "drizzle-orm";

import {
  applications,
  credentialedScrapingEvents,
  credentialVaultRefs,
  properties,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Credentialed Agency Ingestion Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I §3.37: preserves accountable review of credentialed agency
 *   ingestion pre-session records.
 * - Vol II §3.25: protects ToS, license, credential, isolation, and
 *   anti-bulk-acquisition evidence.
 * - Vol III TECH-CONN-001: reads credentialed_scraping_events and
 *   credential_vault_refs through the canonical schema spine.
 * - Vol IV OPS-CONN-002: supports compliance review, SEV-2 posture, and
 *   circuit-breaker inspection.
 * - Vol V CANON-EXTSOURCE-001: preserves source trust, provenance,
 *   replayability, advisory limits, and controlled disclosure.
 */

export type ListCredentialedIngestionAdminRecordsInput = {
  eventId?: string | null;
  scrapingEventId?: string | null;
  vaultRefId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  externalTargetDomain?: string | null;
  sourceType?: string | null;
  sessionOutcome?: string | null;
  readyForSession?: boolean | null;
  limit?: number | null;
  includeCredential?: boolean | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type CredentialedIngestionAdminRecord = {
  ingestionEvent: typeof credentialedScrapingEvents.$inferSelect;
  credential: typeof credentialVaultRefs.$inferSelect | null;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type CredentialedIngestionAdminScopeRecord = {
  eventId?: string | null;
  scrapingEventId?: string | null;
  vaultRefId?: string | null;
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

async function loadCredential(
  ingestionEvent: typeof credentialedScrapingEvents.$inferSelect,
  includeCredential: boolean
): Promise<typeof credentialVaultRefs.$inferSelect | null> {
  if (!includeCredential) {
    return null;
  }

  const rows = await db
    .select()
    .from(credentialVaultRefs)
    .where(eq(credentialVaultRefs.vaultRefId, ingestionEvent.licenseIdentifierRef))
    .limit(1);

  return rows[0] ?? null;
}

async function loadApplication(
  ingestionEvent: typeof credentialedScrapingEvents.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !ingestionEvent.applicationIdScope) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, ingestionEvent.applicationIdScope))
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

export async function getCredentialedIngestionAdminScopeRecord(input: {
  eventId?: string | null;
  scrapingEventId?: string | null;
  applicationId?: string | null;
}): Promise<CredentialedIngestionAdminScopeRecord | null> {
  const filters = [
    normalizeText(input.eventId)
      ? eq(credentialedScrapingEvents.id, normalizeText(input.eventId) ?? "")
      : undefined,
    normalizeText(input.scrapingEventId)
      ? eq(
          credentialedScrapingEvents.scrapingEventId,
          normalizeText(input.scrapingEventId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          credentialedScrapingEvents.applicationIdScope,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  if (filters.length === 0) {
    return null;
  }

  const rows = await db
    .select()
    .from(credentialedScrapingEvents)
    .where(and(...filters))
    .limit(1);
  const ingestionEvent = rows[0] ?? null;

  if (!ingestionEvent) {
    return null;
  }

  return {
    eventId: ingestionEvent.id,
    scrapingEventId: ingestionEvent.scrapingEventId,
    vaultRefId: ingestionEvent.licenseIdentifierRef,
    applicationId: ingestionEvent.applicationIdScope,
    borrowerId: ingestionEvent.borrowerId,
    tenantId: ingestionEvent.tenantId,
  };
}

export async function listCredentialedIngestionAdminRecords(
  input: ListCredentialedIngestionAdminRecordsInput
): Promise<CredentialedIngestionAdminRecord[]> {
  const filters = [
    normalizeText(input.eventId)
      ? eq(credentialedScrapingEvents.id, normalizeText(input.eventId) ?? "")
      : undefined,
    normalizeText(input.scrapingEventId)
      ? eq(
          credentialedScrapingEvents.scrapingEventId,
          normalizeText(input.scrapingEventId) ?? ""
        )
      : undefined,
    normalizeText(input.vaultRefId)
      ? eq(
          credentialedScrapingEvents.licenseIdentifierRef,
          normalizeText(input.vaultRefId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          credentialedScrapingEvents.applicationIdScope,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(
          credentialedScrapingEvents.borrowerId,
          normalizeText(input.borrowerId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(
          credentialedScrapingEvents.tenantId,
          normalizeText(input.tenantId) ?? ""
        )
      : undefined,
    normalizeText(input.externalTargetDomain)
      ? eq(
          credentialedScrapingEvents.externalTargetDomain,
          normalizeText(input.externalTargetDomain) ?? ""
        )
      : undefined,
    normalizeStatus(input.sourceType)
      ? eq(
          credentialedScrapingEvents.sourceType,
          normalizeStatus(input.sourceType) ?? ""
        )
      : undefined,
    normalizeStatus(input.sessionOutcome)
      ? eq(
          credentialedScrapingEvents.sessionOutcome,
          normalizeStatus(input.sessionOutcome) ?? ""
        )
      : undefined,
    typeof input.readyForSession === "boolean"
      ? eq(credentialedScrapingEvents.readyForSession, input.readyForSession)
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(credentialedScrapingEvents)
        .where(whereClause)
        .orderBy(desc(credentialedScrapingEvents.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(credentialedScrapingEvents)
        .orderBy(desc(credentialedScrapingEvents.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: CredentialedIngestionAdminRecord[] = [];

  for (const ingestionEvent of rows) {
    const application = await loadApplication(
      ingestionEvent,
      input.includeApplication !== false
    );

    records.push({
      ingestionEvent,
      credential: await loadCredential(
        ingestionEvent,
        input.includeCredential !== false
      ),
      application,
      property: await loadProperty(
        application,
        input.includeProperty !== false
      ),
    });
  }

  return records;
}
