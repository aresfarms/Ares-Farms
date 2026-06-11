/**
 * ingestPropertyNmtc — NMTC low-income-community place-fact per LIVE property
 * (the OZ pattern: tract-GEOID match against the published eligibility data).
 *
 * Dataset: NMTC Qualified Tracts 2020 (national, 34,372 tract rows carrying the
 * CDFI Fund 2016–2020 ACS eligibility determinations — poverty / median-income
 * criteria, field `Does_Census_Tract_Qualify_For_N`). Queried by FIPS IN (...)
 * batches against the tract GEOIDs the OZ ingest already resolved — no
 * re-geocoding. Writes src/lib/property/propertyNmtcGenerated.ts.
 *
 * Run: npm run ingest:property-nmtc
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_OZ_FACTS } from "../lib/property/propertyOpportunityZonesGenerated";

const NMTC_URL =
  "https://services6.arcgis.com/BAJNi3EgCdtQ1BCG/arcgis/rest/services/NMTC_Qualified_Tracts_2020/FeatureServer/3/query";
const OUT = path.join(process.cwd(), "src/lib/property/propertyNmtcGenerated.ts");

async function queryQualified(geoids: string[]): Promise<Set<string>> {
  const qualified = new Set<string>();
  const CHUNK = 150;
  for (let i = 0; i < geoids.length; i += CHUNK) {
    const slice = geoids.slice(i, i + CHUNK);
    const params = new URLSearchParams({
      where: `FIPS IN (${slice.map((g) => `'${g}'`).join(",")}) AND Does_Census_Tract_Qualify_For_N='YES'`,
      outFields: "FIPS",
      returnGeometry: "false",
      f: "pjson",
    });
    const res = await fetch(NMTC_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`NMTC HTTP ${res.status}`);
    const body = await res.json();
    for (const f of body?.features ?? []) if (f.attributes?.FIPS) qualified.add(String(f.attributes.FIPS));
  }
  return qualified;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-nmtc ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const propTract = new Map<string, string>();
  for (const [id, f] of Object.entries(PROPERTY_OZ_FACTS)) if (f.tractId) propTract.set(id, f.tractId);
  const tracts = [...new Set(propTract.values())];
  console.log(`  properties with a tract: ${propTract.size} · unique tracts: ${tracts.length}`);

  const qualified = await queryQualified(tracts);
  console.log(`  NMTC-qualified tracts among them: ${qualified.size}`);

  const byId: Record<string, { tractId: string }> = {};
  for (const [id, tract] of propTract) if (qualified.has(tract)) byId[id] = { tractId: tract };
  console.log(`  properties in an NMTC low-income community: ${Object.keys(byId).length} / ${propTract.size}`);

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = Object.entries(byId).sort(([a], [b]) => a.localeCompare(b))
    .map(([id, v]) => `  ${JSON.stringify(id)}: { tractId: ${JSON.stringify(v.tractId)} },`).join("\n");

  fs.writeFileSync(OUT, `/**
 * propertyNmtcGenerated — GENERATED FILE. Do not edit by hand.
 *
 * NMTC low-income-community place-fact per LIVE property (CDFI Fund 2016–2020
 * ACS eligibility data via the national NMTC Qualified Tracts 2020 layer),
 * matched on the property's census tract GEOID. Snapshot-only render.
 * Re-run \`npm run ingest:property-nmtc\` to refresh.
 */

export const PROPERTY_NMTC_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  designationAuthority: "CDFI Fund / U.S. Treasury — NMTC low-income community (IRC §45D; 2016–2020 ACS)",
  dataset: "NMTC Qualified Tracts 2020 (national tract layer; field Does_Census_Tract_Qualify_For_N)",
  license: "Public domain (U.S. Government data)",
  resolvedProperties: ${propTract.size},
  qualifiedProperties: ${Object.keys(byId).length},
} as const;

export interface PropertyNmtcFact { tractId: string }

/** canonical_property_id → NMTC-qualified tract (only qualified properties present). */
export const PROPERTY_NMTC_FACTS: Record<string, PropertyNmtcFact> = {
${entries}
};
`, "utf8");
  console.log(`  wrote ${path.relative(process.cwd(), OUT)} (as of ${asOf})\n`);
}

main().catch((e) => { console.error("ingest:property-nmtc FAILED —", e); process.exit(1); });
