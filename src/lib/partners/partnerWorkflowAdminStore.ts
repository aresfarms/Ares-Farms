import { and, desc, eq } from "drizzle-orm";

import { applications, partnerWorkflows, properties } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Partner Workflow Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for lender and sponsor workflow reads.
 * - Vol II: Protects borrower, lender, sponsor, disclosure, diligence,
 *   certification, and commitment posture from uncontrolled exposure.
 * - Vol III: Provides deterministic record-scoped partner workflow reads
 *   before lender, sponsor, operator, or admin portals consume records.
 * - Vol IV: Supports due diligence monitoring, escalation, assignment,
 *   recovery, audit preparation, and evidence review.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

export type ListPartnerWorkflowAdminRecordsInput = {
  workflowId?: string | null;
  partnerType?: string | null;
  partnerId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  status?: string | null;
  workflowStage?: string | null;
  commitmentStatus?: string | null;
  dueDiligenceStatus?: string | null;
  disclosureStatus?: string | null;
  certificationStatus?: string | null;
  limit?: number | null;
  includeApplication?: boolean | null;
  includeProperty?: boolean | null;
};

export type PartnerWorkflowAdminRecord = {
  workflow: typeof partnerWorkflows.$inferSelect;
  application: typeof applications.$inferSelect | null;
  property: typeof properties.$inferSelect | null;
};

export type PartnerWorkflowAdminScopeRecord = {
  workflowId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  partnerType?: string | null;
  partnerId?: string | null;
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

function normalizePartnerType(value: unknown): string | null {
  const normalized = normalizeText(value)?.toUpperCase();

  if (!normalized) {
    return null;
  }

  return new Set(["LENDER", "SPONSOR"]).has(normalized) ? normalized : null;
}

function normalizeStatus(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

async function loadApplication(
  workflow: typeof partnerWorkflows.$inferSelect,
  includeApplication: boolean
): Promise<typeof applications.$inferSelect | null> {
  if (!includeApplication || !workflow.applicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, workflow.applicationId))
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

export async function getPartnerWorkflowAdminScopeRecord(input: {
  workflowId?: string | null;
  applicationId?: string | null;
}): Promise<PartnerWorkflowAdminScopeRecord | null> {
  const normalizedWorkflowId = normalizeText(input.workflowId);

  if (normalizedWorkflowId) {
    const rows = await db
      .select()
      .from(partnerWorkflows)
      .where(eq(partnerWorkflows.id, normalizedWorkflowId))
      .limit(1);
    const workflow = rows[0] ?? null;

    if (workflow) {
      return {
        workflowId: workflow.id,
        applicationId: workflow.applicationId,
        borrowerId: workflow.borrowerId,
        tenantId: workflow.tenantId,
        partnerType: workflow.partnerType,
        partnerId: workflow.partnerId,
      };
    }
  }

  const normalizedApplicationId = normalizeText(input.applicationId);

  if (normalizedApplicationId) {
    return {
      workflowId: null,
      applicationId: normalizedApplicationId,
      borrowerId: null,
      tenantId: null,
      partnerType: null,
      partnerId: null,
    };
  }

  return null;
}

export async function listPartnerWorkflowAdminRecords(
  input: ListPartnerWorkflowAdminRecordsInput
): Promise<PartnerWorkflowAdminRecord[]> {
  const filters = [
    normalizeText(input.workflowId)
      ? eq(partnerWorkflows.id, normalizeText(input.workflowId) ?? "")
      : undefined,
    normalizePartnerType(input.partnerType)
      ? eq(partnerWorkflows.partnerType, normalizePartnerType(input.partnerType) ?? "")
      : undefined,
    normalizeText(input.partnerId)
      ? eq(partnerWorkflows.partnerId, normalizeText(input.partnerId) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(partnerWorkflows.applicationId, normalizeText(input.applicationId) ?? "")
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(partnerWorkflows.borrowerId, normalizeText(input.borrowerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(partnerWorkflows.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeStatus(input.status)
      ? eq(partnerWorkflows.status, normalizeStatus(input.status) ?? "")
      : undefined,
    normalizeStatus(input.workflowStage)
      ? eq(partnerWorkflows.workflowStage, normalizeStatus(input.workflowStage) ?? "")
      : undefined,
    normalizeStatus(input.commitmentStatus)
      ? eq(
          partnerWorkflows.commitmentStatus,
          normalizeStatus(input.commitmentStatus) ?? ""
        )
      : undefined,
    normalizeStatus(input.dueDiligenceStatus)
      ? eq(
          partnerWorkflows.dueDiligenceStatus,
          normalizeStatus(input.dueDiligenceStatus) ?? ""
        )
      : undefined,
    normalizeStatus(input.disclosureStatus)
      ? eq(
          partnerWorkflows.disclosureStatus,
          normalizeStatus(input.disclosureStatus) ?? ""
        )
      : undefined,
    normalizeStatus(input.certificationStatus)
      ? eq(
          partnerWorkflows.certificationStatus,
          normalizeStatus(input.certificationStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const workflows = whereClause
    ? await db
        .select()
        .from(partnerWorkflows)
        .where(whereClause)
        .orderBy(desc(partnerWorkflows.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(partnerWorkflows)
        .orderBy(desc(partnerWorkflows.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: PartnerWorkflowAdminRecord[] = [];

  for (const workflow of workflows) {
    const application = await loadApplication(
      workflow,
      input.includeApplication !== false
    );

    records.push({
      workflow,
      application,
      property: await loadProperty(application, input.includeProperty !== false),
    });
  }

  return records;
}
