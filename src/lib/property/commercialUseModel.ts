import { annualLevelDebtService, transactionPrice } from "./calculationMath";
/** Source-backed operating alternatives, not automatic rent-per-foot valuations.
 * TECH-PROV-001 / CANON-EXPL-001. Generic rent and occupancy assumptions never
 * become parcel NOI. Financing terms are explicitly modeled, not lender quotes. */

import { commercialAlternativeUses } from "@/lib/property/commercialAlternativeUses";
import { buildCommercialConversionIntelligence, type ConversionIntelligence } from "@/lib/property/commercialConversionIntelligence";

export interface ModeledUse {
  use: string;
  /** Conservative net-to-owner band, $/sq ft/yr. */
  netPerSqftLow: number | null;
  netPerSqftHigh: number | null;
  /** Modeled stabilized NOI at the midpoint band × occupancy. */
  noiMid: number | null;
  noiLow: number | null;
  noiHigh: number | null;
  /** DSCR at the reference lender terms (null without price + sqft). */
  dscr: number | null;
  clearsFloor: boolean | null;
  why: string;
  watch: string;
  financialModelAvailable: boolean;
  financialModelNote: string;
  conversion: ConversionIntelligence;
}

export interface CommercialUseScreen {
  squareFeet: number | null;
  propertyClassification: string;
  screeningPrice: number | null;
  referenceTerms: string;
  referenceRatePct: number | null;
  occupancyFactor: number;
  uses: ModeledUse[];
  currentUse: string | null;
  /** Highest-DSCR use that zoning did not rule out (null without inputs). */
  bestUse: ModeledUse | null;
  bestSupportedUse: ModeledUse | null;
  /** A deliberately surfaced non-primary use, favoring senior housing when the shell plausibly supports it. */
  secondaryOpportunity: ModeledUse | null;
  note: string;
}

const DSCR_FLOOR = 1.25;
const OCCUPANCY = 0.88;

/** Conservative small-market net bands by use family ($/sq ft/yr to owner). */


const levelAnnualDebtService = (principal: number, ratePct: number, years: number) => annualLevelDebtService(principal, ratePct, years, 12);

export function modelCommercialUses(args: {
  zoning: string | null;
  landUse: string | null;
  squareFeet: number | null;
  town: string | null;
  county?: string | null;
  stateCode?: string | null;
  screeningPrice: number | null;
  /** Published 30-yr benchmark; lender terms modeled at benchmark +0.75, 25-yr, 80% LTV. */
  benchRatePct: number | null;
  operatingEvidence?: Array<{use:string; noiLow:number; noiHigh:number; sourceRef:string; legalUseVerified:boolean; marketVerified:boolean}>;
}): CommercialUseScreen {
  const candidates = commercialAlternativeUses({
    zoning: args.zoning,
    landUse: args.landUse,
    squareFeet: args.squareFeet,
    town: args.town,
  });
  const ratePct = args.benchRatePct != null ? args.benchRatePct + 0.75 : null;
  const ads =
    transactionPrice(args.screeningPrice) != null && ratePct != null
      ? levelAnnualDebtService(args.screeningPrice! * 0.8, ratePct, 25)
      : null;

  const uses: ModeledUse[] = candidates.uses.map((candidate) => {

    const sqft = args.squareFeet;
    const operatingModelRequired = /senior housing|extended-stay hospitality/i.test(candidate.use);
    const budget = args.operatingEvidence?.find(b => b.use === candidate.use && b.sourceRef.trim() && b.legalUseVerified && b.marketVerified && Number.isFinite(b.noiLow) && Number.isFinite(b.noiHigh) && b.noiLow <= b.noiHigh);
    const noiLow = budget?.noiLow ?? null;
    const noiHigh = budget?.noiHigh ?? null;
    const noiMid = noiLow != null && noiHigh != null ? Math.round((noiLow + noiHigh) / 2) : null;
    const dscr = noiMid != null && ads != null && ads > 0 ? noiMid / ads : null;
    return {
      use: candidate.use,
      netPerSqftLow: budget && sqft != null && sqft > 0 ? budget.noiLow / sqft : null,
      netPerSqftHigh: budget && sqft != null && sqft > 0 ? budget.noiHigh / sqft : null,
      noiLow,
      noiHigh,
      noiMid,
      dscr,
      clearsFloor: dscr != null ? dscr >= DSCR_FLOOR : null,
      why: candidate.why,
      watch: candidate.watch,
      financialModelAvailable: Boolean(budget),
      financialModelNote: operatingModelRequired
        ? "Requires a unit/room-level operating model, staffing/service assumptions where applicable, and code-capex before NOI or DSCR is credible."
        : "Property-specific rent roll, lease comparables, expenses, reserves and operating statements are required. Generic rent bands do not establish property NOI.",
      conversion: buildCommercialConversionIntelligence({
        currentLandUse: args.landUse,
        zoning: args.zoning,
        targetUse: candidate.use,
        squareFeet: args.squareFeet,
        town: args.town,
        county: args.county,
        stateCode: args.stateCode,
      }),
    };
  });

  const scored = uses.filter((u) => u.dscr != null).sort((a, b) => (b.dscr ?? 0) - (a.dscr ?? 0));
  const bestUse = scored[0] ?? null;
  const sourceUse = `${args.landUse ?? ""} ${args.zoning ?? ""}`;
  const hospitalityShell = /hotel|motel|hospitality|lodging|inn|resort/i.test(sourceUse);
  const propertyClassification = hospitalityShell
    ? "Commercial—hospitality"
    : /industrial|warehouse|flex|manufactur/i.test(sourceUse)
      ? "Commercial—industrial/flex"
      : /retail|storefront|shopping/i.test(sourceUse)
        ? "Commercial—retail/service"
        : /office|medical/i.test(sourceUse)
          ? "Commercial—office/medical"
          : "Commercial—general";
  const extendedStay = uses.find((u) => /extended-stay hospitality/i.test(u.use)) ?? null;
  const bestSupportedUse = bestUse;
  const seniorOpportunity = uses.find((u) => /senior housing|independent-living/i.test(u.use)) ?? null;
  const secondaryOpportunity =
    seniorOpportunity && seniorOpportunity.use !== bestSupportedUse?.use
      ? seniorOpportunity
      : uses.find((u) => u.use !== bestSupportedUse?.use) ?? null;

  return {
    squareFeet: args.squareFeet,
    propertyClassification,
    screeningPrice: args.screeningPrice,
    referenceTerms:
      ratePct != null
        ? `${ratePct.toFixed(2)}% (benchmark +0.75), 25-yr amortization, 80% LTV — lender-shaped reference terms`
        : "reference lender terms unavailable (no published benchmark loaded)",
    referenceRatePct: ratePct,
    occupancyFactor: OCCUPANCY,
    uses,
    currentUse: args.landUse?.trim() || null,
    bestUse,
    bestSupportedUse,
    secondaryOpportunity,
    note: "Property-specific operating evidence is required before alternatives can receive NOI, DSCR or a highest-income ranking. Building area alone does not establish rent, occupancy or profitability. " + candidates.note,
  };
}
