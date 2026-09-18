import type { DecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import type { HumanDecisionAssignmentPlan, HumanDecisionAssignment } from "@/lib/intelligence/humanDecisionAssignmentPlan";

export type DecisionResolutionOutcome = "not-recorded" | "accepted" | "accepted-with-conditions" | "modified" | "rejected" | "escalated";
export type GateDisposition = "cleared" | "preserved" | "narrowed" | "escalated";

export interface DecisionResolutionRecord {
  assignmentId: string;
  title: string;
  reviewerRole: string;
  authorityUsed: HumanDecisionAssignment["authority"];
  outcome: DecisionResolutionOutcome;
  evidenceConsidered: string[];
  conditionsImposed: string[];
  gateDisposition: GateDisposition;
  resolutionEffect: string;
}

export interface DecisionResolutionPlan {
  records: DecisionResolutionRecord[];
  clearedGateCount: number;
  preservedGateCount: number;
  finalityStatus: "not-final" | "conditionally-final" | "final";
  headline: string;
  resolutionRule: string;
}

export function buildDecisionResolutionPlan(args: {
  decision: DecisionSynthesisPlan;
  assignments: HumanDecisionAssignmentPlan;
}): DecisionResolutionPlan {
  const records = args.assignments.assignments.map((assignment): DecisionResolutionRecord => {
    const resolved = assignment.dueState === "ready" && !assignment.blocksRecommendation;
    return {
      assignmentId: assignment.id,
      title: assignment.title,
      reviewerRole: assignment.ownerRole,
      authorityUsed: assignment.authority,
      outcome: resolved ? "accepted" : "not-recorded",
      evidenceConsidered: resolved ? assignment.evidenceRequired : [],
      conditionsImposed: resolved ? [] : ["Submit the required evidence and record an authorized reviewer disposition."],
      gateDisposition: resolved ? "cleared" : "preserved",
      resolutionEffect: resolved
        ? "This modeled gate is satisfied for the current evidence state."
        : assignment.blockingEffect,
    };
  });

  const clearedGateCount = records.filter((record) => record.gateDisposition === "cleared").length;
  const preservedGateCount = records.filter((record) => record.gateDisposition !== "cleared").length;
  const finalityStatus = preservedGateCount > 0 ? "not-final" : args.decision.requiredConditions.length > 0 ? "conditionally-final" : "final";

  return {
    records,
    clearedGateCount,
    preservedGateCount,
    finalityStatus,
    headline: preservedGateCount > 0
      ? "Decision resolution is incomplete; one or more blocking gates remain preserved."
      : "All assigned human-decision gates have a recorded disposition.",
    resolutionRule: "A gate clears only when the correct authority records an outcome, identifies the evidence considered, states any conditions imposed, and expressly clears, narrows, preserves, or escalates the blocking effect.",
  };
}
