/**
 * capitalRatesCurated — the SBA / prime / 504 / USDA capital-rate view shared by
 * the commercial AND farm lanes (founder direction 2026-07-18: create the
 * SBA/prime/504 rates and add them to both).
 *
 * HONEST SOURCING: prime and the 504 debenture come from the committed snapshot
 * (capitalRatesGenerated) — shown ONLY when actually ingested, never fabricated.
 * The FSA program rate is a real committed snapshot and is always shown. What is
 * always shown regardless is how each program is PRICED, with the hard rule that
 * the binding rate is set at the loan's closing date.
 */

import { CAPITAL_RATES, CAPITAL_RATES_PROVENANCE } from "@/lib/property/capitalRatesGenerated";
import { FSA_RATES, FSA_RATES_PROVENANCE } from "@/lib/property/fsaRatesGenerated";

export interface CapitalRateLine {
  program: string;
  /** How the rate is set (factual, structural). */
  basis: string;
  /** A hard current figure when we genuinely have one (else omitted). */
  current?: string;
}

export interface CapitalRatesView {
  asOf: string;
  lines: CapitalRateLine[];
  note: string;
}

export function buildCapitalRates(): CapitalRatesView {
  const prime = CAPITAL_RATES.prime;
  const deb = CAPITAL_RATES.sba504Debenture;

  const sba7aBasis = prime != null
    ? `Prime ${prime}% + a lender-negotiated spread (SBA-capped); usually variable.`
    : "Prime + a lender-negotiated spread (SBA-capped); usually variable.";

  const lines: CapitalRateLine[] = [
    { program: "SBA 7(a)", basis: sba7aBasis, current: prime != null ? `Prime ${prime}%` : undefined },
    {
      program: "SBA 504",
      basis: "A fixed rate set at each monthly debenture sale — it locks when your loan funds.",
      current: deb != null ? `${deb}%` : undefined,
    },
    { program: "USDA Business & Industry (B&I)", basis: "Lender-negotiated, backed by a USDA guarantee." },
    { program: "USDA / FSA program", basis: "Published program rate.", current: `FSA Farm Ownership ${FSA_RATES.ownershipDirect}%` },
    { program: "Conventional", basis: "Bank-set — often the 5-yr Treasury or SOFR + a spread; frequently a balloon." },
  ];

  // Prefer the freshest stamp we actually have.
  const asOf = CAPITAL_RATES_PROVENANCE.asOf ?? FSA_RATES_PROVENANCE.effective ?? "current";

  return {
    asOf,
    lines,
    note:
      "Your actual rate is set at your loan's CLOSING date and depends on the program, term, lender, and your file — " +
      "these are how each program is priced, not a quote. The FSA rate is a live published figure" +
      (prime == null ? "; live Prime / SBA-7(a) / 504 numbers populate once the capital-rate ingest runs." : ".") +
      " The Financing & Capital module has the lanes in detail.",
  };
}
