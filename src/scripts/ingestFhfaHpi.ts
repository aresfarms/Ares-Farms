/**
 * ingestFhfaHpi — state house-price-index trend factors, frozen into a
 * committed snapshot (founder direction 2026-07-17: listed price vs. county
 * median value, adjusted to today with FHFA's public house-price index —
 * context against published benchmarks, never an appraisal).
 *
 * Source: FHFA House Price Index master file (fhfa.gov) — U.S. Government
 * work, public, NO KEY REQUIRED. We keep the "traditional / all-transactions
 * / quarterly / State" series and compute, per state, the factor from the
 * 2023 annual average (the ACS B25077 vintage) to the latest quarter — the
 * multiplier that walks a 2023 county median forward to today.
 *
 *   npm run ingest:fhfa-hpi
 *
 * State TRENDS only — the county median is county-level; only the adjustment
 * trend is state-level, and every rendering surface says so.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/stateHpiGenerated.ts");
const CSV_URL = "https://www.fhfa.gov/hpi/download/monthly/hpi_master.csv";
/** Must match the ACS vintage used by countyTaxContextGenerated (B25077). */
const BASE_YEAR = 2023;

const unquote = (cell: string): string => cell.replace(/^"|"$/g, "");

async function main(): Promise<void> {
  console.log("\n━━━ ingest:fhfa-hpi ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`FHFA HPI master HTTP ${res.status}`);
  const csv = await res.text();

  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0]?.split(",").map((cell) => unquote(cell).trim().toLowerCase()) ?? [];
  const col = (name: string) => header.indexOf(name);
  const [typeC, flavorC, freqC, levelC, placeC, yrC, periodC, nsaC] = [
    col("hpi_type"), col("hpi_flavor"), col("frequency"), col("level"),
    col("place_id"), col("yr"), col("period"), col("index_nsa"),
  ];
  if ([typeC, flavorC, freqC, levelC, placeC, yrC, periodC, nsaC].some((i) => i < 0)) {
    throw new Error(`FHFA CSV header changed (${header.join(",")}) — snapshot NOT overwritten.`);
  }

  // state → {baseSum, baseCount, latest, thirtyYearsAgo} — the 30-year-ago
  // index anchors the long-run CAGR used by the equity-outlook scenarios.
  const byState = new Map<string, {
    baseSum: number; baseCount: number;
    latestYr: number; latestPeriod: number; latestIndex: number;
    oldYr: number; oldPeriod: number; oldIndex: number;
    recentQuarterly: Record<string, number>;
  }>();
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(",");
    if (unquote(cells[levelC]) !== "State") continue;
    if (unquote(cells[typeC]) !== "traditional") continue;
    if (unquote(cells[flavorC]) !== "all-transactions") continue;
    if (unquote(cells[freqC]) !== "quarterly") continue;
    const state = unquote(cells[placeC]).toUpperCase();
    const yr = Number(cells[yrC]);
    const period = Number(cells[periodC]);
    const index = Number(cells[nsaC]);
    if (!/^[A-Z]{2}$/.test(state) || !Number.isFinite(index) || index <= 0) continue;
    const entry = byState.get(state) ?? {
      baseSum: 0, baseCount: 0,
      latestYr: 0, latestPeriod: 0, latestIndex: 0,
      oldYr: 0, oldPeriod: 0, oldIndex: 0,
      recentQuarterly: {},
    };
    if (yr === BASE_YEAR) {
      entry.baseSum += index;
      entry.baseCount += 1;
    }
    if (yr >= 2020) {
      entry.recentQuarterly[`${yr}Q${period}`] = index;
    }
    if (yr > entry.latestYr || (yr === entry.latestYr && period > entry.latestPeriod)) {
      entry.latestYr = yr;
      entry.latestPeriod = period;
      entry.latestIndex = index;
    }
    byState.set(state, entry);
  }

  // Second pass: the index closest to 30 years before each state's latest.
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(",");
    if (unquote(cells[levelC]) !== "State") continue;
    if (unquote(cells[typeC]) !== "traditional") continue;
    if (unquote(cells[flavorC]) !== "all-transactions") continue;
    if (unquote(cells[freqC]) !== "quarterly") continue;
    const state = unquote(cells[placeC]).toUpperCase();
    const entry = byState.get(state);
    if (!entry) continue;
    const yr = Number(cells[yrC]);
    const period = Number(cells[periodC]);
    const index = Number(cells[nsaC]);
    if (!Number.isFinite(index) || index <= 0) continue;
    const targetYr = entry.latestYr - 30;
    const distance = Math.abs((yr + period / 4) - (targetYr + entry.latestPeriod / 4));
    const bestDistance = entry.oldIndex > 0
      ? Math.abs((entry.oldYr + entry.oldPeriod / 4) - (targetYr + entry.latestPeriod / 4))
      : Infinity;
    if (distance < bestDistance) {
      entry.oldYr = yr;
      entry.oldPeriod = period;
      entry.oldIndex = index;
    }
  }

  const entries = [...byState.entries()]
    .filter(([, e]) => e.baseCount > 0 && e.latestIndex > 0 && e.latestYr >= BASE_YEAR && e.oldIndex > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([state, e]) => {
      const factor = Number((e.latestIndex / (e.baseSum / e.baseCount)).toFixed(4));
      const spanYears = (e.latestYr + e.latestPeriod / 4) - (e.oldYr + e.oldPeriod / 4);
      const longRunAnnualPct = Number(
        ((Math.pow(e.latestIndex / e.oldIndex, 1 / spanYears) - 1) * 100).toFixed(2)
      );
      const recentQuarterly = Object.fromEntries(
        Object.entries(e.recentQuarterly).sort(([a], [b]) => a.localeCompare(b))
      );
      return `  ${JSON.stringify(state)}: ${JSON.stringify({
        factorSinceBase: factor,
        latestQuarter: `${e.latestYr}Q${e.latestPeriod}`,
        latestIndex: Number(e.latestIndex.toFixed(4)),
        recentQuarterly,
        longRunAnnualPct,
        longRunSpanYears: Math.round(spanYears),
      })},`;
    });
  if (entries.length < 45) {
    throw new Error(`Only ${entries.length} states resolved — snapshot NOT overwritten.`);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * stateHpiGenerated — GENERATED FILE. Do not edit by hand.
 *
 * State house-price trend factors from the FHFA House Price Index
 * (traditional, all-transactions, quarterly). factorSinceBase multiplies a
 * ${BASE_YEAR} dollar value forward to the latest quarter. State TRENDS only.
 * Re-run: npm run ingest:fhfa-hpi
 */

export const STATE_HPI_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "FHFA House Price Index master file (fhfa.gov)",
  baseYear: ${BASE_YEAR},
  resolvedStates: ${entries.length},
} as const;

export interface StateHpi {
  /** Multiply a ${BASE_YEAR} dollar value by this to walk it to the latest quarter. */
  factorSinceBase: number;
  /** Latest quarter in the series, e.g. "2026Q2". */
  latestQuarter: string;
  /** Raw latest state index value, used for date-aligned residential walk-forward. */
  latestIndex: number;
  /** Recent quarterly state index values. Residential valuation uses an exact
      quarter from this map rather than a long-run CAGR bridge. */
  recentQuarterly: Record<string, number>;
  /** The state's PUBLISHED long-run annualized price change, percent —
      basis for equity-outlook scenarios (history, never a prediction). */
  longRunAnnualPct: number;
  /** Years the long-run rate spans (~30). */
  longRunSpanYears: number;
}

export const STATE_HPI: Record<string, StateHpi> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} states (base ${BASE_YEAR}) → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:fhfa-hpi FAILED —", error);
  process.exit(1);
});
