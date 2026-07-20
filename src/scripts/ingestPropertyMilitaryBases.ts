/**
 * ingestPropertyMilitaryBases — nearest military installation per property,
 * frozen into committed snapshots (founder direction 2026-07-19: base proximity
 * matters BEFORE you visit — especially for service members and military
 * families who relocate on orders).
 *
 * Source: HIFLD / DoD MIRTA "Military Installations, Ranges & Training Areas"
 * (milbases FeatureServer) — public domain, no key. Authoritative DoD sites for
 * Air Force, Army, Navy, and Marine Corps (Active/Guard/Reserve) + WHS. Polygon
 * boundaries are requested as CENTROIDS (returnCentroid) so we store a single
 * representative point per installation.
 *
 *   npm run ingest:property-military
 *
 * Emits TWO files (mirrors the airports ingest):
 *   - usMilitaryBasesGenerated: the installation table so imported-address
 *     briefs can compute the nearest base live from a geocode;
 *   - propertyMilitaryBasesGenerated: precomputed nearest-base facts for the
 *     canonical inventory (coords from HUD records; Census geocode fallback).
 *
 * Distances are straight-line miles — drive time is a map-app check.
 *
 * COVERAGE NOTE: this is the DoD MIRTA set (AF/Army/Navy/Marine + WHS). Coast
 * Guard (DHS) and the Merchant Marine are NOT in MIRTA; Coast Guard AIR stations
 * already surface in the airports block. CG/Merchant-Marine installations are a
 * transparent fast-follow (a separate DHS/MARAD dataset).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_SOURCE_IDS, recordsForReview } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import { geocodeToCensusTract } from "../lib/scrapers/adapters/censusGeocoder";

const ROOT = process.cwd();
const OUT_TABLE = path.join(ROOT, "src/lib/property/usMilitaryBasesGenerated.ts");
const OUT_PROPS = path.join(ROOT, "src/lib/property/propertyMilitaryBasesGenerated.ts");
const MIRTA_URL =
  "https://services.arcgis.com/hRUr1F8lE8Jq2uJo/ArcGIS/rest/services/milbases/FeatureServer/0/query";

interface Base {
  name: string;
  branch: string;
  lat: number;
  lon: number;
}

/** COMPONENT (e.g. "AF Guard", "Navy Active", "MC Active", "WHS") → readable branch. */
function mapBranch(component: string): string {
  const c = (component ?? "").trim();
  if (c.startsWith("AF")) return "Air Force";
  if (c.startsWith("Army")) return "Army";
  if (c.startsWith("Navy")) return "Navy";
  if (c.startsWith("MC")) return "Marine Corps";
  if (c === "WHS") return "Department of Defense";
  return "Military";
}

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearest(bases: Base[], lat: number, lon: number) {
  let best: { base: Base; miles: number } | null = null;
  for (const base of bases) {
    const miles = haversineMiles(lat, lon, base.lat, base.lon);
    if (!best || miles < best.miles) best = { base, miles };
  }
  return best;
}

async function fetchAllBases(): Promise<Base[]> {
  const bases: Base[] = [];
  let offset = 0;
  const pageSize = 1000;
  for (let guard = 0; guard < 20; guard++) {
    const url =
      `${MIRTA_URL}?where=1%3D1&outFields=COMPONENT,SITE_NAME,STPOSTAL` +
      `&returnGeometry=false&returnCentroid=true&f=json` +
      `&resultOffset=${offset}&resultRecordCount=${pageSize}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`MIRTA HTTP ${res.status}`);
    const json = (await res.json()) as {
      features?: Array<{
        attributes: { COMPONENT: string; SITE_NAME: string; STPOSTAL: string };
        centroid?: { x: number; y: number };
      }>;
      exceededTransferLimit?: boolean;
    };
    const features = json.features ?? [];
    for (const f of features) {
      const c = f.centroid;
      const name = f.attributes?.SITE_NAME;
      if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y) || !name) continue;
      bases.push({
        name,
        branch: mapBranch(f.attributes.COMPONENT),
        lat: Number(c.y.toFixed(4)),
        lon: Number(c.x.toFixed(4)),
      });
    }
    offset += features.length;
    if (!json.exceededTransferLimit || features.length === 0) break;
  }
  return bases;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-military ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const bases = await fetchAllBases();
  if (bases.length < 300) throw new Error(`Only ${bases.length} installations parsed — NOT overwritten.`);
  console.log(`  ${bases.length} DoD installations (MIRTA)`);

  // Property coordinates: stored (HUD) or geocoded (others) — same as airports.
  const points: { id: string; lat: number; lon: number }[] = [];
  const needGeocode: { id: string; street: string; city: string; state: string; zip: string }[] = [];
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      const r = c.source_records[0];
      if (typeof r.latitude === "number" && typeof r.longitude === "number") {
        points.push({ id: c.canonical_property_id, lat: r.latitude, lon: r.longitude });
      } else if (r.exactAddress && r.town && r.state) {
        needGeocode.push({ id: c.canonical_property_id, street: r.exactAddress, city: r.town, state: r.state, zip: r.zip ?? "" });
      }
    }
  }
  console.log(`  stored coords: ${points.length} · need geocode: ${needGeocode.length}`);
  for (const g of needGeocode) {
    const geo = await geocodeToCensusTract(g.street, g.city, g.state, g.zip).catch(() => null);
    if (geo?.lat && geo?.lon) points.push({ id: g.id, lat: Number(geo.lat), lon: Number(geo.lon) });
  }

  const propEntries: string[] = [];
  for (const p of points) {
    const n = nearest(bases, p.lat, p.lon);
    if (!n) continue;
    propEntries.push(
      `  ${JSON.stringify(p.id)}: ${JSON.stringify({
        nearestName: n.base.name,
        nearestBranch: n.base.branch,
        nearestMiles: Math.round(n.miles),
      })},`
    );
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const SOURCE = "HIFLD / DoD MIRTA (Military Installations, Ranges & Training Areas), public domain";
  fs.writeFileSync(
    OUT_TABLE,
    `/**
 * usMilitaryBasesGenerated — GENERATED FILE. Do not edit by hand.
 * DoD military installations (Air Force / Army / Navy / Marine Corps + WHS) from
 * the HIFLD/DoD MIRTA dataset, as centroids. Re-run: npm run ingest:property-military
 */

export const US_MILITARY_BASES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: ${JSON.stringify(SOURCE)},
  installations: ${bases.length},
} as const;

export interface UsMilitaryBase {
  name: string;
  branch: string;
  lat: number;
  lon: number;
}

export const US_MILITARY_BASES: UsMilitaryBase[] = ${JSON.stringify(bases)};
`,
    "utf8"
  );
  fs.writeFileSync(
    OUT_PROPS,
    `/**
 * propertyMilitaryBasesGenerated — GENERATED FILE. Do not edit by hand.
 * Nearest DoD military installation per canonical property (straight-line miles),
 * from the HIFLD/DoD MIRTA dataset. Re-run: npm run ingest:property-military
 */

export const PROPERTY_MILITARY_BASES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: ${JSON.stringify(SOURCE)},
  resolvedProperties: ${propEntries.length},
} as const;

export interface PropertyMilitaryBaseFact {
  nearestName: string;
  nearestBranch: string;
  nearestMiles: number;
}

export const PROPERTY_MILITARY_BASES: Record<string, PropertyMilitaryBaseFact> = {
${propEntries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${bases.length} installations + ${propEntries.length} properties\n`);
}

main().catch((error) => {
  console.error("ingest:property-military FAILED —", error);
  process.exit(1);
});
