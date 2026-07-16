/**
 * countyFmrGenerated — GENERATED FILE. Do not edit by hand.
 *
 * HUD Fair Market Rents by 5-digit county FIPS. PLACEHOLDER: empty until the
 * owner-run ingest executes (huduser.gov sits behind an anti-bot wall; download
 * the county FMR CSV in a browser, or register a free HUD USER API token):
 *   npx tsx src/scripts/ingestHudFmr.ts --file <FY_FMRs.csv> --year FY2025
 * The brief renders NO rental-context fact while this is empty.
 */

export const COUNTY_FMR_PROVENANCE = {
  asOf: "pending",
  fmrYear: "pending",
  source: "HUD USER Fair Market Rents (huduser.gov)",
  license: "Public domain (U.S. Government work)",
  counties: 0,
} as const;

export interface CountyFmrEntry {
  areaName: string;
  /** Monthly gross-rent FMRs by bedroom count (0 = efficiency). */
  fmr0: number;
  fmr1: number;
  fmr2: number;
  fmr3: number;
  fmr4: number;
}

export const COUNTY_FMR: Record<string, CountyFmrEntry> = {};
