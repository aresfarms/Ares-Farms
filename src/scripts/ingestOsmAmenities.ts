/**
 * ingestOsmAmenities — daily-life amenity facts per LIVE property, frozen into
 * a committed snapshot (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15: groceries,
 * parks, playgrounds, dog parks, vets, dining, pharmacy, healthcare — as
 * distance/count FACTS, never characterizations).
 *
 * Source: OpenStreetMap via the Overpass API. LICENSE: ODbL — every rendered
 * fact MUST carry "© OpenStreetMap contributors (ODbL)" attribution (the read
 * module bakes it into provenance). Fair use respected: one bounded query per
 * property, sequential, with a delay.
 *
 * Coordinates mirror ingest:property-flood-historic: HUD records carry
 * server-only lat/long; others geocode once via the shared Census geocoder.
 * Resumable (presence = checked). Run: npm run ingest:osm-amenities [-- --limit N]
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROPERTY_SOURCE_IDS, recordsForReview } from "../lib/property/propertyData";
import { isSourceLiveRuntime } from "../lib/property/sourceActivationStore";
import { geocodeToCensusTract } from "../lib/scrapers/adapters/censusGeocoder";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertyAmenitiesGenerated.ts");
const OVERPASS = "https://overpass-api.de/api/interpreter";
// Overpass usage policy requires an identifying User-Agent.
const USER_AGENT = "FurlongPlaceBrief/1.0 (property amenity ingest; chudson@aresfarmsinc.com)";
const RADIUS_M = 16000; // ~10 miles — rural-honest: nearest-town amenities still register
const limitArg = process.argv.find((a) => a.startsWith("--limit"));
const LIMIT = limitArg ? Number(process.argv[process.argv.indexOf(limitArg) + 1] ?? "700") : 700;

export interface AmenityCategoryFact {
  count: number;
  nearestName: string | null;
  nearestMiles: number | null;
}
type Fact = Record<string, AmenityCategoryFact>;

const CATEGORIES: Record<string, (t: Record<string, string>) => boolean> = {
  grocery: (t) => /^(supermarket|greengrocer|convenience)$/.test(t.shop ?? ""),
  park: (t) => t.leisure === "park",
  playground: (t) => t.leisure === "playground",
  dogPark: (t) => t.leisure === "dog_park",
  vet: (t) => t.amenity === "veterinary",
  dining: (t) => /^(restaurant|cafe|bar|pub|fast_food)$/.test(t.amenity ?? ""),
  pharmacy: (t) => t.amenity === "pharmacy",
  healthcare: (t) => /^(hospital|clinic|doctors)$/.test(t.amenity ?? ""),
};

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function readExisting(): Record<string, Fact> {
  try {
    const src = fs.readFileSync(OUT, "utf8");
    const m = src.match(/PROPERTY_AMENITY_FACTS[^=]*=\s*(\{[\s\S]*?\n\});/);
    if (m) return Function(`return ${m[1]}`)() as Record<string, Fact>;
  } catch {}
  return {};
}

async function queryAmenities(lat: number, lon: number): Promise<Fact | null> {
  const q = `[out:json][timeout:25];
(
  nwr(around:${RADIUS_M},${lat},${lon})["shop"~"^(supermarket|convenience|greengrocer)$"];
  nwr(around:${RADIUS_M},${lat},${lon})["leisure"~"^(park|playground|dog_park)$"];
  nwr(around:${RADIUS_M},${lat},${lon})["amenity"~"^(veterinary|restaurant|cafe|bar|pub|fast_food|pharmacy|hospital|clinic|doctors)$"];
);
out center tags 400;`;
  const res = await fetch(OVERPASS, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT },
    body: new URLSearchParams({ data: q }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    elements?: Array<{ lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
  };
  const fact: Fact = {};
  for (const key of Object.keys(CATEGORIES)) {
    fact[key] = { count: 0, nearestName: null, nearestMiles: null };
  }
  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const eLat = el.lat ?? el.center?.lat;
    const eLon = el.lon ?? el.center?.lon;
    if (typeof eLat !== "number" || typeof eLon !== "number") continue;
    const miles = haversineMiles(lat, lon, eLat, eLon);
    for (const [key, match] of Object.entries(CATEGORIES)) {
      if (!match(tags)) continue;
      const cat = fact[key];
      cat.count += 1;
      if (cat.nearestMiles === null || miles < cat.nearestMiles) {
        cat.nearestMiles = Math.round(miles * 10) / 10;
        cat.nearestName = tags.name ?? null;
      }
    }
  }
  return fact;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:osm-amenities ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const existing = readExisting();
  const points: { id: string; lon: number; lat: number }[] = [];
  let needGeocode: { id: string; street: string; city: string; state: string; zip: string }[] = [];

  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      if (existing[c.canonical_property_id]) continue;
      const r = c.source_records[0];
      if (typeof r.latitude === "number" && typeof r.longitude === "number") {
        points.push({ id: c.canonical_property_id, lon: r.longitude, lat: r.latitude });
      } else if (r.exactAddress && r.town && r.state) {
        needGeocode.push({ id: c.canonical_property_id, street: r.exactAddress, city: r.town, state: r.state, zip: r.zip ?? "" });
      }
    }
  }
  console.log(`  already resolved: ${Object.keys(existing).length} · stored coords: ${points.length} · need geocode: ${needGeocode.length} · cap: ${LIMIT}`);

  needGeocode = needGeocode.slice(0, Math.max(0, LIMIT - Math.min(points.length, LIMIT)));
  for (const g of needGeocode) {
    const geo = await geocodeToCensusTract(g.street, g.city, g.state, g.zip).catch(() => null);
    if (geo?.lat && geo?.lon) points.push({ id: g.id, lon: Number(geo.lon), lat: Number(geo.lat) });
  }

  const batch = points.slice(0, LIMIT);
  const facts: Record<string, Fact> = { ...existing };
  let done = 0;
  for (const p of batch) {
    const fact = await queryAmenities(p.lat, p.lon).catch(() => null);
    if (fact) facts[p.id] = fact;
    done += 1;
    if (done % 20 === 0) console.log(`  …${done}/${batch.length} (total ${Object.keys(facts).length})`);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Overpass fair use
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const entries = Object.entries(facts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, f]) => `  ${JSON.stringify(id)}: ${JSON.stringify(f)},`)
    .join("\n");

  fs.writeFileSync(
    OUT,
    `/**
 * propertyAmenitiesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Daily-life amenity facts per LIVE property within ~5 miles, resolved offline
 * via the Overpass API. LICENSE: ODbL — rendered facts must credit
 * "© OpenStreetMap contributors (ODbL)". Resumable; presence = checked.
 * Re-run: npm run ingest:osm-amenities
 */

export const PROPERTY_AMENITIES_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  source: "OpenStreetMap via Overpass API",
  license: "ODbL — © OpenStreetMap contributors",
  radiusMiles: 10,
  resolvedProperties: ${Object.keys(facts).length},
} as const;

export interface AmenityCategoryFact {
  count: number;
  nearestName: string | null;
  nearestMiles: number | null;
}

export const PROPERTY_AMENITY_FACTS: Record<string, Record<string, AmenityCategoryFact>> = {
${entries}
};
`,
    "utf8"
  );
  console.log(`  resolved this run: ${done} · total: ${Object.keys(facts).length} · wrote ${path.relative(ROOT, OUT)}\n`);
}

main().catch((e) => { console.error("ingest:osm-amenities FAILED —", e); process.exit(1); });
