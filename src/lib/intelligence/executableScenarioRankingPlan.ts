import type { CollateralEquityPlan } from "@/lib/intelligence/collateralEquityPlan";
import type { FinancialCapacityPlan } from "@/lib/intelligence/financialCapacityPlan";
import type { RankedPropertyScenario, ScenarioPosture, ScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import type { TransactionTimelinePlan } from "@/lib/intelligence/transactionTimelinePlan";

export type ExecutableRankingStatus = "authorization-required" | "incomplete" | "ranked";

export interface ExecutableScenarioRank {
  id: string;
  title: string;
  propertyPotentialRank: number;
  executableRank: number | null;
  propertyPotentialScore: number;
  executableScore: number | null;
  posture: ScenarioPosture | "hold";
  adjustments: string[];
}

export interface ExecutableScenarioRankingPlan {
  status: ExecutableRankingStatus;
  scenarios: ExecutableScenarioRank[];
  headline: string;
  explanation: string;
  decisionRule: string;
}

function timelineAdjustment(plan: TransactionTimelinePlan): number {
  if (plan.compatibility === "incompatible") return -24;
  if (plan.compatibility === "tight") return -10;
  if (plan.compatibility === "compatible") return 4;
  return 0;
}

function capacityAdjustment(plan: FinancialCapacityPlan): number {
  if (plan.posture === "house-poor") return -30;
  if (plan.posture === "tight") return -14;
  if (plan.posture === "responsible") return 8;
  return 0;
}

function collateralAdjustment(plan: CollateralEquityPlan): number {
  if (plan.status === "consent-required") return 0;
  return -2;
}

function posture(score: number): ScenarioPosture {
  if (score >= 72) return "proceed-with-conditions";
  if (score >= 58) return "renegotiate";
  return "walk-away";
}

function lockedScenario(scenario: RankedPropertyScenario, index: number): ExecutableScenarioRank {
  return {
    id: scenario.id,
    title: scenario.title,
    propertyPotentialRank: index + 1,
    executableRank: null,
    propertyPotentialScore: scenario.totalScore,
    executableScore: null,
    posture: "hold",
    adjustments: ["Customer-specific ranking remains locked until financial authorization and complete capacity inputs are present."],
  };
}

export function buildExecutableScenarioRankingPlan(args: {
  propertyRanking: ScenarioRankingPlan;
  financialCapacity: FinancialCapacityPlan;
  timeline: TransactionTimelinePlan;
  collateral: CollateralEquityPlan;
}): ExecutableScenarioRankingPlan {
  const { propertyRanking, financialCapacity, timeline, collateral } = args;
  if (financialCapacity.authorization !== "authorized") {
    return {
      status: "authorization-required",
      scenarios: propertyRanking.scenarios.map(lockedScenario),
      headline: "Property-potential ranking is available; personalized executable ranking is locked.",
      explanation: "Furlong will not infer what this customer can carry from property value, lender maximums, or collateral alone.",
      decisionRule: "Request authorization, then complete income, debt, liquidity, reserves, recurring-cost, timing, and collateral inputs before changing the Top Three for this customer.",
    };
  }
  if (financialCapacity.posture === "incomplete" || financialCapacity.posture === "authorization-required") {
    return {
      status: "incomplete",
      scenarios: propertyRanking.scenarios.map(lockedScenario),
      headline: "Authorization is present, but the personalized ranking is incomplete.",
      explanation: "Partial borrower data cannot responsibly convert property potential into an executable recommendation.",
      decisionRule: "Hold personalized ranking until all authorized capacity inputs are complete and verified.",
    };
  }

  const capacity = capacityAdjustment(financialCapacity);
  const timing = timelineAdjustment(timeline);
  const collateralRisk = collateralAdjustment(collateral);
  const ranked = propertyRanking.scenarios.map((scenario, index) => {
    const concentrationPenalty = index === 0 && financialCapacity.posture === "tight" ? -4 : 0;
    const score = Math.max(0, Math.min(100, Math.round(scenario.totalScore + capacity + timing + collateralRisk + concentrationPenalty)));
    return {
      id: scenario.id,
      title: scenario.title,
      propertyPotentialRank: index + 1,
      executableRank: 0,
      propertyPotentialScore: scenario.totalScore,
      executableScore: score,
      posture: posture(score),
      adjustments: [
        `Customer capacity adjustment ${capacity >= 0 ? "+" : ""}${capacity}`,
        `Transaction timing adjustment ${timing >= 0 ? "+" : ""}${timing}`,
        `Collateral exposure adjustment ${collateralRisk >= 0 ? "+" : ""}${collateralRisk}`,
        ...(concentrationPenalty ? ["Leading property course reduced because the authorized capacity posture is tight."] : []),
      ],
    };
  }).sort((a, b) => (b.executableScore ?? 0) - (a.executableScore ?? 0)).map((scenario, index) => ({ ...scenario, executableRank: index + 1 }));

  return {
    status: "ranked",
    scenarios: ranked,
    headline: "Personalized executable ranking is active.",
    explanation: "The property Top Three has been re-ranked for this customer using authorized capacity, liquidity, reserves, timing, and collateral exposure.",
    decisionRule: "A high property-potential score cannot override house-poor risk, inadequate reserves, incompatible timing, or unsafe collateral concentration.",
  };
}
