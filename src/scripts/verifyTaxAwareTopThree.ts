import { buildMarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import { buildPreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";
import { buildScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const marketPlan = buildMarketComparablePlan({ profileId: "farm", comparables: [] });
const capitalPlan = buildPreliminaryCapitalPlan({
  profileId: "farm",
  listedPrice: 500_000,
  requestedAmount: null,
  pathwayNames: ["FSA Direct Farm Ownership"],
});

const baseline = buildScenarioRankingPlan({
  profileId: "farm",
  marketPlan,
  capitalPlan,
  pathwayCount: 1,
  taxImpact: {
    acquisitionPrice: 500_000,
    stabilizedAnnual: 5_000,
    adverseAnnual: 7_500,
  },
});

const stressed = buildScenarioRankingPlan({
  profileId: "farm",
  marketPlan,
  capitalPlan,
  pathwayCount: 1,
  taxImpact: {
    acquisitionPrice: 500_000,
    stabilizedAnnual: 5_000,
    adverseAnnual: 7_500,
    scenarioAdjustments: {
      "operating-agriculture": {
        annualAdditionalTax: 40_000,
        oneTimeRollbackTax: 100_000,
        verified: true,
        note: "Preferential assessment is lost under the tested use.",
      },
    },
  },
});

const baselineLead = baseline.scenarios[0];
const stressedOperating = stressed.scenarios.find((scenario) => scenario.id === "operating-agriculture");
const stressedLead = stressed.scenarios[0];

assert(baselineLead?.id === "operating-agriculture", "Operating agriculture should lead before the use-specific tax shock.");
assert(stressedOperating, "Operating-agriculture scenario must remain present.");
assert(stressedLead?.id !== "operating-agriculture", "A material verified tax shock must be able to change the Top Three order.");
assert(stressedOperating.taxAdjustment < baselineLead.taxAdjustment, "Tax adjustment must worsen under the use-specific shock.");
assert(stressedOperating.reasons.some((reason) => reason.includes("rollback")), "The ranking must explain rollback-tax exposure.");
assert(stressed.rankingRule.includes("Seller taxes never control"), "The ranking contract must preserve POST-SALE-TAX-001.");

console.log(JSON.stringify({
  ok: true,
  rule: "TAX-AWARE-TOP-THREE-001",
  baselineOrder: baseline.scenarios.map((scenario) => ({ id: scenario.id, score: scenario.totalScore })),
  stressedOrder: stressed.scenarios.map((scenario) => ({
    id: scenario.id,
    score: scenario.totalScore,
    taxResilience: scenario.taxResilience,
    taxAdjustment: scenario.taxAdjustment,
  })),
}, null, 2));
