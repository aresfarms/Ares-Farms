/**
 * ingestNassCropConditions — current corn & soybean condition by state,
 * frozen into a committed snapshot (founder direction 2026-07-17: the
 * regional newsletter must say what's happening to THIS year's crop, in
 * numbers — the story generic industry newsletters skip).
 *
 * Source: USDA NASS QuickStats (quickstats.nass.usda.gov) — public data,
 * FREE owner-registered key (NASS_API_KEY, already provisioned for cash
 * rents). Weekly Crop Progress condition ratings: percent of the crop rated
 * Very Poor / Poor / Fair / Good / Excellent. We keep the latest week per
 * state and derive Good-or-Excellent and Poor-or-Very-Poor shares.
 *
 *   NASS_API_KEY=<key> npm run ingest:nass-crop-conditions
 *
 * Facts, never characterizations — "38% poor-or-very-poor" is the number;
 * the reader draws the conclusion.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/stateCropConditionsGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";
const KEY = process.env.NASS_API_KEY?.trim();
const YEAR = new Date(process.env.NASS_AS_OF ? Date.parse(process.env.NASS_AS_OF) : Date.now()).getFullYear();

interface NassRow {
  state_alpha?: string;
  reference_period_desc?: string; // "WEEK #28"
  short_desc?: string; // "... MEASURED IN PCT GOOD"
  Value?: string;
}

const CATEGORY = (short: string): string | null => {
  if (/PCT VERY POOR/.test(short)) return "veryPoor";
  if (/PCT POOR/.test(short)) return "poor";
  if (/PCT FAIR/.test(short)) return "fair";
  if (/PCT GOOD/.test(short)) return "good";
  if (/PCT EXCELLENT/.test(short)) return "excellent";
  return null;
};

async function fetchCommodity(commodity: string): Promise<NassRow[]> {
  const params = new URLSearchParams({
    key: KEY as string,
    commodity_desc: commodity,
    statisticcat_desc: "CONDITION",
    agg_level_desc: "STATE",
    year: String(YEAR),
    format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`NASS ${commodity} HTTP ${res.status}`);
  const body = (await res.json()) as { data?: NassRow[] };
  return body.data ?? [];
}

function weekNum(desc: string): number {
  const m = desc.match(/#\s*(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** state → {week, cats}. Keeps only the latest week seen per state. */
function reduceLatest(rows: NassRow[]) {
  const byState = new Map<string, { week: number; cats: Record<string, number> }>();
  for (const r of rows) {
    const st = (r.state_alpha ?? "").toUpperCase();
    const cat = CATEGORY(r.short_desc ?? "");
    const val = Number((r.Value ?? "").replace(/,/g, ""));
    const wk = weekNum(r.reference_period_desc ?? "");
    if (!/^[A-Z]{2}$/.test(st) || !cat || !Number.isFinite(val) || wk === 0) continue;
    const cur = byState.get(st);
    if (!cur || wk > cur.week) byState.set(st, { week: wk, cats: { [cat]: val } });
    else if (wk === cur.week) cur.cats[cat] = val;
  }
  return byState;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-crop-conditions ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) {
    console.error("  NASS_API_KEY is required (free: quickstats.nass.usda.gov/api).\n");
    process.exit(1);
  }
  const [corn, soy] = await Promise.all([fetchCommodity("CORN"), fetchCommodity("SOYBEANS")]);
  const cornByState = reduceLatest(corn);
  const soyByState = reduceLatest(soy);
  console.log(`  corn: ${cornByState.size} states · soybeans: ${soyByState.size} states`);

  const states = [...new Set([...cornByState.keys(), ...soyByState.keys()])].sort();
  const shape = (entry?: { week: number; cats: Record<string, number> }) => {
    if (!entry) return null;
    const c = entry.cats;
    const ge = (c.good ?? 0) + (c.excellent ?? 0);
    const pvp = (c.veryPoor ?? 0) + (c.poor ?? 0);
    return { week: entry.week, goodExcellent: Math.round(ge), poorVeryPoor: Math.round(pvp) };
  };
  const entries = states
    .map((st) => {
      const corn = shape(cornByState.get(st));
      const soy = shape(soyByState.get(st));
      if (!corn && !soy) return null;
      return `  ${JSON.stringify(st)}: ${JSON.stringify({ corn, soybeans: soy })},`;
    })
    .filter((e): e is string => e !== null);
  if (entries.length < 10) throw new Error(`Only ${entries.length} states — snapshot NOT overwritten.`);

  const latestWeek = Math.max(
    ...[...cornByState.values(), ...soyByState.values()].map((e) => e.week),
    0
  );
  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * stateCropConditionsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Latest weekly corn & soybean CONDITION ratings by state from USDA NASS
 * Crop Progress. Good-or-Excellent and Poor-or-Very-Poor percent of crop.
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-crop-conditions
 */

export const STATE_CROP_CONDITIONS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS Crop Progress (quickstats.nass.usda.gov)",
  year: ${YEAR},
  latestWeek: ${latestWeek},
  resolvedStates: ${entries.length},
} as const;

export interface CropCondition {
  /** Crop-progress week number. */
  week: number;
  /** Percent of the crop rated Good or Excellent. */
  goodExcellent: number;
  /** Percent of the crop rated Poor or Very Poor. */
  poorVeryPoor: number;
}

export interface StateCropConditions {
  corn: CropCondition | null;
  soybeans: CropCondition | null;
}

export const STATE_CROP_CONDITIONS: Record<string, StateCropConditions> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  ${entries.length} states, week ${latestWeek} → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:nass-crop-conditions FAILED —", error);
  process.exit(1);
});
