import type { PropertyProfileId } from "@/lib/property/propertyProfile";
import type { MarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import type { PreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";

export type ScenarioPosture = "proceed" | "proceed-with-conditions" | "renegotiate" | "walk-away";

export interface RankedPropertyScenario {
  id: string;
  title: string;
  summary: string;
  totalScore: number;
  propertyFit: number;
  marketViability: number;
  financeability: number;
  lifecycleResilience: number;
  posture: ScenarioPosture;
  reasons: string[];
  conditions: string[];
}

export interface ScenarioRankingPlan {
  status: "preliminary" | "evidence-supported";
  scenarios: RankedPropertyScenario[];
  overallPosture: ScenarioPosture;
  rankingRule: string;
  walkAwayGates: string[];
}

function templates(profileId: PropertyProfileId) {
  if (profileId === "farm") return [
    ["operating-agriculture", "Operating agricultural use", "Operate the land and improvements as a real farm business."],
    ["residential-passive-acreage", "Residential plus leased or passive acreage", "Preserve the residence while leasing or using acreage conservatively."],
    ["specialty-direct-market", "Specialty or direct-market enterprise", "Use higher-value specialty, equestrian, agritourism, or direct-market activity."],
  ] as const;
  if (["commercial", "hospitality", "mobile-home-park"].includes(profileId)) return [
    ["owner-operated", "Owner-operated commercial use", "Use the parcel as the operating base for a real business."],
    ["income-property", "Income-producing property", "Rely primarily on rent, occupancy, or stabilized operating income."],
    ["adaptive-mixed-use", "Adaptive or mixed use", "Phase or combine uses to improve risk-adjusted performance."],
  ] as const;
  if (profileId === "land") return [
    ["productive-land", "Productive land use", "Use the parcel for agriculture, grazing, forestry, conservation, energy, or leasing."],
    ["residential-homestead", "Residential or homestead use", "Develop or hold the parcel for residential use."],
    ["hold-lease-pass", "Hold, lease, or walk away", "Avoid forcing development when passive use or no purchase is stronger."],
  ] as const;
  return [
    ["primary-residential", "Primary residential use", "Use the property principally as a residence."],
    ["residential-income", "Residential plus lawful secondary income", "Add rental, accessory, agricultural, or other lawful income."],
    ["renovate-renegotiate-pass", "Renovate, renegotiate, or pass", "Change price or scope rather than accepting an unsafe ownership position."],
  ] as const;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function buildScenarioRankingPlan(args: {
  profileId: PropertyProfileId;
  marketPlan: MarketComparablePlan;
  capitalPlan: PreliminaryCapitalPlan;
  pathwayCount: number;
}): ScenarioRankingPlan {
  const marketBase = args.marketPlan.status === "supported" ? 72 : args.marketPlan.status === "preliminary" ? 58 : 44;
  const financeBase = args.capitalPlan.priceKnown ? 68 : 48;
  const pathwayBoost = Math.min(12, args.pathwayCount * 4);
  const alternativePenalty = Math.min(15, args.marketPlan.alternativePropertyCount * 3);
  const phasePenalty = args.capitalPlan.phaseIRequired ? 4 : 0;

  const scenarios = templates(args.profileId).map(([id, title, summary], index) => {
    const propertyFit = clamp(78 - index * 8);
    const marketViability = clamp(marketBase - index * 3 - alternativePenalty + (index === 2 ? 4 : 0));
    const financeability = clamp(financeBase + pathwayBoost - index * 5 - phasePenalty);
    const lifecycleResilience = clamp(72 - index * 4 + (index === 1 ? 5 : 0));
    const totalScore = clamp(propertyFit * 0.3 + marketViability * 0.25 + financeability * 0.25 + lifecycleResilience * 0.2);
    const posture: ScenarioPosture = totalScore >= 72 ? "proceed-with-conditions" : totalScore >= 58 ? "renegotiate" : "walk-away";
    return {
      id, title, summary, totalScore, propertyFit, marketViability, financeability, lifecycleResilience, posture,
      reasons: [
        `Property fit ${propertyFit}/100`,
        `Market viability ${marketViability}/100`,
        `Financeability ${financeability}/100`,
        `Lifecycle resilience ${lifecycleResilience}/100`,
      ],
      conditions: [
        args.marketPlan.status === "supported" ? "Comparable and market support is present but still requires source review." : "Market and closed-sale evidence must be strengthened before reliance.",
        args.capitalPlan.phaseIRequired ? "A lender-acceptable Phase I ESA remains part of final financing approval." : "Any triggered environmental requirement must be resolved before final lender approval.",
        "Borrower-specific affordability and collateral analysis remain authorization-gated.",
      ],
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const lead = scenarios[0];
  return {
    status: args.marketPlan.status === "supported" && args.capitalPlan.priceKnown ? "evidence-supported" : "preliminary",
    scenarios,
    overallPosture: lead?.posture ?? "walk-away",
    rankingRule: "Rank by property fit, market viability, financeability, and lifecycle resilience; no single score can override a hard legal, environmental, physical, or affordability stop.",
    walkAwayGates: [
      "The leading course cannot support acquisition, required improvements, working capital, and debt service under conservative assumptions.",
      "Environmental, zoning, access, utility, title, insurance, or physical constraints make the intended use impractical.",
      "A materially better nearby property is available at a comparable or lower total project cost.",
      "The seller timeline is incompatible with the realistic financing pipeline and cannot be extended safely.",
    ],
  };
}
