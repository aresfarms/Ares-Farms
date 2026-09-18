/**
 * ingestCapitalRates — the market-driven capital-rate benchmarks (prime, and
 * optionally the SBA 504 debenture) frozen into a committed snapshot (founder
 * direction 2026-07-18: create the SBA/prime/504 rates and add to both lanes).
 *
 * Source: FRED series DPRIME (Bank Prime Loan Rate) via the PUBLIC graph CSV
 * endpoint — NO API KEY REQUIRED. The SBA 7(a) rate is Prime + a lender spread,
 * so the live prime is what actually moves the 7(a) number.
 *
 *   npm run ingest:capital-rates
 *
 * The 504 debenture is set at a monthly sale with no free public feed; pass it
 * explicitly to record it:  SBA_504_DEBENTURE=6.12 npm run ingest:capital-rates
 * These are benchmarks — a borrower's binding rate is set at the loan's closing.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/capitalRatesGenerated.ts");
const DPRIME_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DPRIME";

const num = (value: string | undefined): number | null => {
  const n = Number((value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function main(): Promise<void> {
  console.log("\n━━━ ingest:capital-rates ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const res = await fetch(DPRIME_CSV, {
    headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`FRED DPRIME HTTP ${res.status}`);
  const csv = await res.text();

  // CSV: "observation_date,DPRIME" (older: "DATE,DPRIME"); "." marks a gap.
  const lines = csv.trim().split(/\r?\n/);
  let asOfDate: string | null = null;
  let prime: number | null = null;
  for (let i = lines.length - 1; i > 0; i -= 1) {
    const [rawDate, rawVal] = lines[i].split(",");
    const v = num(rawVal);
    if (v === null) continue; // "." = no observation
    asOfDate = (rawDate ?? "").trim(); // YYYY-MM-DD
    prime = v;
    break;
  }
  if (!asOfDate || prime === null) throw new Error("No usable DPRIME row — snapshot NOT overwritten.");

  const ageDays = Math.round((Date.now() - new Date(asOfDate).getTime()) / 86_400_000);
  if (ageDays > 120) throw new Error(`Latest DPRIME ${asOfDate} is ${ageDays} days old — snapshot NOT overwritten.`);

  const deb = num(process.env.SBA_504_DEBENTURE);

  fs.writeFileSync(
    OUT,
    `/**
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
  asOf: ${JSON.stringify(asOfDate)} as string | null,
  source: "FRED (DPRIME) for prime; NADCO/DCFC monthly debenture for 504",
} as const;

export interface CapitalRatesSnapshot {
  /** US bank prime loan rate, percent (FRED DPRIME). null until ingested. */
  prime: number | null;
  /** SBA 504 effective debenture rate, percent (set monthly). null until entered. */
  sba504Debenture: number | null;
}

export const CAPITAL_RATES: CapitalRatesSnapshot = {
  prime: ${prime},
  sba504Debenture: ${deb === null ? "null" : deb},
};
`,
    "utf8"
  );

  console.log(`  prime ${prime}% (DPRIME ${asOfDate})${deb != null ? ` · 504 debenture ${deb}%` : " · 504 debenture: not provided"}`);
  console.log(`  wrote ${path.relative(ROOT, OUT)}`);
  console.log("✓ ingest:capital-rates OK\n");
}

main().catch((err) => {
  console.error("✗ ingest:capital-rates FAILED —", err instanceof Error ? err.message : err);
  process.exit(1);
});
