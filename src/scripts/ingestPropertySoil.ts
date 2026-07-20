/**
 * ingestPropertySoil — soil + climate facts per property, frozen into a committed
 * snapshot (founder direction 2026-07-19: wire the free public soil/climate data
 * to sharpen the farm best-use engine — "is this good cropland vs pasture vs
 * specialty"). Two PUBLIC sources, no key:
 *   - USDA-NRCS SSURGO via Soil Data Access (sdmdataaccess) — by lat/lon: the
 *     dominant soil's name, prime-farmland class, and land-capability class (1–8;
 *     1–4 = arable cropland, 5–8 = pasture/range/woodland/limited).
 *   - USDA Plant Hardiness Zone via phzmapi.org — by ZIP.
 *
 *   npm run ingest:property-soil
 *
 * Emits propertySoilGenerated: per canonical property. Failures degrade to null
 * (honest — the engine then omits the soil-grounded lines for that parcel).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_SOURCE_IDS, recordsForReview } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertySoilGenerated.ts");
const SDA_URL = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";

interface SoilFact {
  soilName: string | null;
  primeFarmland: string | null;
  /** Non-irrigated land-capability class 1–8 as a number (1–4 cropland-capable). */
  capabilityClass: number | null;
  hardinessZone: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function soilAt(lat: number, lon: number): Promise<Omit<SoilFact, "hardinessZone"> | null> {
  const query =
    `SELECT TOP 1 m.muname, m.farmlndcl, c.nirrcapcl ` +
    `FROM mapunit m INNER JOIN component c ON m.mukey=c.mukey AND c.majcompflag='Yes' ` +
    `WHERE m.mukey IN (SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lon} ${lat})'))`;
  try {
    const res = await fetch(SDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "FurlongPropertyIngest/1.0" },
      body: JSON.stringify({ query, format: "JSON" }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { Table?: string[][] };
    const row = j.Table?.[0];
    if (!row) return null;
    const capNum = Number(row[2]);
    return {
      soilName: row[0] || null,
      primeFarmland: row[1] || null,
      capabilityClass: Number.isFinite(capNum) ? capNum : null,
    };
  } catch {
    return null;
  }
}

const hardinessCache = new Map<string, string | null>();
async function hardinessForZip(zip: string): Promise<string | null> {
  const z = zip.slice(0, 5);
  if (!/^\d{5}$/.test(z)) return null;
  if (hardinessCache.has(z)) return hardinessCache.get(z) ?? null;
  try {
    const res = await fetch(`https://phzmapi.org/${z}.json`, { signal: AbortSignal.timeout(15000) });
    const zone = res.ok ? ((await res.json()) as { zone?: string }).zone ?? null : null;
    hardinessCache.set(z, zone);
    return zone;
  } catch {
    hardinessCache.set(z, null);
    return null;
  }
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:property-soil ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const points: { id: string; lat: number; lon: number; zip: string }[] = [];
  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      const r = c.source_records[0];
      if (typeof r.latitude === "number" && typeof r.longitude === "number") {
        points.push({ id: c.canonical_property_id, lat: r.latitude, lon: r.longitude, zip: r.zip ?? "" });
      }
    }
  }
  console.log(`  ${points.length} properties with coordinates`);

  const facts: Record<string, SoilFact> = {};
  let ok = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const soil = await soilAt(p.lat, p.lon);
    const hardinessZone = p.zip ? await hardinessForZip(p.zip) : null;
    if (soil || hardinessZone) {
      facts[p.id] = { ...(soil ?? { soilName: null, primeFarmland: null, capabilityClass: null }), hardinessZone };
      if (soil?.capabilityClass != null || soil?.primeFarmland) ok++;
    }
    if ((i + 1) % 50 === 0) console.log(`  …${i + 1}/${points.length} (${ok} with soil)`);
    await sleep(120);
  }
  console.log(`  resolved soil for ${ok} properties`);

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * propertySoilGenerated — GENERATED FILE. Do not edit by hand.
 * Dominant-soil + prime-farmland + land-capability (USDA-NRCS SSURGO / Soil Data
 * Access) and plant-hardiness zone (USDA / phzmapi.org), per canonical property.
 * Re-run: npm run ingest:property-soil
 */

export const PROPERTY_SOIL_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)} as string | null,
  source: "USDA-NRCS SSURGO (Soil Data Access) + USDA Plant Hardiness (phzmapi.org), public domain",
  resolvedProperties: ${Object.keys(facts).length},
} as const;

export interface PropertySoilFact {
  soilName: string | null;
  primeFarmland: string | null;
  /** Non-irrigated land-capability class 1–8 (1–4 = arable cropland). */
  capabilityClass: number | null;
  hardinessZone: string | null;
}

export const PROPERTY_SOIL: Record<string, PropertySoilFact> = ${JSON.stringify(facts, null, 0)};
`,
    "utf8"
  );
  console.log(`  wrote ${Object.keys(facts).length} property soil records\n`);
}

main().catch((error) => {
  console.error("ingest:property-soil FAILED —", error);
  process.exit(1);
});
