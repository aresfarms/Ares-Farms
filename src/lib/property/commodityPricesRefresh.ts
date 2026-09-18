/**
 * commodityPricesRefresh — scheduled grain + livestock price refresh (server-only).
 *
 * Pulls USDA NASS "price received" (corn/soy/wheat $/bu; cattle/hogs/milk $/cwt)
 * and writes a timestamped overlay to the runtime-state bucket. Runs inside
 * refreshAllSources (the daily source-refresh job), so the market tiles track
 * USDA without anyone re-ingesting by hand.
 *
 * HARD GUARANTEES:
 *   - Needs NASS_API_KEY in the job environment (free public-data key). Without
 *     it, or on total failure, the overlay is NOT written — the committed snapshot
 *     stays; numbers are never fabricated.
 *   - USDA "price received" is a monthly/marketing-year AVERAGE, not futures —
 *     it refreshes on USDA's cadence, not in real time.
 */

import type { CommodityPrice } from "./commodityPricesGenerated";
import type { LivestockPrice } from "./livestockPricesGenerated";
import { CommodityPricesLive, writeCommodityPricesLive } from "./commodityPricesLive";

const API = "https://quickstats.nass.usda.gov/api/api_GET/";
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

interface NassRow { reference_period_desc?: string; unit_desc?: string; Value?: string }

async function latest(
  key: string,
  commodity: string,
  unitNeedle: string,
  year: number
): Promise<{ month: string; year: number; value: number } | null> {
  const params = new URLSearchParams({
    key, commodity_desc: commodity, statisticcat_desc: "PRICE RECEIVED",
    agg_level_desc: "NATIONAL", year: String(year), format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(30000) }).catch(() => null);
  if (!res || !res.ok) return null;
  const rows = ((await res.json()) as { data?: NassRow[] }).data ?? [];
  let best: { rank: number; month: string; value: number } | null = null;
  for (const r of rows) {
    const unit = (r.unit_desc ?? "").toUpperCase();
    if (unit && !unit.includes(unitNeedle)) continue;
    const value = Number((r.Value ?? "").replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    const per = (r.reference_period_desc ?? "").trim().toUpperCase();
    const mi = MONTHS.indexOf(per);
    const rank = mi >= 0 ? mi : per.includes("YEAR") ? 11 : -1;
    if (!best || rank > best.rank) best = { rank, month: mi >= 0 ? per : String(year), value };
  }
  return best ? { month: best.month, year, value: best.value } : null;
}

async function latestBackfilled(key: string, commodity: string, unit: string, year: number) {
  return (await latest(key, commodity, unit, year)) ?? (await latest(key, commodity, unit, year - 1));
}

export interface CommodityPricesRefreshResult {
  status: "REFRESHED" | "PARTIAL" | "SKIPPED" | "FAILED";
  grain: number;
  livestock: number;
}

export async function refreshCommodityPrices(): Promise<CommodityPricesRefreshResult> {
  const key = process.env.NASS_API_KEY?.trim();
  if (!key) return { status: "SKIPPED", grain: 0, livestock: 0 };

  const year = new Date().getUTCFullYear();
  const grainDefs: Array<[string, string]> = [["CORN", "corn"], ["SOYBEANS", "soybeans"], ["WHEAT", "wheat"]];
  const stockDefs: Array<[string, string]> = [["CATTLE", "cattle"], ["HOGS", "hogs"], ["MILK", "milk"]];

  const grain: Record<string, CommodityPrice> = {};
  for (const [nass, k] of grainDefs) {
    const p = await latestBackfilled(key, nass, "BU", year);
    if (p) grain[k] = { month: p.month, year: p.year, pricePerBushel: p.value };
  }
  const livestock: Record<string, LivestockPrice> = {};
  for (const [nass, k] of stockDefs) {
    const p = await latestBackfilled(key, nass, "CWT", year);
    if (p) livestock[k] = { month: p.month, year: p.year, pricePerCwt: p.value };
  }

  if (Object.keys(grain).length === 0 && Object.keys(livestock).length === 0) {
    return { status: "FAILED", grain: 0, livestock: 0 };
  }

  const overlay: CommodityPricesLive = {
    grain,
    livestock,
    fetchedAt: new Date().toISOString(),
    source: "USDA NASS QuickStats — Price Received (quickstats.nass.usda.gov)",
  };
  writeCommodityPricesLive(overlay);

  const complete = Object.keys(grain).length === 3 && Object.keys(livestock).length === 3;
  return {
    status: complete ? "REFRESHED" : "PARTIAL",
    grain: Object.keys(grain).length,
    livestock: Object.keys(livestock).length,
  };
}
