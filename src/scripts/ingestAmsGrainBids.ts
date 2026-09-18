/**
 * ingestAmsGrainBids — current LOCAL grain-buyer cash bids by state, frozen
 * into a committed snapshot (founder direction 2026-07-17: add the daily grain
 * buying prices — public record for the major grain buyers in the region).
 *
 * Source: USDA AMS Market News (MARS API, marsapi.ams.usda.gov) — public
 * record, FREE owner-registered key (MARS_API_KEY). Each state's daily/weekly
 * grain-bid report gives the average local cash bid, range, and day-over-day
 * direction for corn, soybeans, and wheat — the number the region's elevators
 * are actually paying.
 *
 *   MARS_API_KEY=<key> npm run ingest:ams-grain-bids
 *
 * Public price observations — the exact bid is your buyer's board.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/stateGrainBidsGenerated.ts");
const API = "https://marsapi.ams.usda.gov/services/v1.2";
const KEY = process.env.MARS_API_KEY?.trim();

// State grain-bid report slugs (MARS). Delmarva/Mid-Atlantic first, then majors.
const REPORTS: Record<string, string> = {
  MD: "2714", PA: "3091", VA: "3088-va", OH: "2851", KY: "2892", TN: "3088",
  IA: "2850", KS: "2886", MO: "2932", AR: "2960", MS: "2928", SC: "2787",
  OK: "3100", TX: "2711", CO: "2912",
};

interface DetailRow {
  commodity?: string; price_unit?: string; report_date?: string;
  avg_price?: number | string | null;
  "price Min"?: number | string | null; "price Max"?: number | string | null;
  "price Max Direction"?: string | null;
}

function auth(): string {
  return "Basic " + Buffer.from(`${KEY}:`).toString("base64");
}

async function recentDates(slug: string): Promise<string[]> {
  const res = await fetch(`${API}/reports/${slug}`, { headers: { Authorization: auth() }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) return [];
  const body = (await res.json()) as { results?: Array<{ report_date?: string }> } | Array<{ report_date?: string }>;
  const rows = Array.isArray(body) ? body : body.results ?? [];
  const parse = (s?: string) => {
    const m = (s ?? "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? `${m[3]}-${m[1]}-${m[2]}` : "";
  };
  return [...new Set(rows.map((r) => r.report_date).filter(Boolean) as string[])]
    .sort((a, b) => (parse(b) < parse(a) ? -1 : 1))
    .slice(0, 6);
}

async function detailFor(slug: string, date: string): Promise<DetailRow[]> {
  const url = `${API}/reports/${slug}/Report%20Detail?q=report_date=${encodeURIComponent(date)}`;
  const res = await fetch(url, { headers: { Authorization: auth() }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) return [];
  const body = (await res.json()) as { results?: DetailRow[] };
  return (body.results ?? []).filter((r) => /bushel/i.test(r.price_unit ?? ""));
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function main(): Promise<void> {
  console.log("\n━━━ ingest:ams-grain-bids ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) { console.error("  MARS_API_KEY required (free: marsapi.ams.usda.gov, register).\n"); process.exit(1); }

  const out: Record<string, { reportDate: string; bids: Record<string, { avg: number; min: number | null; max: number | null; direction: string | null }> }> = {};
  for (const [state, slug] of Object.entries(REPORTS)) {
    try {
      const dates = await recentDates(slug);
      let picked: { date: string; rows: DetailRow[] } | null = null;
      for (const d of dates) {
        const rows = await detailFor(slug, d);
        if (rows.length > 0) { picked = { date: d, rows }; break; }
      }
      if (!picked) continue;
      // Average the local bids per commodity across the report's markets.
      const byCommodity = new Map<string, { avgs: number[]; mins: number[]; maxs: number[]; dir: string | null }>();
      for (const r of picked.rows) {
        const c = (r.commodity ?? "").toLowerCase();
        const key = /soybean/.test(c) ? "soybeans" : /wheat/.test(c) ? "wheat" : /corn/.test(c) ? "corn" : null;
        if (!key) continue;
        const avg = num(r.avg_price) ?? num(r["price Min"]);
        if (avg === null) continue;
        const agg = byCommodity.get(key) ?? { avgs: [], mins: [], maxs: [], dir: null };
        agg.avgs.push(avg);
        const mn = num(r["price Min"]); if (mn !== null) agg.mins.push(mn);
        const mx = num(r["price Max"]); if (mx !== null) agg.maxs.push(mx);
        if (!agg.dir && r["price Max Direction"]) agg.dir = r["price Max Direction"] as string;
        byCommodity.set(key, agg);
      }
      const bids: Record<string, { avg: number; min: number | null; max: number | null; direction: string | null }> = {};
      for (const [k, a] of byCommodity) {
        if (a.avgs.length === 0) continue;
        bids[k] = {
          avg: Number((a.avgs.reduce((x, y) => x + y, 0) / a.avgs.length).toFixed(2)),
          min: a.mins.length ? Number(Math.min(...a.mins).toFixed(2)) : null,
          max: a.maxs.length ? Number(Math.max(...a.maxs).toFixed(2)) : null,
          direction: a.dir,
        };
      }
      if (Object.keys(bids).length > 0) {
        out[state] = { reportDate: picked.date, bids };
        console.log(`  ${state}: ${Object.entries(bids).map(([k, b]) => `${k} $${b.avg}`).join(" · ")} (${picked.date})`);
      }
    } catch (error) {
      console.error(`  ${state}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  if (Object.keys(out).length === 0) throw new Error("No grain bids resolved — snapshot NOT overwritten.");

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * stateGrainBidsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Local grain-buyer cash bids by state from USDA AMS Market News (public
 * record). Average local bid, range, and day-over-day direction, $/bushel.
 * Re-run: MARS_API_KEY=<key> npm run ingest:ams-grain-bids
 */

export const STATE_GRAIN_BIDS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA AMS Market News (marsapi.ams.usda.gov)",
  resolvedStates: ${Object.keys(out).length},
} as const;

export interface GrainBid {
  /** Average local cash bid, $/bushel. */
  avg: number;
  min: number | null;
  max: number | null;
  /** Day-over-day direction: "UP" | "DOWN" | "UNCH" | null. */
  direction: string | null;
}

export interface StateGrainBids {
  /** Report date, YYYY-MM-DD. */
  reportDate: string;
  bids: Record<string, GrainBid>;
}

export const STATE_GRAIN_BIDS: Record<string, StateGrainBids> = ${JSON.stringify(out, null, 2)};
`,
    "utf8"
  );
  console.log(`  wrote ${Object.keys(out).length} states → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:ams-grain-bids FAILED —", error);
  process.exit(1);
});
