import type { DecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import type { RecommendationEvidenceLedger } from "@/lib/intelligence/recommendationEvidenceLedger";
import type { DecisionResolutionPlan } from "@/lib/intelligence/decisionResolutionPlan";
import type { RecommendationFinalityPlan } from "@/lib/intelligence/recommendationFinalityPlan";

export interface RecommendationReleaseRecord {
  releaseId: string;
  releaseState: "withheld" | "eligible";
  finality: RecommendationFinalityPlan["status"];
  evidenceVersion: string;
  approvedRecommendationText: string;
  reviewerResolutions: Array<{ title: string; outcome: string; authority: string; disposition: string }>;
  conditions: string[];
  advisoryBoundary: string;
  integrityStatement: string;
}

function stableToken(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildRecommendationReleaseRecord(args: {
  decision: DecisionSynthesisPlan;
  ledger: RecommendationEvidenceLedger;
  resolutions: DecisionResolutionPlan;
  finality: RecommendationFinalityPlan;
}): RecommendationReleaseRecord {
  const evidenceBasis = args.ledger.entries.map((entry) =>
    [entry.id, entry.kind, entry.status, entry.label, entry.detail, entry.source].join("|")
  ).join("||");
  const resolutionBasis = args.resolutions.records.map((record) =>
    [record.assignmentId, record.outcome, record.authorityUsed, record.gateDisposition].join("|")
  ).join("||");
  const evidenceVersion = `ev-${stableToken(`${evidenceBasis}::${resolutionBasis}`)}`;
  const releaseState = args.finality.status === "final" || args.finality.status === "conditionally-final"
    ? "eligible"
    : "withheld";
  const recommendation = args.decision.decision.replace(/-/g, " ");

  return {
    releaseId: `rec-${stableToken(`${recommendation}::${evidenceVersion}::${args.finality.status}`)}`,
    releaseState,
    finality: args.finality.status,
    evidenceVersion,
    approvedRecommendationText: releaseState === "eligible"
      ? `Human reviewers may use the ${recommendation} recommendation subject to every recorded condition and advisory limitation.`
      : `Release withheld. The ${recommendation} recommendation remains advisory and may not be represented as approved or final.`,
    reviewerResolutions: args.resolutions.records.map((record) => ({
      title: record.title, outcome: record.outcome, authority: record.authorityUsed, disposition: record.gateDisposition,
    })),
    conditions: args.finality.remainingConditions,
    advisoryBoundary: args.decision.advisoryBoundary,
    integrityStatement: "This release record is tied to the stated evidence version and reviewer dispositions. Any material evidence, authority, condition, or recommendation change requires a new release record; this artifact is not lender approval, an appraisal, a legal determination, environmental clearance, a guarantee, or a commitment.",
  };
}
