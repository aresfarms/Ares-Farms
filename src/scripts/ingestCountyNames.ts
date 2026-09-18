import { writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * ingest:county-names — Census national county gazetteer → frozen snapshot
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15: county resolution).
 *
 * Master Volume Governance:
 * - Vol V (source authority): U.S. Census Bureau national county file — public
 *   domain (U.S. Government work). Offline ingest producing a frozen snapshot;
 *   the public render NEVER fetches live.
 * - Render-time honesty: the snapshot carries an asOf date and the generated
 *   file names its source.
 *
 * Why: 757 canonical properties already carry a census tract id (from the OZ
 * ingest's geocoding). A tract's first five digits are the state+county FIPS,
 * so this one small public-domain table upgrades "county: Unknown" to a real
 * county name for nearly the whole inventory — no per-property fetches.
 *
 * Usage: npx tsx src/scripts/ingestCountyNames.ts
 * Output: src/lib/property/countyNamesGenerated.ts
 */

const SOURCE_URL =
  "https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt";

async function main(): Promise<void> {
  console.log(`Fetching Census national county file: ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) {
    throw new Error(`Census county file fetch failed: HTTP ${res.status}`);
  }
  const text = await res.text();

  // Pipe-delimited: STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.toUpperCase() ?? "";
  if (!header.includes("STATEFP") || !header.includes("COUNTYNAME")) {
    throw new Error(`Unexpected county file header: ${lines[0]}`);
  }

  const entries: Array<[string, { name: string; state: string }]> = [];
  for (const line of lines.slice(1)) {
    const parts = line.split("|");
    if (parts.length < 5) continue;
    const [state, statefp, countyfp, , countyname] = parts;
    if (!/^\d{2}$/.test(statefp) || !/^\d{3}$/.test(countyfp) || !countyname) continue;
    entries.push([`${statefp}${countyfp}`, { name: countyname.trim(), state: state.trim() }]);
  }
  if (entries.length < 3000) {
    throw new Error(`Suspiciously few counties parsed (${entries.length}) — aborting.`);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const body = entries
    .map(([fips, v]) => `  "${fips}": { name: ${JSON.stringify(v.name)}, state: ${JSON.stringify(v.state)} },`)
    .join("\n");

  const out = `/**
 * countyNamesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * U.S. county FIPS (5-digit state+county) → county name + state postal code.
 * Source: U.S. Census Bureau national county file (codes2020/national_county2020.txt)
 * — public domain (U.S. Government work). Re-run \`npx tsx src/scripts/ingestCountyNames.ts\`.
 */

export const COUNTY_NAMES_PROVENANCE = {
  asOf: "${asOf}",
  source: "U.S. Census Bureau national county file (2020 codes)",
  license: "Public domain (U.S. Government work)",
  counties: ${entries.length},
} as const;

export const COUNTY_NAMES: Record<string, { name: string; state: string }> = {
${body}
};
`;

  const outPath = path.join(process.cwd(), "src", "lib", "property", "countyNamesGenerated.ts");
  await writeFile(outPath, out, "utf8");
  console.log(`Wrote ${entries.length} counties -> ${path.relative(process.cwd(), outPath)}`);
}

main().catch((error: unknown) => {
  console.error("ingest:county-names FAILED —", error instanceof Error ? error.message : error);
  process.exit(1);
});
