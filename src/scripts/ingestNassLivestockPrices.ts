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
 *   NASS_API_KEY=<key> npm run ingest:nass-livestock-prices
 *
 * This is why livestock is not yet showing: the pipe is built, but the snapshot
 * is populated by running this with the owner's NASS key (as with grain prices).
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/livestockPricesGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";
const KEY = process.env.NASS_API_KEY?.trim();
const YEAR = new Date(process.env.NASS_AS_OF ? Date.parse(process.env.NASS_AS_OF) : Date.now()).getFullYear();

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

interface NassRow { reference_period_desc?: string; unit_desc?: string; short_desc?: string; Value?: string }

async function latest(commodity: string, year: number): Promise<{ month: string; price: number; year: number; unit: string } | null> {
  const params = new URLSearchParams({
    key: KEY as string, commodity_desc: commodity, statisticcat_desc: "PRICE RECEIVED",
    agg_level_desc: "NATIONAL", year: String(year), format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) return null;
  const rows = ((await res.json()) as { data?: NassRow[] }).data ?? [];
  let best: { idx: number; month: string; price: number; unit: string } | null = null;
  for (const r of rows) {
    if (!/\$ ?\/ ?CWT/i.test(r.unit_desc ?? "")) continue;
    const m = (r.reference_period_desc ?? "").trim().toUpperCase();
    const idx = MONTHS.indexOf(m);
    const price = Number((r.Value ?? "").replace(/,/g, ""));
    if (idx < 0 || !Number.isFinite(price) || price <= 0) continue;
    if (!best || idx > best.idx) best = { idx, month: m, price, unit: r.unit_desc ?? "$/CWT" };
  }
  return best ? { month: best.month, price: best.price, year, unit: best.unit } : null;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-livestock-prices ━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) { console.error("  NASS_API_KEY required (free: quickstats.nass.usda.gov/api) — same key as grain prices.\n"); process.exit(1); }
  const commodities: Array<[string, string]> = [["CATTLE", "cattle"], ["HOGS", "hogs"], ["MILK", "milk"]];
  const out: Record<string, { month: string; year: number; pricePerCwt: number }> = {};
  for (const [nass, key] of commodities) {
    const p = (await latest(nass, YEAR).catch(() => null)) ?? (await latest(nass, YEAR - 1).catch(() => null));
    if (p) { out[key] = { month: p.month, year: p.year, pricePerCwt: p.price }; console.log(`  ${key}: $${p.price}/cwt (${p.month} ${p.year})`); }
  }
  if (Object.keys(out).length === 0) throw new Error("No livestock prices resolved — snapshot NOT overwritten.");

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
