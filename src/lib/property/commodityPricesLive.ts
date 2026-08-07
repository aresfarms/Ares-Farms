/**
 * commodityPricesLive — runtime-state overlay for grain + livestock prices.
 *
 * The scheduled source-refresh job writes the newest USDA NASS figures here into
 * the runtime-state bucket; the app reads them at request time (sync read of the
 * mounted volume, same as capitalRatesLive). So the market tiles update on their
 * own as USDA publishes — no hand re-ingest. If the overlay is missing, stale, or
 * unparseable, the readers fall back to the committed snapshot; a number is never
 * fabricated or blanked.
 *
 * HONESTY: this is USDA "price received" (a monthly/marketing-year national
 * AVERAGE), NOT exchange futures — so it refreshes on USDA's cadence, it does not
 * tick in real time. Freshness is keyed on WHEN THE REFRESH LAST RAN (fetchedAt),
 * not the data date, because USDA figures legitimately lag by weeks/months.
 */

import * as fs from "node:fs";

import { runtimeStatePath } from "./runtimeStatePath";
import { COMMODITY_PRICES, type CommodityPrice } from "./commodityPricesGenerated";
import { LIVESTOCK_PRICES, type LivestockPrice } from "./livestockPricesGenerated";

const LIVE_PATH = runtimeStatePath("commodity-prices-live.json");

/** Trust the overlay only if the refresh ran within this many days. */
const MAX_REFRESH_AGE_DAYS = 21;

export interface CommodityPricesLive {
  grain: Record<string, CommodityPrice>;
  livestock: Record<string, LivestockPrice>;
  /** When the refresh wrote this overlay (ISO). */
  fetchedAt: string;
  source: string;
}

export function readCommodityPricesLive(): CommodityPricesLive | null {
  try {
    const raw = fs.readFileSync(LIVE_PATH, "utf8");
    const data = JSON.parse(raw) as CommodityPricesLive;
    if (!data || typeof data.fetchedAt !== "string" || !data.grain) return null;
    const ageDays = Math.round((Date.now() - new Date(data.fetchedAt).getTime()) / 86_400_000);
    if (!Number.isFinite(ageDays) || ageDays > MAX_REFRESH_AGE_DAYS) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeCommodityPricesLive(data: CommodityPricesLive): void {
  fs.writeFileSync(LIVE_PATH, JSON.stringify(data, null, 2), "utf8");
}

/** Grain prices — the fresh daily overlay when present, else the committed snapshot. */
export function buildCommodityPrices(): Record<string, CommodityPrice> {
  const live = readCommodityPricesLive();
  return live && Object.keys(live.grain).length > 0 ? live.grain : COMMODITY_PRICES;
}

/** Livestock prices — the fresh daily overlay when present, else the committed snapshot. */
export function buildLivestockPrices(): Record<string, LivestockPrice> {
  const live = readCommodityPricesLive();
  return live && Object.keys(live.livestock).length > 0 ? live.livestock : LIVESTOCK_PRICES;
}
