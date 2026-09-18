/**
 * ingestIpedsColleges — colleges and universities by county, frozen into a
 * committed snapshot (founder direction 2026-07-17: if a major or even minor
 * university or community college is in town or nearby, the chart should say
 * so — some buyers want that, others don't; either way it's a fact).
 *
 * Source: NCES IPEDS institutional directory (HD file) — U.S. Department of
 * Education, public domain, NO KEY REQUIRED. Same federal-directory class as
 * the NCES K-12 school snapshots. Directory facts ONLY — Furlong does not
 * rate institutions.
 *
 *   npm run ingest:ipeds-colleges
 *
 * Includes degree-granting 4-year and 2-year institutions (sectors 1-6);
 * excludes administrative units and <2-year trade programs so the fact reads
 * "college," not "cosmetology school."
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { parseCsv } from "../lib/property/hudAdapter";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyCollegesGenerated.ts");
const IPEDS_YEAR = 2024;
const ZIP_URL = `https://nces.ed.gov/ipeds/datacenter/data/HD${IPEDS_YEAR}.zip`;

async function main(): Promise<void> {
  console.log("\n━━━ ingest:ipeds-colleges ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const res = await fetch(ZIP_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`IPEDS HD${IPEDS_YEAR} HTTP ${res.status}`);
  const archive = Buffer.from(await res.arrayBuffer());
  const csv = execFileSync("unzip", ["-p"], {
    input: archive,
    maxBuffer: 64 * 1024 * 1024,
  }).toString("latin1");

  const rows = parseCsv(csv);
  const header = rows[0].map((cell) => cell.trim().toUpperCase());
  const col = (name: string) => header.indexOf(name);
  const [nameC, cityC, stateC, sectorC, countyC, latC, lonC] = [col("INSTNM"), col("CITY"), col("STABBR"), col("SECTOR"), col("COUNTYCD"), col("LATITUDE"), col("LONGITUD")];
  if ([nameC, cityC, stateC, sectorC, countyC, latC, lonC].some((i) => i < 0)) {
    throw new Error(`IPEDS HD header changed — snapshot NOT overwritten.`);
  }

  type Campus = { name: string; city: string; state: string; level: string; lat: number; lon: number };
  const byCounty = new Map<string, Campus[]>();
  const campuses: Campus[] = [];
  let kept = 0;
  for (const row of rows.slice(1)) {
    const sector = Number(row[sectorC]);
    if (!(sector >= 1 && sector <= 6)) continue; // degree-granting 4yr/2yr only
    const fips = (row[countyC] ?? "").trim().padStart(5, "0");
    if (!/^\d{5}$/.test(fips) || fips === "00000") continue;
    const level =
      sector <= 3 ? "4-year" : sector === 4 ? "community college" : "2-year";
    const lat = Number(row[latC]);
    const lon = Number(row[lonC]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const campus = { name: (row[nameC] ?? "").trim(), city: (row[cityC] ?? "").trim(), state: (row[stateC] ?? "").trim(), level, lat, lon };
    const list = byCounty.get(fips) ?? [];
    list.push(campus);
    campuses.push(campus);
    byCounty.set(fips, list);
    kept += 1;
  }
  if (kept < 3000) throw new Error(`Only ${kept} institutions parsed — snapshot NOT overwritten.`);

  const entries = [...byCounty.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fips, list]) => `  ${JSON.stringify(fips)}: ${JSON.stringify(list.slice(0, 10))},`);
  const campusEntries = campuses.map((campus) => `  ${JSON.stringify(campus)},`);

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * countyCollegesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Colleges and universities by county from the NCES IPEDS institutional
 * directory (HD${IPEDS_YEAR}) — U.S. Dept. of Education, public domain.
 * Directory facts only; Furlong does not rate institutions.
 * Re-run: npm run ingest:ipeds-colleges
 */

export const COUNTY_COLLEGES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "NCES IPEDS institutional directory (HD${IPEDS_YEAR}), nces.ed.gov/ipeds",
  institutions: ${kept},
  resolvedCounties: ${entries.length},
} as const;

export interface CountyCollege {
  name: string;
  city: string;
  state?: string;
  /** "4-year" | "community college" | "2-year" */
  level: string;
  lat?: number;
  lon?: number;
}

export interface CollegeCampus extends CountyCollege {
  state: string;
  lat: number;
  lon: number;
}

/** Keyed by 5-digit county FIPS; capped at 10 per county. */
export const COUNTY_COLLEGES: Record<string, CountyCollege[]> = {
${entries.join("\n")}
};

/** All degree-granting campuses with coordinates, for nearest-campus distance facts. */
export const US_COLLEGE_CAMPUSES: CollegeCampus[] = [
${campusEntries.join("\n")}
];
`,
    "utf8"
  );
  console.log(`  ${kept} institutions across ${entries.length} counties → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:ipeds-colleges FAILED —", error);
  process.exit(1);
});
