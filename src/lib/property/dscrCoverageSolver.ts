/**
 * dscrCoverageSolver — answers the founder's question (2026-07-29): "what
 * combination of crops, livestock, hay, flowers, or orchard would clear the
 * 1.25x DSCR floor for THIS property — and if none can, say so plainly."
 *
 * Deterministic screening over the agricultural-opportunity optimizer's
 * enterprise models. Three honest verdicts:
 *   - clears: a modeled single enterprise or mix services the debt at ≥1.25x;
 *   - close:  the best mix covers the payment (≥1.0x) but misses the lender
 *             floor — the gap is stated in dollars, with the off-farm-income
 *             (global DSCR) and price paths that close it;
 *   - cannot: no modeled combination covers the payment — agriculture alone
 *             will not carry this purchase at the screening price; outside
 *             income or a lower price is required, both quantified.
 *
 * The borrower's documented history always outranks the model — that is
 * stated in the output, because real operating records (e.g. an owner who
 * actually nets more than the county screen) are exactly what underwriting
 * substitutes for these assumptions.
 */

import { optimizeAgriculturalOpportunities, type OpportunityAssumptions } from "@/lib/property/agriculturalOpportunityOptimizer";

export const DSCR_FLOOR = 1.25;

export interface CoverageMixPart {
  label: string;
  sharePct: number;
  annualNoi: number;
}

export interface CoverageSolution {
  floor: number;
  annualDebtService: number;
  requiredNoi: number;
  bestSingle: { label: string; annualNoi: number; dscr: number } | null;
  bestMix: { parts: CoverageMixPart[]; annualNoi: number; dscr: number } | null;
  verdict: "clears" | "close" | "cannot";
  /** Dollars/yr the best option falls short of the 1.25x floor (null when clear). */
  gapAnnual: number | null;
  /** Off-farm income counted in GLOBAL DSCR that closes the gap (== gapAnnual). */
  outsideIncomeNeeded: number | null;
  /** Screening price at which the best modeled income clears 1.25x. */
  maxSupportablePrice: number | null;
  notes: string[];
}

export function solveDscrCoverage(args: {
  acres: number;
  screeningPrice: number;
  annualDebtService: number;
  ratePct: number;
  amortYears: number;
  ltv: number;
  assumptions?: Partial<OpportunityAssumptions>;
}): CoverageSolution {
  const model = optimizeAgriculturalOpportunities({
    acres: args.acres,
    purchasePrice: args.screeningPrice,
    debtService: args.annualDebtService,
    waterScore: 70,
    laborCapacity: 55,
    capitalCapacity: 55,
    marketAccess: 60,
    gridEvidence: false,
    solarZoningEvidence: false,
    ...args.assumptions,
  });

  const ds = args.annualDebtService;
  const requiredNoi = ds * DSCR_FLOOR;

  const bestSingleRaw = model.mostProfitable;
  const bestSingle = bestSingleRaw
    ? { label: bestSingleRaw.label, annualNoi: Math.round(bestSingleRaw.noi), dscr: ds > 0 ? bestSingleRaw.noi / ds : 0 }
    : null;
  const bestMix = model.diversified.length
    ? {
        parts: model.diversified.map((r) => ({
          label: r.label,
          sharePct: Math.round(r.portfolioShare * 100),
          annualNoi: Math.round(r.noi * r.portfolioShare),
        })),
        annualNoi: Math.round(model.portfolioNoi),
        dscr: ds > 0 ? model.portfolioNoi / ds : 0,
      }
    : null;

  const bestNoi = Math.max(bestSingle?.annualNoi ?? 0, bestMix?.annualNoi ?? 0);
  const bestDscr = ds > 0 ? bestNoi / ds : 0;

  const verdict: CoverageSolution["verdict"] =
    bestDscr >= DSCR_FLOOR ? "clears" : bestDscr >= 1.0 ? "close" : "cannot";
  const gapAnnual = verdict === "clears" ? null : Math.round(requiredNoi - bestNoi);

  // Invert the level-payment screen: the price at which the best modeled
  // income clears the floor. DS(price) = price·LTV·r/(1−(1+r)^−n) →
  // price = (bestNoi/1.25) / (LTV·r/(1−(1+r)^−n)).
  const r = args.ratePct / 100;
  const paymentFactor = args.ltv * (r > 0 ? r / (1 - Math.pow(1 + r, -args.amortYears)) : 1 / args.amortYears);
  const maxSupportablePrice = bestNoi > 0 && paymentFactor > 0 ? Math.round(bestNoi / DSCR_FLOOR / paymentFactor) : null;

  const notes = [
    "Screening model over county economics and stated capacity assumptions — enterprise budgets, contracts, and site evidence move every figure.",
    "The borrower's documented operating history OUTRANKS this model at underwriting: an operator with real records (e.g. Schedule F showing stronger commodity income on this ground) substitutes those records for these assumptions — bring three years.",
    "Off-farm income counts in GLOBAL debt-service coverage under FSA and most lender conventions — the outside-income figure below is stated on that basis.",
  ];

  return {
    floor: DSCR_FLOOR,
    annualDebtService: Math.round(ds),
    requiredNoi: Math.round(requiredNoi),
    bestSingle,
    bestMix,
    verdict,
    gapAnnual,
    outsideIncomeNeeded: gapAnnual,
    maxSupportablePrice,
    notes,
  };
}
