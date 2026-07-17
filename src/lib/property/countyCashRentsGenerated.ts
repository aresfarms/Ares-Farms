/**
 * countyCashRentsGenerated — GENERATED FILE (placeholder until first ingest).
 *
 * County-average cropland and pastureland CASH RENTS from the USDA NASS
 * Cash Rents Survey — public domain. Keyed by 5-digit county FIPS.
 * Context facts only: county averages, never a parcel appraisal or an offer.
 *
 * Populate/refresh: NASS_API_KEY=<free key> npm run ingest:nass-cash-rents
 * (key signup: quickstats.nass.usda.gov/api — free, immediate)
 */

export const COUNTY_CASH_RENTS_PROVENANCE = {
  asOf: null as string | null,
  source: "USDA NASS Cash Rents Survey (quickstats.nass.usda.gov)",
  year: null as number | null,
  resolvedCounties: 0,
} as const;

export interface CountyCashRent {
  /** County-average cropland (non-irrigated) cash rent, $/acre/year. */
  cropland: number | null;
  /** County-average pastureland cash rent, $/acre/year. */
  pasture: number | null;
}

export const COUNTY_CASH_RENTS: Record<string, CountyCashRent> = {};
