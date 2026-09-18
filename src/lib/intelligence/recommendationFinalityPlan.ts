import type { DecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import type { RecommendationEvidenceLedger } from "@/lib/intelligence/recommendationEvidenceLedger";
import type { HumanDecisionAssignmentPlan } from "@/lib/intelligence/humanDecisionAssignmentPlan";
import type { DecisionResolutionPlan } from "@/lib/intelligence/decisionResolutionPlan";

export type RecommendationFinalityStatus = "blocked" | "provisional" | "conditionally-final" | "final";

export interface RecommendationFinalityPlan {
  status: RecommendationFinalityStatus;
  evidenceGate: "satisfied" | "open";
  assignmentGate: "satisfied" | "open";
  authorityGate: "satisfied" | "open";
  conditionGate: "satisfied" | "open";
  resolutionGate: "satisfied" | "open";
  blockingReasons: string[];
  remainingConditions: string[];
  headline: string;
  finalityRule: string;
}

export function buildRecommendationFinalityPlan(args: {
  decision: DecisionSynthesisPlan;
  ledger: RecommendationEvidenceLedger;
  assignments: HumanDecisionAssignmentPlan;
  resolutions: DecisionResolutionPlan;
}): RecommendationFinalityPlan {
  const materialUnknowns = args.ledger.entries.filter((entry) =>
    entry.kind === "unresolved-unknown" && (entry.status === "blocking" || entry.status === "pending")
  );
  const openAssignments = args.assignments.assignments.filter((item) => item.blocksRecommendation);
  const authorityOpen = args.resolutions.records.some((record) =>
    record.outcome === "not-recorded" || record.gateDisposition === "escalated"
  );
  const unresolvedRecords = args.resolutions.records.filter((record) => record.gateDisposition !== "cleared");
  const remainingConditions = [
    ...args.decision.requiredConditions,
    ...args.resolutions.records.flatMap((record) => record.conditionsImposed),
  ].filter((value, index, all) => value.trim().length > 0 && all.indexOf(value) === index);

  const evidenceGate = materialUnknowns.length === 0 ? "satisfied" : "open";
  const assignmentGate = openAssignments.length === 0 ? "satisfied" : "open";
  const authorityGate = authorityOpen ? "open" : "satisfied";
  const resolutionGate = unresolvedRecords.length === 0 ? "satisfied" : "open";
  const conditionGate = remainingConditions.length === 0 ? "satisfied" : "open";

  const blockingReasons = [
    ...(evidenceGate === "open" ? [`${materialUnknowns.length} material evidence gap(s) remain unresolved.`] : []),
    ...(assignmentGate === "open" ? [`${openAssignments.length} assigned human decision(s) still block finality.`] : []),
    ...(authorityGate === "open" ? ["One or more required authority dispositions have not been recorded or were escalated."] : []),
    ...(resolutionGate === "open" ? [`${unresolvedRecords.length} decision gate(s) remain preserved, narrowed, or escalated.`] : []),
  ];

  const hardBlocked = args.decision.hardStops.length > 0 || blockingReasons.length > 0;
  const status: RecommendationFinalityStatus = hardBlocked
    ? "blocked"
    : conditionGate === "open"
      ? "conditionally-final"
      : args.ledger.entries.some((entry) => entry.kind === "modeled-assumption" && entry.status === "caution")
        ? "provisional"
        : "final";

  return {
    status, evidenceGate, assignmentGate, authorityGate, conditionGate, resolutionGate,
    blockingReasons: [...args.decision.hardStops, ...blockingReasons],
    remainingConditions,
    headline: status === "final"
      ? "The recommendation has satisfied every modeled finality gate."
      : status === "conditionally-final"
        ? "The recommendation is conditionally final and remains subject to recorded conditions."
        : status === "provisional"
          ? "The recommendation is provisional because modeled assumptions still require confirmation."
          : "The recommendation is blocked from final treatment.",
    finalityRule: "Finality requires sufficient evidence, accountable assignments, correct authority, completed resolutions, and satisfaction of every imposed condition. Furlong does not convert an advisory recommendation into lender approval, appraisal, legal determination, environmental clearance, guarantee, or commitment.",
  };
}
