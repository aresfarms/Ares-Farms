/**
 * ingestNassCashRents — county-average cropland + pastureland cash rents,
 * frozen into a committed snapshot (founder direction 2026-07-16: farm-shaped
 * properties should carry ground-rent context for open acreage).
 *
 * Source: USDA NASS Quick Stats API (Cash Rents Survey) — public domain.
 * Requires a FREE API key: sign up at quickstats.nass.usda.gov/api (immediate,
 * emailed). Owner-run governed ingest:
 *
 *   NASS_API_KEY=<key> npm run ingest:nass-cash-rents
 *
 * Honest-context discipline: county AVERAGES only — never a parcel appraisal,
 * never an offer. The read module frames them as negotiation context.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyCashRentsGenerated.ts");
const API = "https://quickstats.nass.usda.gov/api/api_GET/";

const KEY = process.env.NASS_API_KEY?.trim();

const SERIES: { field: "cropland" | "pasture"; shortDesc: string }[] = [
  { field: "cropland", shortDesc: "RENT, CASH, CROPLAND, NON-IRRIGATED - EXPENSE, MEASURED IN $ / ACRE" },
  { field: "pasture", shortDesc: "RENT, CASH, PASTURELAND - EXPENSE, MEASURED IN $ / ACRE" },
];

interface QsRow {
  state_fips_code?: string;
  county_code?: string;
  Value?: string;
  year?: string;
}

async function fetchSeries(shortDesc: string, year: number): Promise<QsRow[] | null> {
  const params = new URLSearchParams({
    key: KEY as string,
    source_desc: "SURVEY",
    sector_desc: "ECONOMICS",
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

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nass-cash-rents ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!KEY) {
    console.error(
      "  NASS_API_KEY is not set. Get a FREE key at quickstats.nass.usda.gov/api\n" +
      "  (immediate email), then run:  NASS_API_KEY=<key> npm run ingest:nass-cash-rents\n"
    );
    process.exit(1);
  }

  // The Cash Rents Survey publishes most (not all) counties each year — walk
  // back from the current year until a series returns data.
  const thisYear = new Date().getFullYear();
  const rents = new Map<string, { cropland: number | null; pasture: number | null }>();
  let usedYear: number | null = null;

  for (const series of SERIES) {
    let rows: QsRow[] | null = null;
    for (let year = thisYear; year >= thisYear - 3; year -= 1) {
      rows = await fetchSeries(series.shortDesc, year).catch((error) => {
        console.error(`  ${series.field} ${year}: ${error instanceof Error ? error.message : "failed"}`);
        return null;
      });
      if (rows && rows.length > 0) {
        usedYear = usedYear ?? year;
        console.log(`  ${series.field}: ${rows.length} county rows (${year})`);
        break;
      }
    }
    for (const row of rows ?? []) {
      const state = (row.state_fips_code ?? "").padStart(2, "0");
      const county = (row.county_code ?? "").padStart(3, "0");
      if (!/^\d{2}$/.test(state) || !/^\d{3}$/.test(county) || county === "998") continue;
      const value = Number((row.Value ?? "").replace(/,/g, ""));
      if (!Number.isFinite(value) || value <= 0) continue;
      const fips = `${state}${county}`;
      const entry = rents.get(fips) ?? { cropland: null, pasture: null };
      entry[series.field] = value;
      rents.set(fips, entry);
    }
  }

  if (rents.size === 0) {
    console.error("  No county rows returned — snapshot NOT overwritten.");
    process.exit(1);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = [...rents.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fips, rent]) => `  ${JSON.stringify(fips)}: ${JSON.stringify(rent)},`)
    .join("\n");

  fs.writeFileSync(
    OUT,
    `/**
 * countyCashRentsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * County-average cropland and pastureland CASH RENTS from the USDA NASS
 * Cash Rents Survey — public domain. Keyed by 5-digit county FIPS.
 * Context facts only: county averages, never a parcel appraisal or an offer.
 * Re-run: NASS_API_KEY=<key> npm run ingest:nass-cash-rents
 */

export const COUNTY_CASH_RENTS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA NASS Cash Rents Survey (quickstats.nass.usda.gov)",
  year: ${usedYear} as number | null,
  resolvedCounties: ${rents.size},
} as const;

export interface CountyCashRent {
  /** County-average cropland (non-irrigated) cash rent, $/acre/year. */
  cropland: number | null;
  /** County-average pastureland cash rent, $/acre/year. */
  pasture: number | null;
}

export const COUNTY_CASH_RENTS: Record<string, CountyCashRent> = {
${entries}
};
`,
    "utf8"
  );
  console.log(`  wrote ${rents.size} counties (survey year ${usedYear}) → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:nass-cash-rents FAILED —", error);
  process.exit(1);
});
