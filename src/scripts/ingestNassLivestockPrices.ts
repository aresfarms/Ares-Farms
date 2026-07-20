/**
 * ingestNassLivestockPrices — current livestock prices (cattle, hogs, milk),
 * frozen into a committed snapshot for the Furlong market report (founder
 * direction 2026-07-19: the ag-market table should include livestock, not just
 * grain).
 *
 * Source: USDA NASS QuickStats PRICE RECEIVED — the monthly national average
 * price farmers received. Livestock is priced in $/CWT (hundredweight), NOT
 * $/bushel. Public data, FREE owner NASS key (the SAME key that populates the
 * grain prices).
 *
 * Run it and paste the key when prompted (nothing is stored):
 *   npm run ingest:nass-livestock-prices
 * …or pass it inline if you prefer:
 *   NASS_API_KEY=<key> npm run ingest:nass-livestock-prices
 *
 * This is why livestock is not yet showing: the pipe is built, but the snapshot
 * is populated by running this with the owner's NASS key (as with grain prices).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/livestockPricesGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";
// Set from env if provided, else prompted in the terminal (hidden) at run time.
let KEY = process.env.NASS_API_KEY?.trim();

/** Prompt for the NASS key in the terminal (VISIBLE — it's a free public-data key,
    not a secret, and showing it lets you confirm it pasted correctly). */
function promptForKey(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("  Paste your USDA NASS API key (free at quickstats.nass.usda.gov/api) and press Enter:\n  > ", (answer) => {
      rl.close();
      // Strip any stray whitespace/newlines that come along with a paste.
      resolve(answer.replace(/\s+/g, "").trim());
    });
  });
}
const YEAR = new Date(process.env.NASS_AS_OF ? Date.parse(process.env.NASS_AS_OF) : Date.now()).getFullYear();

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

interface NassRow { reference_period_desc?: string; unit_desc?: string; short_desc?: string; Value?: string }

/** Diagnostic breadcrumbs printed if nothing resolves — so a failure is legible. */
const DIAG: string[] = [];

/**
 * NASS "CATTLE" PRICE RECEIVED returns MULTIPLE classes — calves, cows, steers &
 * heifers, all-cattle — in the same $/CWT unit. An unfiltered read grabs whatever
 * period is latest, which is how the first run landed on the CALVES class (~$513/cwt)
 * instead of fed cattle. `preferClasses`, when set, is an ALLOWLIST matched against
 * short_desc: only those classes are accepted (dropping calves-only and cows), and
 * earlier entries win, so fed cattle (steers & heifers) beats the blended averages.
 */
interface CommoditySpec {
  nass: string;
  key: string;
  preferClasses?: string[];
}

const COMMODITIES: CommoditySpec[] = [
  { nass: "CATTLE", key: "cattle", preferClasses: ["STEERS & HEIFERS", "EXCL CALVES", "INCL CALVES"] },
  { nass: "HOGS", key: "hogs" },
  { nass: "MILK", key: "milk" },
];

async function latest(spec: CommoditySpec, year: number): Promise<{ month: string; price: number; year: number } | null> {
  const { nass: commodity, preferClasses } = spec;
  const params = new URLSearchParams({
    key: KEY as string, commodity_desc: commodity, statisticcat_desc: "PRICE RECEIVED",
    agg_level_desc: "NATIONAL", year: String(year), format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) { DIAG.push(`${commodity} ${year}: HTTP ${res.status}`); return null; }
  const rows = ((await res.json()) as { data?: NassRow[] }).data ?? [];
  DIAG.push(`${commodity} ${year}: ${rows.length} rows`);
  // Accept $/CWT rows on ANY reporting period — livestock price-received is often
  // annual/marketing-year, not monthly (that's what broke the first run). Rank
  // first by CLASS (fed cattle over calves/cows/blended), then by period so the
  // latest wins within a class.
  let best: { classScore: number; rank: number; label: string; price: number } | null = null;
  for (const r of rows) {
    const unit = (r.unit_desc ?? "").toUpperCase();
    if (unit && !unit.includes("CWT")) continue;
    const price = Number((r.Value ?? "").replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) continue;
    let classScore = 0;
    if (preferClasses) {
      const sd = (r.short_desc ?? "").toUpperCase();
      const ci = preferClasses.findIndex((c) => sd.includes(c));
      if (ci < 0) continue; // not an allowed class → drop (calves-only, cows)
      classScore = preferClasses.length - ci; // earlier = more preferred = higher
    }
    const per = (r.reference_period_desc ?? "").trim().toUpperCase();
    const mi = MONTHS.indexOf(per);
    const rank = mi >= 0 ? mi : per.includes("YEAR") ? 11 : -1;
    const better = !best || classScore > best.classScore || (classScore === best.classScore && rank > best.rank);
    if (better) best = { classScore, rank, label: mi >= 0 ? per : String(year), price };
  }
  if (!best && rows.length) {
    DIAG.push(`  ${commodity}: units=[${[...new Set(rows.map((r) => r.unit_desc))].slice(0, 3).join(" | ")}] classes=[${[...new Set(rows.map((r) => r.short_desc))].slice(0, 4).join(" | ")}]`);
  }
  return best ? { month: best.label, price: best.price, year } : null;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-livestock-prices ━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) {
    console.log("  No NASS_API_KEY in the environment — paste it below (used only for this run, never stored).");
    KEY = await promptForKey();
  }
  if (!KEY) {
    console.error("  No key provided — nothing fetched. (Free key: quickstats.nass.usda.gov/api — same one as grain.)\n");
    process.exit(1);
  }
  console.log(`  Key received (${KEY.length} characters) — querying USDA NASS…`);
  const out: Record<string, { month: string; year: number; pricePerCwt: number }> = {};
  for (const spec of COMMODITIES) {
    const p = (await latest(spec, YEAR).catch(() => null)) ?? (await latest(spec, YEAR - 1).catch(() => null));
    if (p) { out[spec.key] = { month: p.month, year: p.year, pricePerCwt: p.price }; console.log(`  ${spec.key}: $${p.price}/cwt (${p.month} ${p.year})`); }
  }
  if (Object.keys(out).length === 0) {
    console.error("  Diagnostics (what NASS returned):");
    DIAG.forEach((d) => console.error("    " + d));
    throw new Error("No livestock prices resolved — snapshot NOT overwritten. Paste the diagnostics above to me and I'll pinpoint the query.");
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * livestockPricesGenerated — GENERATED FILE. Do not edit by hand.
 * Current livestock prices (USDA NASS national average price received, $/CWT).
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-livestock-prices
 */

export const LIVESTOCK_PRICES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS QuickStats — Price Received (quickstats.nass.usda.gov)",
} as const;

export interface LivestockPrice {
  month: string;
  year: number;
  /** National average price received, dollars per hundredweight (CWT). */
  pricePerCwt: number;
}

export const LIVESTOCK_PRICES: Record<string, LivestockPrice> = ${JSON.stringify(out, null, 2)};
`,
    "utf8"
  );
  console.log(`  wrote ${Object.keys(out).length} livestock commodities → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:nass-livestock-prices FAILED —", error);
  process.exit(1);
});
