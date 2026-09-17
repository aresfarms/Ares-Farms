import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, asc, eq, gt, or } from "drizzle-orm";

import {
  furlongCaseEvents,
  furlongCases,
  furlongPropertyComparisonItems,
  furlongPropertyComparisons,
} from "@/db/schema";
import { db } from "@/lib/db";
import { FURLONG_CASE_GOVERNANCE_VERSION } from "@/lib/intelligence/furlongCaseStore";
import type { PropertyComparisonIntake } from "@/lib/intelligence/propertyComparisonIntake";
import type { EnterpriseEconomicEvidencePackage } from "@/lib/intelligence/economicEvidencePackage";
import {
  PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
  compilePropertyComparisonEconomicAnalysis,
} from "@/lib/intelligence/propertyComparisonEconomicAnalysis";
import {
  isComparablePropertyAnalysis,
  rankPropertyComparisonAnalyses,
  type ComparablePropertyAnalysis,
} from "@/lib/intelligence/propertyComparisonRanking";

export const PROPERTY_COMPARISON_GOVERNANCE_VERSION = "property-comparison-v1.0.0";

export class PropertyComparisonEconomicEvidenceError extends Error {
  constructor(readonly missingEvidence: string[]) {
    super("Property comparison economic evidence is incomplete.");
    this.name = "PropertyComparisonEconomicEvidenceError";
  }
}

const RECOVERY_DAYS = 90;

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function recoveryToken(): string {
  return "furlong-comparison-" + randomBytes(32).toString("base64url");
}

export async function createPropertyComparison(input: {
  intake: PropertyComparisonIntake;
  ownerActorId: string | null;
  traceId: string;
}) {
  const comparisonId = randomUUID();
  const caseId = "comparison:" + comparisonId;
  const accessToken = recoveryToken();
  const accessTokenHash = tokenHash(accessToken);
  const actorId = input.ownerActorId ?? "anonymous-comparison:" + accessTokenHash.slice(0, 16);
  const expiresAt = new Date(Date.now() + RECOVERY_DAYS * 24 * 60 * 60 * 1000);

  const comparison = await db.transaction(async (tx) => {
    await tx.insert(furlongCases).values({
      caseId,
      ownerActorId: actorId,
      customerGoal: `Compare ${input.intake.addresses.length} properties and return the best ${input.intake.requestedResultCount}.`,
      currentStage: "PROPERTY_ANALYSIS",
      caseStatus: "OPEN",
      outcomeStatus: "NOT_STARTED",
      propertySnapshot: {
        comparisonId,
        retainedPropertyCount: input.intake.addresses.length,
        excludedPropertyCount: input.intake.excludedAddresses.length,
      },
      businessContext: {},
      borrowerReadiness: {},
      environmentalContext: {},
      capitalContext: {},
      documentRefs: [],
      permissionState: { providerSharingAuthorized: false },
      providerSelections: [],
      governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      metadata: {
        caseKind: "PROPERTY_COMPARISON",
        batchExecutionRequired: true,
        rankingAvailableOnlyAfterComparableChildResults: true,
        customerControlled: true,
      },
    });
    await tx.insert(furlongCaseEvents).values({
      caseId,
      idempotencyKey: `comparison-created:${comparisonId}`,
      eventType: "PROPERTY_COMPARISON_CREATED",
      eventStatus: "RECORDED",
      actorId,
      summary: "The customer-controlled property comparison was created.",
      detail: {
        retainedPropertyCount: input.intake.addresses.length,
        excludedPropertyCount: input.intake.excludedAddresses.length,
        requestedResultCount: input.intake.requestedResultCount,
      },
      evidenceRefs: [input.traceId],
      governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      metadata: { appendOnly: true },
    });
    const [created] = await tx.insert(furlongPropertyComparisons).values({
      id: comparisonId,
      caseId,
      ownerActorId: input.ownerActorId,
      accessTokenHash,
      requestedResultCount: input.intake.requestedResultCount,
      propertyCount: input.intake.addresses.length,
      governanceVersion: PROPERTY_COMPARISON_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      metadata: {
        anonymousRecoveryPermitted: true,
        recoveryTokenStoredAsHashOnly: true,
        queueExecutionMode: "ASYNCHRONOUS_REQUIRED",
      },
      expiresAt,
    }).returning();

    const retained = input.intake.addresses.map((submittedAddress, ordinal) => ({
      comparisonId, ordinal, submittedAddress, status: "QUEUED",
      governanceVersion: PROPERTY_COMPARISON_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL", replayRef: input.traceId, traceId: input.traceId,
      metadata: { rankingEligible: false, reason: "Awaiting property verification." },
    }));
    const excluded = input.intake.excludedAddresses.map((submittedAddress, index) => ({
      comparisonId, ordinal: retained.length + index, submittedAddress, status: "EXCLUDED",
      governanceVersion: PROPERTY_COMPARISON_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL", replayRef: input.traceId, traceId: input.traceId,
      metadata: { rankingEligible: false, reason: "Excluded by customer before scheduling." },
    }));
    if (retained.length || excluded.length) {
      await tx.insert(furlongPropertyComparisonItems).values([...retained, ...excluded]);
    }
    return created;
  });

  if (!comparison) throw new Error("The comparison case could not be created.");
  return {
    comparisonId: comparison.id,
    caseId: comparison.caseId,
    accessToken,
    status: comparison.status,
    propertyCount: comparison.propertyCount,
    requestedResultCount: comparison.requestedResultCount,
    expiresAt: comparison.expiresAt,
  };
}

export async function loadPropertyComparison(input: {
  comparisonId: string;
  ownerActorId: string | null;
  accessToken: string | null;
}) {
  const hash = input.accessToken?.trim() ? tokenHash(input.accessToken.trim()) : null;
  if (!input.ownerActorId && !hash) return null;
  const authority = [
    input.ownerActorId
      ? eq(furlongPropertyComparisons.ownerActorId, input.ownerActorId)
      : undefined,
    hash ? eq(furlongPropertyComparisons.accessTokenHash, hash) : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const access = authority.length === 2 ? or(authority[0], authority[1]) : authority[0];
  if (!access) return null;

  const [comparison] = await db.select({
    id: furlongPropertyComparisons.id,
    caseId: furlongPropertyComparisons.caseId,
    requestedResultCount: furlongPropertyComparisons.requestedResultCount,
    status: furlongPropertyComparisons.status,
    propertyCount: furlongPropertyComparisons.propertyCount,
    completedCount: furlongPropertyComparisons.completedCount,
    failedCount: furlongPropertyComparisons.failedCount,
    metadata: furlongPropertyComparisons.metadata,
    expiresAt: furlongPropertyComparisons.expiresAt,
    createdAt: furlongPropertyComparisons.createdAt,
    updatedAt: furlongPropertyComparisons.updatedAt,
  }).from(furlongPropertyComparisons).where(and(
    eq(furlongPropertyComparisons.id, input.comparisonId),
    gt(furlongPropertyComparisons.expiresAt, new Date()),
    access,
  )).limit(1);
  if (!comparison) return null;

  const items = await db.select({
    id: furlongPropertyComparisonItems.id,
    ordinal: furlongPropertyComparisonItems.ordinal,
    submittedAddress: furlongPropertyComparisonItems.submittedAddress,
    normalizedAddress: furlongPropertyComparisonItems.normalizedAddress,
    status: furlongPropertyComparisonItems.status,
    propertyId: furlongPropertyComparisonItems.propertyId,
    childCaseId: furlongPropertyComparisonItems.childCaseId,
    resultSnapshot: furlongPropertyComparisonItems.resultSnapshot,
    failureCode: furlongPropertyComparisonItems.failureCode,
    evidenceRefs: furlongPropertyComparisonItems.evidenceRefs,
    startedAt: furlongPropertyComparisonItems.startedAt,
    completedAt: furlongPropertyComparisonItems.completedAt,
  }).from(furlongPropertyComparisonItems)
    .where(eq(furlongPropertyComparisonItems.comparisonId, comparison.id))
    .orderBy(asc(furlongPropertyComparisonItems.ordinal));
  return { comparison, items };
}

export async function claimQueuedPropertyComparisonItems(input: {
  limit?: number;
  traceId: string;
}) {
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 5), 1), 20);
  const candidates = await db.select({
    id: furlongPropertyComparisonItems.id,
    comparisonId: furlongPropertyComparisonItems.comparisonId,
    submittedAddress: furlongPropertyComparisonItems.submittedAddress,
    ordinal: furlongPropertyComparisonItems.ordinal,
  }).from(furlongPropertyComparisonItems)
    .where(eq(furlongPropertyComparisonItems.status, "QUEUED"))
    .orderBy(asc(furlongPropertyComparisonItems.createdAt))
    .limit(limit * 3);

  const claimed = [];
  for (const candidate of candidates) {
    if (claimed.length >= limit) break;
    const [item] = await db.update(furlongPropertyComparisonItems).set({
      status: "VERIFYING",
      startedAt: new Date(),
      updatedAt: new Date(),
      traceId: input.traceId,
      replayRef: input.traceId,
      metadata: { rankingEligible: false, reason: "Address verification in progress." },
    }).where(and(
      eq(furlongPropertyComparisonItems.id, candidate.id),
      eq(furlongPropertyComparisonItems.status, "QUEUED"),
    )).returning({
      id: furlongPropertyComparisonItems.id,
      comparisonId: furlongPropertyComparisonItems.comparisonId,
      submittedAddress: furlongPropertyComparisonItems.submittedAddress,
      ordinal: furlongPropertyComparisonItems.ordinal,
    });
    if (item) claimed.push(item);
  }
  for (const comparisonId of new Set(claimed.map((item) => item.comparisonId))) {
    await db.update(furlongPropertyComparisons).set({
      status: "VERIFYING", updatedAt: new Date(),
      traceId: input.traceId, replayRef: input.traceId,
    }).where(and(
      eq(furlongPropertyComparisons.id, comparisonId),
      eq(furlongPropertyComparisons.status, "QUEUED"),
    ));
  }
  return claimed;
}

export async function recordPropertyComparisonVerification(input: {
  itemId: string;
  comparisonId: string;
  verified: boolean;
  normalizedAddress?: string | null;
  propertyId?: string | null;
  failureCode?: string | null;
  evidenceRefs?: string[];
  resultSnapshot?: Record<string, unknown>;
  traceId: string;
}) {
  const terminalStatus = input.verified ? "VERIFIED" : "UNVERIFIABLE";
  const [item] = await db.update(furlongPropertyComparisonItems).set({
    status: terminalStatus,
    normalizedAddress: input.normalizedAddress ?? null,
    propertyId: input.propertyId ?? null,
    failureCode: input.verified ? null : input.failureCode ?? "ADDRESS_UNVERIFIABLE",
    evidenceRefs: input.evidenceRefs ?? [],
    resultSnapshot: input.resultSnapshot ?? null,
    completedAt: new Date(),
    updatedAt: new Date(),
    traceId: input.traceId,
    replayRef: input.traceId,
    metadata: {
      rankingEligible: false,
      reason: input.verified
        ? "Verified; full property analysis is still required."
        : "Address could not enter property analysis.",
    },
  }).where(and(
    eq(furlongPropertyComparisonItems.id, input.itemId),
    eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId),
    eq(furlongPropertyComparisonItems.status, "VERIFYING"),
  )).returning();
  if (!item) return null;

  const statuses = await db.select({ status: furlongPropertyComparisonItems.status })
    .from(furlongPropertyComparisonItems)
    .where(eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId));
  const active = statuses.filter((row) => row.status !== "EXCLUDED");
  const failedCount = active.filter((row) => ["UNVERIFIABLE", "FAILED"].includes(row.status)).length;
  const verificationPending = active.some((row) => ["QUEUED", "VERIFYING"].includes(row.status));
  await db.update(furlongPropertyComparisons).set({
    status: verificationPending ? "VERIFYING" : "ANALYZING",
    failedCount,
    updatedAt: new Date(),
    traceId: input.traceId,
    replayRef: input.traceId,
  }).where(eq(furlongPropertyComparisons.id, input.comparisonId));
  return item;
}

export async function claimVerifiedPropertyComparisonItems(input: {
  limit?: number;
  traceId: string;
}) {
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 5), 1), 20);
  const candidates = await db.select({
    id: furlongPropertyComparisonItems.id,
    comparisonId: furlongPropertyComparisonItems.comparisonId,
    submittedAddress: furlongPropertyComparisonItems.submittedAddress,
    normalizedAddress: furlongPropertyComparisonItems.normalizedAddress,
    propertyId: furlongPropertyComparisonItems.propertyId,
    resultSnapshot: furlongPropertyComparisonItems.resultSnapshot,
  }).from(furlongPropertyComparisonItems)
    .where(eq(furlongPropertyComparisonItems.status, "VERIFIED"))
    .orderBy(asc(furlongPropertyComparisonItems.createdAt))
    .limit(limit * 3);
  const claimed = [];
  for (const candidate of candidates) {
    if (claimed.length >= limit) break;
    const [item] = await db.update(furlongPropertyComparisonItems).set({
      status: "ANALYZING", updatedAt: new Date(),
      traceId: input.traceId, replayRef: input.traceId,
      metadata: { rankingEligible: false, reason: "Full property analysis in progress." },
    }).where(and(
      eq(furlongPropertyComparisonItems.id, candidate.id),
      eq(furlongPropertyComparisonItems.status, "VERIFIED"),
    )).returning({
      id: furlongPropertyComparisonItems.id,
      comparisonId: furlongPropertyComparisonItems.comparisonId,
      submittedAddress: furlongPropertyComparisonItems.submittedAddress,
      normalizedAddress: furlongPropertyComparisonItems.normalizedAddress,
      propertyId: furlongPropertyComparisonItems.propertyId,
      resultSnapshot: furlongPropertyComparisonItems.resultSnapshot,
    });
    if (item) claimed.push(item);
  }
  return claimed;
}

export async function recordCompletedPropertyComparisonAnalysis(input: {
  itemId: string;
  comparisonId: string;
  evidencePackages: EnterpriseEconomicEvidencePackage[];
  traceId: string;
}) {
  const childCaseId = "comparison-property:" + input.itemId;

  return db.transaction(async (tx) => {
    const [parent] = await tx.select({
      caseId: furlongPropertyComparisons.caseId,
    }).from(furlongPropertyComparisons)
      .where(eq(furlongPropertyComparisons.id, input.comparisonId)).limit(1);
    if (!parent) return null;

    const [sourceItem] = await tx.select({
      propertyId: furlongPropertyComparisonItems.propertyId,
      normalizedAddress: furlongPropertyComparisonItems.normalizedAddress,
      submittedAddress: furlongPropertyComparisonItems.submittedAddress,
    }).from(furlongPropertyComparisonItems).where(and(
      eq(furlongPropertyComparisonItems.id, input.itemId),
      eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId),
    )).limit(1);
    if (!sourceItem?.propertyId) return null;

    const compilation = compilePropertyComparisonEconomicAnalysis({
      comparisonItemId: input.itemId,
      propertyId: sourceItem.propertyId,
      address: sourceItem.normalizedAddress ?? sourceItem.submittedAddress,
      packages: input.evidencePackages,
    });
    if (!compilation.ok) {
      throw new PropertyComparisonEconomicEvidenceError(
        compilation.missingEvidence,
      );
    }
    const analysis = compilation.analysis;
    const evidenceRefs = compilation.evidenceRefs;
    const packageSnapshots = input.evidencePackages.map(
      (evidencePackage, index) => ({
        package: evidencePackage,
        assessment: compilation.assessments[index],
      }),
    );

    const [claimed] = await tx.update(furlongPropertyComparisonItems).set({
      status: "ANALYZING",
      updatedAt: new Date(),
      traceId: input.traceId,
      replayRef: input.traceId,
      metadata: {
        rankingEligible: false,
        reason: "Validated economic evidence packages are being committed.",
      },
    }).where(and(
      eq(furlongPropertyComparisonItems.id, input.itemId),
      eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId),
      or(
        eq(furlongPropertyComparisonItems.status, "VERIFIED"),
        eq(furlongPropertyComparisonItems.status, "NEEDS_EVIDENCE"),
        eq(furlongPropertyComparisonItems.status, "ANALYZING"),
      ),
    )).returning({ id: furlongPropertyComparisonItems.id });
    if (!claimed) return null;

    const [parentCase] = await tx.select({
      ownerActorId: furlongCases.ownerActorId,
    }).from(furlongCases)
      .where(eq(furlongCases.caseId, parent.caseId)).limit(1);
    const actorId =
      parentCase?.ownerActorId ?? "system:property-comparison-worker";

    await tx.insert(furlongCases).values({
      caseId: childCaseId,
      ownerActorId: actorId,
      propertyId: analysis.propertyId,
      propertyAddress: analysis.address,
      customerGoal:
        "Identify and compare the strongest supported enterprise configurations for this property.",
      currentStage: "FEASIBILITY",
      caseStatus: "OPEN",
      outcomeStatus: "NOT_STARTED",
      propertySnapshot: {
        comparisonId: input.comparisonId,
        analysis,
        economicEvidencePackages: packageSnapshots,
      },
      businessContext: {},
      borrowerReadiness: {},
      environmentalContext: {},
      capitalContext: {},
      documentRefs: evidenceRefs,
      permissionState: { providerSharingAuthorized: false },
      providerSelections: [],
      governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      metadata: {
        caseKind: "COMPARISON_CHILD_PROPERTY",
        parentCaseId: parent.caseId,
        economicAnalysisVersion:
          PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
      },
    }).onConflictDoNothing({ target: furlongCases.caseId });

    await tx.insert(furlongCaseEvents).values({
      caseId: childCaseId,
      idempotencyKey: "comparison-analysis-completed:" + input.itemId,
      eventType: "PROPERTY_COMPARISON_ANALYSIS_COMPLETED",
      eventStatus: "RECORDED",
      actorId: "system:property-comparison-worker",
      summary:
        "The child property analysis completed from validated economic evidence packages.",
      detail: {
        comparisonId: input.comparisonId,
        candidateCount: analysis.candidates.length,
        packageIds: input.evidencePackages.map((item) => item.packageId),
        economicAnalysisVersion:
          PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
      },
      evidenceRefs,
      governanceVersion: FURLONG_CASE_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: input.traceId,
      traceId: input.traceId,
      metadata: { appendOnly: true, rankingReleased: false },
    }).onConflictDoNothing({ target: furlongCaseEvents.idempotencyKey });

    const [updated] = await tx.update(furlongPropertyComparisonItems).set({
      status: "COMPLETED",
      childCaseId,
      resultSnapshot: {
        schemaVersion: "comparable-property-analysis-v1",
        economicAnalysisVersion:
          PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
        analysis,
        economicEvidencePackages: packageSnapshots,
      },
      evidenceRefs,
      completedAt: new Date(),
      updatedAt: new Date(),
      traceId: input.traceId,
      replayRef: input.traceId,
      metadata: {
        rankingEligible: true,
        rankingReleased: false,
        evidencePackageCount: packageSnapshots.length,
      },
    }).where(and(
      eq(furlongPropertyComparisonItems.id, input.itemId),
      eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId),
      eq(furlongPropertyComparisonItems.status, "ANALYZING"),
    )).returning();
    return updated ?? null;
  });
}

export async function recordPropertyComparisonEvidenceGap(input: {
  itemId: string;
  comparisonId: string;
  missingEvidence: string[];
  traceId: string;
}) {
  const missingEvidence = [...new Set(input.missingEvidence.map((item) => item.trim()).filter(Boolean))];
  if (!missingEvidence.length) throw new Error("At least one missing evidence item is required.");
  const [updated] = await db.update(furlongPropertyComparisonItems).set({
    status: "NEEDS_EVIDENCE",
    resultSnapshot: {
      schemaVersion: "comparable-property-analysis-v1",
      rankingEligible: false,
      missingEvidence,
    },
    completedAt: new Date(), updatedAt: new Date(),
    traceId: input.traceId, replayRef: input.traceId,
    metadata: { rankingEligible: false, reason: "Material analysis evidence is missing." },
  }).where(and(
    eq(furlongPropertyComparisonItems.id, input.itemId),
    eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId),
    eq(furlongPropertyComparisonItems.status, "ANALYZING"),
  )).returning();
  return updated ?? null;
}

export async function finalizePropertyComparison(input: {
  comparisonId: string;
  traceId: string;
}) {
  const [comparison] = await db.select().from(furlongPropertyComparisons)
    .where(eq(furlongPropertyComparisons.id, input.comparisonId)).limit(1);
  if (!comparison) return null;
  const items = await db.select().from(furlongPropertyComparisonItems)
    .where(eq(furlongPropertyComparisonItems.comparisonId, input.comparisonId))
    .orderBy(asc(furlongPropertyComparisonItems.ordinal));
  const retained = items.filter((item) => item.status !== "EXCLUDED");
  const active = retained.some((item) =>
    ["QUEUED", "VERIFYING", "VERIFIED", "ANALYZING"].includes(item.status));
  if (active) {
    return { finalized: false, reason: "Child property work remains active." };
  }

  const analyses: ComparablePropertyAnalysis[] = retained.map((item) => {
    const snapshot = item.resultSnapshot && typeof item.resultSnapshot === "object"
      ? item.resultSnapshot as Record<string, unknown> : {};
    if (item.status === "COMPLETED" && isComparablePropertyAnalysis(snapshot.analysis)) {
      return snapshot.analysis;
    }
    return {
      comparisonItemId: item.id,
      propertyId: item.propertyId ?? "unresolved:" + item.id,
      address: item.normalizedAddress ?? item.submittedAddress,
      status: item.status === "UNVERIFIABLE" ? "unverifiable"
        : item.status === "FAILED" ? "failed" : "needs-evidence",
      candidates: [],
    };
  });
  const ranking = rankPropertyComparisonAnalyses({
    analyses,
    expectedPropertyCount: comparison.propertyCount,
    requestedResultCount: comparison.requestedResultCount,
  });
  const status = ranking.status === "completed" ? "COMPLETED"
    : ranking.status === "partial" ? "PARTIAL"
      : ranking.status === "needs-evidence" ? "AWAITING_EVIDENCE" : comparison.status;
  const currentMetadata = comparison.metadata && typeof comparison.metadata === "object"
    ? comparison.metadata as Record<string, unknown> : {};
  await db.update(furlongPropertyComparisons).set({
    status,
    completedCount: retained.filter((item) => item.status === "COMPLETED").length,
    failedCount: retained.filter((item) => ["FAILED", "UNVERIFIABLE"].includes(item.status)).length,
    updatedAt: new Date(), traceId: input.traceId, replayRef: input.traceId,
    metadata: { ...currentMetadata, ranking, rankingReleased: ranking.status !== "pending" },
  }).where(eq(furlongPropertyComparisons.id, input.comparisonId));
  return { finalized: ranking.status !== "pending", ranking };
}
