/**
 * capitalRatesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * The market-driven capital-rate benchmarks that back the SBA / prime / 504
 * displays on the commercial and farm lanes. HONEST: values are null until the
 * ingest runs — we never fabricate a "current" rate. The FSA program rate is a
 * separate committed snapshot (fsaRatesGenerated) and is always shown.
 *
 * Re-run: npm run ingest:capital-rates   (prime is keyless via FRED graph CSV;
 * pass SBA_504_DEBENTURE=<pct> to record the monthly 504 debenture).
 */

export const CAPITAL_RATES_PROVENANCE = {
  asOf: "2026-07-22" as string | null,
  source: "FRED (DPRIME) for prime; NADCO/DCFC monthly debenture for 504",
} as const;

export interface CapitalRatesSnapshot {
  /** US bank prime loan rate, percent (FRED DPRIME). null until ingested. */
  prime: number | null;
  /** SBA 504 effective debenture rate, percent (set monthly). null until entered. */
  sba504Debenture: number | null;
}

export const CAPITAL_RATES: CapitalRatesSnapshot = {
  prime: 6.75,
  sba504Debenture: 6.176,
};
