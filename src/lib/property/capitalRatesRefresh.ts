/**
 * capitalRatesRefresh — the scheduled market-rate refresh (server-only).
 *
 * Pulls the three keyless FRED public graph CSVs — DPRIME (bank prime, drives
 * SBA 7(a)), DGS5 (5-yr Treasury), and SOFR (both reference the conventional
 * line) — and writes a timestamped overlay to the runtime-state bucket. Runs
 * inside refreshAllSources (the daily source-refresh job), so the displayed
 * rates track the Fed/market without anyone re-ingesting by hand.
 *
 * HARD GUARANTEES:
 *   - Keyless official source (FRED graph CSV); no API key, no scraping.
 *   - One series failing never blanks the others; a total failure leaves the
 *     last-good overlay (or the committed snapshot) in place — never fabricated.
 *   - Values older than the freshness window are dropped by the reader, not here.
 */

import { CapitalRatesLive, writeCapitalRatesLive } from "./capitalRatesLive";

const FRED_CSV = (id: string) =>
  `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;

function parseNum(value: string | undefined): number | null {
  const n = Number((value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Newest usable (date, value) from a FRED graph CSV; "." marks a gap. */
async function fetchFredLatest(
  id: string
): Promise<{ asOf: string; value: number } | null> {
  try {
    const res = await fetch(FRED_CSV(id), {
      headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const lines = (await res.text()).trim().split(/\r?\n/);
    for (let i = lines.length - 1; i > 0; i -= 1) {
      const [rawDate, rawVal] = lines[i].split(",");
      const v = parseNum(rawVal);
      if (v === null) continue;
      return { asOf: (rawDate ?? "").trim(), value: v };
    }
    return null;
  } catch {
    return null;
  }
}

export interface CapitalRatesRefreshResult {
  status: "REFRESHED" | "PARTIAL" | "FAILED";
  prime: number | null;
  treasury5yr: number | null;
  sofr: number | null;
  asOf: string | null;
}

export async function refreshCapitalRates(): Promise<CapitalRatesRefreshResult> {
  const [prime, dgs5, sofr] = await Promise.all([
    fetchFredLatest("DPRIME"),
    fetchFredLatest("DGS5"),
    fetchFredLatest("SOFR"),
  ]);

  const observations = [prime?.asOf, dgs5?.asOf, sofr?.asOf].filter(
    (d): d is string => Boolean(d)
  );
  if (observations.length === 0) {
    return { status: "FAILED", prime: null, treasury5yr: null, sofr: null, asOf: null };
  }

  // Newest observation date across the series we actually got.
  const asOf = observations.sort().at(-1) as string;

  const overlay: CapitalRatesLive = {
    prime: prime?.value ?? null,
    treasury5yr: dgs5?.value ?? null,
    sofr: sofr?.value ?? null,
    asOf,
    fetchedAt: new Date().toISOString(),
    source: "FRED public graph CSV (DPRIME, DGS5, SOFR)",
  };
  writeCapitalRatesLive(overlay);

  const complete = prime && dgs5 && sofr;
  return {
    status: complete ? "REFRESHED" : "PARTIAL",
    prime: overlay.prime,
    treasury5yr: overlay.treasury5yr,
    sofr: overlay.sofr,
    asOf,
  };
}
