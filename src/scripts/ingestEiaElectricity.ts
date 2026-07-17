/**
 * ingestEiaElectricity — state-average electricity prices and typical
 * residential bills, frozen into a committed snapshot (founder direction
 * 2026-07-17: buyers should see how cheap or expensive power runs in an
 * area before they commit).
 *
 * Source: U.S. Energy Information Administration API v2 (public domain).
 * Requires a FREE key: eia.gov/opendata/register.php (immediate, emailed).
 *
 *   EIA_API_KEY=<key> npm run ingest:eia-electricity
 *
 * Method mirrors EIA's own Table 5.a: average monthly residential bill =
 * annual residential revenue / residential customers / 12. State AVERAGES
 * only — the serving utility's tariff decides actuals.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/stateElectricityGenerated.ts");
const API = "https://api.eia.gov/v2/electricity/retail-sales/data/";
const KEY = process.env.EIA_API_KEY?.trim();

interface EiaRow {
  period?: string;
  stateid?: string;
  sectorid?: string;
  price?: number | string | null;
  customers?: number | string | null;
  revenue?: number | string | null;
}

const STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
]);

async function fetchYear(year: number): Promise<EiaRow[]> {
  const params = new URLSearchParams({
    api_key: KEY as string,
    frequency: "annual",
    start: String(year),
    end: String(year),
    length: "5000",
  });
  for (const dataCol of ["price", "customers", "revenue"]) params.append("data[]", dataCol);
  for (const sector of ["RES", "COM"]) params.append("facets[sectorid][]", sector);
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`EIA API HTTP ${res.status}`);
  const body = (await res.json()) as { response?: { data?: EiaRow[] } };
  return body.response?.data ?? [];
}

const num = (value: number | string | null | undefined): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function main(): Promise<void> {
  console.log("\n━━━ ingest:eia-electricity ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) {
    console.error(
      "  EIA_API_KEY is not set. Get a FREE key at eia.gov/opendata/register.php\n" +
      "  then run:  EIA_API_KEY=<key> npm run ingest:eia-electricity\n"
    );
    process.exit(1);
  }

  // Walk back from last year until a complete annual dataset appears.
  let rows: EiaRow[] = [];
  let usedYear: number | null = null;
  for (let year = new Date().getFullYear() - 1; year >= new Date().getFullYear() - 4; year -= 1) {
    rows = await fetchYear(year).catch((error) => {
      console.error(`  ${year}: ${error instanceof Error ? error.message : "failed"}`);
      return [];
    });
    if (rows.length > 50) {
      usedYear = year;
      console.log(`  ${rows.length} rows (${year})`);
      break;
    }
  }
  if (!usedYear) {
    console.error("  No usable annual data returned — snapshot NOT overwritten.");
    process.exit(1);
  }

  const byState = new Map<string, { resPrice: number | null; resBill: number | null; comPrice: number | null }>();
  for (const row of rows) {
    const state = (row.stateid ?? "").toUpperCase();
    if (!STATE_CODES.has(state)) continue;
    const entry = byState.get(state) ?? { resPrice: null, resBill: null, comPrice: null };
    if (row.sectorid === "RES") {
      entry.resPrice = num(row.price);
      const revenue = num(row.revenue); // million dollars
      const customers = num(row.customers);
      entry.resBill = revenue && customers ? Math.round((revenue * 1_000_000) / customers / 12) : null;
    } else if (row.sectorid === "COM") {
      entry.comPrice = num(row.price);
    }
    byState.set(state, entry);
  }

  const entries = [...byState.entries()]
    .filter(([, e]) => e.resPrice !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([state, e]) =>
      `  ${JSON.stringify(state)}: ${JSON.stringify({
        resPriceCentsKwh: e.resPrice,
        resAvgMonthlyBill: e.resBill,
        comPriceCentsKwh: e.comPrice,
      })},`
    );

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * stateElectricityGenerated — GENERATED FILE. Do not edit by hand.
 *
 * State-average electricity prices and typical residential bills from the
 * U.S. Energy Information Administration (EIA) — public domain. State
 * AVERAGES only; the serving utility's tariff decides actuals.
 * Re-run: EIA_API_KEY=<key> npm run ingest:eia-electricity
 */

export const STATE_ELECTRICITY_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "U.S. EIA electricity retail sales (api.eia.gov)",
  year: ${usedYear} as number | null,
  resolvedStates: ${entries.length},
} as const;

export interface StateElectricity {
  /** Average residential price, cents/kWh. */
  resPriceCentsKwh: number;
  /** Average residential monthly bill, dollars (revenue / customers / 12). */
  resAvgMonthlyBill: number | null;
  /** Average commercial price, cents/kWh. */
  comPriceCentsKwh: number | null;
}

export const STATE_ELECTRICITY: Record<string, StateElectricity> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} states (${usedYear}) → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:eia-electricity FAILED —", error);
  process.exit(1);
});
