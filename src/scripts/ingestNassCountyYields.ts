/**
 * ingestNassCountyYields — county-average CROP YIELDS (corn / soybeans / wheat,
 * bu/acre), frozen into a committed snapshot for the property best-use engine
 * (founder direction 2026-07-20: a county productivity benchmark to sit alongside
 * cash rent + soil in the PARCEL analysis — analysis only, NOT the market listing).
 *
 * Source: USDA NASS Quick Stats API (Survey, county yields) — public domain.
 * FREE key: quickstats.nass.usda.gov/api (immediate, emailed). Same key as the
 * grain / cash-rent / livestock ingests. Owner-run governed ingest:
 *
 *   npm run ingest:nass-county-yields          (paste the key when prompted)
 *   NASS_API_KEY=<key> npm run ingest:nass-county-yields
 *
 * Honest-context discipline: county AVERAGES only — a benchmark to underwrite
 * against, never a parcel yield guarantee, an appraisal, or an offer. All three
 * crops share one survey year so the snapshot never mixes drought/bumper years.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyYieldsGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";

let KEY = process.env.NASS_API_KEY?.trim();

/** Prompt for the NASS key in the terminal (VISIBLE — a free public-data key,
    not a secret; showing it lets you confirm it pasted correctly). */
function promptForKey(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("  Paste your USDA NASS API key (free at quickstats.nass.usda.gov/api) and press Enter:\n  > ", (answer) => {
      rl.close();
      resolve(answer.replace(/\s+/g, "").trim());
    });
  });
}

const CROPS: { field: "corn" | "soybeans" | "wheat"; shortDesc: string }[] = [
  { field: "corn", shortDesc: "CORN, GRAIN - YIELD, MEASURED IN BU / ACRE" },
  { field: "soybeans", shortDesc: "SOYBEANS - YIELD, MEASURED IN BU / ACRE" },
  { field: "wheat", shortDesc: "WHEAT - YIELD, MEASURED IN BU / ACRE" },
];

interface QsRow {
  state_fips_code?: string;
  county_code?: string;
  Value?: string;
}

async function fetchSeries(shortDesc: string, year: number): Promise<QsRow[] | null> {
  const params = new URLSearchParams({
    key: KEY as string,
    source_desc: "SURVEY",
    sector_desc: "CROPS",
    short_desc: shortDesc,
    agg_level_desc: "COUNTY",
    year: String(year),
    format: "JSON",
  });
  const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(120000) });
  if (res.status === 400) return null; // no data for that year
  if (!res.ok) throw new Error(`NASS API HTTP ${res.status} for ${shortDesc} ${year}`);
  const body = (await res.json()) as { data?: QsRow[] };
  return body.data ?? null;
}

/** Fold county rows into the accumulator for one crop field. Returns row count. */
function absorb(
  rows: QsRow[] | null,
  field: "corn" | "soybeans" | "wheat",
  acc: Map<string, { corn: number | null; soybeans: number | null; wheat: number | null }>,
): number {
  let n = 0;
  for (const row of rows ?? []) {
    const state = (row.state_fips_code ?? "").padStart(2, "0");
    const county = (row.county_code ?? "").padStart(3, "0");
    if (!/^\d{2}$/.test(state) || !/^\d{3}$/.test(county) || county === "998") continue;
    const value = Number((row.Value ?? "").replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    const fips = `${state}${county}`;
    const entry = acc.get(fips) ?? { corn: null, soybeans: null, wheat: null };
    entry[field] = value;
    acc.set(fips, entry);
    n += 1;
  }
  return n;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-county-yields ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) {
    console.log("  No NASS_API_KEY in the environment — paste it below (used only for this run, never stored).");
    KEY = await promptForKey();
  }
  if (!KEY) {
    console.error("  No key provided — nothing fetched. (Free key: quickstats.nass.usda.gov/api — same one as grain.)\n");
    process.exit(1);
  }
  console.log("  Key received — querying USDA NASS…");

  // Pick ONE base year from corn (the most widely reported county crop), then
  // pull all three crops for that SAME year so no county mixes seasons. County
  // finals lag, so the newest complete year is typically last year.
  const thisYear = new Date().getFullYear();
  let baseYear: number | null = null;
  const acc = new Map<string, { corn: number | null; soybeans: number | null; wheat: number | null }>();

  for (let year = thisYear; year >= thisYear - 4 && baseYear === null; year -= 1) {
    const corn = await fetchSeries(CROPS[0].shortDesc, year).catch(() => null);
    if (corn && corn.length > 100) {
      baseYear = year;
      const n = absorb(corn, "corn", acc);
      console.log(`  corn: ${n} counties (${year})`);
    }
  }
  if (baseYear === null) {
    console.error("  No county corn yield rows returned for any recent year — snapshot NOT overwritten.");
    process.exit(1);
  }

  for (const crop of CROPS.slice(1)) {
    const rows = await fetchSeries(crop.shortDesc, baseYear).catch((e) => {
      console.error(`  ${crop.field} ${baseYear}: ${e instanceof Error ? e.message : "failed"}`);
      return null;
    });
    const n = absorb(rows, crop.field, acc);
    console.log(`  ${crop.field}: ${n} counties (${baseYear})`);
  }

  if (acc.size === 0) {
    console.error("  No county rows returned — snapshot NOT overwritten.");
    process.exit(1);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = [...acc.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fips, y]) => `  ${JSON.stringify(fips)}: ${JSON.stringify({ ...y, year: baseYear })},`)
    .join("\n");

  fs.writeFileSync(
    OUT,
    `/**
 * countyYieldsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County-average CROP YIELDS (corn / soybeans / wheat, bu/acre) from the USDA
 * NASS Survey — public domain. Keyed by 5-digit county FIPS. Property-ANALYSIS
 * context only (the best-use engine): a county productivity benchmark to
 * underwrite commodity/cash-rent math against — never a parcel yield guarantee,
 * an appraisal, or an offer, and deliberately NOT shown on the market listing.
 *
 * Re-run: npm run ingest:nass-county-yields
 */

export const COUNTY_YIELDS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS Survey — county crop yields (quickstats.nass.usda.gov)",
  year: ${baseYear} as number | null,
  resolvedCounties: ${acc.size},
} as const;

export interface CountyYield {
  /** County-average corn (grain) yield, bu/acre. */
  corn: number | null;
  /** County-average soybean yield, bu/acre. */
  soybeans: number | null;
  /** County-average wheat yield, bu/acre. */
  wheat: number | null;
  /** Survey year the values are drawn from. */
  year: number | null;
}

export const COUNTY_YIELDS: Record<string, CountyYield> = {
${entries}
};
`,
    "utf8",
  );
  console.log(`  wrote ${acc.size} counties (survey year ${baseYear}) → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:nass-county-yields FAILED —", error);
  process.exit(1);
});
