import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";
import type { RecommendationReleaseChangeControl } from "@/lib/intelligence/recommendationReleaseChangeControl";

export type ReleaseAuditAction = "created" | "withheld" | "retained" | "superseded";

export interface RecommendationReleaseAuditEntry {
  sequence: number;
  releaseId: string;
  previousReleaseId: string | null;
  action: ReleaseAuditAction;
  evidenceVersion: string;
  finality: RecommendationReleaseRecord["finality"];
  releaseState: RecommendationReleaseRecord["releaseState"];
  reviewerRecordCount: number;
  conditionCount: number;
  changeReasons: string[];
  reconstructionKey: string;
}

export interface RecommendationReleaseHistory {
  entries: RecommendationReleaseAuditEntry[];
  currentReleaseId: string;
  lineageDepth: number;
  immutableEntryCount: number;
  headline: string;
  auditRule: string;
}

function historyToken(parts: string[]): string {
  let hash = 2166136261;
  for (const value of parts.join("||")) {
    hash ^= value.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildRecommendationReleaseHistory(args: {
  current: RecommendationReleaseRecord;
  changeControl: RecommendationReleaseChangeControl;
  priorEntries?: RecommendationReleaseAuditEntry[];
}): RecommendationReleaseHistory {
  const priorEntries = [...(args.priorEntries ?? [])];
  const action: ReleaseAuditAction = args.current.releaseState === "withheld"
    ? "withheld"
    : args.changeControl.supersessionRequired
      ? "superseded"
      : priorEntries.length === 0
        ? "created"
        : "retained";
  const currentEntry: RecommendationReleaseAuditEntry = {
    sequence: priorEntries.length + 1,
    releaseId: args.current.releaseId,
    previousReleaseId: args.changeControl.previousReleaseId,
    action,
    evidenceVersion: args.current.evidenceVersion,
    finality: args.current.finality,
    releaseState: args.current.releaseState,
    reviewerRecordCount: args.current.reviewerResolutions.length,
    conditionCount: args.current.conditions.length,
    changeReasons: args.changeControl.changeReasons,
    reconstructionKey: `audit-${historyToken([
      args.current.releaseId,
      args.current.evidenceVersion,
      args.current.finality,
      action,
      ...args.changeControl.changeReasons,
    ])}`,
  };
  const entries = [...priorEntries, currentEntry];
  return {
    entries,
    currentReleaseId: args.current.releaseId,
    lineageDepth: entries.length,
    immutableEntryCount: entries.length,
    headline: action === "superseded"
      ? "A new immutable audit entry records the supersession event and preserves the prior release lineage."
      : action === "withheld"
        ? "The withheld release is preserved as an auditable non-release event."
        : "The current release state is preserved as an immutable audit entry.",
    auditRule: "Every release, withheld release, retained release, and supersession must create a new immutable audit entry. Entries preserve release identifiers, evidence versions, reviewer state, conditions, change reasons, and predecessor links so the recommendation lineage can be reconstructed without mutating historical records.",
  };
}
