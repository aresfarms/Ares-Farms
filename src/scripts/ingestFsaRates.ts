/**
 * ingestFsaRates — current USDA FSA farm-loan interest rates, frozen into a
 * committed snapshot (founder direction 2026-07-17: wire the REAL FSA rate
 * into the farm cost model instead of an illustrative mortgage proxy).
 *
 * Source: USDA FSA "Current Loan Interest Rates" page — public, keyless,
 * updated monthly. Effective the 1st of each month.
 *
 *   npm run ingest:fsa-rates
 *
 * The farm cost panel uses Farm Ownership - Direct as the representative rate.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/fsaRatesGenerated.ts");
const URL = "https://www.fsa.usda.gov/tools/informational/rates/current-fsa-loan-interest-rates";

const PROGRAMS: Array<[RegExp, string]> = [
  [/Farm Ownership - Direct, Joint Financing/, "ownershipJoint"],
  [/Farm Ownership - Down Payment/, "downPayment"],
  [/Farm Ownership - Direct/, "ownershipDirect"],
  [/Farm Operating - Direct/, "operatingDirect"],
  [/Emergency Loan/, "emergency"],
];

async function main(): Promise<void> {
  console.log("\n━━━ ingest:fsa-rates ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`FSA rates HTTP ${res.status}`);
  const txt = (await res.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  const rates: Record<string, number> = {};
  // Longest labels first so "…Joint Financing" and "…Down Payment" win over
  // the bare "Farm Ownership - Direct" match.
  for (const [re, key] of PROGRAMS) {
    const m = txt.match(new RegExp(re.source + "\\D{0,60}?(\\d\\.\\d{2,3})\\s*%"));
    if (m) rates[key] = Number(m[1]);
  }
  if (rates.ownershipDirect === undefined || rates.operatingDirect === undefined) {
    throw new Error("FSA Farm Ownership/Operating Direct rate not found — page format changed; snapshot NOT overwritten.");
  }
  const effM = txt.match(/Effective as of ([A-Za-z]+ \d{1,2}, \d{4})/);
  const effective = effM ? effM[1] : null;

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * fsaRatesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Current USDA FSA farm-loan interest rates (Farm Service Agency, public,
 * monthly). Re-run: npm run ingest:fsa-rates
 */

export const FSA_RATES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  effective: ${JSON.stringify(effective)} as string | null,
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

export const FSA_RATES: FsaRates = ${JSON.stringify(rates, null, 2)};
`,
    "utf8"
  );
  console.log(`  Farm Ownership Direct ${rates.ownershipDirect}% · Operating ${rates.operatingDirect}% (${effective ?? "n/a"})`);
  console.log(`  wrote → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => { console.error("ingest:fsa-rates FAILED —", error); process.exit(1); });
