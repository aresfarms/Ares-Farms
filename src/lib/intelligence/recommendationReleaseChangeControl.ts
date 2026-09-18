import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";

export type ReleaseLineageState = "baseline-created" | "withheld" | "current" | "superseded";

export interface RecommendationReleaseChangeControl {
  lineageState: ReleaseLineageState;
  currentReleaseId: string;
  previousReleaseId: string | null;
  evidenceVersionChanged: boolean;
  finalityChanged: boolean;
  recommendationTextChanged: boolean;
  reviewerDispositionChanged: boolean;
  conditionsChanged: boolean;
  materialChangeCount: number;
  supersessionRequired: boolean;
  changeReasons: string[];
  headline: string;
  changeRule: string;
}

function canonicalReviewerState(record: RecommendationReleaseRecord): string {
  return record.reviewerResolutions
    .map((item) => [item.title, item.outcome, item.authority, item.disposition].join("|"))
    .sort()
    .join("||");
}

function canonicalConditions(record: RecommendationReleaseRecord): string {
  return [...record.conditions].sort().join("||");
}

export function buildRecommendationReleaseChangeControl(args: {
  current: RecommendationReleaseRecord;
  previous?: RecommendationReleaseRecord | null;
}): RecommendationReleaseChangeControl {
  const previous = args.previous ?? null;
  const evidenceVersionChanged = previous != null && previous.evidenceVersion !== args.current.evidenceVersion;
  const finalityChanged = previous != null && previous.finality !== args.current.finality;
  const recommendationTextChanged = previous != null && previous.approvedRecommendationText !== args.current.approvedRecommendationText;
  const reviewerDispositionChanged = previous != null && canonicalReviewerState(previous) !== canonicalReviewerState(args.current);
  const conditionsChanged = previous != null && canonicalConditions(previous) !== canonicalConditions(args.current);
  const changeReasons = [
    ...(evidenceVersionChanged ? ["The evidence-version fingerprint changed."] : []),
    ...(finalityChanged ? ["The recommendation finality classification changed."] : []),
    ...(recommendationTextChanged ? ["The human-use recommendation text changed."] : []),
    ...(reviewerDispositionChanged ? ["A reviewer outcome, authority, or gate disposition changed."] : []),
    ...(conditionsChanged ? ["The recorded conditions changed."] : []),
  ];
  const supersessionRequired = previous != null && changeReasons.length > 0;
  const lineageState: ReleaseLineageState = args.current.releaseState === "withheld"
    ? "withheld"
    : supersessionRequired
      ? "superseded"
      : previous == null
        ? "baseline-created"
        : "current";

  return {
    lineageState,
    currentReleaseId: args.current.releaseId,
    previousReleaseId: previous?.releaseId ?? null,
    evidenceVersionChanged,
    finalityChanged,
    recommendationTextChanged,
    reviewerDispositionChanged,
    conditionsChanged,
    materialChangeCount: changeReasons.length,
    supersessionRequired,
    changeReasons,
    headline: lineageState === "withheld"
      ? "No releasable recommendation exists; the current record remains withheld."
      : lineageState === "superseded"
        ? "The prior release is superseded and must not be treated as current."
        : lineageState === "baseline-created"
          ? "This release establishes the first governed lineage baseline."
          : "The release remains current against the supplied prior record.",
    changeRule: "Any material change to evidence, finality, approved recommendation text, reviewer authority or disposition, or recorded conditions invalidates the prior release and requires a newly identified release record. Historical releases remain immutable and must never be silently overwritten.",
  };
}
