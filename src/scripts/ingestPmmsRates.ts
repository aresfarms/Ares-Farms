/**
 * ingestPmmsRates — current average mortgage rates, frozen into a committed
 * snapshot (founder direction 2026-07-17: the ownership-cost model must use
 * current published rates so the estimated payment is honest, and must say
 * when the rate was published because rates move).
 *
 * Source: Freddie Mac Primary Mortgage Market Survey (PMMS) weekly history
 * CSV — public, NO KEY REQUIRED. The survey publishes national average
 * 30-year and 15-year fixed rates every Thursday.
 *
 *   npm run ingest:pmms-rates
 *
 * National AVERAGES only — a borrower's quoted rate depends on credit,
 * points, program, and lender. The model labels every payment estimate
 * accordingly.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/mortgageRatesGenerated.ts");
const CSV_URL = "https://www.freddiemac.com/pmms/docs/PMMS_history.csv";

const num = (value: string | undefined): number | null => {
  const n = Number((value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function main(): Promise<void> {
  console.log("\n━━━ ingest:pmms-rates ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`PMMS history HTTP ${res.status}`);
  const csv = await res.text();

  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0]?.split(",").map((cell) => cell.trim().toLowerCase()) ?? [];
  const dateCol = header.indexOf("date");
  const rate30Col = header.indexOf("pmms30");
  const rate15Col = header.indexOf("pmms15");
  if (dateCol < 0 || rate30Col < 0) {
    throw new Error(`PMMS CSV header changed (${header.join(",")}) — snapshot NOT overwritten.`);
  }

  // Latest week with a 30-year value wins.
  let weekOf: string | null = null;
  let rate30: number | null = null;
  let rate15: number | null = null;
  for (let i = lines.length - 1; i > 0; i -= 1) {
    const cells = lines[i].split(",");
    const r30 = num(cells[rate30Col]);
    if (r30 === null) continue;
    const raw = (cells[dateCol] ?? "").trim(); // M/D/YYYY
    const [m, d, y] = raw.split("/").map(Number);
    if (!y || !m || !d) continue;
    weekOf = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    rate30 = r30;
    rate15 = rate15Col >= 0 ? num(cells[rate15Col]) : null;
    break;
  }
  if (!weekOf || rate30 === null) {
    throw new Error("No usable PMMS row found — snapshot NOT overwritten.");
  }
  // A stale survey (site frozen, format drift) must not masquerade as current.
  const ageDays = Math.round((Date.now() - new Date(weekOf).getTime()) / 86_400_000);
  if (ageDays > 45) {
    throw new Error(`Latest PMMS week ${weekOf} is ${ageDays} days old — snapshot NOT overwritten.`);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * mortgageRatesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * National average fixed mortgage rates from the Freddie Mac Primary
 * Mortgage Market Survey (PMMS), published weekly. National AVERAGES —
 * a borrower's quoted rate depends on credit, points, program, and lender.
 * Re-run: npm run ingest:pmms-rates
 */

export const MORTGAGE_RATES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "Freddie Mac Primary Mortgage Market Survey (freddiemac.com/pmms)",
  weekOf: ${JSON.stringify(weekOf)} as string | null,
} as const;

export interface MortgageRates {
  /** Survey week (Thursday publication date), YYYY-MM-DD. */
  weekOf: string;
  /** Average 30-year fixed rate, percent. */
  rate30: number;
  /** Average 15-year fixed rate, percent. */
  rate15: number | null;
}

export const MORTGAGE_RATES: MortgageRates = ${JSON.stringify(
      { weekOf, rate30, rate15 },
      null,
      2
    )};
`,
    "utf8"
  );
  console.log(`  week of ${weekOf}: 30-yr ${rate30}%, 15-yr ${rate15 ?? "n/a"}%`);
  console.log(`  wrote → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:pmms-rates FAILED —", error);
  process.exit(1);
});
