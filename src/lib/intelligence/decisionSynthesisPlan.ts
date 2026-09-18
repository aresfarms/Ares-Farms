import type { ExecutableScenarioRankingPlan } from "@/lib/intelligence/executableScenarioRankingPlan";
import type { FinancialCapacityPlan } from "@/lib/intelligence/financialCapacityPlan";
import type { MarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import type { PreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";
import type { ScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import type { TransactionTimelinePlan } from "@/lib/intelligence/transactionTimelinePlan";

export type SynthesizedDecision = "proceed" | "proceed-with-conditions" | "renegotiate" | "restructure" | "phase" | "walk-away" | "hold";

export interface DecisionSynthesisPlan {
  decision: SynthesizedDecision;
  headline: string;
  rationale: string[];
  requiredConditions: string[];
  hardStops: string[];
  nextActions: string[];
  advisoryBoundary: string;
}

export function buildDecisionSynthesisPlan(args: {
  propertyRanking: ScenarioRankingPlan;
  executableRanking: ExecutableScenarioRankingPlan;
  financialCapacity: FinancialCapacityPlan;
  timeline: TransactionTimelinePlan;
  market: MarketComparablePlan;
  capital: PreliminaryCapitalPlan;
}): DecisionSynthesisPlan {
  const { propertyRanking, executableRanking, financialCapacity, timeline, market, capital } = args;
  const lead = executableRanking.status === "ranked" ? executableRanking.scenarios[0] : null;
  const hardStops: string[] = [];
  if (financialCapacity.posture === "house-poor") hardStops.push("Authorized capacity analysis indicates house-poor or inadequate-reserve risk.");
  if (timeline.compatibility === "incompatible") hardStops.push("The available transaction window is shorter than the realistic financing pipeline.");
  if (lead?.posture === "walk-away") hardStops.push("The highest customer-executable scenario remains below the minimum proceed threshold.");

  let decision: SynthesizedDecision = "hold";
  if (hardStops.length) decision = "walk-away";
  else if (executableRanking.status !== "ranked") decision = "hold";
  else if (timeline.compatibility === "tight") decision = "restructure";
  else if (financialCapacity.posture === "tight") decision = "phase";
  else if (lead?.posture === "renegotiate" || market.alternativePropertyCount > 0) decision = "renegotiate";
  else if (lead?.posture === "proceed-with-conditions") decision = "proceed-with-conditions";
  else decision = "proceed";

  const requiredConditions = [
    capital.phaseIRequired ? "Complete a lender-acceptable Phase I ESA and resolve any required follow-up." : "Resolve any triggered environmental requirement before final lender approval.",
    "Confirm appraisal, title, insurance, zoning, access, utilities, physical condition, and lender eligibility.",
    "Preserve required post-closing, repair, tax, seasonal, and operating reserves.",
    timeline.compatibility === "unknown" ? "Enter the contract deadline and written extension rights before relying on timing." : "Maintain a contract window compatible with the selected financing path.",
  ];

  return {
    decision,
    headline: decision === "hold" ? "Recommendation held pending authorization or complete evidence." : `Governed recommendation: ${decision.replace(/-/g, " ")}.`,
    rationale: [
      `Property posture: ${propertyRanking.overallPosture.replace(/-/g, " ")}.`,
      lead ? `Leading customer-executable course: ${lead.title} at ${lead.executableScore}/100.` : "Customer-executable ranking is not yet available.",
      `Capacity posture: ${financialCapacity.posture.replace(/-/g, " ")}.`,
      `Transaction timing: ${timeline.compatibility}.`,
      `Market support: ${market.status}; ${market.alternativePropertyCount} nearby lower- or similarly-priced alternative(s) identified.`,
    ],
    requiredConditions,
    hardStops,
    nextActions: decision === "walk-away" ? ["Do not waive the blocking condition.", "Test a lower price, safer structure, longer contract window, phased scope, or a better nearby property."] : ["Resolve the listed conditions in order of critical path.", "Re-run the recommendation when verified evidence or authorized borrower inputs change."],
    advisoryBoundary: "This is a governed planning recommendation, not lender approval, an appraisal, legal advice, environmental clearance, insurance confirmation, or a commitment to finance.",
  };
}
