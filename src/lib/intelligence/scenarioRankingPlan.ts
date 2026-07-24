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
  taxResilience: number;
  taxAdjustment: number;
  posture: ScenarioPosture;
  reasons: string[];
  conditions: string[];
}

export interface ScenarioTaxAdjustment {
  annualAdditionalTax?: number;
  oneTimeRollbackTax?: number;
  verified?: boolean;
  note?: string;
}

export interface ScenarioTaxImpact {
  stabilizedAnnual: number;
  adverseAnnual: number;
  acquisitionPrice: number;
  scenarioAdjustments?: Record<string, ScenarioTaxAdjustment>;
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
  taxImpact?: ScenarioTaxImpact | null;
}): ScenarioRankingPlan {
  const marketBase = args.marketPlan.status === "supported" ? 72 : args.marketPlan.status === "preliminary" ? 58 : 44;
  const financeBase = args.capitalPlan.priceKnown ? 68 : 48;
  const pathwayBoost = Math.min(12, args.pathwayCount * 4);
  const alternativePenalty = Math.min(15, args.marketPlan.alternativePropertyCount * 3);
  const phasePenalty = args.capitalPlan.phaseIRequired ? 4 : 0;

  const commonTaxPenalty = (() => {
    const tax = args.taxImpact;
    if (!tax || tax.acquisitionPrice <= 0) return 0;
    const adverseCarryPct = tax.adverseAnnual / tax.acquisitionPrice;
    const shockPct = tax.stabilizedAnnual > 0
      ? Math.max(0, (tax.adverseAnnual - tax.stabilizedAnnual) / tax.stabilizedAnnual)
      : 0;
    return Math.min(18, Math.round(adverseCarryPct * 300 + shockPct * 8));
  })();

  const scenarios = templates(args.profileId).map(([id, title, summary], index) => {
    const propertyFit = clamp(78 - index * 8);
    const marketViability = clamp(marketBase - index * 3 - alternativePenalty + (index === 2 ? 4 : 0));
    const financeability = clamp(financeBase + pathwayBoost - index * 5 - phasePenalty);
    const lifecycleResilience = clamp(72 - index * 4 + (index === 1 ? 5 : 0));
    const scenarioTax = args.taxImpact?.scenarioAdjustments?.[id];
    const annualAdditional = Math.max(0, scenarioTax?.annualAdditionalTax ?? 0);
    const rollbackAnnualized = Math.max(0, scenarioTax?.oneTimeRollbackTax ?? 0) / 5;
    const price = Math.max(1, args.taxImpact?.acquisitionPrice ?? 1);
    const scenarioTaxPenalty = Math.min(30, Math.round(((annualAdditional + rollbackAnnualized) / price) * 500));
    const taxAdjustment = -(commonTaxPenalty + scenarioTaxPenalty);
    const taxResilience = clamp(78 + taxAdjustment);
    const totalScore = clamp(
      propertyFit * 0.24 +
      marketViability * 0.21 +
      financeability * 0.21 +
      lifecycleResilience * 0.14 +
      taxResilience * 0.20 -
      scenarioTaxPenalty * 0.5
    );
    const posture: ScenarioPosture = totalScore >= 72 ? "proceed-with-conditions" : totalScore >= 58 ? "renegotiate" : "walk-away";
    const taxReason = scenarioTax
      ? `${scenarioTax.verified ? "Verified" : "Planning"} use-specific tax effect: $${Math.round(annualAdditional).toLocaleString("en-US")}/yr additional` +
        `${scenarioTax.oneTimeRollbackTax ? ` plus $${Math.round(scenarioTax.oneTimeRollbackTax).toLocaleString("en-US")} one-time rollback exposure` : ""}` +
        `${scenarioTax.note ? ` — ${scenarioTax.note}` : ""}`
      : args.taxImpact
        ? `Buyer-side tax resilience ${taxResilience}/100 using stabilized $${Math.round(args.taxImpact.stabilizedAnnual).toLocaleString("en-US")}/yr and adverse $${Math.round(args.taxImpact.adverseAnnual).toLocaleString("en-US")}/yr`
        : "Tax effect unresolved and not yet scored beyond the hard-stop rule.";
    return {
      id, title, summary, totalScore, propertyFit, marketViability, financeability, lifecycleResilience, taxResilience, taxAdjustment, posture,
      reasons: [
        `Property fit ${propertyFit}/100`,
        `Market viability ${marketViability}/100`,
        `Financeability ${financeability}/100`,
        `Lifecycle resilience ${lifecycleResilience}/100`,
        taxReason,
      ],
      conditions: [
        args.marketPlan.status === "supported" ? "Comparable and market support is present but still requires source review." : "Market and closed-sale evidence must be strengthened before reliance.",
        args.capitalPlan.phaseIRequired ? "A lender-acceptable Phase I ESA remains part of final financing approval." : "Any triggered environmental requirement must be resolved before final lender approval.",
        args.taxImpact
          ? "Official reassessment, exemption, rollback, and change-of-use rules must replace planning tax assumptions before reliance."
          : "Post-transfer and use-change tax exposure must be established before reliance.",
        "Borrower-specific affordability and collateral analysis remain authorization-gated.",
      ],
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const lead = scenarios[0];
  return {
    status: args.marketPlan.status === "supported" && args.capitalPlan.priceKnown ? "evidence-supported" : "preliminary",
    scenarios,
    overallPosture: lead?.posture ?? "walk-away",
    rankingRule: "Rank by property fit, market viability, financeability, lifecycle resilience, and buyer-side tax resilience. Seller taxes never control the score unless transferability is officially verified; no score overrides a hard legal, environmental, physical, tax, insurance, or affordability stop.",
    walkAwayGates: [
      "The leading course cannot support acquisition, required improvements, working capital, and debt service under conservative assumptions.",
      "Environmental, zoning, access, utility, title, insurance, or physical constraints make the intended use impractical.",
      "A materially better nearby property is available at a comparable or lower total project cost.",
      "The seller timeline is incompatible with the realistic financing pipeline and cannot be extended safely.",
      "Post-sale reassessment, rollback tax, special assessment, or change-of-use tax makes the use economically impractical.",
    ],
  };
}
