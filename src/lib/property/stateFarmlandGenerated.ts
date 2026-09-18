/**
 * stateFarmlandGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Farm real-estate value ($/acre, land + buildings) by state from USDA NASS,
 * with year-over-year change. Re-run: NASS_API_KEY=<key> npm run ingest:nass-farmland
 */

export const STATE_FARMLAND_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "USDA NASS — Ag Land Asset Value ($/acre)",
  resolvedStates: 48,
} as const;

export interface StateFarmland {
  year: number;
  /** Average farm real-estate value, dollars per acre (land + buildings). */
  dollarsPerAcre: number;
  /** Year-over-year change, percent (null if no prior year). */
  yoyPct: number | null;
}

export const STATE_FARMLAND: Record<string, StateFarmland> = {
  "AL": {"year":2025,"dollarsPerAcre":4150,"yoyPct":3.8},
  "AR": {"year":2025,"dollarsPerAcre":4250,"yoyPct":3.4},
  "AZ": {"year":2025,"dollarsPerAcre":4180,"yoyPct":4.5},
  "CA": {"year":2025,"dollarsPerAcre":13700,"yoyPct":2.2},
  "CO": {"year":2025,"dollarsPerAcre":2290,"yoyPct":4.1},
  "CT": {"year":2025,"dollarsPerAcre":14400,"yoyPct":0.7},
  "DE": {"year":2025,"dollarsPerAcre":9550,"yoyPct":0.3},
  "FL": {"year":2025,"dollarsPerAcre":8700,"yoyPct":4.8},
  "GA": {"year":2025,"dollarsPerAcre":4720,"yoyPct":4.9},
  "IA": {"year":2025,"dollarsPerAcre":9790,"yoyPct":3.9},
  "ID": {"year":2025,"dollarsPerAcre":4580,"yoyPct":4.3},
  "IL": {"year":2025,"dollarsPerAcre":8930,"yoyPct":2.6},
  "IN": {"year":2025,"dollarsPerAcre":8850,"yoyPct":4},
  "KS": {"year":2025,"dollarsPerAcre":3100,"yoyPct":4.4},
  "KY": {"year":2025,"dollarsPerAcre":5480,"yoyPct":3.4},
  "LA": {"year":2025,"dollarsPerAcre":3850,"yoyPct":3.5},
  "MA": {"year":2025,"dollarsPerAcre":14900,"yoyPct":4.2},
  "MD": {"year":2025,"dollarsPerAcre":9750,"yoyPct":3},
  "ME": {"year":2025,"dollarsPerAcre":3350,"yoyPct":2.8},
  "MI": {"year":2025,"dollarsPerAcre":6800,"yoyPct":7.8},
  "MN": {"year":2025,"dollarsPerAcre":6790,"yoyPct":5.3},
  "MO": {"year":2025,"dollarsPerAcre":5000,"yoyPct":4.2},
  "MS": {"year":2025,"dollarsPerAcre":3580,"yoyPct":2.6},
  "MT": {"year":2025,"dollarsPerAcre":1230,"yoyPct":2.5},
  "NC": {"year":2025,"dollarsPerAcre":5470,"yoyPct":5.4},
  "ND": {"year":2025,"dollarsPerAcre":2360,"yoyPct":4.4},
  "NE": {"year":2025,"dollarsPerAcre":4250,"yoyPct":4.2},
  "NH": {"year":2025,"dollarsPerAcre":6500,"yoyPct":4},
  "NJ": {"year":2025,"dollarsPerAcre":16600,"yoyPct":2.5},
  "NM": {"year":2025,"dollarsPerAcre":725,"yoyPct":3.6},
  "NV": {"year":2025,"dollarsPerAcre":1200,"yoyPct":4.3},
  "NY": {"year":2025,"dollarsPerAcre":4300,"yoyPct":3.6},
  "OH": {"year":2025,"dollarsPerAcre":9350,"yoyPct":6.7},
  "OK": {"year":2025,"dollarsPerAcre":2540,"yoyPct":5.8},
  "OR": {"year":2025,"dollarsPerAcre":3780,"yoyPct":1.6},
  "PA": {"year":2025,"dollarsPerAcre":8490,"yoyPct":4},
  "RI": {"year":2025,"dollarsPerAcre":22500,"yoyPct":2.3},
  "SC": {"year":2025,"dollarsPerAcre":4740,"yoyPct":5.3},
  "SD": {"year":2025,"dollarsPerAcre":2970,"yoyPct":6.8},
  "TN": {"year":2025,"dollarsPerAcre":6150,"yoyPct":7.7},
  "TX": {"year":2025,"dollarsPerAcre":2970,"yoyPct":6.1},
  "UT": {"year":2025,"dollarsPerAcre":3500,"yoyPct":6.1},
  "VA": {"year":2025,"dollarsPerAcre":6100,"yoyPct":4.3},
  "VT": {"year":2025,"dollarsPerAcre":4400,"yoyPct":1.1},
  "WA": {"year":2025,"dollarsPerAcre":3710,"yoyPct":2.5},
  "WI": {"year":2025,"dollarsPerAcre":6420,"yoyPct":4.9},
  "WV": {"year":2025,"dollarsPerAcre":3520,"yoyPct":2.9},
  "WY": {"year":2025,"dollarsPerAcre":1000,"yoyPct":2.6},
};
