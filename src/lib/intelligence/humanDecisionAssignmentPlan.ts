import type { DecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import type { RecommendationEvidenceLedger } from "@/lib/intelligence/recommendationEvidenceLedger";

export type DecisionAuthority = "customer" | "transaction-lead" | "qualified-provider" | "named-reviewer";
export type DecisionDueState = "ready" | "awaiting-evidence" | "awaiting-assignment" | "blocked";

export interface HumanDecisionAssignment {
  id: string;
  title: string;
  ownerRole: string;
  authority: DecisionAuthority;
  dueState: DecisionDueState;
  evidenceRequired: string[];
  blockingEffect: string;
  blocksRecommendation: boolean;
}

export interface HumanDecisionAssignmentPlan {
  assignments: HumanDecisionAssignment[];
  blockingCount: number;
  unassignedCount: number;
  headline: string;
  assignmentRule: string;
}

export function buildHumanDecisionAssignmentPlan(args: {
  decision: DecisionSynthesisPlan;
  ledger: RecommendationEvidenceLedger;
}): HumanDecisionAssignmentPlan {
  const humanEntries = args.ledger.entries.filter((entry) => entry.kind === "human-decision");
  const assignments: HumanDecisionAssignment[] = humanEntries.map((entry) => {
    if (entry.label === "Borrower authorization") {
      const complete = entry.status === "supporting";
      return {
        id: entry.id,
        title: entry.label,
        ownerRole: "Customer or authorized customer representative",
        authority: "customer",
        dueState: complete ? "ready" : "blocked",
        evidenceRequired: ["Recorded authorization scope", "Identity and authority confirmation", "Permitted financial inputs"],
        blockingEffect: complete ? "No current authorization block." : "Blocks borrower-specific affordability and executable ranking.",
        blocksRecommendation: !complete,
      };
    }
    if (entry.label === "Contract strategy") {
      const complete = entry.status === "supporting";
      return {
        id: entry.id,
        title: entry.label,
        ownerRole: "Transaction lead",
        authority: "transaction-lead",
        dueState: complete ? "ready" : "awaiting-evidence",
        evidenceRequired: ["Executed contract deadline", "Written extension rights", "Financing and diligence contingencies"],
        blockingEffect: complete ? "Current timing does not create a known block." : "Blocks reliance on a closing strategy that assumes the deadline will move.",
        blocksRecommendation: !complete,
      };
    }
    if (entry.label === "Environmental and diligence acceptance") {
      return {
        id: entry.id,
        title: entry.label,
        ownerRole: "Qualified provider and lender-facing reviewer",
        authority: "qualified-provider",
        dueState: "awaiting-evidence",
        evidenceRequired: ["Applicable environmental trigger determination", "Provider scope and credentials", "Reliance language and follow-up disposition"],
        blockingEffect: "Blocks final reliance where environmental or diligence requirements remain unresolved.",
        blocksRecommendation: true,
      };
    }
    return {
      id: entry.id,
      title: entry.label,
      ownerRole: "Named human reviewer",
      authority: "named-reviewer",
      dueState: "awaiting-assignment",
      evidenceRequired: ["Complete recommendation evidence ledger", "Hard-stop and condition review", "Recorded accept, modify, or reject decision"],
      blockingEffect: `Blocks treatment of the ${args.decision.decision.replace(/-/g, " ")} recommendation as final.`,
      blocksRecommendation: true,
    };
  });

  return {
    assignments,
    blockingCount: assignments.filter((item) => item.blocksRecommendation).length,
    unassignedCount: assignments.filter((item) => item.dueState === "awaiting-assignment").length,
    headline: assignments.some((item) => item.blocksRecommendation)
      ? "Human decisions remain open and the recommendation is not final."
      : "All modeled human-decision gates are currently satisfied.",
    assignmentRule: "Every material human decision must have a named accountable owner, the correct authority, required evidence, and a recorded disposition before its blocking effect can be removed.",
  };
}
