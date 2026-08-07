/**
 * fsaRatesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Current USDA FSA farm-loan interest rates (Farm Service Agency, public,
 * monthly). Re-run: npm run ingest:fsa-rates
 */

export const FSA_RATES_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  effective: "July 1, 2026" as string | null,
  source: "USDA FSA Current Loan Interest Rates (fsa.usda.gov)",
} as const;

export interface FsaRates {
  /** Farm Ownership - Direct, percent. */
  ownershipDirect: number;
  /** Farm Operating - Direct, percent. */
  operatingDirect: number;
  /** Farm Ownership - Direct, Joint Financing, percent (if published). */
  ownershipJoint?: number;
  /** Farm Ownership - Down Payment program, percent (if published). */
  downPayment?: number;
  /** Emergency loan, percent (if published). */
  emergency?: number;
}

export const FSA_RATES: FsaRates = {
  "ownershipJoint": 4,
  "downPayment": 2,
  "ownershipDirect": 6,
  "operatingDirect": 5.125,
  "emergency": 3.75
};
