/**
 * countyYieldsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County-average CROP YIELDS (corn / soybeans / wheat, bu/acre) from the USDA
 * NASS Survey — public domain. Keyed by 5-digit county FIPS. Property-ANALYSIS
 * context only (the best-use engine): a county productivity benchmark to
 * underwrite commodity/cash-rent math against — never a parcel yield guarantee,
 * an appraisal, or an offer, and deliberately NOT shown on the market listing.
 *
 * Ships EMPTY (asOf null → the engine adds no yield facts) until the owner runs
 * the ingest with a free NASS key:
 *   npm run ingest:nass-county-yields
 */

export const COUNTY_YIELDS_PROVENANCE = {
  asOf: null as string | null,
  source: "USDA NASS Survey — county crop yields (quickstats.nass.usda.gov)",
  year: null as number | null,
  resolvedCounties: 0,
} as const;

export interface CountyYield {
  /** County-average corn (grain) yield, bu/acre. */
  corn: number | null;
  /** County-average soybean yield, bu/acre. */
  soybeans: number | null;
  /** County-average wheat yield, bu/acre. */
  wheat: number | null;
  /** Survey year the values are drawn from. */
  year: number | null;
}

export const COUNTY_YIELDS: Record<string, CountyYield> = {};
