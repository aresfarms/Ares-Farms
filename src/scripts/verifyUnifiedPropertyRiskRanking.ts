import { buildScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import { buildMarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import { buildPreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const market = buildMarketComparablePlan({ profileId: "commercial", comparables: [] });
const capital = buildPreliminaryCapitalPlan({ profileId: "commercial", listedPrice: 1000000, requestedAmount: null, pathwayNames: ["SBA 504"] });
const base = buildScenarioRankingPlan({ profileId: "commercial", marketPlan: market, capitalPlan: capital, pathwayCount: 1 });
const stressed = buildScenarioRankingPlan({
  profileId: "commercial",
  marketPlan: market,
  capitalPlan: capital,
  pathwayCount: 1,
  infrastructureRisk: {
    water: "verified-clear",
    insurance: "verified-clear",
    publicProject: "verified-clear",
    governmentAction: "verified-clear",
    scenarioAdjustments: {
      "owner-operated": {
        waterPenalty: 24,
        insurancePenalty: 18,
        publicProjectPenalty: 20,
        governmentActionPenalty: 14,
        verified: true,
        notes: ["Insufficient fire-flow capacity", "Specialty coverage unavailable", "Funded access-control project", "Enacted ordinance not yet effective"],
      },
    },
  },
});
assert(base.scenarios[0]?.id === "owner-operated", "Expected owner-operated use to lead before risk evidence.");
assert(stressed.scenarios[0]?.id !== "owner-operated", "Verified infrastructure and formal government risk must be able to change the Top Three order.");
assert((stressed.scenarios.find((s) => s.id === "owner-operated")?.infrastructureAdjustment ?? 0) < 0, "Risk adjustment must be visible.");
console.log(JSON.stringify({ ok: true, rule: "UNIFIED-PROPERTY-RISK-001", baselineOrder: base.scenarios.map((s) => s.id), stressedOrder: stressed.scenarios.map((s) => ({ id: s.id, score: s.totalScore, infrastructureResilience: s.infrastructureResilience, adjustment: s.infrastructureAdjustment })) }, null, 2));
