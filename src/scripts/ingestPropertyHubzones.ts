/**
 * ingestPropertyHubzones — resolve the SBA HUBZone place-fact for every LIVE
 * public property, frozen into a committed snapshot. HUBZone analog of
 * ingestPropertyOpportunityZones.
 *
 * Efficient path: the OZ ingest already resolved each property's 11-digit census
 * tract GEOID (PROPERTY_OZ_FACTS). We REUSE those — no re-geocoding — and resolve
 * HUBZone designation by querying the SBA HUBZone layer's TRACT-keyed and
 * COUNTY-keyed sublayers with GEOID IN (...) batches:
 *   tract-keyed:  0 Qualified Census Tract · 3 Redesignated Census Tract · 7 Governor-Designated Census
 *   county-keyed: 1 Qualified Non-Metro County · 2 Redesignated Non-Metro County · 4 Governor-Designated County
 * Tract-level match wins over county-level (more specific).
 *
 * NOT resolved here (honest limitation): Qualified Indian Land (5) and Qualified
 * Disaster Area (6) are point-geometry categories with no tract/county key, so
 * they are not covered by this property snapshot. A property in only those would
 * read "not designated" here — acceptable for a public badge (absence shows
 * nothing). The live lookupHubzone covers all 8 by point.
 *
 * Renders from the SNAPSHOT only; live fetch stays Module 22/23 gated.
 * Run: npm run ingest:property-hubzone [-- --dry]
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_OZ_FACTS } from "../lib/property/propertyOpportunityZonesGenerated";
import {
  HUBZONE_FEATURE_BASE,
  HUBZONE_DATASET_EFFECTIVE,
  HUBZONE_ADAPTER_VERSION,
  parseRedesignatedThrough,
} from "../lib/scrapers/adapters/hubzone";

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertyHubzonesGenerated.ts");

type Designation = {
  hubzoneType: string;
  effective: string;
  expiration: string | null;
  timeLimited: boolean;
};

// layerId, type, key ("tract"|"county"), how to read effective/expiration.
const TRACT_LAYERS = [
  { id: 0, type: "Qualified Census Tract", timeLimited: false, fields: "GEOID" },
  { id: 3, type: "Redesignated Census Tract", timeLimited: true, fields: "GEOID" },
  { id: 7, type: "Governor-Designated Census Tract", timeLimited: true, fields: "GEOID,mvw_gov_ar,mvw_gov__3" },
] as const;
const COUNTY_LAYERS = [
  { id: 1, type: "Qualified Non-Metropolitan County", timeLimited: false, fields: "GEOID" },
  { id: 2, type: "Redesignated Non-Metropolitan County", timeLimited: true, fields: "GEOID,F20230701_q" },
  { id: 4, type: "Governor-Designated County", timeLimited: true, fields: "GEOID,mvw_gov_ar,mvw_gov__3" },
] as const;

function normDate(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Query one HUBZone sublayer for the GEOIDs that match (POST; long IN lists). */
async function queryLayer(
  layerId: number,
  fields: string,
  geoids: string[],
): Promise<Map<string, Record<string, string>>> {
  const found = new Map<string, Record<string, string>>();
  const CHUNK = 150;
  for (let i = 0; i < geoids.length; i += CHUNK) {
    const slice = geoids.slice(i, i + CHUNK);
    const params = new URLSearchParams({
      where: `GEOID IN (${slice.map((g) => `'${g}'`).join(",")})`,
      outFields: fields,
      returnGeometry: "false",
      f: "pjson",
    });
    const res = await fetch(`${HUBZONE_FEATURE_BASE}/${layerId}/query`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`HUBZone layer ${layerId} HTTP ${res.status}`);
    const body = await res.json();
    for (const f of body?.features ?? []) {
      const a = f.attributes as Record<string, string>;
      if (a.GEOID) found.set(String(a.GEOID), a);
    }
  }
  return found;
}

function designationFrom(
  layer: { type: string; timeLimited: boolean },
  attrs: Record<string, string>,
): Designation {
  let effective = HUBZONE_DATASET_EFFECTIVE;
  let expiration: string | null = null;
  if (attrs.mvw_gov_ar) effective = normDate(attrs.mvw_gov_ar) ?? HUBZONE_DATASET_EFFECTIVE;
  if (attrs.mvw_gov__3) expiration = normDate(attrs.mvw_gov__3);
  if (attrs.F20230701_q) expiration = parseRedesignatedThrough(attrs.F20230701_q);
  return { hubzoneType: layer.type, effective, expiration, timeLimited: layer.timeLimited };
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-hubzone ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const propTract = new Map<string, string>();
  // Only properties with a resolved tract can be HUBZone-checked (tract/county
  // keyed). Properties whose address didn't geocode (tractId null) are recorded
  // in the OZ snapshot as checked-undetermined and simply carry no HUBZone badge.
  for (const [id, f] of Object.entries(PROPERTY_OZ_FACTS)) if (f.tractId) propTract.set(id, f.tractId);
  console.log(`  properties with a resolved tract: ${propTract.size}`);
  if (propTract.size === 0) { console.log("  nothing to resolve.\n"); return; }

  const tracts = [...new Set([...propTract.values()])];
  const counties = [...new Set(tracts.map((t) => t.slice(0, 5)))];
  console.log(`  unique tracts: ${tracts.length} · unique counties: ${counties.length}`);

  // Resolve each layer.
  const tractHits = new Map<number, Map<string, Record<string, string>>>();
  for (const L of TRACT_LAYERS) tractHits.set(L.id, await queryLayer(L.id, L.fields, tracts));
  const countyHits = new Map<number, Map<string, Record<string, string>>>();
  for (const L of COUNTY_LAYERS) countyHits.set(L.id, await queryLayer(L.id, L.fields, counties));
  for (const L of TRACT_LAYERS) console.log(`  tract layer ${L.id} (${L.type}): ${tractHits.get(L.id)!.size} tracts`);
  for (const L of COUNTY_LAYERS) console.log(`  county layer ${L.id} (${L.type}): ${countyHits.get(L.id)!.size} counties`);

  // Per-property designation: tract-level first (most specific), else county-level.
  const byId = new Map<string, Designation & { geoid: string }>();
  for (const [id, tract] of propTract) {
    let chosen: (Designation & { geoid: string }) | null = null;
    for (const L of TRACT_LAYERS) {
      const a = tractHits.get(L.id)!.get(tract);
      if (a) { chosen = { ...designationFrom(L, a), geoid: tract }; break; }
    }
    if (!chosen) {
      const county = tract.slice(0, 5);
      for (const L of COUNTY_LAYERS) {
        const a = countyHits.get(L.id)!.get(county);
        if (a) { chosen = { ...designationFrom(L, a), geoid: county }; break; }
      }
    }
    if (chosen) byId.set(id, chosen);
  }
  console.log(`  properties in a HUBZone: ${byId.size} / ${propTract.size}`);

  if (DRY) { console.log("  DRY RUN — no file written.\n"); return; }

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = [...byId.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([id, v]) =>
        `  ${JSON.stringify(id)}: { hubzoneType: ${JSON.stringify(v.hubzoneType)}, geoid: ${JSON.stringify(v.geoid)}, effective: ${JSON.stringify(v.effective)}, expiration: ${v.expiration ? JSON.stringify(v.expiration) : "null"}, timeLimited: ${v.timeLimited} },`,
    )
    .join("\n");

  const file = `/**
 * propertyHubzonesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Written by src/scripts/ingestPropertyHubzones.ts. Frozen SBA HUBZone place-fact
 * for each LIVE public property, resolved offline against the SBA HUBZone layer
 * (tract + county sublayers) reusing the OZ ingest's tract GEOIDs. The public
 * property card reads THIS snapshot; the request-time live fetch stays Module
 * 22/23 gated. Coarse tract/county geography only — never an exact address.
 *
 * NOT covered: Qualified Indian Land + Qualified Disaster Area (point-geometry).
 * Re-run \`npm run ingest:property-hubzone\` to refresh.
 */

export const PROPERTY_HUBZONE_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  designationAuthority: "SBA — 13 CFR §126 / 15 U.S.C. §657a (HUBZone program)",
  hubzoneSource: "SBA HUBZone designation layer (public ArcGIS FeatureServer; effective ${HUBZONE_DATASET_EFFECTIVE})",
  authoritativeLiveSource: "SBA HUBZone Map — maps.certify.sba.gov",
  license: "Public domain (U.S. Government work)",
  adapterVersion: ${JSON.stringify(HUBZONE_ADAPTER_VERSION)},
  resolvedProperties: ${propTract.size},
  designatedProperties: ${byId.size},
} as const;

export interface PropertyHubzoneFact {
  hubzoneType: string;
  geoid: string;
  effective: string;
  expiration: string | null;
  timeLimited: boolean;
}

/** canonical_property_id → frozen HUBZone place-fact (only designated properties present). */
export const PROPERTY_HUBZONE_FACTS: Record<string, PropertyHubzoneFact> = {
${entries}
};
`;
  fs.writeFileSync(OUT, file);
  console.log(`  wrote ${path.relative(ROOT, OUT)} (${byId.size} designated, as of ${asOf})\n`);
}

main().catch((e) => { console.error("ingest:property-hubzone FAILED —", e); process.exit(1); });
