/**
 * residentialRatesCurated — the residential mortgage-rate block for the
 * Residential lane (founder direction 2026-07-18: current interest rates that
 * track and change as rates change, for all applicable residential mortgage
 * loan options).
 *
 * HONEST SOURCING: the two benchmark rates (30-year and 15-year fixed) are the
 * Freddie Mac PMMS national averages from the committed snapshot, refreshed
 * weekly — so they track as rates move. We do NOT fabricate distinct FHA / VA /
 * USDA / ARM rates: those are lender-set and priced NEAR the conventional
 * benchmark; the real difference between programs is the down payment and
 * mortgage insurance, not a wildly different rate. Each option carries its
 * structure and who it's for. Scanned by verify:brief-copy.
 */

import { MORTGAGE_RATES, MORTGAGE_RATES_PROVENANCE } from "@/lib/property/mortgageRatesGenerated";

export type RateKind = "fixed30" | "fixed15" | "near" | "arm";

export interface ResidentialLoanOption {
  name: string;
  rateKind: RateKind;
  downPayment: string;
  mortgageInsurance: string;
  whoFor: string;
  note?: string;
}

export const RESIDENTIAL_LOAN_OPTIONS: ResidentialLoanOption[] = [
  {
    name: "Conventional 30-year fixed",
    rateKind: "fixed30",
    downPayment: "3–20%+",
    mortgageInsurance: "PMI if under 20% down (drops off at 20% equity)",
    whoFor: "The default for most buyers with reasonable credit.",
  },
  {
    name: "Conventional 15-year fixed",
    rateKind: "fixed15",
    downPayment: "3–20%+",
    mortgageInsurance: "PMI if under 20% down",
    whoFor: "Higher payment, much less interest — pays off in half the time.",
  },
  {
    name: "FHA",
    rateKind: "near",
    downPayment: "3.5% (580+ score)",
    mortgageInsurance: "MIP: upfront + annual, usually for the life of the loan",
    whoFor: "Lower credit or thin down payment; the MIP is the trade-off.",
  },
  {
    name: "VA",
    rateKind: "near",
    downPayment: "0%",
    mortgageInsurance: "None — a one-time funding fee instead",
    whoFor: "Veterans, active service members, and eligible spouses.",
  },
  {
    name: "USDA Rural Development",
    rateKind: "near",
    downPayment: "0%",
    mortgageInsurance: "Upfront + annual guarantee fee (lower than FHA MIP)",
    whoFor: "Rural-eligible areas within income limits.",
    note: "One hard boundary: USDA-RD is for a RURAL HOME — it will not finance a working farm or income-producing acreage (that lives in the FSA/Farm Credit lanes).",
  },
  {
    name: "Adjustable-rate (ARM)",
    rateKind: "arm",
    downPayment: "5–20%+",
    mortgageInsurance: "PMI if under 20% down",
    whoFor: "Lower rate for the first fixed period (e.g. 5 or 7 years), then it adjusts — you carry the rate risk after that.",
  },
];

export interface ResidentialRatesView {
  rate30: number;
  rate15: number | null;
  weekOf: string | null;
  options: Array<ResidentialLoanOption & { rateLabel: string }>;
  provenanceNote: string;
}

/** Build the rates view from the live PMMS snapshot. */
export function buildResidentialRates(): ResidentialRatesView {
  const r30 = MORTGAGE_RATES.rate30;
  const r15 = MORTGAGE_RATES.rate15;
  const rateLabelFor = (kind: RateKind): string => {
    switch (kind) {
      case "fixed30":
        return `${r30.toFixed(2)}%`;
      case "fixed15":
        return r15 != null ? `${r15.toFixed(2)}%` : "lender-set";
      case "arm":
        return "starts below the 30-yr, then adjusts";
      default:
        return "near the 30-yr benchmark · lender-set";
    }
  };
  return {
    rate30: r30,
    rate15: r15,
    weekOf: MORTGAGE_RATES.weekOf ?? MORTGAGE_RATES_PROVENANCE.weekOf,
    options: RESIDENTIAL_LOAN_OPTIONS.map((o) => ({ ...o, rateLabel: rateLabelFor(o.rateKind) })),
    provenanceNote:
      `Benchmark 30- and 15-year fixed rates are the Freddie Mac PMMS national averages, refreshed weekly — ` +
      `they track as rates move. Your quoted rate depends on credit, points, program, and lender; FHA/VA/USDA/ARM ` +
      `rates are lender-set and priced near the benchmark. Not a rate offer, quote, or lending decision. ` +
      `Source: Freddie Mac Primary Mortgage Market Survey (freddiemac.com/pmms).`,
  };
}
