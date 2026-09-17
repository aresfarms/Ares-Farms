import type { PropertyProfileId } from "@/lib/property/propertyProfile";
import type { MarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import type { PreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";

/**
 * Canonical property-decision ranking.
 *
 * Authority: FURLONG-VISION-001; CONST-AI-001/002/003; CONST-FAIR-001;
 * REG-SCORE-002/003; TECH-SCORE-001; CANON-EXPL-001; FACILITATION-001.
 *
 * The three candidates are always generated independently: the best supported
 * single enterprise, the best supported mixed-use configuration, and the
 * customer's selected vision. Their source role never fixes final rank.
 * Property/project financing fit is scored separately from borrower
 * underwriting, which Furlong does not perform.
 */
export type ScenarioPosture =
  | "proceed"
  | "proceed-with-conditions"
  | "renegotiate"
  | "walk-away";

export type ScenarioCandidateRole =
  | "best-single-enterprise"
  | "best-mixed-use"
  | "customer-vision"
  | "best-distinct-alternative";

export interface RankedPropertyScenario {
  id: string;
  candidateRole: ScenarioCandidateRole;
  title: string;
  summary: string;
  totalScore: number;
  propertyFit: number;
  marketViability: number;
  financeability: number;
  lifecycleResilience: number;
  taxResilience: number;
  taxAdjustment: number;
  infrastructureResilience: number;
  infrastructureAdjustment: number;
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

export type PropertyRiskStatus =
  | "verified-clear"
  | "verified-constrained"
  | "unknown";

export interface ScenarioInfrastructureAdjustment {
  waterPenalty?: number;
  waterBenefit?: number;
  insurancePenalty?: number;
  publicProjectPenalty?: number;
  governmentActionPenalty?: number;
  verified?: boolean;
  notes?: string[];
}

export interface PropertyInfrastructureRiskImpact {
  water: PropertyRiskStatus;
  insurance: PropertyRiskStatus;
  publicProject: PropertyRiskStatus;
  governmentAction: PropertyRiskStatus;
  scenarioAdjustments?: Record<string, ScenarioInfrastructureAdjustment>;
}

export interface ScenarioRankingPlan {
  status: "preliminary" | "evidence-supported";
  scenarios: RankedPropertyScenario[];
  overallPosture: ScenarioPosture;
  rankingRule: string;
  walkAwayGates: string[];
}

interface ScenarioTemplate {
  id: string;
  candidateRole: ScenarioCandidateRole;
  title: string;
  summary: string;
  propertyFitBase: number;
  lifecycleBase: number;
  marketAdjustment: number;
  financeAdjustment: number;
}

function singleUseLabel(profileId: PropertyProfileId): [string, string] {
  if (profileId === "farm")
    return [
      "Best supported single agricultural enterprise",
      "The strongest one-enterprise use of the land, structures, soils, water, climate, market, labor, and operating evidence.",
    ];
  if (["commercial", "hospitality", "mobile-home-park"].includes(profileId))
    return [
      "Best supported single commercial enterprise",
      "The strongest one-enterprise use of the building and parcel after conversion, market, operating-cost, and financing constraints.",
    ];
  if (profileId === "land")
    return [
      "Best supported single land enterprise",
      "The strongest one-enterprise use of the parcel after access, utilities, physical constraints, law, market, and carrying cost.",
    ];
  return [
    "Best supported single property use",
    "The strongest one-use configuration supported by the building, parcel, market, carrying cost, and available evidence.",
  ];
}

function mixedUseLabel(profileId: PropertyProfileId): [string, string] {
  if (profileId === "farm" || profileId === "land")
    return [
      "Best supported whole-parcel combination",
      "The strongest compatible allocation across productive land, structures, forest, slopes, wetlands, energy, recreation, or other supported segments without double-counting.",
    ];
  return [
    "Best supported mixed-use configuration",
    "The strongest compatible allocation across floors, buildings, site areas, tenants, and operating enterprises without double-counting.",
  ];
}

function templates(
  profileId: PropertyProfileId,
  customerVision: string | null,
): ScenarioTemplate[] {
  const [singleTitle, singleSummary] = singleUseLabel(profileId);
  const [mixedTitle, mixedSummary] = mixedUseLabel(profileId);
  const singleId =
    profileId === "farm"
      ? "operating-agriculture"
      : profileId === "land"
        ? "productive-land"
        : ["commercial", "hospitality", "mobile-home-park"].includes(profileId)
          ? "owner-operated"
          : "primary-residential";
  const mixedId =
    profileId === "farm" || profileId === "land"
      ? "whole-parcel-mixed-use"
      : "adaptive-mixed-use";
  const vision = customerVision?.trim() ?? "";
  return [
    {
      id: singleId,
      candidateRole: "best-single-enterprise",
      title: singleTitle,
      summary: singleSummary,
      propertyFitBase: 78,
      lifecycleBase: 72,
      marketAdjustment: 0,
      financeAdjustment: 2,
    },
    {
      id: mixedId,
      candidateRole: "best-mixed-use",
      title: mixedTitle,
      summary: mixedSummary,
      propertyFitBase: 74,
      lifecycleBase: 74,
      marketAdjustment: 3,
      financeAdjustment: -3,
    },
    vision
      ? {
          id: "customer-vision",
          candidateRole: "customer-vision",
          title: `Customer vision: ${vision}`,
          summary:
            "The customer's selected plan, tested independently against the same property, market, cost, risk, and property/project financing evidence.",
          propertyFitBase: 70,
          lifecycleBase: 70,
          marketAdjustment: 0,
          financeAdjustment: 0,
        }
      : {
          id: "best-distinct-alternative",
          candidateRole: "best-distinct-alternative",
          title: "Best materially distinct alternative",
          summary:
            "The strongest supported alternative that is not a duplicate of the leading single-enterprise or mixed-use configuration.",
          propertyFitBase: 68,
          lifecycleBase: 69,
          marketAdjustment: -2,
          financeAdjustment: -1,
        },
  ];
}

const clamp = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

export function buildScenarioRankingPlan(args: {
  profileId: PropertyProfileId;
  marketPlan: MarketComparablePlan;
  capitalPlan: PreliminaryCapitalPlan;
  pathwayCount: number;
  customerVision?: string | null;
  taxImpact?: ScenarioTaxImpact | null;
  infrastructureRisk?: PropertyInfrastructureRiskImpact | null;
}): ScenarioRankingPlan {
  const marketBase =
    args.marketPlan.status === "supported"
      ? 72
      : args.marketPlan.status === "preliminary"
        ? 58
        : 44;
  const financeBase = args.capitalPlan.priceKnown ? 68 : 48;
  const pathwayBoost = Math.min(12, args.pathwayCount * 4);
  const alternativePenalty = Math.min(
    15,
    args.marketPlan.alternativePropertyCount * 3,
  );
  const phasePenalty = args.capitalPlan.phaseIRequired ? 4 : 0;
  const commonTaxPenalty = (() => {
    const tax = args.taxImpact;
    if (!tax || tax.acquisitionPrice <= 0) return 0;
    const adverseCarryPct = tax.adverseAnnual / tax.acquisitionPrice;
    const shockPct =
      tax.stabilizedAnnual > 0
        ? Math.max(
            0,
            (tax.adverseAnnual - tax.stabilizedAnnual) / tax.stabilizedAnnual,
          )
        : 0;
    return Math.min(
      18,
      Math.round(adverseCarryPct * 300 + shockPct * 8),
    );
  })();

  const scenarios = templates(
    args.profileId,
    args.customerVision ?? null,
  ).map(
    (template) => {
      const propertyFit = clamp(template.propertyFitBase);
      const marketViability = clamp(
        marketBase +
          template.marketAdjustment -
          alternativePenalty,
      );
      const financeability = clamp(
        financeBase +
          pathwayBoost +
          template.financeAdjustment -
          phasePenalty,
      );
      const lifecycleResilience = clamp(template.lifecycleBase);
      const scenarioTax =
        args.taxImpact?.scenarioAdjustments?.[template.id];
      const annualAdditional = Math.max(
        0,
        scenarioTax?.annualAdditionalTax ?? 0,
      );
      const rollbackAnnualized =
        Math.max(0, scenarioTax?.oneTimeRollbackTax ?? 0) / 5;
      const price = Math.max(1, args.taxImpact?.acquisitionPrice ?? 1);
      const scenarioTaxPenalty = Math.min(
        30,
        Math.round(
          ((annualAdditional + rollbackAnnualized) / price) * 500,
        ),
      );
      const taxAdjustment = -(commonTaxPenalty + scenarioTaxPenalty);
      const taxResilience = clamp(78 + taxAdjustment);
      const infrastructure =
        args.infrastructureRisk?.scenarioAdjustments?.[template.id];
      const statusPenalty = args.infrastructureRisk
        ? [
            args.infrastructureRisk.water,
            args.infrastructureRisk.insurance,
            args.infrastructureRisk.publicProject,
            args.infrastructureRisk.governmentAction,
          ].reduce(
            (total, status) =>
              total +
              (status === "verified-constrained"
                ? 10
                : status === "unknown"
                  ? 3
                  : 0),
            0,
          )
        : 12;
      const usePenalty = Math.min(
        60,
        Math.max(0, infrastructure?.waterPenalty ?? 0) +
          Math.max(0, infrastructure?.insurancePenalty ?? 0) +
          Math.max(0, infrastructure?.publicProjectPenalty ?? 0) +
          Math.max(0, infrastructure?.governmentActionPenalty ?? 0),
      );
      const useBenefit = Math.min(
        15,
        Math.max(0, infrastructure?.waterBenefit ?? 0),
      );
      const infrastructureAdjustment =
        -(statusPenalty + usePenalty) + useBenefit;
      const infrastructureResilience = clamp(
        82 + infrastructureAdjustment,
      );
      const totalScore = clamp(
        propertyFit * 0.2 +
          marketViability * 0.18 +
          financeability * 0.18 +
          lifecycleResilience * 0.12 +
          taxResilience * 0.16 +
          infrastructureResilience * 0.16 -
          scenarioTaxPenalty * 0.4 -
          usePenalty * 0.35 +
          useBenefit * 0.25,
      );
      const posture: ScenarioPosture =
        totalScore >= 72
          ? "proceed-with-conditions"
          : totalScore >= 58
            ? "renegotiate"
            : "walk-away";
      const taxReason = scenarioTax
        ? `${scenarioTax.verified ? "Verified" : "Planning"} use-specific tax effect: $${Math.round(annualAdditional).toLocaleString("en-US")}/yr additional${scenarioTax.oneTimeRollbackTax ? ` plus $${Math.round(scenarioTax.oneTimeRollbackTax).toLocaleString("en-US")} one-time rollback exposure` : ""}${scenarioTax.note ? ` — ${scenarioTax.note}` : ""}`
        : args.taxImpact
          ? `Buyer-side tax resilience ${taxResilience}/100 using stabilized $${Math.round(args.taxImpact.stabilizedAnnual).toLocaleString("en-US")}/yr and adverse $${Math.round(args.taxImpact.adverseAnnual).toLocaleString("en-US")}/yr`
          : "Tax effect unresolved and not yet scored beyond the hard-stop rule.";
      const infrastructureReason = infrastructure
        ? `${infrastructure.verified ? "Verified" : "Planning"} use-specific water/insurance/public-project/government-action adjustment ${infrastructureAdjustment}${infrastructure.notes?.length ? ` — ${infrastructure.notes.join("; ")}` : ""}`
        : args.infrastructureRisk
          ? `Property-wide infrastructure resilience ${infrastructureResilience}/100 across water, insurance, public-project exposure, and formal government actions`
          : "Water, insurance, public-project exposure, and formal government actions remain unresolved and are conservatively scored.";
      return {
        id: template.id,
        candidateRole: template.candidateRole,
        title: template.title,
        summary: template.summary,
        totalScore,
        propertyFit,
        marketViability,
        financeability,
        lifecycleResilience,
        taxResilience,
        taxAdjustment,
        infrastructureResilience,
        infrastructureAdjustment,
        posture,
        reasons: [
          `Property fit ${propertyFit}/100`,
          `Market viability ${marketViability}/100`,
          `Property/project financing fit ${financeability}/100`,
          `Lifecycle resilience ${lifecycleResilience}/100`,
          taxReason,
          infrastructureReason,
        ],
        conditions: [
          args.marketPlan.status === "supported"
            ? "Comparable and market support is present but still requires source review."
            : "Market and closed-sale evidence must be strengthened before reliance.",
          args.capitalPlan.phaseIRequired
            ? "A lender-acceptable Phase I ESA remains part of final financing approval."
            : "Any triggered environmental requirement must be resolved before final lender approval.",
          "Borrower eligibility and lender approval are not evaluated by this property/project ranking.",
        ],
      };
    },
  ).sort(
    (a, b) =>
      b.totalScore - a.totalScore ||
      b.financeability - a.financeability ||
      a.id.localeCompare(b.id),
  );

  const lead = scenarios[0];
  return {
    status:
      args.marketPlan.status === "supported" &&
      args.capitalPlan.priceKnown
        ? "evidence-supported"
        : "preliminary",
    scenarios,
    overallPosture: lead?.posture ?? "walk-away",
    rankingRule:
      "Independently compare the best single enterprise, best mixed-use configuration, and customer vision. Rank property/project performance without allowing candidate type or customer preference to fix the result. Show property/project financing fit separately; borrower underwriting and final approval remain with the lender. Seller taxes never control the score unless transferability is officially verified.",
    walkAwayGates: [
      "The leading course cannot support acquisition, required improvements, working capital, and debt service under conservative assumptions.",
      "Environmental, zoning, access, utility, title, insurance, or physical constraints make the use impractical.",
      "A materially better nearby property is available at a comparable or lower total project cost.",
      "The seller timeline is incompatible with the realistic financing pipeline and cannot be extended safely.",
      "Post-transfer tax, water, insurance, public-project, or government-action evidence makes the use impractical.",
    ],
  };
}
