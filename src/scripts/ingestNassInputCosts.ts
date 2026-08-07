/**
 * ingestNassInputCosts — farm input cost trend (fertilizer, seed, fuel, feed),
 * frozen into a committed snapshot (founder direction 2026-07-17: seed and
 * fertilizer costs for next year belong in the newsletter's end-of-year
 * planning).
 *
 * Source: USDA NASS Prices Paid indexes (2011 = 100), national. Public data,
 * FREE owner NASS key. Latest vs prior year gives the year-over-year move —
 * the direction of next season's input budget.
 *
 *   NASS_API_KEY=<key> npm run ingest:nass-input-costs
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/inputCostsGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";
const KEY = process.env.NASS_API_KEY?.trim();

const COMMODITIES: Array<[string, string]> = [
  ["FERTILIZER TOTALS", "fertilizer"], ["SEEDS & PLANTS TOTALS", "seed"],
  ["FUELS", "fuel"], ["FEED", "feed"], ["CHEMICAL TOTALS", "chemicals"],
];

interface NassRow { commodity_desc?: string; year?: string | number; reference_period_desc?: string; unit_desc?: string; Value?: string }

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-input-costs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) { console.error("  NASS_API_KEY required.\n"); process.exit(1); }
  const params = new URLSearchParams({
    key: KEY, sector_desc: "ECONOMICS", group_desc: "PRICES PAID", agg_level_desc: "NATIONAL", format: "JSON",
  });
  params.append("year__GE", String(new Date().getFullYear() - 3));
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`NASS Prices Paid HTTP ${res.status}`);
  const rows = ((await res.json()) as { data?: NassRow[] }).data ?? [];

  const num = (v?: string) => Number((v ?? "").replace(/,/g, ""));
  const out: Record<string, { index: number; year: number; period: string; yoyPct: number | null }> = {};
  for (const [nass, key] of COMMODITIES) {
    const idx = rows.filter((r) => r.commodity_desc === nass && /INDEX/i.test(r.unit_desc ?? "") && Number.isFinite(num(r.Value)));
    if (idx.length === 0) continue;
    idx.sort((a, b) => (Number(b.year) - Number(a.year)) || (b.reference_period_desc ?? "").localeCompare(a.reference_period_desc ?? ""));
    const latest = idx[0];
    const prior = idx.find((r) => Number(r.year) === Number(latest.year) - 1 && r.reference_period_desc === latest.reference_period_desc);
    const v = num(latest.Value);
    const yoy = prior ? Number((((v - num(prior.Value)) / num(prior.Value)) * 100).toFixed(1)) : null;
    out[key] = { index: Number(v.toFixed(1)), year: Number(latest.year), period: latest.reference_period_desc ?? "", yoyPct: yoy };
    console.log(`  ${key}: index ${v} (${latest.reference_period_desc} ${latest.year})${yoy != null ? `, ${yoy >= 0 ? "+" : ""}${yoy}% YoY` : ""}`);
  }
  if (Object.keys(out).length === 0) throw new Error("No input costs resolved — snapshot NOT overwritten.");

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * inputCostsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Farm input cost indexes (USDA NASS Prices Paid, 2011 = 100) with
 * year-over-year change. Re-run: NASS_API_KEY=<key> npm run ingest:nass-input-costs
 */

export const INPUT_COSTS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS Prices Paid indexes (2011=100)",
} as const;

export interface InputCost {
  /** Price-paid index, 2011 = 100. */
  index: number;
  year: number;
  period: string;
  /** Year-over-year change, percent (null if no prior year). */
  yoyPct: number | null;
}

export const INPUT_COSTS: Record<string, InputCost> = ${JSON.stringify(out, null, 2)};
`,
    "utf8"
  );
  console.log(`  wrote ${Object.keys(out).length} inputs → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => { console.error("ingest:nass-input-costs FAILED —", error); process.exit(1); });
