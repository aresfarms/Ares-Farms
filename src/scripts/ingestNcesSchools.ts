/**
 * ingestNcesSchools — public-school directory facts for every county that has
 * a LIVE property, frozen into a committed snapshot
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15, founder decision: LIST schools
 * + whatever the data permits — enrollment, charter status — NO ratings ever).
 *
 * Source: NCES Common Core of Data (CCD) school directory via the Urban
 * Institute Education Data API (educationdata.urban.org) — open, no key.
 * NOTE: the API's server-side county filter is unreliable, so we fetch per
 * STATE (paginated) and filter client-side by county_code.
 *
 * Counties come from the properties' census tracts (first 5 digits = FIPS),
 * same derivation the county-name resolution uses.
 *
 * Run: npx tsx src/scripts/ingestNcesSchools.ts
 * Output: src/lib/property/countySchoolsGenerated.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_OZ_FACTS } from "../lib/property/propertyOpportunityZonesGenerated";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/countySchoolsGenerated.ts");
const CCD_YEAR = 2022;
const MAX_PER_COUNTY = 60;
// --all: national coverage (every county, tighter sample cap) — manual
// addresses can be anywhere (founder-reported gap 2026-07-17).
const ALL_COUNTIES = process.argv.includes("--all");
const MAX_PER_COUNTY_ALL = 20;
const ALL_STATE_FIPS = [
  "01","02","04","05","06","08","09","10","11","12","13","15","16","17","18",
  "19","20","21","22","23","24","25","26","27","28","29","30","31","32","33",
  "34","35","36","37","38","39","40","41","42","44","45","46","47","48","49",
  "50","51","53","54","55","56",
];

export interface CountySchool {
  name: string;
  city: string;
  enrollment: number | null;
  charter: boolean;
}

interface ApiRecord {
  school_name?: string;
  city_mailing?: string;
  county_code?: number | string;
  enrollment?: number | null;
  charter?: number | null;
  school_status?: number | null;
}

async function fetchStatePages(stateFips: string): Promise<ApiRecord[]> {
  const out: ApiRecord[] = [];
  let url: string | null =
    `https://educationdata.urban.org/api/v1/schools/ccd/directory/${CCD_YEAR}/?fips=${Number(stateFips)}`;
  let pages = 0;
  while (url && pages < 200) {
    const res = await fetch(url, {
      headers: { "User-Agent": "FurlongPlaceBrief/1.0 (schools ingest; chudson@aresfarmsinc.com)" },
      signal: AbortSignal.timeout(45000),
    });
    if (res.status === 403 || res.status === 429) {
      // throttled — back off once, then bail on this state (resumable pattern)
      await new Promise((resolve) => setTimeout(resolve, 15000));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const data = (await res.json()) as { next: string | null; results: ApiRecord[] };
    out.push(...data.results);
    url = data.next;
    pages += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return out;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:nces-schools ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  // Counties (and their states) that actually carry properties.
  const counties = new Set<string>();
  for (const fact of Object.values(PROPERTY_OZ_FACTS)) {
    if (fact.tractId && fact.tractId.length >= 5) counties.add(fact.tractId.slice(0, 5));
  }
  const states = ALL_COUNTIES
    ? ALL_STATE_FIPS
    : [...new Set([...counties].map((c) => c.slice(0, 2)))].sort();
  console.log(
    ALL_COUNTIES
      ? `  target: ALL counties, ${states.length} states (CCD ${CCD_YEAR})`
      : `  target: ${counties.size} counties across ${states.length} states (CCD ${CCD_YEAR})`
  );

  const byCounty = new Map<string, CountySchool[]>();
  let stateDone = 0;
  for (const state of states) {
    try {
      const records = await fetchStatePages(state);
      for (const record of records) {
        const county = String(record.county_code ?? "").padStart(5, "0");
        if (!ALL_COUNTIES && !counties.has(county)) continue;
        if (!/^\d{5}$/.test(county) || county === "00000") continue;
        // school_status 1 = open (keep unknowns too; drop confirmed-closed 2/6/7).
        if (record.school_status != null && [2, 6, 7].includes(Number(record.school_status))) continue;
        const list = byCounty.get(county) ?? [];
        list.push({
          name: (record.school_name ?? "").trim(),
          city: (record.city_mailing ?? "").trim(),
          enrollment:
            typeof record.enrollment === "number" && record.enrollment >= 0
              ? record.enrollment
              : null,
          charter: Number(record.charter ?? 0) === 1,
        });
        byCounty.set(county, list);
      }
      stateDone += 1;
      console.log(`  state ${state}: ${records.length} schools scanned (${stateDone}/${states.length})`);
    } catch (error) {
      console.warn(`  skip state ${state}: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Cap per county, largest enrollment first (stable, defensible ordering).
  const entries: string[] = [];
  for (const [county, schools] of [...byCounty.entries()].sort()) {
    const capped = schools
      .filter((s) => s.name)
      .sort((a, b) => (b.enrollment ?? -1) - (a.enrollment ?? -1))
      .slice(0, ALL_COUNTIES ? MAX_PER_COUNTY_ALL : MAX_PER_COUNTY);
    entries.push(`  ${JSON.stringify(county)}: ${JSON.stringify(capped)},`);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * countySchoolsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Public-school directory (incl. charter flag + enrollment) for every county
 * with a LIVE property. Source: NCES Common Core of Data ${CCD_YEAR} via the
 * Urban Institute Education Data API — public data, listed as FACTS, never
 * rated. Private/parochial options are directed to the state DOE (honest
 * unknown). Re-run: npx tsx src/scripts/ingestNcesSchools.ts
 */

export const COUNTY_SCHOOLS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  ccdYear: ${CCD_YEAR},
  source: "NCES Common Core of Data via Urban Institute Education Data API",
  license: "Public domain (U.S. Government data)",
  counties: ${entries.length},
} as const;

export interface CountySchool {
  name: string;
  city: string;
  enrollment: number | null;
  charter: boolean;
}

export const COUNTY_SCHOOLS: Record<string, CountySchool[]> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} counties -> ${path.relative(ROOT, OUT)}\n`);
}

main().catch((e) => { console.error("ingest:nces-schools FAILED —", e); process.exit(1); });
