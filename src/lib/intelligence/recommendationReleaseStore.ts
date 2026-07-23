import { and, asc, desc, eq, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { recommendationReleaseAttestations, recommendationReleaseRecords, type RecommendationReleaseAttestationRow, type RecommendationReleaseRecordRow } from "@/db/schema";
import { db } from "@/lib/db";
import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";
import { buildRecommendationReleaseChangeControl } from "@/lib/intelligence/recommendationReleaseChangeControl";
import { buildRecommendationReleaseHistory } from "@/lib/intelligence/recommendationReleaseHistory";

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const SOURCE = "recommendation-release-store";
const ATTESTATION_FRESHNESS_MS = 24 * 60 * 60 * 1000;

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


export interface PendingRecommendationReleaseSummary {
  releaseId: string;
  subjectType: string;
  subjectKey: string;
  firstAttestedAt: Date;
  expiresAt: Date;
  freshnessState: "active" | "expired";
  urgencyState: "normal" | "due-soon" | "critical" | "expired";
  remainingSeconds: number;
  escalationRequired: boolean;
  attestationCount: number;
  currentActorAlreadyAttested: boolean;
  canCountersign: boolean;
  decisionContext: Record<string, unknown>;
}

export async function listPendingRecommendationReleaseAttestations(input: {
  actorId: string;
  subjectType?: string;
  subjectKey?: string;
  limit?: number;
}): Promise<PendingRecommendationReleaseSummary[]> {
  const actorId = required(input.actorId, "actorId");
  const filters = [];
  if (input.subjectType?.trim()) filters.push(eq(recommendationReleaseAttestations.subjectType, input.subjectType.trim()));
  if (input.subjectKey?.trim()) filters.push(eq(recommendationReleaseAttestations.subjectKey, input.subjectKey.trim()));
  const attestations = await db.select().from(recommendationReleaseAttestations)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(recommendationReleaseAttestations.createdAt))
    .limit(Math.min(Math.max(input.limit ?? 300, 1), 750));
  if (!attestations.length) return [];

  const released = await db.select({ releaseId: recommendationReleaseRecords.releaseId }).from(recommendationReleaseRecords);
  const releasedIds = new Set(released.map((row) => row.releaseId));
  const grouped = new Map<string, RecommendationReleaseAttestationRow[]>();
  for (const row of attestations) {
    if (releasedIds.has(row.releaseId)) continue;
    const key = `${row.releaseId}::${row.attestationCycleId}`;
    const rows = grouped.get(key) ?? [];
    rows.push(row);
    grouped.set(key, rows);
  }

  const latestCycleByRelease = new Map<string, RecommendationReleaseAttestationRow[]>();
  for (const rows of grouped.values()) {
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const current = latestCycleByRelease.get(rows[0].releaseId);
    if (!current || rows[0].createdAt > current[0].createdAt) latestCycleByRelease.set(rows[0].releaseId, rows);
  }

  const now = Date.now();
  return [...latestCycleByRelease.values()]
    .filter((rows) => rows.length === 1)
    .map((rows) => {
      const first = rows[0];
      const remainingMs = first.expiresAt.getTime() - now;
      const expired = remainingMs <= 0;
      const urgencyState: PendingRecommendationReleaseSummary["urgencyState"] = expired
        ? "expired"
        : remainingMs <= 4 * 60 * 60 * 1000
          ? "critical"
          : remainingMs <= 12 * 60 * 60 * 1000
            ? "due-soon"
            : "normal";
      const currentActorAlreadyAttested = rows.some((row) => row.reviewerActorId === actorId);
      return {
        releaseId: first.releaseId,
        subjectType: first.subjectType,
        subjectKey: first.subjectKey,
        firstAttestedAt: first.createdAt,
        expiresAt: first.expiresAt,
        freshnessState: expired ? ("expired" as const) : ("active" as const),
        urgencyState,
        remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
        escalationRequired: urgencyState === "critical",
        attestationCount: rows.length,
        currentActorAlreadyAttested,
        canCountersign: !expired && !currentActorAlreadyAttested,
        decisionContext: (first.decisionContext ?? {}) as Record<string, unknown>,
      };
    })
    .sort((a, b) => {
      const rank = { critical: 0, "due-soon": 1, normal: 2, expired: 3 } as const;
      const urgencyDelta = rank[a.urgencyState] - rank[b.urgencyState];
      return urgencyDelta || a.expiresAt.getTime() - b.expiresAt.getTime();
    });
}

export async function persistRecommendationRelease(input: {
  subjectType: string;
  subjectKey: string;
  release: RecommendationReleaseRecord;
  traceId: string;
  reviewer: { actorId: string; email: string; name?: string | null; role: string; authorityBasis: string };
  decisionContext?: Record<string, unknown>;
}): Promise<{ row: RecommendationReleaseRecordRow | null; previous: RecommendationReleaseRecord | null; attestations: RecommendationReleaseAttestationRow[]; pendingCountersignature: boolean; attestationExpiresAt: Date | null; staleCycleRestarted: boolean }> {
  const subjectType = required(input.subjectType, "subjectType");
  const subjectKey = required(input.subjectKey, "subjectKey");
  const existingRelease = await db.select().from(recommendationReleaseRecords)
    .where(eq(recommendationReleaseRecords.releaseId, input.release.releaseId)).limit(1);
  if (existingRelease[0]) return { row: existingRelease[0], previous: null, attestations: [], pendingCountersignature: false, attestationExpiresAt: null, staleCycleRestarted: false };

  const previousRow = await getLatestRecommendationRelease({ subjectType, subjectKey, excludeReleaseId: input.release.releaseId });
  const previous = previousRow ? releaseFromRow(previousRow) : null;
  const changeControl = buildRecommendationReleaseChangeControl({ current: input.release, previous });
  const history = buildRecommendationReleaseHistory({ current: input.release, changeControl });
  const requiresIndependentCountersignature = input.release.releaseState !== "withheld" || changeControl.supersessionRequired;
  const attestationStatement = requiresIndependentCountersignature
    ? "I independently reviewed the evidence version, recommendation, conditions, reviewer dispositions, and release authority, and I attest that this release may proceed subject to the recorded boundaries."
    : "I reviewed this withheld-release event and attest that it records a non-release without implying approval or affirmative guidance.";

  const priorAttestations = await db.select().from(recommendationReleaseAttestations)
    .where(eq(recommendationReleaseAttestations.releaseId, input.release.releaseId))
    .orderBy(desc(recommendationReleaseAttestations.createdAt));
  const latest = priorAttestations[0] ?? null;
  const now = new Date();
  const latestCycleActive = Boolean(latest && latest.expiresAt.getTime() > now.getTime());
  const attestationCycleId = latestCycleActive ? latest!.attestationCycleId : `${input.release.releaseId}:${randomUUID()}`;
  const expiresAt = latestCycleActive ? latest!.expiresAt : new Date(now.getTime() + ATTESTATION_FRESHNESS_MS);
  const staleCycleRestarted = Boolean(latest && !latestCycleActive);

  await db.insert(recommendationReleaseAttestations).values({
    releaseId: input.release.releaseId, attestationCycleId, expiresAt, subjectType, subjectKey,
    reviewerActorId: required(input.reviewer.actorId, "reviewer.actorId"),
    reviewerEmail: required(input.reviewer.email, "reviewer.email"),
    reviewerName: input.reviewer.name?.trim() || null,
    reviewerRole: required(input.reviewer.role, "reviewer.role"),
    authorityBasis: required(input.reviewer.authorityBasis, "reviewer.authorityBasis"),
    attestationStatement, decisionContext: { ...(input.decisionContext ?? {}), attestationCycleId, attestationExpiresAt: expiresAt.toISOString() }, traceId: input.traceId,
  }).onConflictDoNothing({ target: [recommendationReleaseAttestations.releaseId, recommendationReleaseAttestations.attestationCycleId, recommendationReleaseAttestations.reviewerActorId] });

  const attestations = await db.select().from(recommendationReleaseAttestations)
    .where(and(
      eq(recommendationReleaseAttestations.releaseId, input.release.releaseId),
      eq(recommendationReleaseAttestations.attestationCycleId, attestationCycleId),
    ))
    .orderBy(asc(recommendationReleaseAttestations.createdAt));
  const requiredCount = requiresIndependentCountersignature ? 2 : 1;
  if (attestations.length < requiredCount) return { row: null, previous, attestations, pendingCountersignature: true, attestationExpiresAt: expiresAt, staleCycleRestarted };
  if (expiresAt.getTime() <= Date.now()) throw new Error("The countersignature cycle expired before completion. Start a fresh independent review cycle.");

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
    decisionContext: { ...(input.decisionContext ?? {}), attestationCount: attestations.length, independentCountersignatureRequired: requiresIndependentCountersignature, attestationCycleId, attestationExpiresAt: expiresAt.toISOString() },
  }).onConflictDoNothing({ target: recommendationReleaseRecords.releaseId });

  const rows = await db.select().from(recommendationReleaseRecords).where(eq(recommendationReleaseRecords.releaseId, input.release.releaseId)).limit(1);
  if (!rows[0]) throw new Error("Recommendation release persistence failed.");
  return { row: rows[0], previous, attestations, pendingCountersignature: false, attestationExpiresAt: expiresAt, staleCycleRestarted };
}
