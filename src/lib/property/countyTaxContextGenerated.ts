/**
 * countyTaxContextGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County property-tax context from U.S. Census Bureau ACS 5-year estimates
 * (B25103 median real estate taxes, B25077 median home value). County
 * MEDIANS — the parcel's assessment, exemptions, and local levies decide
 * actuals. Re-run: CENSUS_API_KEY=<key> npm run ingest:census-tax-rates
 *
 * EMPTY until the owner-keyed ingest runs — the ownership-cost model falls
 * back to labeled national guidance when a county is missing here.
 */

export const COUNTY_TAX_CONTEXT_PROVENANCE = {
  asOf: null as string | null,
  source: "U.S. Census Bureau API (api.census.gov)",
  acsVintage: "pending first ingest",
  resolvedCounties: 0,
} as const;

export interface CountyTaxContext {
  /** Median annual real estate taxes paid, owner-occupied homes, dollars. */
  medianAnnualTax: number;
  /** Median owner-occupied home value, dollars. */
  medianHomeValue: number;
  /** Effective rate the two medians imply, percent of value per year. */
  effectiveRatePct: number;
}

/** Keyed by 5-digit county FIPS. */
export const COUNTY_TAX_CONTEXT: Record<string, CountyTaxContext> = {};
