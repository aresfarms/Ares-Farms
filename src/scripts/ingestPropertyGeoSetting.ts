/**
 * ingestPropertyGeoSetting — the geographic features that DEFINE each
 * property's place, frozen into a committed snapshot (founder direction
 * 2026-07-17: "what makes this area special — a beach town on X Bay" — from
 * an authority that is NOT publicly editable).
 *
 * Source: USGS Geographic Names Information System (GNIS) — the federal
 * authority on official feature names. Public domain, keyless, and closed to
 * public editing (names are decided by the U.S. Board on Geographic Names).
 * This replaces any thought of Wikipedia for the geographic layer.
 *
 *   npm run ingest:property-geo-setting
 *
 * Per property: the nearest named identity-making features (bays, beaches,
 * islands, lakes, summits, forests…) within class-appropriate radii —
 * distance facts, never characterizations.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

import { PROPERTY_SOURCE_IDS, recordsForReview } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import { geocodeToCensusTract } from "../lib/scrapers/adapters/censusGeocoder";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertyGeoSettingGenerated.ts");
const GNIS_URL = (st: string) =>
  `https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_${st}_Text.zip`;

/** Identity-making feature classes and how close they must be to count (miles). */
const CLASS_RADII: Record<string, number> = {
  // Bays and seas are marked at their CENTROID, which for a big bay sits
  // miles offshore — a wider radius still means "on the bay".
  Bay: 7, Sea: 7,
  Beach: 3, Cape: 3, Channel: 3, Harbor: 3, Lagoon: 3, Island: 3,
  Lake: 2, Reservoir: 2, Falls: 2, Swamp: 2,
  Stream: 0.6,
  Summit: 3, Ridge: 3, Range: 4,
  Forest: 4, Woods: 4, Park: 4,
};

interface GeoFeature { name: string; cls: string; lat: number; lon: number }

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function loadStateFeatures(st: string): Promise<GeoFeature[]> {
  const res = await fetch(GNIS_URL(st), {
    headers: { "User-Agent": "Mozilla/5.0 (FurlongDataIngest)" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) return [];
  const zipPath = path.join(os.tmpdir(), `furlong-gnis-${st}.zip`);
  fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
  let text: string;
  try {
    text = execFileSync("unzip", ["-p", zipPath, `Text/DomesticNames_${st}.txt`], {
      maxBuffer: 256 * 1024 * 1024,
    }).toString("utf8");
  } finally {
    fs.unlinkSync(zipPath);
  }
  const lines = text.split("\n");
  const features: GeoFeature[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split("|");
    const cls = cols[2];
    if (!cls || !(cls in CLASS_RADII)) continue;
    const lat = Number(cols[15]);
    const lon = Number(cols[16]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0) continue;
    features.push({ name: cols[1], cls, lat, lon });
  }
  return features;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-geo-setting ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  // Property coordinates (stored for HUD; geocoded otherwise) grouped by state.
  const byState = new Map<string, { id: string; lat: number; lon: number }[]>();
  const needGeocode: { id: string; state: string; street: string; city: string; zip: string }[] = [];
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      const r = c.source_records[0];
      if (typeof r.latitude === "number" && typeof r.longitude === "number") {
        const list = byState.get(r.state) ?? [];
        list.push({ id: c.canonical_property_id, lat: r.latitude, lon: r.longitude });
        byState.set(r.state, list);
      } else if (r.exactAddress && r.town && r.state) {
        needGeocode.push({ id: c.canonical_property_id, state: r.state, street: r.exactAddress, city: r.town, zip: r.zip ?? "" });
      }
    }
  }
  for (const g of needGeocode) {
    const geo = await geocodeToCensusTract(g.street, g.city, g.state, g.zip).catch(() => null);
    if (geo?.lat && geo?.lon) {
      const list = byState.get(g.state) ?? [];
      list.push({ id: g.id, lat: Number(geo.lat), lon: Number(geo.lon) });
      byState.set(g.state, list);
    }
  }

  const entries: string[] = [];
  let resolved = 0;
  for (const [state, points] of [...byState.entries()].sort()) {
    const features = await loadStateFeatures(state);
    console.log(`  ${state}: ${features.length} named features · ${points.length} properties`);
    if (features.length === 0) continue;
    for (const p of points) {
      // Nearest feature PER CLASS within its radius, then closest 4 overall.
      const bestByClass = new Map<string, { name: string; cls: string; miles: number }>();
      for (const f of features) {
        const miles = haversineMiles(p.lat, p.lon, f.lat, f.lon);
        if (miles > CLASS_RADII[f.cls]) continue;
        const current = bestByClass.get(f.cls);
        if (!current || miles < current.miles) {
          bestByClass.set(f.cls, { name: f.name, cls: f.cls, miles: Math.round(miles * 10) / 10 });
        }
      }
      const top = [...bestByClass.values()].sort((a, b) => a.miles - b.miles).slice(0, 4);
      if (top.length === 0) continue;
      entries.push(`  ${JSON.stringify(p.id)}: ${JSON.stringify(top)},`);
      resolved += 1;
    }
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * propertyGeoSettingGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Nearest identity-making named geographic features per property, from the
 * USGS Geographic Names Information System (GNIS) — public domain, decided
 * by the U.S. Board on Geographic Names, NOT publicly editable.
 * Re-run: npm run ingest:property-geo-setting
 */

export const PROPERTY_GEO_SETTING_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USGS Geographic Names Information System (GNIS)",
  resolvedProperties: ${resolved},
} as const;

export interface GeoSettingFeature {
  name: string;
  /** GNIS feature class, e.g. "Bay", "Beach", "Lake", "Summit". */
  cls: string;
  miles: number;
}

export const PROPERTY_GEO_SETTING: Record<string, GeoSettingFeature[]> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${resolved} properties → ${path.relative(ROOT, OUT)}\n`);
}

main().catch((error) => {
  console.error("ingest:property-geo-setting FAILED —", error);
  process.exit(1);
});
