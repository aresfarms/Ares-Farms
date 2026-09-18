/**
 * mortgageRatesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * National average fixed mortgage rates from the Freddie Mac Primary
 * Mortgage Market Survey (PMMS), published weekly. National AVERAGES —
 * a borrower's quoted rate depends on credit, points, program, and lender.
 * Re-run: npm run ingest:pmms-rates
 */

export const MORTGAGE_RATES_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "Freddie Mac Primary Mortgage Market Survey (freddiemac.com/pmms)",
  weekOf: "2026-07-16" as string | null,
} as const;

export interface MortgageRates {
  /** Survey week (Thursday publication date), YYYY-MM-DD. */
  weekOf: string;
  /** Average 30-year fixed rate, percent. */
  rate30: number;
  /** Average 15-year fixed rate, percent. */
  rate15: number | null;
}

export const MORTGAGE_RATES: MortgageRates = {
  "weekOf": "2026-07-16",
  "rate30": 6.55,
  "rate15": 5.93
};
