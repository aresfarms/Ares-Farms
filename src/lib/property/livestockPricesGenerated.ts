/**
 * livestockPricesGenerated — GENERATED FILE. Do not edit by hand.
 * Current livestock prices (USDA NASS national average price received, $/CWT).
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-livestock-prices
 */

export const LIVESTOCK_PRICES_PROVENANCE = {
  asOf: "2026-07-20" as string | null,
  source: "USDA NASS QuickStats — Price Received (quickstats.nass.usda.gov)",
} as const;

export interface LivestockPrice {
  month: string;
  year: number;
  /** National average price received, dollars per hundredweight (CWT). */
  pricePerCwt: number;
}

export const LIVESTOCK_PRICES: Record<string, LivestockPrice> = {
  "cattle": {
    "month": "MAY",
    "year": 2026,
    "pricePerCwt": 513
  },
  "hogs": {
    "month": "MAY",
    "year": 2026,
    "pricePerCwt": 68.5
  },
  "milk": {
    "month": "MAY",
    "year": 2026,
    "pricePerCwt": 21.3
  }
};
