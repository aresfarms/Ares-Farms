/**
 * Explainability Lineage Runtime
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces AI explainability, adverse action clarity, and audit openness.
 *
 * - Vol II: Regulatory Governance
 *   Supports ECOA reason codes, borrower explanation, and compliance review.
 *
 * - Vol III: Technical Infrastructure
 *   Preserves model/rule/replay lineage and deterministic explanation metadata.
 *
 * - Vol IV: Operational Runbooks
 *   Supports score delivery, dispute review, escalation, and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Implements CANON-EXPL-001 AI Explainability and Citation.
 */

export type ExplanationClaimType =
  | "fact"
  | "inference"
  | "prediction"
  | "simulation"
  | "recommendation";

export type ExplanationAudience =
  | "borrower"
  | "lender"
  | "regulator"
  | "auditor"
  | "internal"
  | "governance";

export type ExplanationEvidenceRef = {
  refId: string;
  sourceType: "ledger" | "rule" | "model" | "document" | "connector" | "human_review";
  sourceName: string;
  sourceVersion?: string | null;
  citation?: string | null;
  replayRef?: string | null;
};

export type ExplanationLineageInput = {
  outputIdentifier: string;
  outputType: string;
  audience: ExplanationAudience;
  claimType: ExplanationClaimType;
  summary: string;
  modelVersion?: string | null;
  ruleVersion?: string | null;
  overlayRefs?: string[];
  confidenceScore?: number | null;
  uncertaintyFlags?: string[];
  evidenceRefs?: ExplanationEvidenceRef[];
  humanReviewRequired?: boolean;
  auditEventRefs?: string[];
  replayRefs?: string[];
  metadata?: Record<string, unknown>;
};

export type ExplanationLineageRecord = {
  explanationId: string;
  outputIdentifier: string;
  outputType: string;
  audience: ExplanationAudience;
  claimType: ExplanationClaimType;
  summary: string;
  modelVersion: string | null;
  ruleVersion: string | null;
  overlayRefs: string[];
  confidenceScore: number | null;
  uncertaintyFlags: string[];
  evidenceRefs: ExplanationEvidenceRef[];
  humanReviewRequired: boolean;
  auditEventRefs: string[];
  replayRefs: string[];
  metadata: Record<string, unknown>;
  timestamp: string;
};

function createExplanationId(outputIdentifier: string): string {
  return `expl-${outputIdentifier}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeConfidenceScore(score?: number | null): number | null {
  if (score === null || score === undefined) {
    return null;
  }

  if (!Number.isFinite(score)) {
    return null;
  }

  if (score < 0) {
    return 0;
  }

  if (score > 1) {
    return 1;
  }

  return score;
}

export function createExplanationLineage(
  input: ExplanationLineageInput
): ExplanationLineageRecord {
  return {
    explanationId: createExplanationId(input.outputIdentifier),
    outputIdentifier: input.outputIdentifier,
    outputType: input.outputType,
    audience: input.audience,
    claimType: input.claimType,
    summary: input.summary,
    modelVersion: input.modelVersion ?? null,
    ruleVersion: input.ruleVersion ?? null,
    overlayRefs: input.overlayRefs ?? [],
    confidenceScore: normalizeConfidenceScore(input.confidenceScore),
    uncertaintyFlags: input.uncertaintyFlags ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    humanReviewRequired: input.humanReviewRequired ?? false,
    auditEventRefs: input.auditEventRefs ?? [],
    replayRefs: input.replayRefs ?? [],
    metadata: input.metadata ?? {},
    timestamp: new Date().toISOString(),
  };
}

export function requireHumanReviewForLowConfidence(
  record: ExplanationLineageRecord,
  threshold = 0.7
): ExplanationLineageRecord {
  if (record.confidenceScore === null || record.confidenceScore >= threshold) {
    return record;
  }

  return {
    ...record,
    humanReviewRequired: true,
    uncertaintyFlags: [
      ...record.uncertaintyFlags,
      "LOW_CONFIDENCE_HUMAN_REVIEW_REQUIRED",
    ],
  };
}

export function attachEvidenceRef(
  record: ExplanationLineageRecord,
  evidenceRef: ExplanationEvidenceRef
): ExplanationLineageRecord {
  return {
    ...record,
    evidenceRefs: [...record.evidenceRefs, evidenceRef],
  };
}
