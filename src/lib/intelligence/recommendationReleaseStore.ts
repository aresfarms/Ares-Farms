import { and, asc, desc, eq, ne } from "drizzle-orm";

import { recommendationReleaseAttestations, recommendationReleaseRecords, type RecommendationReleaseAttestationRow, type RecommendationReleaseRecordRow } from "@/db/schema";
import { db } from "@/lib/db";
import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";
import { buildRecommendationReleaseChangeControl } from "@/lib/intelligence/recommendationReleaseChangeControl";
import { buildRecommendationReleaseHistory } from "@/lib/intelligence/recommendationReleaseHistory";

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const SOURCE = "recommendation-release-store";

function required(value: unknown, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${label} is required.`);
  return text;
}

function releaseFromRow(row: RecommendationReleaseRecordRow): RecommendationReleaseRecord {
  return row.releasePayload as unknown as RecommendationReleaseRecord;
}

export async function getLatestRecommendationRelease(input: {
  subjectType: string;
  subjectKey: string;
  excludeReleaseId?: string | null;
}): Promise<RecommendationReleaseRecordRow | null> {
  const filters = [
    eq(recommendationReleaseRecords.subjectType, required(input.subjectType, "subjectType")),
    eq(recommendationReleaseRecords.subjectKey, required(input.subjectKey, "subjectKey")),
  ];
  if (input.excludeReleaseId) filters.push(ne(recommendationReleaseRecords.releaseId, input.excludeReleaseId));
  const rows = await db.select().from(recommendationReleaseRecords)
    .where(and(...filters)).orderBy(desc(recommendationReleaseRecords.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function listRecommendationReleaseHistory(input: {
  subjectType: string;
  subjectKey: string;
  limit?: number;
}): Promise<RecommendationReleaseRecordRow[]> {
  return db.select().from(recommendationReleaseRecords)
    .where(and(
      eq(recommendationReleaseRecords.subjectType, required(input.subjectType, "subjectType")),
      eq(recommendationReleaseRecords.subjectKey, required(input.subjectKey, "subjectKey")),
    ))
    .orderBy(desc(recommendationReleaseRecords.createdAt))
    .limit(Math.min(Math.max(input.limit ?? 50, 1), 200));
}

export async function persistRecommendationRelease(input: {
  subjectType: string;
  subjectKey: string;
  release: RecommendationReleaseRecord;
  traceId: string;
  reviewer: { actorId: string; email: string; name?: string | null; role: string; authorityBasis: string };
  decisionContext?: Record<string, unknown>;
}): Promise<{ row: RecommendationReleaseRecordRow | null; previous: RecommendationReleaseRecord | null; attestations: RecommendationReleaseAttestationRow[]; pendingCountersignature: boolean }> {
  const subjectType = required(input.subjectType, "subjectType");
  const subjectKey = required(input.subjectKey, "subjectKey");
  const previousRow = await getLatestRecommendationRelease({ subjectType, subjectKey, excludeReleaseId: input.release.releaseId });
  const previous = previousRow ? releaseFromRow(previousRow) : null;
  const changeControl = buildRecommendationReleaseChangeControl({ current: input.release, previous });
  const history = buildRecommendationReleaseHistory({ current: input.release, changeControl });
  const requiresIndependentCountersignature = input.release.releaseState !== "withheld" || changeControl.supersessionRequired;
  const attestationStatement = requiresIndependentCountersignature
    ? "I independently reviewed the evidence version, recommendation, conditions, reviewer dispositions, and release authority, and I attest that this release may proceed subject to the recorded boundaries."
    : "I reviewed this withheld-release event and attest that it records a non-release without implying approval or affirmative guidance.";

  await db.insert(recommendationReleaseAttestations).values({
    releaseId: input.release.releaseId, subjectType, subjectKey,
    reviewerActorId: required(input.reviewer.actorId, "reviewer.actorId"),
    reviewerEmail: required(input.reviewer.email, "reviewer.email"),
    reviewerName: input.reviewer.name?.trim() || null,
    reviewerRole: required(input.reviewer.role, "reviewer.role"),
    authorityBasis: required(input.reviewer.authorityBasis, "reviewer.authorityBasis"),
    attestationStatement, decisionContext: input.decisionContext ?? {}, traceId: input.traceId,
  }).onConflictDoNothing({ target: [recommendationReleaseAttestations.releaseId, recommendationReleaseAttestations.reviewerActorId] });

  const attestations = await db.select().from(recommendationReleaseAttestations)
    .where(eq(recommendationReleaseAttestations.releaseId, input.release.releaseId))
    .orderBy(asc(recommendationReleaseAttestations.createdAt));
  const requiredCount = requiresIndependentCountersignature ? 2 : 1;
  if (attestations.length < requiredCount) return { row: null, previous, attestations, pendingCountersignature: true };

  const finalReviewer = attestations[attestations.length - 1];
  await db.insert(recommendationReleaseRecords).values({
    subjectType, subjectKey, releaseId: input.release.releaseId, previousReleaseId: previous?.releaseId ?? null,
    evidenceVersion: input.release.evidenceVersion, releaseState: input.release.releaseState, finality: input.release.finality,
    approvedRecommendationText: input.release.approvedRecommendationText, reviewerRecordCount: input.release.reviewerResolutions.length,
    conditionCount: input.release.conditions.length, materialChangeCount: changeControl.materialChangeCount,
    supersessionRequired: changeControl.supersessionRequired, releasePayload: input.release, changeControlPayload: changeControl,
    historyPayload: history, governanceVersion: GOVERNANCE_VERSION, classification: "CONFIDENTIAL", replayRef: input.traceId,
    traceId: input.traceId, source: SOURCE, reviewerActorId: finalReviewer.reviewerActorId, reviewerEmail: finalReviewer.reviewerEmail,
    reviewerName: finalReviewer.reviewerName, reviewerRole: finalReviewer.reviewerRole, authorityBasis: finalReviewer.authorityBasis,
    decisionContext: { ...(input.decisionContext ?? {}), attestationCount: attestations.length, independentCountersignatureRequired: requiresIndependentCountersignature },
  }).onConflictDoNothing({ target: recommendationReleaseRecords.releaseId });

  const rows = await db.select().from(recommendationReleaseRecords).where(eq(recommendationReleaseRecords.releaseId, input.release.releaseId)).limit(1);
  if (!rows[0]) throw new Error("Recommendation release persistence failed.");
  return { row: rows[0], previous, attestations, pendingCountersignature: false };
}
