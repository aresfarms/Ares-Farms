/**
 * livestockPricesGenerated — GENERATED FILE. Do not edit by hand.
 * Current livestock prices (USDA NASS national average price received, $/CWT).
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-livestock-prices
 *
 * PLACEHOLDER — awaiting the first ingest run with the owner's NASS key (the
 * same key that populates the grain prices). Until then LIVESTOCK_PRICES is empty
 * and the market table simply omits the livestock section (no fabricated numbers).
 */

export const LIVESTOCK_PRICES_PROVENANCE = {
  asOf: null as string | null,
  source: "USDA NASS QuickStats — Price Received (quickstats.nass.usda.gov)",
} as const;

export interface LivestockPrice {
  month: string;
  year: number;
  /** National average price received, dollars per hundredweight (CWT). */
  pricePerCwt: number;
}

export const LIVESTOCK_PRICES: Record<string, LivestockPrice> = {};
