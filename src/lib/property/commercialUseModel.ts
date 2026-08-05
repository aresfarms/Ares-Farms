/**
 * commercialUseModel — the commercial twin of the farm enterprise optimizer
 * (founder direction 2026-08-05: "the pro forma doesn't tell us the best use
 * for this commercial property, nor if it clears the DSCR requirements —
 * we need those numbers, on-screen and in the pro forma").
 *
 * Deterministic income screening per candidate use: conservative small-market
 * net-to-owner rent bands ($/sq ft/yr, NNN-posture) × the building's square
 * footage × a stabilized-occupancy factor → modeled NOI per use → DSCR at
 * lender-shaped terms against the 1.25x floor. The candidate list reuses the
 * alternative-use screen's zoning logic, so a use zoning rules out never
 * appears with a number on it.
 *
 * Honesty rules: every figure is a stated screening assumption, not an
 * appraisal, rent comp, or value opinion; an actual rent roll or appraisal
 * OUTRANKS this model the moment one exists, and the note says so.
 */

import { commercialAlternativeUses } from "@/lib/property/commercialAlternativeUses";

export interface ModeledUse {
  use: string;
  /** Conservative net-to-owner band, $/sq ft/yr. */
  netPerSqftLow: number;
  netPerSqftHigh: number;
  /** Modeled stabilized NOI at the midpoint band × occupancy. */
  noiMid: number | null;
  noiLow: number | null;
  noiHigh: number | null;
  /** DSCR at the reference lender terms (null without price + sqft). */
  dscr: number | null;
  clearsFloor: boolean | null;
  why: string;
  watch: string;
}

export interface CommercialUseScreen {
  squareFeet: number | null;
  screeningPrice: number | null;
  referenceTerms: string;
  occupancyFactor: number;
  uses: ModeledUse[];
  /** Highest-DSCR use that zoning didn't rule out (null without inputs). */
  bestUse: ModeledUse | null;
  note: string;
}

const DSCR_FLOOR = 1.25;
const OCCUPANCY = 0.88;

/** Conservative small-market net bands by use family ($/sq ft/yr to owner). */
const NET_BANDS: Array<{ pattern: RegExp; low: number; high: number }> = [
  { pattern: /office|medical/i, low: 8, high: 14 },
  { pattern: /retail|service storefront/i, low: 7, high: 14 },
  { pattern: /flex|light industrial/i, low: 5, high: 9 },
  { pattern: /warehouse|self-storage|storage/i, low: 4, high: 7 },
  { pattern: /mixed-use|residential/i, low: 8, high: 15 },
  { pattern: /food service|restaurant/i, low: 10, high: 16 },
];

function levelAnnualDebtService(principal: number, ratePct: number, years: number): number {
  const r = ratePct / 100;
  if (r <= 0) return principal / years;
  return (principal * r) / (1 - Math.pow(1 + r, -years));
}

export function modelCommercialUses(args: {
  zoning: string | null;
  landUse: string | null;
  squareFeet: number | null;
  town: string | null;
  screeningPrice: number | null;
  /** Published 30-yr benchmark; lender terms modeled at benchmark +0.75, 25-yr, 80% LTV. */
  benchRatePct: number | null;
}): CommercialUseScreen {
  const candidates = commercialAlternativeUses({
    zoning: args.zoning,
    landUse: args.landUse,
    squareFeet: args.squareFeet,
    town: args.town,
  });
  const ratePct = args.benchRatePct != null ? args.benchRatePct + 0.75 : null;
  const ads =
    args.screeningPrice != null && ratePct != null
      ? levelAnnualDebtService(args.screeningPrice * 0.8, ratePct, 25)
      : null;

  const uses: ModeledUse[] = candidates.uses.map((candidate) => {
    const band = NET_BANDS.find((b) => b.pattern.test(candidate.use)) ?? { low: 6, high: 11 };
    const sqft = args.squareFeet;
    const noiLow = sqft != null ? Math.round(sqft * band.low * OCCUPANCY) : null;
    const noiHigh = sqft != null ? Math.round(sqft * band.high * OCCUPANCY) : null;
    const noiMid = noiLow != null && noiHigh != null ? Math.round((noiLow + noiHigh) / 2) : null;
    const dscr = noiMid != null && ads != null && ads > 0 ? noiMid / ads : null;
    return {
      use: candidate.use,
      netPerSqftLow: band.low,
      netPerSqftHigh: band.high,
      noiLow,
      noiHigh,
      noiMid,
      dscr,
      clearsFloor: dscr != null ? dscr >= DSCR_FLOOR : null,
      why: candidate.why,
      watch: candidate.watch,
    };
  });

  const scored = uses.filter((u) => u.dscr != null).sort((a, b) => (b.dscr ?? 0) - (a.dscr ?? 0));
  const bestUse = scored[0] ?? null;

  return {
    squareFeet: args.squareFeet,
    screeningPrice: args.screeningPrice,
    referenceTerms:
      ratePct != null
        ? `${ratePct.toFixed(2)}% (benchmark +0.75), 25-yr amortization, 80% LTV — lender-shaped reference terms`
        : "reference lender terms unavailable (no published benchmark loaded)",
    occupancyFactor: OCCUPANCY,
    uses,
    bestUse,
    note:
      args.squareFeet == null
        ? "The income model needs the building's square footage — add it (or confirm the parcel record) and every use gets a modeled NOI and DSCR."
        : `Screening assumptions: conservative small-market net-to-owner rent bands per use × ${Math.round(OCCUPANCY * 100)}% stabilized occupancy; not an appraisal, rent comp, or value opinion. An actual rent roll or appraisal outranks this model the moment one exists. ${candidates.note}`,
  };
}
