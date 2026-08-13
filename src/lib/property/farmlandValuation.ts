/**
 * farmlandValuation — Furlong's own, COMPS-FREE, math-derived value for a
 * farm/land parcel (founder direction 2026-08-13).
 *
 * WHY: a tool that can't stand behind a property's value loses the customer for
 * every other number it shows. We do not defer to the realtor's price and we do
 * not lean on individual comparable sales. We derive value the way an appraiser
 * does with the two approaches that AREN'T sales comparison, from aggregate
 * public data + this parcel's own economics:
 *
 *   1. MARKET LAND VALUE (cost approach, land)   — acres × USDA state farm
 *      real-estate $/acre, adjusted for soil capability. What farmland trades at.
 *   2. PRODUCTIVE / INCOME VALUE (income approach) — best-use NOI ÷ cap rate,
 *      where the cap rate is the OBSERVED income yield (USDA cash rent ÷ USDA
 *      land value). What the land is worth for what it EARNS.
 *   3. IMPROVEMENTS (cost approach, structures)  — replacement cost new less
 *      depreciation. Shown SEPARATELY and flagged as an ESTIMATE unless the
 *      footprint is verified/measured, because assessor/listing square footage
 *      is frequently wrong and must never silently drive the value.
 *
 * "With and without discount": the INCOME value (earnings-only, no speculative
 * premium) is the conservative floor; the MARKET LAND value is the full,
 * market-reflective number. The spread between them is the premium the market
 * pays above pure earnings — a real, decision-relevant output for a buyer.
 *
 * NOT an appraisal or a broker price opinion. A licensed appraisal, and a real
 * arm's-length price, both outrank it. Every rate below is a published aggregate
 * (USDA), never a cherry-picked neighbor's sale; the CALCULATION is this
 * parcel's own (its acres, soil, income, and — when verified — its buildings).
 *
 * Master Volume Governance: Vol II (sources declared, no fabricated certainty),
 * Vol V (versioned, every input named, replay-safe).
 */

// ── Tunable screening assumptions (founder-reviewable) ───────────────────────
/** Soil-capability multiplier on the state average $/acre. Class 1–2 is prime;
 *  6–8 is non-arable. Screening adjustment, not a soil appraisal. */
const SOIL_FACTOR: Record<number, number> = { 1: 1.1, 2: 1.05, 3: 0.95, 4: 0.85, 5: 0.7, 6: 0.55, 7: 0.45, 8: 0.35 };
/** Cap rate is derived from USDA cash-rent ÷ USDA land value; clamped to a sane
 *  farmland band so a thin data point can't produce an absurd multiple. */
const CAP_RATE_MIN = 0.025;
const CAP_RATE_MAX = 0.08;
const CAP_RATE_DEFAULT = 0.04;
/** Improvement replacement cost, $/ft² (screening; region- and type-blind).
 *  Deliberately conservative — improvements are a flagged add-on, not the core. */
const IMPROVEMENT_COST_PER_SQFT = 140;
/** Straight-line-ish depreciation per year of building age, capped. */
const IMPROVEMENT_DEPRECIATION_PER_YEAR = 0.012;
const IMPROVEMENT_DEPRECIATION_MAX = 0.7;
/** Square footage is never trusted on entry — from the record OR a customer.
 *  These guards reject an implausible area before it can skew a value. */
const SQFT_ABS_MIN = 100;
const SQFT_ABS_MAX = 200_000;
/** A building can't credibly cover more than this fraction of the parcel. */
const SQFT_MAX_PARCEL_COVERAGE = 0.5;

export interface FarmlandValuationInput {
  acres: number | null;
  /** USDA state farm real-estate value, $/acre. */
  stateFarmlandPerAcre: number | null;
  /** USDA NASS cropland cash rent, $/acre/yr. */
  croplandRentPerAcre: number | null;
  /** Best modeled use's annual NOI, from the pro-forma. */
  bestUseNoiAnnual?: number | null;
  /** NRCS land-capability class 1–8. */
  soilCapabilityClass?: number | null;
  /** Building area, ft². TREATED AS ESTIMATE unless squareFeetVerified. */
  squareFeet?: number | null;
  yearBuilt?: number | null;
  /** True only when the footprint is measured or mathematically calculated. */
  squareFeetVerified?: boolean;
  /** Reference year for depreciation (pass the current year; keeps this pure). */
  asOfYear: number;
}

export type MethodReliability = "math-derived" | "estimate-unverified" | "unavailable";

export interface ValuationMethod {
  key: "market-land" | "income-best-use" | "improvements";
  label: string;
  valueUsd: number | null;
  basis: string;
  reliability: MethodReliability;
}

export interface FarmlandValuation {
  status: "valued" | "insufficient-data";
  /** The confident range from the RELIABLE (math-derived) methods only. */
  lowUsd: number | null;
  midUsd: number | null;
  highUsd: number | null;
  capRatePct: number | null;
  /** ── The three headline figures a customer wants (founder 2026-08-13) ── */
  /** Land alone — market, USDA-grounded (reliable). */
  landValueUsd: number | null;
  /** Productive/income value — what the best use earns (reliable cross-check). */
  incomeValueUsd: number | null;
  /** Improvements alone — DEPRECIATED replacement cost (the value contribution). */
  improvementsValueUsd: number | null;
  /** Improvements REBUILD cost new (undepreciated) — the fire/flood insurance figure. */
  improvementsRebuildCostUsd: number | null;
  /** Land + improvements combined. */
  combinedUsd: number | null;
  methods: ValuationMethod[];
  /** Estimated improvements (= improvementsValueUsd); only reliable when verified. */
  improvementsEstimatedUsd: number | null;
  improvementsVerified: boolean;
  sources: string[];
  cautions: string[];
}

function round1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}

export function valueFarmland(input: FarmlandValuationInput): FarmlandValuation {
  const acres = input.acres && input.acres > 0 ? input.acres : null;
  const soilFactor =
    input.soilCapabilityClass != null && SOIL_FACTOR[input.soilCapabilityClass] != null
      ? SOIL_FACTOR[input.soilCapabilityClass]
      : 1.0;

  // Cap rate from the observed income yield (USDA rent ÷ USDA land value).
  const observedYield =
    input.croplandRentPerAcre != null && input.stateFarmlandPerAcre != null && input.stateFarmlandPerAcre > 0
      ? input.croplandRentPerAcre / input.stateFarmlandPerAcre
      : null;
  const capRate = observedYield != null ? Math.min(CAP_RATE_MAX, Math.max(CAP_RATE_MIN, observedYield)) : CAP_RATE_DEFAULT;

  // 1. Market land value.
  const marketLand =
    acres != null && input.stateFarmlandPerAcre != null && input.stateFarmlandPerAcre > 0
      ? round1000(acres * input.stateFarmlandPerAcre * soilFactor)
      : null;

  // 2. Income / productive value.
  // Land-income value capitalizes the LAND's own income (USDA cash rent) — NOT
  // the operator's best-use NOI, which embeds returns to labor, management, and
  // equipment and would badly overvalue the land (e.g. capitalizing intensive
  // alfalfa NOI at a bare-land cap rate). This is the defensible income anchor.
  const landIncomeAnnual =
    input.croplandRentPerAcre != null && input.croplandRentPerAcre > 0 && acres != null
      ? input.croplandRentPerAcre * acres
      : null;
  const incomeValue = landIncomeAnnual != null && capRate > 0 ? round1000(landIncomeAnnual / capRate) : null;

  // 3. Improvements — flagged estimate, and only when the area is PLAUSIBLE.
  // Square footage is never trusted on entry (record or customer); an
  // implausible number is rejected so it can't skew the value, and customer
  // entry alone never makes it "verified" — only a measured/calculated footprint.
  let improvements: number | null = null;   // depreciated — the VALUE contribution
  let rebuildCost: number | null = null;     // undepreciated — the INSURANCE rebuild figure
  let sqftImplausible = false;
  if (input.squareFeet != null && input.squareFeet > 0) {
    const parcelSqft = acres != null ? acres * 43_560 : null;
    const plausible =
      input.squareFeet >= SQFT_ABS_MIN &&
      input.squareFeet <= SQFT_ABS_MAX &&
      (parcelSqft == null || input.squareFeet <= parcelSqft * SQFT_MAX_PARCEL_COVERAGE);
    if (!plausible) {
      sqftImplausible = true;
    } else {
      const age = input.yearBuilt != null ? Math.max(0, input.asOfYear - input.yearBuilt) : 30;
      const depreciation = Math.min(IMPROVEMENT_DEPRECIATION_MAX, age * IMPROVEMENT_DEPRECIATION_PER_YEAR);
      rebuildCost = round1000(input.squareFeet * IMPROVEMENT_COST_PER_SQFT);
      improvements = round1000(input.squareFeet * IMPROVEMENT_COST_PER_SQFT * (1 - depreciation));
    }
  }
  const improvementsVerified = !!input.squareFeetVerified && improvements != null;
  // Combined = land + improvements (flagged when improvements are unverified).
  const combined =
    marketLand != null
      ? round1000(marketLand + (improvements ?? 0))
      : improvements != null
        ? improvements
        : null;

  const methods: ValuationMethod[] = [
    {
      key: "market-land",
      label: "Market land value",
      valueUsd: marketLand,
      basis:
        marketLand != null
          ? `${acres!.toLocaleString("en-US")} ac × $${input.stateFarmlandPerAcre!.toLocaleString("en-US")}/ac (USDA state farm real-estate value)${soilFactor !== 1 ? ` × ${soilFactor.toFixed(2)} soil-capability factor (class ${input.soilCapabilityClass})` : ""}`
          : "Needs acreage and the USDA state farmland $/acre.",
      reliability: marketLand != null ? "math-derived" : "unavailable",
    },
    {
      key: "income-best-use",
      label: "Land-income value",
      valueUsd: incomeValue,
      basis:
        incomeValue != null
          ? `USDA cash rent $${input.croplandRentPerAcre!.toLocaleString("en-US")}/ac × ${acres!.toLocaleString("en-US")} ac ÷ ${(capRate * 100).toFixed(1)}% cap rate — the land's own income, not the operator's.`
          : "Needs county cash rent and acreage.",
      reliability: incomeValue != null ? "math-derived" : "unavailable",
    },
    {
      key: "improvements",
      label: "Estimated improvements",
      valueUsd: improvements,
      basis:
        improvements != null
          ? `${input.squareFeet!.toLocaleString("en-US")} ft² × $${IMPROVEMENT_COST_PER_SQFT}/ft² replacement, less age depreciation${improvementsVerified ? " (footprint verified)" : " — ESTIMATE: square footage is UNVERIFIED and NOT in the value below; a measured/calculated footprint is required to include it"}`
          : sqftImplausible
            ? `Entered building area (${input.squareFeet!.toLocaleString("en-US")} ft²) is implausible for this parcel — rejected so a wrong number can't skew the value; provide a verified footprint.`
            : "No building area on record.",
      reliability: improvements == null ? "unavailable" : improvementsVerified ? "math-derived" : "estimate-unverified",
    },
  ];

  // Confident range from the RELIABLE methods only. Verified improvements add on.
  const reliable = [marketLand, incomeValue].filter((v): v is number => v != null);
  if (reliable.length === 0) {
    return {
      status: "insufficient-data",
      lowUsd: null, midUsd: null, highUsd: null, capRatePct: observedYield != null ? Math.round(capRate * 1000) / 10 : null,
      landValueUsd: marketLand, incomeValueUsd: incomeValue, improvementsValueUsd: improvements, improvementsRebuildCostUsd: rebuildCost, combinedUsd: combined,
      methods,
      improvementsEstimatedUsd: improvements,
      improvementsVerified,
      sources: [],
      cautions: [
        "Not enough public data to derive a value yet — we need the parcel's acreage plus the USDA state farmland value and county cash rent for this location.",
      ],
    };
  }
  const improvementAdd = improvementsVerified && improvements != null ? improvements : 0;
  const low = round1000(Math.min(...reliable) + improvementAdd);
  const high = round1000(Math.max(...reliable) + improvementAdd);
  const mid = round1000((low + high) / 2);

  return {
    status: "valued",
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    capRatePct: Math.round(capRate * 1000) / 10,
    landValueUsd: marketLand, incomeValueUsd: incomeValue, improvementsValueUsd: improvements, improvementsRebuildCostUsd: rebuildCost, combinedUsd: combined,
    methods,
    improvementsEstimatedUsd: improvements,
    improvementsVerified,
    sources: [
      "USDA NASS — state farm real-estate value and county cash rents",
      "Furlong best-use enterprise model (this parcel's NOI)",
    ],
    cautions: [
      "A screening value from public aggregates and this parcel's own economics — NOT an appraisal, a broker price opinion, or a closed-comps analysis. A licensed appraisal and a real arm's-length price both outrank it.",
      "The land and income figures are math-derived. Building/improvement value is a separate ESTIMATE and is excluded from the range above until the square footage is verified.",
      ...(sqftImplausible
        ? ["The building area on file is implausible for this parcel and was NOT used — a wrong square footage can't be allowed to skew the value; verify the footprint before any improvement value is credited."]
        : []),
    ],
  };
}
