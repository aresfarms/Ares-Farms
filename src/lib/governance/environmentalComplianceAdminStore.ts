import { and, desc, eq } from "drizzle-orm";

import {
  applications,
  borrowerProtectionFeeControls,
  environmentalComplianceRecords,
  properties,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Environmental Compliance Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: preserves Environmental Engineering Spoke / Banker Spoke isolation.
 * - Vol II: keeps environmental review posture regulated, advisory, and
 *   human-review bound.
 * - Vol III: reads canonical environmental_compliance_records without
 *   bypassing replay, classification, audit, or version lineage.
 * - Vol IV: supports operator review of environmental pathway exceptions,
 *   escalation, recovery, and evidence preparation.
 * - Vol V: preserves borrower fee autonomy, jurisdictional provider-license
 *   verification, source authority, controlled disclosure, and auditability.
 * - Vol VI: exposes the environmental backend through a portable vertical
 *   module surface without live provider engagement or official reports.
 */

export type ListEnvironmentalComplianceAdminRecordsInput = {
  recordId?: string | null;
  complianceRecordId?: string | null;
  journeyId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  pathwayType?: string | null;
  assessmentRequirementStatus?: string | null;
  assessmentOutcome?: string | null;
  environmentalAssessmentTriggered?: boolean | null;
  loanPathwayAdvancementAllowed?: boolean | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
  includeFeeControl?: boolean | null;
};

export type EnvironmentalComplianceAdminRecord = {
  complianceRecord: typeof environmentalComplianceRecords.$inferSelect;
  feeControl: typeof borrowerProtectionFeeControls.$inferSelect | null;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type EnvironmentalComplianceAdminScopeRecord = {
  recordId?: string | null;
  complianceRecordId?: string | null;
  journeyId?: string | null;
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

function normalizePathway(value: unknown): string | null {
  return normalizeText(value)
    ?.toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_") ?? null;
}

async function loadApplication(
  complianceRecord: typeof environmentalComplianceRecords.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !complianceRecord.applicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, complianceRecord.applicationId))
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

async function loadFeeControl(
  complianceRecord: typeof environmentalComplianceRecords.$inferSelect,
  includeFeeControl: boolean
): Promise<typeof borrowerProtectionFeeControls.$inferSelect | null> {
  if (
    !includeFeeControl ||
    !complianceRecord.borrowerProtectionFeeControlId
  ) {
    return null;
  }

  const rows = await db
    .select()
    .from(borrowerProtectionFeeControls)
    .where(
      eq(
        borrowerProtectionFeeControls.feeControlId,
        complianceRecord.borrowerProtectionFeeControlId
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getEnvironmentalComplianceAdminScopeRecord(input: {
  recordId?: string | null;
  complianceRecordId?: string | null;
  journeyId?: string | null;
  applicationId?: string | null;
}): Promise<EnvironmentalComplianceAdminScopeRecord | null> {
  const filters = [
    normalizeText(input.recordId)
      ? eq(
          environmentalComplianceRecords.id,
          normalizeText(input.recordId) ?? ""
        )
      : undefined,
    normalizeText(input.complianceRecordId)
      ? eq(
          environmentalComplianceRecords.complianceRecordId,
          normalizeText(input.complianceRecordId) ?? ""
        )
      : undefined,
    normalizeText(input.journeyId)
      ? eq(
          environmentalComplianceRecords.journeyId,
          normalizeText(input.journeyId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          environmentalComplianceRecords.applicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  if (filters.length === 0) {
    return null;
  }

  const rows = await db
    .select()
    .from(environmentalComplianceRecords)
    .where(and(...filters))
    .limit(1);
  const complianceRecord = rows[0] ?? null;

  if (!complianceRecord) {
    return null;
  }

  return {
    recordId: complianceRecord.id,
    complianceRecordId: complianceRecord.complianceRecordId,
    journeyId: complianceRecord.journeyId,
    applicationId: complianceRecord.applicationId,
    borrowerId: complianceRecord.borrowerId,
    tenantId: complianceRecord.tenantId,
  };
}

export async function listEnvironmentalComplianceAdminRecords(
  input: ListEnvironmentalComplianceAdminRecordsInput
): Promise<EnvironmentalComplianceAdminRecord[]> {
  const filters = [
    normalizeText(input.recordId)
      ? eq(
          environmentalComplianceRecords.id,
          normalizeText(input.recordId) ?? ""
        )
      : undefined,
    normalizeText(input.complianceRecordId)
      ? eq(
          environmentalComplianceRecords.complianceRecordId,
          normalizeText(input.complianceRecordId) ?? ""
        )
      : undefined,
    normalizeText(input.journeyId)
      ? eq(
          environmentalComplianceRecords.journeyId,
          normalizeText(input.journeyId) ?? ""
        )
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          environmentalComplianceRecords.applicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(
          environmentalComplianceRecords.borrowerId,
          normalizeText(input.borrowerId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(
          environmentalComplianceRecords.tenantId,
          normalizeText(input.tenantId) ?? ""
        )
      : undefined,
    normalizePathway(input.pathwayType)
      ? eq(
          environmentalComplianceRecords.pathwayType,
          normalizePathway(input.pathwayType) ?? ""
        )
      : undefined,
    normalizeStatus(input.assessmentRequirementStatus)
      ? eq(
          environmentalComplianceRecords.assessmentRequirementStatus,
          normalizeStatus(input.assessmentRequirementStatus) ?? ""
        )
      : undefined,
    normalizeStatus(input.assessmentOutcome)
      ? eq(
          environmentalComplianceRecords.assessmentOutcome,
          normalizeStatus(input.assessmentOutcome) ?? ""
        )
      : undefined,
    typeof input.environmentalAssessmentTriggered === "boolean"
      ? eq(
          environmentalComplianceRecords.environmentalAssessmentTriggered,
          input.environmentalAssessmentTriggered
        )
      : undefined,
    typeof input.loanPathwayAdvancementAllowed === "boolean"
      ? eq(
          environmentalComplianceRecords.loanPathwayAdvancementAllowed,
          input.loanPathwayAdvancementAllowed
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = whereClause
    ? await db
        .select()
        .from(environmentalComplianceRecords)
        .where(whereClause)
        .orderBy(desc(environmentalComplianceRecords.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(environmentalComplianceRecords)
        .orderBy(desc(environmentalComplianceRecords.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: EnvironmentalComplianceAdminRecord[] = [];

  for (const complianceRecord of rows) {
    const application = await loadApplication(
      complianceRecord,
      input.includeApplication !== false
    );

    records.push({
      complianceRecord,
      feeControl: await loadFeeControl(
        complianceRecord,
        input.includeFeeControl !== false
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
