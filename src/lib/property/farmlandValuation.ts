/**
 * Compatibility bridge to the ONE valuation engine. The retired standalone
 * USDA/soil-factor, synthetic cap-rate and $140/sqft methods must never create a
 * second market value. Product Coherence 2026-09-05; TECH-PROV / CANON-EXPL.
 */
import { indicateMarketValue } from "./marketValueIndication";
export interface FarmlandValuationInput {
  acres: number | null;
  marketEvidence?: Parameters<typeof indicateMarketValue>[0];
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


export function valueFarmland(input: FarmlandValuationInput): FarmlandValuation {
  const screen = indicateMarketValue({ ...input.marketEvidence, propertyType: "farm", acreage: input.acres });
  return {
    status: screen.status === "indicated" ? "valued" : "insufficient-data",
    lowUsd: screen.lowUsd, midUsd: screen.midUsd, highUsd: screen.highUsd,
    capRatePct: null, landValueUsd: null, incomeValueUsd: null,
    improvementsValueUsd: null, improvementsRebuildCostUsd: null,
    combinedUsd: screen.midUsd, improvementsEstimatedUsd: null, improvementsVerified: false,
    methods: [{ key: "market-land", label: screen.displayLabel, valueUsd: screen.midUsd,
      basis: screen.method, reliability: screen.status === "indicated" ? "math-derived" : "unavailable" }],
    sources: screen.sources,
    cautions: [...screen.cautions, "Comparable evidence pending until current, verified, adjusted farm/land sales support the screen. State averages, county rents, soil multipliers and assumed improvement costs are not market-value evidence."],
  };
}
