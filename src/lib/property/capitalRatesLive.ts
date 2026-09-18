/**
 * capitalRatesLive — the runtime-state overlay for market-driven capital rates.
 *
 * The scheduled source-refresh job writes the latest FRED figures here (prime,
 * 5-yr Treasury, SOFR) into the runtime-state bucket; the app reads them at
 * request time with a SYNC read (the bucket is a mounted volume, same pattern as
 * liveOverlay). If the file is missing, unparseable, or stale, read returns null
 * and callers fall back to the committed snapshot — the rate is never fabricated
 * or shown blank.
 *
 * This is how "rates update automatically when the Fed/market moves" works while
 * staying replay-safe: each refresh writes a timestamped overlay; the committed
 * snapshot is the deterministic floor.
 */

import * as fs from "node:fs";

import { runtimeStatePath } from "./runtimeStatePath";

const LIVE_PATH = runtimeStatePath("capital-rates-live.json");

/** Overlay is trusted only if its newest observation is within this window. */
const MAX_AGE_DAYS = 45;

export interface CapitalRatesLive {
  /** US bank prime loan rate, percent (FRED DPRIME). */
  prime: number | null;
  /** 5-year Treasury constant maturity, percent (FRED DGS5). */
  treasury5yr: number | null;
  /** Secured Overnight Financing Rate, percent (FRED SOFR). */
  sofr: number | null;
  /** Newest observation date across the series (YYYY-MM-DD). */
  asOf: string;
  /** When the refresh wrote this overlay (ISO). */
  fetchedAt: string;
  source: string;
}

export function readCapitalRatesLive(): CapitalRatesLive | null {
  try {
    const raw = fs.readFileSync(LIVE_PATH, "utf8");
    const data = JSON.parse(raw) as CapitalRatesLive;
    if (!data || typeof data.asOf !== "string") return null;
    const ageDays = Math.round(
      (Date.now() - new Date(data.asOf).getTime()) / 86_400_000
    );
    if (!Number.isFinite(ageDays) || ageDays > MAX_AGE_DAYS) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeCapitalRatesLive(data: CapitalRatesLive): void {
  fs.writeFileSync(LIVE_PATH, JSON.stringify(data, null, 2), "utf8");
}
