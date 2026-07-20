/**
 * livestockPricesGenerated — GENERATED FILE. Do not edit by hand.
 * Current livestock prices (USDA national average price received, $/CWT).
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-livestock-prices
 *
 * CATTLE NOTE (founder correction 2026-07-20): NASS PRICE RECEIVED for "CATTLE"
 * returns several classes; an unfiltered read picks up the CALVES class (~$513/cwt),
 * which is NOT the fed-cattle number a farmer means. The value below is the
 * fed-cattle figure from the USDA AMS National Daily Cattle & Beef Summary
 * (5-area live steer, 2026-07-17). The ingest parser now pins the NASS query to
 * the fed-cattle class (steers & heifers), so a re-run repopulates cattle from
 * NASS in the same ballpark instead of the calves class.
 */

export const LIVESTOCK_PRICES_PROVENANCE = {
  asOf: "2026-07-20" as string | null,
  source:
    "USDA — NASS Price Received (hogs, milk); AMS National Daily Cattle & Beef Summary, 5-area live steer (cattle)",
} as const;

export interface LivestockPrice {
  month: string;
  year: number;
  /** National average price received, dollars per hundredweight (CWT). */
  pricePerCwt: number;
}

export const LIVESTOCK_PRICES: Record<string, LivestockPrice> = {
  "cattle": {
    "month": "JUL",
    "year": 2026,
    "pricePerCwt": 238.59
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
