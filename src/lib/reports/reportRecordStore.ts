import { and, desc, eq } from "drizzle-orm";

import { applications, properties, reportRecords } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Report Record Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for report generation records.
 * - Vol II: Protects borrower, application, disclosure, advisory-only,
 *   human-review, and regulatory-use boundaries.
 * - Vol III: Provides deterministic, replay-safe report persistence and
 *   record-scoped report reads.
 * - Vol IV: Supports reporting review, escalation, retention, audit
 *   preparation, and operational evidence preservation.
 * - Vol V: Enforces classification, explainability, observability, replay,
 *   version lineage, controlled disclosure, and export governance.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const REPORT_RECORD_SOURCE = "report-record-runtime";

export type PersistReportRecordInput = {
  traceId: string;
  reportId: string;
  reportType?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  reportTitle?: string | null;
  advisory?: string | null;
  requestPayload?: Record<string, unknown>;
  reportPayload?: Record<string, unknown>;
  outputSummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ListReportAdminRecordsInput = {
  reportId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  reportType?: string | null;
  reportStatus?: string | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type ReportAdminRecord = {
  report: typeof reportRecords.$inferSelect;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type ReportAdminScopeRecord = {
  reportId?: string | null;
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

function normalizeRequiredText(value: unknown, label: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeReportType(value: unknown): string {
  return normalizeText(value)?.toUpperCase() ?? "STANDARD";
}

function normalizeReportTypeFilter(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
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

async function loadApplicationById(applicationId?: string | null) {
  const normalizedApplicationId = normalizeText(applicationId);

  if (!normalizedApplicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, normalizedApplicationId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadApplicationForReport(
  report: typeof reportRecords.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !report.applicationId) {
    return null;
  }

  return loadApplicationById(report.applicationId);
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

export async function persistReportRecord(
  input: PersistReportRecordInput
): Promise<typeof reportRecords.$inferSelect> {
  const application = await loadApplicationById(input.applicationId);
  const now = new Date();
  const reportType = normalizeReportType(input.reportType);
  const rows = await db
    .insert(reportRecords)
    .values({
      reportId: normalizeRequiredText(input.reportId, "reportId"),
      reportType,
      reportStatus: "GENERATED_ADVISORY_REVIEW_REQUIRED",
      applicationId: normalizeText(input.applicationId),
      borrowerId:
        normalizeText(input.borrowerId) ?? application?.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application?.tenantId ?? null,
      actorId: normalizeText(input.actorId),
      reportTitle:
        normalizeText(input.reportTitle) ?? `${reportType} borrower report`,
      advisory:
        normalizeText(input.advisory) ??
        "AI-GENERATED INFORMATION ONLY - NOT AN OFFICIAL REPORT - NOT VALID FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.",
      advisoryOnly: true,
      officialUseAllowed: false,
      borrowerDisclosureAllowed: false,
      humanReviewRequired: true,
      externalReportGenerated: false,
      requestPayload: input.requestPayload ?? {},
      reportPayload: input.reportPayload ?? {},
      outputSummary: input.outputSummary ?? {},
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: REPORT_RECORD_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        reportRecordRuntimeVersion: "report-record-runtime-v0.1.0",
        advisoryOnly: true,
        officialUseAllowed: false,
        humanReviewRequired: true,
        externalReportGenerated: false,
      },
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rows[0];
}

export async function getReportAdminScopeRecord(input: {
  reportId?: string | null;
  applicationId?: string | null;
}): Promise<ReportAdminScopeRecord | null> {
  const normalizedReportId = normalizeText(input.reportId);

  if (normalizedReportId) {
    const rows = await db
      .select()
      .from(reportRecords)
      .where(eq(reportRecords.reportId, normalizedReportId))
      .limit(1);
    const report = rows[0] ?? null;

    if (report) {
      return {
        reportId: report.reportId,
        applicationId: report.applicationId,
        borrowerId: report.borrowerId,
        tenantId: report.tenantId,
      };
    }
  }

  const normalizedApplicationId = normalizeText(input.applicationId);

  if (normalizedApplicationId) {
    return {
      reportId: null,
      applicationId: normalizedApplicationId,
      borrowerId: null,
      tenantId: null,
    };
  }

  return null;
}

export async function listReportAdminRecords(
  input: ListReportAdminRecordsInput
): Promise<ReportAdminRecord[]> {
  const filters = [
    normalizeText(input.reportId)
      ? eq(reportRecords.reportId, normalizeText(input.reportId) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(reportRecords.applicationId, normalizeText(input.applicationId) ?? "")
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(reportRecords.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(reportRecords.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeReportTypeFilter(input.reportType)
      ? eq(
          reportRecords.reportType,
          normalizeReportTypeFilter(input.reportType) ?? ""
        )
      : undefined,
    normalizeStatus(input.reportStatus)
      ? eq(reportRecords.reportStatus, normalizeStatus(input.reportStatus) ?? "")
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const reports = whereClause
    ? await db
        .select()
        .from(reportRecords)
        .where(whereClause)
        .orderBy(desc(reportRecords.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(reportRecords)
        .orderBy(desc(reportRecords.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: ReportAdminRecord[] = [];

  for (const report of reports) {
    const application = await loadApplicationForReport(
      report,
      input.includeApplication !== false
    );

    records.push({
      report,
      application,
      property: await loadProperty(application, input.includeProperty !== false),
    });
  }

  return records;
}
