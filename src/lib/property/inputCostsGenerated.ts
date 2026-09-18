/**
 * inputCostsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Farm input cost indexes (USDA NASS Prices Paid, 2011 = 100) with
 * year-over-year change. Re-run: NASS_API_KEY=<key> npm run ingest:nass-input-costs
 */

export const INPUT_COSTS_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "USDA NASS Prices Paid indexes (2011=100)",
} as const;

export interface InputCost {
  /** Price-paid index, 2011 = 100. */
  index: number;
  year: number;
  period: string;
  /** Year-over-year change, percent (null if no prior year). */
  yoyPct: number | null;
}

export const INPUT_COSTS: Record<string, InputCost> = {
  "fertilizer": {
    "index": 1747,
    "year": 2026,
    "period": "MAY",
    "yoyPct": 22.3
  },
  "seed": {
    "index": 4479,
    "year": 2026,
    "period": "MAY",
    "yoyPct": 0
  },
  "fuel": {
    "index": 3466,
    "year": 2026,
    "period": "MAY",
    "yoyPct": 46.9
  },
  "feed": {
    "index": 1246,
    "year": 2026,
    "period": "MAY",
    "yoyPct": 2.9
  },
  "chemicals": {
    "index": 993,
    "year": 2026,
    "period": "MAY",
    "yoyPct": -5
  }
};
