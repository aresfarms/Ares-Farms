/**
 * ingestNassGrainPrices — current commodity prices (corn, soybeans, wheat),
 * frozen into a committed snapshot for the newsletter (founder direction
 * 2026-07-17: add current commodity pricing to The Furlong Compass).
 *
 * Source: USDA NASS QuickStats PRICE RECEIVED — the monthly national average
 * price farmers received, $/bushel. Public data, FREE owner NASS key (already
 * provisioned). This is the authoritative commodity-price series; DAILY local
 * grain-buyer cash bids come from the separate USDA AMS Market News feed
 * (ingest:ams-grain-bids, pending its own free MARS key).
 *
 *   NASS_API_KEY=<key> npm run ingest:nass-grain-prices
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/commodityPricesGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";
const KEY = process.env.NASS_API_KEY?.trim();
const YEAR = new Date(process.env.NASS_AS_OF ? Date.parse(process.env.NASS_AS_OF) : Date.now()).getFullYear();

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

interface NassRow { reference_period_desc?: string; unit_desc?: string; Value?: string }

async function latestPrice(commodity: string): Promise<{ month: string; price: number; year: number } | null> {
  const params = new URLSearchParams({
    key: KEY as string, commodity_desc: commodity, statisticcat_desc: "PRICE RECEIVED",
    agg_level_desc: "NATIONAL", year: String(YEAR), format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) {
    // First weeks of a year may have no data yet — fall back to prior year.
    if (res.status === 400) return latestPriceYear(commodity, YEAR - 1);
    throw new Error(`NASS ${commodity} HTTP ${res.status}`);
  }
  const rows = ((await res.json()) as { data?: NassRow[] }).data ?? [];
  return pickLatest(rows, YEAR) ?? (await latestPriceYear(commodity, YEAR - 1));
}

async function latestPriceYear(commodity: string, year: number): Promise<{ month: string; price: number; year: number } | null> {
  const params = new URLSearchParams({
    key: KEY as string, commodity_desc: commodity, statisticcat_desc: "PRICE RECEIVED",
    agg_level_desc: "NATIONAL", year: String(year), format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) return null;
  return pickLatest(((await res.json()) as { data?: NassRow[] }).data ?? [], year);
}

function pickLatest(rows: NassRow[], year: number): { month: string; price: number; year: number } | null {
  let best: { idx: number; month: string; price: number } | null = null;
  for (const r of rows) {
    if (!/\$ ?\/ ?BU/i.test(r.unit_desc ?? "")) continue;
    const m = (r.reference_period_desc ?? "").trim().toUpperCase();
    const idx = MONTHS.indexOf(m);
    const price = Number((r.Value ?? "").replace(/,/g, ""));
    if (idx < 0 || !Number.isFinite(price) || price <= 0) continue;
    if (!best || idx > best.idx) best = { idx, month: m, price };
  }
  return best ? { month: best.month, price: best.price, year } : null;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-grain-prices ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) { console.error("  NASS_API_KEY required (free: quickstats.nass.usda.gov/api).\n"); process.exit(1); }
  const commodities: Array<[string, string]> = [["CORN", "corn"], ["SOYBEANS", "soybeans"], ["WHEAT", "wheat"]];
  const out: Record<string, { month: string; year: number; pricePerBushel: number }> = {};
  for (const [nass, key] of commodities) {
    const p = await latestPrice(nass).catch(() => null);
    if (p) { out[key] = { month: p.month, year: p.year, pricePerBushel: p.price }; console.log(`  ${key}: $${p.price}/bu (${p.month} ${p.year})`); }
  }
  if (Object.keys(out).length === 0) throw new Error("No commodity prices resolved — snapshot NOT overwritten.");

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * commodityPricesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Current commodity prices (USDA NASS national average price received,
 * $/bushel). Monthly. Re-run: NASS_API_KEY=<key> npm run ingest:nass-grain-prices
 */

export const COMMODITY_PRICES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS QuickStats — Price Received (quickstats.nass.usda.gov)",
} as const;

export interface CommodityPrice {
  /** Month of the price, e.g. "MAY". */
  month: string;
  year: number;
  /** National average price received, dollars per bushel. */
  pricePerBushel: number;
}

export const COMMODITY_PRICES: Record<string, CommodityPrice> = ${JSON.stringify(out, null, 2)};
`,
    "utf8"
  );
  console.log(`  wrote ${Object.keys(out).length} commodities → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:nass-grain-prices FAILED —", error);
  process.exit(1);
});
