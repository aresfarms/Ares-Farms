/**
 * ingestNassFarmland — farm real-estate values ($/acre) by state, frozen into
 * a committed snapshot (founder correction 2026-07-17: farmers don't read home
 * prices — the value benchmark for farmland is USDA's ag-land survey).
 *
 * Source: USDA NASS QuickStats — Ag Land, Incl Buildings, Asset Value,
 * $/acre, by state, annual. Public data, FREE owner NASS key. Keeps the two
 * most recent years so the newsletter can show the year-over-year change.
 *
 *   NASS_API_KEY=<key> npm run ingest:nass-farmland
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/stateFarmlandGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";
const KEY = process.env.NASS_API_KEY?.trim();
const YEAR = new Date(process.env.NASS_AS_OF ? Date.parse(process.env.NASS_AS_OF) : Date.now()).getFullYear();

interface NassRow { state_alpha?: string; year?: string | number; unit_desc?: string; short_desc?: string; Value?: string }

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-farmland ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) { console.error("  NASS_API_KEY required (free: quickstats.nass.usda.gov/api).\n"); process.exit(1); }
  const params = new URLSearchParams({
    key: KEY, sector_desc: "ECONOMICS", commodity_desc: "AG LAND",
    statisticcat_desc: "ASSET VALUE", agg_level_desc: "STATE", format: "JSON",
  });
  params.append("year__GE", String(YEAR - 3));
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`NASS farmland HTTP ${res.status}`);
  const rows = ((await res.json()) as { data?: NassRow[] }).data ?? [];

  // state → year → $/acre (real estate = "INCL BUILDINGS").
  const byState = new Map<string, Map<number, number>>();
  for (const r of rows) {
    if (!/\$ ?\/ ?ACRE/i.test(r.unit_desc ?? "")) continue;
    if (!/INCL BUILDINGS/i.test(r.short_desc ?? "")) continue;
    const st = (r.state_alpha ?? "").toUpperCase();
    const yr = Number(r.year);
    const val = Number((r.Value ?? "").replace(/,/g, ""));
    if (!/^[A-Z]{2}$/.test(st) || !Number.isFinite(yr) || !Number.isFinite(val) || val <= 0) continue;
    const m = byState.get(st) ?? new Map<number, number>();
    m.set(yr, val);
    byState.set(st, m);
  }

  const entries = [...byState.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([st, years]) => {
      const sorted = [...years.entries()].sort(([a], [b]) => b - a);
      const [latestYear, latest] = sorted[0];
      const prior = sorted[1];
      const yoyPct = prior ? Number((((latest - prior[1]) / prior[1]) * 100).toFixed(1)) : null;
      return `  ${JSON.stringify(st)}: ${JSON.stringify({ year: latestYear, dollarsPerAcre: latest, yoyPct })},`;
    });
  if (entries.length < 30) throw new Error(`Only ${entries.length} states — snapshot NOT overwritten.`);

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * stateFarmlandGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Farm real-estate value ($/acre, land + buildings) by state from USDA NASS,
 * with year-over-year change. Re-run: NASS_API_KEY=<key> npm run ingest:nass-farmland
 */

export const STATE_FARMLAND_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS — Ag Land Asset Value ($/acre)",
  resolvedStates: ${entries.length},
} as const;

export interface StateFarmland {
  year: number;
  /** Average farm real-estate value, dollars per acre (land + buildings). */
  dollarsPerAcre: number;
  /** Year-over-year change, percent (null if no prior year). */
  yoyPct: number | null;
}

export const STATE_FARMLAND: Record<string, StateFarmland> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} states → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:nass-farmland FAILED —", error);
  process.exit(1);
});
