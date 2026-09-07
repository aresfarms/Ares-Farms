import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import {
  furlongCaseEvents,
  furlongCaseOutcomeRecords,
  furlongCases,
} from "@/db/schema";
import { db } from "@/lib/db";

export const FURLONG_CASE_GOVERNANCE_VERSION = "furlong-case-v1.0.0";

export const FURLONG_CASE_STAGES = [
  "PROPERTY_ANALYSIS",
  "FEASIBILITY",
  "FINANCING_READINESS",
  "PROVIDER_COMPARISON",
  "CASE_ROOM",
  "DILIGENCE",
  "CLOSING",
  "OPERATING_LOGBOOK",
] as const;

export type FurlongCaseStage = (typeof FURLONG_CASE_STAGES)[number];

export function normalizeFurlongCaseStage(value: unknown): FurlongCaseStage {
  const stage = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!FURLONG_CASE_STAGES.includes(stage as FurlongCaseStage)) {
    throw new Error("Invalid Furlong case stage.");
  }
  return stage as FurlongCaseStage;
}

export type SaveFurlongCaseInput = {
  caseId: string;
  customerId?: string | null;
  propertyId?: string | null;
  propertyAddress?: string | null;
  customerGoal?: string | null;
  currentStage?: FurlongCaseStage;
  caseStatus?: string;
  outcomeStatus?: string;
  propertySnapshot?: Record<string, unknown>;
  businessContext?: Record<string, unknown>;
  borrowerReadiness?: Record<string, unknown>;
  environmentalContext?: Record<string, unknown>;
  capitalContext?: Record<string, unknown>;
  documentRefs?: string[];
  permissionState?: Record<string, unknown>;
  providerSelections?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

function normalizeCaseId(caseId: string): string {
  const value = caseId.trim();
  if (!value || value.length > 160) throw new Error("A valid Furlong case identifier is required.");
  return value;
}

function strings(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export async function saveFurlongCase(
  input: SaveFurlongCaseInput,
  actorId: string,
  traceId: string,
) {
  const caseId = normalizeCaseId(input.caseId);
  const now = new Date();
  const existing = await loadFurlongCase(caseId);
  const values = {
    caseId,
    // Ownership is established on first save and is never silently transferred by
    // a later operator/admin update. Any ownership transfer requires a separate,
    // explicit governed ceremony rather than an upsert side effect.
    ownerActorId: existing?.ownerActorId ?? actorId,
    customerId: input.customerId?.trim() || existing?.customerId || null,
    propertyId: input.propertyId?.trim() || existing?.propertyId || null,
    propertyAddress: input.propertyAddress?.trim() || existing?.propertyAddress || null,
    customerGoal: input.customerGoal?.trim() || existing?.customerGoal || null,
    currentStage: normalizeFurlongCaseStage(input.currentStage ?? existing?.currentStage ?? "PROPERTY_ANALYSIS"),
    caseStatus: input.caseStatus?.trim() || "OPEN",
    outcomeStatus: input.outcomeStatus?.trim() || "NOT_STARTED",
    propertySnapshot: input.propertySnapshot ?? {},
    businessContext: input.businessContext ?? {},
    borrowerReadiness: input.borrowerReadiness ?? {},
    environmentalContext: input.environmentalContext ?? {},
    capitalContext: input.capitalContext ?? {},
    documentRefs: strings(input.documentRefs),
    permissionState: input.permissionState ?? {},
    providerSelections: input.providerSelections ?? [],
    governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: traceId,
    traceId,
    metadata: {
      ...(input.metadata ?? {}),
      customerControlled: true,
      outcomeAuthority: "external-human-authority",
      providerSharingRequiresExplicitConsent: true,
    },
    updatedAt: now,
  } as const;

  const [saved] = await db.insert(furlongCases).values(values).onConflictDoUpdate({
    target: furlongCases.caseId,
    set: values,
  }).returning();

  await appendFurlongCaseEvent({
    caseId,
    idempotencyKey: `case-save:${caseId}:${traceId}`,
    eventType: "CASE_SNAPSHOT_SAVED",
    summary: "The customer-controlled Furlong Case snapshot was saved.",
    detail: { currentStage: saved.currentStage, caseStatus: saved.caseStatus },
    evidenceRefs: [traceId],
    actorId,
    traceId,
  });
  return saved;
}

export async function loadFurlongCase(caseId: string) {
  const normalized = normalizeCaseId(caseId);
  const [record] = await db.select().from(furlongCases).where(eq(furlongCases.caseId, normalized)).limit(1);
  return record ?? null;
}

export async function listFurlongCaseEvents(caseId: string, limit = 100) {
  return db
    .select()
    .from(furlongCaseEvents)
    .where(eq(furlongCaseEvents.caseId, normalizeCaseId(caseId)))
    .orderBy(desc(furlongCaseEvents.occurredAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}

export async function listFurlongCaseOutcomes(caseId: string, limit = 100) {
  return db
    .select()
    .from(furlongCaseOutcomeRecords)
    .where(eq(furlongCaseOutcomeRecords.caseId, normalizeCaseId(caseId)))
    .orderBy(desc(furlongCaseOutcomeRecords.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}

export async function appendFurlongCaseEvent(input: {
  caseId: string;
  idempotencyKey?: string;
  eventType: string;
  eventStatus?: string;
  summary: string;
  detail?: Record<string, unknown> | null;
  evidenceRefs?: string[];
  actorId?: string | null;
  traceId: string;
}) {
  const caseId = normalizeCaseId(input.caseId);
  const idempotencyKey = input.idempotencyKey?.trim() || `case-event:${caseId}:${randomUUID()}`;
  const [event] = await db.insert(furlongCaseEvents).values({
    caseId,
    idempotencyKey,
    eventType: input.eventType.trim().toUpperCase(),
    eventStatus: input.eventStatus?.trim().toUpperCase() || "RECORDED",
    actorId: input.actorId?.trim() || null,
    summary: input.summary.trim(),
    detail: input.detail ?? null,
    evidenceRefs: strings(input.evidenceRefs),
    governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    metadata: { appendOnly: true },
  }).onConflictDoNothing({ target: furlongCaseEvents.idempotencyKey }).returning();
  return event ?? null;
}

export async function recordFurlongCaseOutcome(input: {
  caseId: string;
  serviceRequestId?: string | null;
  providerId?: string | null;
  executionRef?: string | null;
  outcomeType: string;
  outcomeReasonCategory?: string | null;
  conditions?: string[];
  financingStructure?: Record<string, unknown> | null;
  actualRateBps?: number | null;
  actualProjectCost?: number | null;
  environmentalOutcome?: string | null;
  submittedAt?: Date | null;
  providerRespondedAt?: Date | null;
  acceptedAt?: Date | null;
  declinedAt?: Date | null;
  closedAt?: Date | null;
  evidenceRefs: string[];
  actorId: string;
  verified?: boolean;
  traceId: string;
}) {
  const caseId = normalizeCaseId(input.caseId);
  const evidenceRefs = strings(input.evidenceRefs);
  if (input.verified && evidenceRefs.length === 0) {
    throw new Error("Verified case outcomes require at least one evidence reference.");
  }
  const now = new Date();
  const verificationStatus = input.verified ? "VERIFIED" : "PENDING_VERIFICATION";
  const [outcome] = await db.insert(furlongCaseOutcomeRecords).values({
    caseId,
    serviceRequestId: input.serviceRequestId?.trim() || null,
    providerId: input.providerId?.trim() || null,
    executionRef: input.executionRef?.trim() || null,
    outcomeType: input.outcomeType.trim().toUpperCase(),
    outcomeReasonCategory: input.outcomeReasonCategory?.trim() || null,
    conditions: strings(input.conditions),
    financingStructure: input.financingStructure ?? null,
    actualRateBps: input.actualRateBps == null ? null : Math.round(input.actualRateBps),
    actualProjectCost: input.actualProjectCost == null ? null : Math.round(input.actualProjectCost),
    environmentalOutcome: input.environmentalOutcome?.trim() || null,
    submittedAt: input.submittedAt ?? null,
    providerRespondedAt: input.providerRespondedAt ?? null,
    acceptedAt: input.acceptedAt ?? null,
    declinedAt: input.declinedAt ?? null,
    closedAt: input.closedAt ?? null,
    verificationStatus,
    evidenceRefs,
    recordedBy: input.actorId,
    verifiedBy: input.verified ? input.actorId : null,
    verifiedAt: input.verified ? now : null,
    governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    metadata: {
      customerOutcomeLearning: true,
      creditDecisionAuthority: false,
      compensationInfluencesRanking: false,
    },
  }).returning();

  await db.update(furlongCases).set({
    outcomeStatus: input.closedAt ? "COMPLETED" : "IN_PROGRESS",
    currentStage: input.closedAt ? "OPERATING_LOGBOOK" : "CLOSING",
    caseStatus: input.closedAt ? "CLOSED_ACTIVE_LOGBOOK" : "OPEN",
    closedAt: input.closedAt ?? null,
    replayRef: input.traceId,
    traceId: input.traceId,
    updatedAt: now,
  }).where(eq(furlongCases.caseId, caseId));

  await appendFurlongCaseEvent({
    caseId,
    eventType: "ACTUAL_OUTCOME_RECORDED",
    summary: `Actual-world outcome recorded: ${input.outcomeType.trim().toUpperCase()}.`,
    detail: {
      providerId: input.providerId ?? null,
      outcomeReasonCategory: input.outcomeReasonCategory ?? null,
      verificationStatus,
      environmentalOutcome: input.environmentalOutcome ?? null,
    },
    evidenceRefs,
    actorId: input.actorId,
    traceId: input.traceId,
  });
  return outcome;
}

export async function loadFurlongCaseBundle(caseId: string) {
  const record = await loadFurlongCase(caseId);
  if (!record) return null;
  const [events, outcomes] = await Promise.all([
    listFurlongCaseEvents(caseId),
    listFurlongCaseOutcomes(caseId),
  ]);
  return { record, events, outcomes };
}
