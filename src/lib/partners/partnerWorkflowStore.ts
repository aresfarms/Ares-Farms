import { and, desc, eq } from "drizzle-orm";

import { applications, partnerWorkflows } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Lender and Sponsor Workflow Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves governed institutional workflow authority.
 * - Vol II: Keeps borrower, lender, sponsor, disclosure, and regulated
 *   finance workflow boundaries controlled before portal exposure.
 * - Vol III: Provides deterministic durable workflow state.
 * - Vol IV: Supports due diligence, escalation, assignment, operational
 *   queues, recovery, and audit preparation.
 * - Vol V: Enforces classification, replay, observability, source authority,
 *   controlled disclosure, and version lineage.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const WORKFLOW_SOURCE = "partner-workflow-runtime";

export type PersistPartnerWorkflowInput = {
  traceId: string;
  partnerType?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  workflowType?: string | null;
  workflowStage?: string | null;
  status?: string | null;
  priority?: string | null;
  requestedAmount?: unknown;
  programType?: string | null;
  commitmentStatus?: string | null;
  dueDiligenceStatus?: string | null;
  disclosureStatus?: string | null;
  certificationStatus?: string | null;
  assignedTo?: string | null;
  escalationStatus?: string | null;
  dueAt?: string | Date | null;
  metadata?: Record<string, unknown>;
};

export type ListPartnerWorkflowInput = {
  partnerType?: string | null;
  partnerId?: string | null;
  tenantId?: string | null;
  status?: string | null;
  limit?: number | null;
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

function normalizePartnerType(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["LENDER", "SPONSOR"]);

  if (!normalized || !allowed.has(normalized)) {
    throw new Error("partnerType must be LENDER or SPONSOR.");
  }

  return normalized;
}

function normalizeWorkflowType(value: unknown, partnerType: string): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "LENDER_REVIEW",
    "SPONSOR_REVIEW",
    "DUE_DILIGENCE",
    "TERM_REVIEW",
    "SPONSORSHIP_REVIEW",
    "DISCLOSURE_REVIEW",
    "CERTIFICATION_REVIEW",
  ]);

  if (normalized && allowed.has(normalized)) {
    return normalized;
  }

  return partnerType === "SPONSOR" ? "SPONSOR_REVIEW" : "LENDER_REVIEW";
}

function normalizeWorkflowStage(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "INTAKE",
    "DUE_DILIGENCE",
    "REVIEW",
    "ESCALATION",
    "AWAITING_HUMAN_REVIEW",
    "COMPLETED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "INTAKE";
}

function normalizeStatus(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "OPEN",
    "IN_PROGRESS",
    "ESCALATED",
    "BLOCKED",
    "COMPLETED",
    "CANCELLED",
  ]);

  return normalized && allowed.has(normalized) ? normalized : "OPEN";
}

function normalizePriority(value: unknown): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);

  return normalized && allowed.has(normalized) ? normalized : "NORMAL";
}

function normalizeReviewStatus(value: unknown, fallback: string): string {
  const normalized = normalizeText(value)?.toUpperCase();

  return normalized ?? fallback;
}

function normalizeEscalationStatus(value: unknown, priority: string): string {
  const normalized = normalizeText(value)?.toUpperCase();
  const allowed = new Set([
    "NOT_ESCALATED",
    "ESCALATION_REVIEW_REQUIRED",
    "ESCALATED",
  ]);

  if (normalized && allowed.has(normalized)) {
    return normalized;
  }

  return priority === "URGENT" ? "ESCALATION_REVIEW_REQUIRED" : "NOT_ESCALATED";
}

function normalizeDueAt(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

async function loadApplication(applicationId?: string | null) {
  const normalizedApplicationId = normalizeText(applicationId);

  if (!normalizedApplicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, normalizedApplicationId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Application not found for partner workflow.");
  }

  return rows[0];
}

export async function persistPartnerWorkflow(input: PersistPartnerWorkflowInput) {
  const partnerType = normalizePartnerType(input.partnerType);
  const partnerId = normalizeRequiredText(input.partnerId, "partnerId");
  const workflowType = normalizeWorkflowType(input.workflowType, partnerType);
  const application = await loadApplication(input.applicationId);
  const priority = normalizePriority(input.priority);
  const status = normalizeStatus(input.status);
  const now = new Date();
  const inserted = await db
    .insert(partnerWorkflows)
    .values({
      partnerType,
      partnerId,
      partnerName: normalizeText(input.partnerName),
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId) ?? application?.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application?.tenantId ?? null,
      actorId: normalizeText(input.actorId),
      workflowType,
      workflowStage: normalizeWorkflowStage(input.workflowStage),
      status,
      priority,
      requestedAmount: normalizeText(input.requestedAmount),
      programType: normalizeText(input.programType),
      commitmentStatus: normalizeReviewStatus(
        input.commitmentStatus,
        "NOT_COMMITTED"
      ),
      dueDiligenceStatus: normalizeReviewStatus(
        input.dueDiligenceStatus,
        "REVIEW_REQUIRED"
      ),
      disclosureStatus: normalizeReviewStatus(
        input.disclosureStatus,
        "DISCLOSURE_REVIEW_REQUIRED"
      ),
      certificationStatus: normalizeReviewStatus(
        input.certificationStatus,
        "NOT_CERTIFIED"
      ),
      advisoryOnly: true,
      finalActionAllowed: false,
      borrowerDisclosureAllowed: false,
      humanReviewRequired: true,
      assignedTo: normalizeText(input.assignedTo),
      escalationStatus: normalizeEscalationStatus(
        input.escalationStatus,
        priority
      ),
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: WORKFLOW_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        partnerWorkflowVersion: "partner-workflow-runtime-v0.1.0",
        finalActionAllowed: false,
        borrowerDisclosureAllowed: false,
      },
      dueAt: normalizeDueAt(input.dueAt),
      reviewedAt: null,
      completedAt: status === "COMPLETED" ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    application,
    workflow: inserted[0],
  };
}

export async function listPartnerWorkflows(input: ListPartnerWorkflowInput) {
  const filters = [
    normalizeText(input.partnerType)
      ? eq(partnerWorkflows.partnerType, normalizePartnerType(input.partnerType))
      : undefined,
    normalizeText(input.partnerId)
      ? eq(partnerWorkflows.partnerId, normalizeText(input.partnerId) ?? "")
      : undefined,
    normalizeText(input.tenantId)
      ? eq(partnerWorkflows.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeText(input.status)
      ? eq(partnerWorkflows.status, normalizeStatus(input.status))
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  if (whereClause) {
    return db
      .select()
      .from(partnerWorkflows)
      .where(whereClause)
      .orderBy(desc(partnerWorkflows.createdAt))
      .limit(normalizeLimit(input.limit));
  }

  return db
    .select()
    .from(partnerWorkflows)
    .orderBy(desc(partnerWorkflows.createdAt))
    .limit(normalizeLimit(input.limit));
}
