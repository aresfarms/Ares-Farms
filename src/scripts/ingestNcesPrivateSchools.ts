/**
 * ingestNcesPrivateSchools — private/parochial school directory facts per
 * county, frozen into a committed snapshot (founder direction 2026-07-16:
 * "why are we not listing these" — now we do).
 *
 * Source: NCES Private School Universe Survey (PSS) public-use file — public
 * domain. Download once (no key):
 *   https://nces.ed.gov/surveys/pss/zip/pss2122_pu_csv.zip
 * Run: npm run ingest:nces-private-schools -- --file <path-to-csv>
 *
 * Same copy discipline as public schools (NCES CCD): LIST + permitted data
 * (enrollment) only — Furlong never rates schools. ALL counties are kept
 * (manual addresses can be anywhere); samples per county are capped to bound
 * the snapshot size, with the true count preserved.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countyPrivateSchoolsGenerated.ts");
const SAMPLE_CAP = 10;

const fileArgIndex = process.argv.indexOf("--file");
const FILE = fileArgIndex >= 0 ? process.argv[fileArgIndex + 1] : null;

/** Minimal CSV parser handling quoted fields (school names contain commas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).trim();
}

interface PrivateSchool {
  name: string;
  city: string;
  state: string;
  enrollment: number | null;
  lat: number;
  lon: number;
}

function main(): void {
  console.log("\n━━━ ingest:nces-private-schools ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (!FILE || !fs.existsSync(FILE)) {
    console.error(
      "  Pass the PSS public-use CSV: npm run ingest:nces-private-schools -- --file <csv>\n" +
      "  Download (no key): https://nces.ed.gov/surveys/pss/zip/pss2122_pu_csv.zip\n"
    );
    process.exit(1);
  }

  const lines = fs.readFileSync(FILE, "latin1").split(/\r?\n/).filter((line) => line.length > 0);
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toUpperCase());
  const col = (name: string) => header.indexOf(name);
  const cName = col("PINST");
  const cCity = col("PL_CIT");
  const cMailCity = col("PCITY");
  const cStateAnsi = col("PSTANSI");
  const cCounty3 = col("PCNTY");
  const cStudents = col("NUMSTUDS");
  const cState = col("PSTABB");
  const cLat = col("LATITUDE22");
  const cLon = col("LONGITUDE22");
  if (cName === -1 || cStateAnsi === -1 || cCounty3 === -1 || cState === -1 || cLat === -1 || cLon === -1) {
    console.error(`  Unexpected header — needed PINST/PSTANSI/PCNTY; got ${header.length} columns.`);
    process.exit(1);
  }

  const byCounty = new Map<string, { count: number; schools: PrivateSchool[] }>();
  const campuses: PrivateSchool[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    const state = (row[cStateAnsi] ?? "").trim().padStart(2, "0");
    const county3 = (row[cCounty3] ?? "").trim().padStart(3, "0");
    if (!/^\d{2}$/.test(state) || !/^\d{3}$/.test(county3)) { skipped += 1; continue; }
    const fips = `${state}${county3}`;
    const name = titleCase((row[cName] ?? "").trim());
    if (!name) { skipped += 1; continue; }
    const enrollment = Number(row[cStudents] ?? "");
    const lat = Number(row[cLat] ?? "");
    const lon = Number(row[cLon] ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { skipped += 1; continue; }
    const entry = byCounty.get(fips) ?? { count: 0, schools: [] };
    entry.count += 1;
    const school = {
      name,
      city: titleCase(((row[cCity] ?? "").trim() || (row[cMailCity] ?? "").trim())),
      state: (row[cState] ?? "").trim().toUpperCase(),
      enrollment: Number.isFinite(enrollment) && enrollment > 0 ? enrollment : null,
      lat,
      lon,
    };
    entry.schools.push(school);
    campuses.push(school);
    byCounty.set(fips, entry);
  }

  // Cap samples per county (largest enrollment first) — count stays true.
  for (const entry of byCounty.values()) {
    entry.schools.sort((a, b) => (b.enrollment ?? 0) - (a.enrollment ?? 0));
    entry.schools = entry.schools.slice(0, SAMPLE_CAP);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = [...byCounty.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fips, entry]) => `  ${JSON.stringify(fips)}: ${JSON.stringify(entry)},`)
    .join("\n");
  const campusEntries = campuses.map((school) => `  ${JSON.stringify(school)},`).join("\n");

  fs.writeFileSync(
    OUT,
    `/**
 * countyPrivateSchoolsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Private/parochial school directory facts per county from the NCES Private
 * School Universe Survey (PSS) public-use file — public domain. Directory
 * facts only (name, city, enrollment) — Furlong never rates schools.
 * \`count\` is the true county total; \`schools\` is a size-capped sample
 * (largest enrollment first). Re-run: npm run ingest:nces-private-schools
 */

export const COUNTY_PRIVATE_SCHOOLS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  source: "NCES Private School Universe Survey (PSS) public-use file",
  pssYear: "2021-22",
  resolvedCounties: ${byCounty.size},
} as const;

export interface CountyPrivateSchool {
  name: string;
  city: string;
  state: string;
  enrollment: number | null;
  lat: number;
  lon: number;
}

export const COUNTY_PRIVATE_SCHOOLS: Record<string, { count: number; schools: CountyPrivateSchool[] }> = {
${entries}
};

/** All surveyed private/parochial campuses with coordinates, for nearest-campus distance facts. */
export const US_PRIVATE_SCHOOL_CAMPUSES: CountyPrivateSchool[] = [
${campusEntries}
];
`,
    "utf8"
  );
  console.log(`  counties: ${byCounty.size} · schools kept: ${[...byCounty.values()].reduce((n, e) => n + e.schools.length, 0)} · skipped rows: ${skipped}`);
  console.log(`  wrote ${path.relative(ROOT, OUT)}\n`);
}

main();
