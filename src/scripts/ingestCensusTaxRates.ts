/**
 * ingestCensusTaxRates — county property-tax context (median annual real
 * estate taxes, median owner-occupied home value, and the effective rate the
 * two imply), frozen into a committed snapshot (founder direction
 * 2026-07-17: post-close ownership costs must include honest property-tax
 * expectations — the numbers people underestimate and get underwater on).
 *
 * Source: U.S. Census Bureau ACS 5-year estimates —
 *   B25103 (median real estate taxes paid, owner-occupied)
 *   B25077 (median home value, owner-occupied)
 * The Census API requires a FREE key. The key is OWNER-registered and
 * supplied via CENSUS_API_KEY env — it is never stored in the repo.
 *
 *   CENSUS_API_KEY=<owner key> npm run ingest:census-tax-rates
 *
 * County MEDIANS only — the parcel's assessment, exemptions, and local levies
 * decide actuals. The model labels every tax estimate accordingly.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyTaxContextGenerated.ts");
const ACS_YEAR = 2023;
const KEY = process.env.CENSUS_API_KEY?.trim();

const num = (value: string | null | undefined): number | null => {
  const n = Number(value);
  // ACS sentinel values for suppressed estimates are large negatives.
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function fetchTable(variable: string): Promise<Map<string, number>> {
  const url =
    `https://api.census.gov/data/${ACS_YEAR}/acs/acs5?get=${variable}` +
    `&for=county:*&key=${KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: "follow" });
  if (!res.ok) throw new Error(`Census API HTTP ${res.status} for ${variable}`);
  const rows = (await res.json()) as string[][];
  const byFips = new Map<string, number>();
  for (const row of rows.slice(1)) {
    const [value, state, county] = row;
    const parsed = num(value);
    if (parsed !== null && state && county) byFips.set(`${state}${county}`, parsed);
  }
  return byFips;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:census-tax-rates ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) {
    console.error(
      "  CENSUS_API_KEY is required (owner-registered, free: api.census.gov/data/key_signup.html).\n" +
      "  Then run:  CENSUS_API_KEY=<key> npm run ingest:census-tax-rates\n"
    );
    process.exit(1);
  }

  const [taxes, values] = await Promise.all([fetchTable("B25103_001E"), fetchTable("B25077_001E")]);
  console.log(`  B25103 median taxes: ${taxes.size} counties`);
  console.log(`  B25077 median values: ${values.size} counties`);
  if (taxes.size < 1000 || values.size < 1000) {
    throw new Error("Implausibly few counties returned — snapshot NOT overwritten.");
  }

  const fipsList = [...taxes.keys()].filter((fips) => values.has(fips)).sort();
  const entries = fipsList.map((fips) => {
    const medianAnnualTax = taxes.get(fips) as number;
    const medianHomeValue = values.get(fips) as number;
    const effectiveRatePct = Number(((medianAnnualTax / medianHomeValue) * 100).toFixed(2));
    return `  ${JSON.stringify(fips)}: ${JSON.stringify({ medianAnnualTax, medianHomeValue, effectiveRatePct })},`;
  });

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * countyTaxContextGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County property-tax context from U.S. Census Bureau ACS 5-year estimates
 * (B25103 median real estate taxes, B25077 median home value). County
 * MEDIANS — the parcel's assessment, exemptions, and local levies decide
 * actuals. Re-run: CENSUS_API_KEY=<key> npm run ingest:census-tax-rates
 */

export const COUNTY_TAX_CONTEXT_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "U.S. Census Bureau API (api.census.gov), ${ACS_YEAR} ACS 5-year estimates",
  acsVintage: "${ACS_YEAR} ACS 5-year estimates, tables B25103 + B25077",
  resolvedCounties: ${entries.length},
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
export const COUNTY_TAX_CONTEXT: Record<string, CountyTaxContext> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} counties → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:census-tax-rates FAILED —", error);
  process.exit(1);
});
