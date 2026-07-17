/**
 * commodityPricesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Current commodity prices (USDA NASS national average price received,
 * $/bushel). Monthly. Re-run: NASS_API_KEY=<key> npm run ingest:nass-grain-prices
 */

export const COMMODITY_PRICES_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "USDA NASS QuickStats — Price Received (quickstats.nass.usda.gov)",
} as const;

export interface CommodityPrice {
  /** Month of the price, e.g. "MAY". */
  month: string;
  year: number;
  /** National average price received, dollars per bushel. */
  pricePerBushel: number;
}

export const COMMODITY_PRICES: Record<string, CommodityPrice> = {
  "corn": {
    "month": "MAY",
    "year": 2026,
    "pricePerBushel": 4.48
  },
  "soybeans": {
    "month": "MAY",
    "year": 2026,
    "pricePerBushel": 11.6
  },
  "wheat": {
    "month": "MAY",
    "year": 2026,
    "pricePerBushel": 5.88
  }
};
