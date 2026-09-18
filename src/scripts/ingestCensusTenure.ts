import { writeFile } from "node:fs/promises";
import path from "node:path";

import { PROPERTY_OZ_FACTS } from "@/lib/property/propertyOpportunityZonesGenerated";

/**
 * ingest:census-tenure — ACS 5-year owner-occupancy per property tract
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15: "neighbor reality" amenity fact,
 * founder-approved presentation: owner-occupancy RATE, never characterizations).
 *
 * Master Volume Governance:
 * - Vol V (source authority): U.S. Census Bureau ACS 5-year estimates, table
 *   B25003 (TENURE) — public domain. Offline ingest -> frozen snapshot; the
 *   public render never fetches live.
 * - Credentialed ingestion doctrine: the Census API now requires a (free) API
 *   key. The key is OWNER-registered and supplied via CENSUS_API_KEY env —
 *   never committed, never baked.
 *
 * Strategy: collect the distinct state+county FIPS pairs across all property
 * tracts (from the OZ ingest's geocoding), fetch B25003 for ALL tracts in each
 * county (one request per county), then join back to properties.
 *
 * Usage: CENSUS_API_KEY=<owner key> npx tsx src/scripts/ingestCensusTenure.ts
 * Output: src/lib/property/propertyTenureGenerated.ts
 */

const ACS_YEAR = "2023";

interface TenureRow {
  total: number;
  ownerOccupied: number;
}

async function fetchCountyTenure(
  stateFips: string,
  countyFips: string,
  key: string
): Promise<Map<string, TenureRow>> {
  const url =
    `https://api.census.gov/data/${ACS_YEAR}/acs/acs5?get=B25003_001E,B25003_002E` +
    `&for=tract:*&in=state:${stateFips}&in=county:${countyFips}&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`ACS fetch failed for ${stateFips}${countyFips}: HTTP ${res.status}`);
  }
  const rows = (await res.json()) as string[][];
  const out = new Map<string, TenureRow>();
  for (const row of rows.slice(1)) {
    const [total, owner, state, county, tract] = row;
    const totalN = Number(total);
    const ownerN = Number(owner);
    if (!Number.isFinite(totalN) || !Number.isFinite(ownerN) || totalN <= 0) continue;
    out.set(`${state}${county}${tract}`, { total: totalN, ownerOccupied: ownerN });
  }
  return out;
}

async function main(): Promise<void> {
  const key = process.env.CENSUS_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "CENSUS_API_KEY is required (owner-registered, free: api.census.gov/data/key_signup.html). " +
        "The key is supplied via env only — never committed."
    );
  }

  // Distinct counties across all property tracts.
  const counties = new Map<string, { state: string; county: string }>();
  const propertyTracts = new Map<string, string>();
  for (const [propertyId, fact] of Object.entries(PROPERTY_OZ_FACTS)) {
    if (!fact.tractId || fact.tractId.length < 11) continue;
    propertyTracts.set(propertyId, fact.tractId);
    const state = fact.tractId.slice(0, 2);
    const county = fact.tractId.slice(2, 5);
    counties.set(`${state}${county}`, { state, county });
  }
  console.log(
    `Resolving tenure for ${propertyTracts.size} properties across ${counties.size} counties (ACS ${ACS_YEAR} 5-year)...`
  );

  const tenureByTract = new Map<string, TenureRow>();
  let done = 0;
  for (const { state, county } of counties.values()) {
    try {
      const rows = await fetchCountyTenure(state, county, key);
      for (const [tract, row] of rows) tenureByTract.set(tract, row);
    } catch (error) {
      console.warn(`  skip ${state}${county}: ${error instanceof Error ? error.message : error}`);
    }
    done += 1;
    if (done % 25 === 0) console.log(`  ...${done}/${counties.size} counties`);
    // Be polite to the API.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const entries: string[] = [];
  let matched = 0;
  for (const [propertyId, tractId] of propertyTracts) {
    const row = tenureByTract.get(tractId);
    if (!row) continue;
    matched += 1;
    const pct = Math.round((row.ownerOccupied / row.total) * 100);
    entries.push(
      `  "${propertyId}": { ownerOccupiedPct: ${pct}, occupiedUnits: ${row.total} },`
    );
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const out = `/**
 * propertyTenureGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Tract-level owner-occupancy per property (ACS ${ACS_YEAR} 5-year, table B25003
 * TENURE) — public domain. Presence = the property's tract had a usable ACS
 * estimate. Re-run: CENSUS_API_KEY=<key> npx tsx src/scripts/ingestCensusTenure.ts
 */

export const PROPERTY_TENURE_PROVENANCE = {
  asOf: "${asOf}",
  acsVintage: "${ACS_YEAR} ACS 5-year estimates, table B25003 (TENURE)",
  source: "U.S. Census Bureau API (api.census.gov)",
  license: "Public domain (U.S. Government work)",
  resolvedProperties: ${matched},
} as const;

export interface PropertyTenureFact {
  /** Share of occupied housing units in the tract that are owner-occupied (0-100). */
  ownerOccupiedPct: number;
  /** Total occupied units in the tract (estimate denominator). */
  occupiedUnits: number;
}

export const PROPERTY_TENURE_FACTS: Record<string, PropertyTenureFact> = {
${entries.join("\n")}
};
`;

  const outPath = path.join(process.cwd(), "src", "lib", "property", "propertyTenureGenerated.ts");
  await writeFile(outPath, out, "utf8");
  console.log(`Wrote tenure for ${matched}/${propertyTracts.size} properties -> ${path.relative(process.cwd(), outPath)}`);
}

main().catch((error: unknown) => {
  console.error("ingest:census-tenure FAILED —", error instanceof Error ? error.message : error);
  process.exit(1);
});
