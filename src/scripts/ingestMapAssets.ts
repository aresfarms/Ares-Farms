/**
 * ingestMapAssets — Build 47
 * Volume III §Map Asset Governance · Doctrine: AUTHORITATIVE_MAP_ASSET_INGESTION_V1
 *
 * Downloads authoritative U.S. geographic boundary data from U.S. Census Bureau
 * TIGER Web Services (GeoJSON REST API) and caches it in public/maps/.
 *
 * Run: npm run ingest:map-assets
 *
 * This script must be run before first deployment and whenever map assets
 * need to be refreshed. It does NOT run during visitor page load.
 */

import fs from "node:fs";
import path from "node:path";
import {
  runtimeGuard,
  computeContentHash,
  buildReplayRef,
  assertGeoJSONFeatureCollection,
  assertMinimumFeatureCount,
  assertNonEmptyGeometry,
  type MapAssetMetadata,
  type AssetRecord,
  MAP_ASSET_INGESTION_RUNTIME_VERSION,
} from "../lib/maps/mapAssetIngestionRuntime";
import {
  MAP_SOURCES,
  CENSUS_TIGER_STATES_URL,
  FEATURED_COUNTY_QUERIES,
  censusTigerCountyUrl,
} from "../lib/maps/mapSourceRegistry";

runtimeGuard();

const PUBLIC_MAPS_DIR = path.resolve(process.cwd(), "public", "maps");
const GENERATED_BY = `ingestMapAssets@${MAP_ASSET_INGESTION_RUNTIME_VERSION}`;

const STATE_SIMPLIFICATION_TOLERANCE = 0.01;
const COUNTY_SIMPLIFICATION_TOLERANCE = 0.0025;
type Position = [number, number];

function squaredSegmentDistance(point: Position, start: Position, end: Position): number {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = end[0]; y = end[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyOpenLine(points: Position[], tolerance: number): Position[] {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxDistance = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const distance = squaredSegmentDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) { index = i; maxDistance = distance; }
    }
    if (index >= 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, index) => keep[index] === 1);
}

function simplifyRing(value: unknown, tolerance: number): unknown {
  if (!Array.isArray(value) || value.length < 4) return value;
  const points = value.filter((point): point is Position =>
    Array.isArray(point) && point.length >= 2 &&
    typeof point[0] === "number" && typeof point[1] === "number"
  );
  if (points.length !== value.length) return value;
  const closed = points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1];
  const body = closed ? points.slice(0, -1) : points;
  if (body.length < 3) return value;
  const simplified = simplifyOpenLine([...body, body[0]], tolerance).slice(0, -1);
  if (simplified.length < 3) return value;
  return [...simplified, simplified[0]];
}

function simplifyGeometry(geometry: unknown, tolerance: number): unknown {
  if (!geometry || typeof geometry !== "object") return geometry;
  const candidate = geometry as { type?: unknown; coordinates?: unknown };
  if (candidate.type === "Polygon" && Array.isArray(candidate.coordinates)) {
    return { ...candidate, coordinates: candidate.coordinates.map((ring) => simplifyRing(ring, tolerance)) };
  }
  if (candidate.type === "MultiPolygon" && Array.isArray(candidate.coordinates)) {
    return { ...candidate, coordinates: candidate.coordinates.map((polygon) =>
      Array.isArray(polygon) ? polygon.map((ring) => simplifyRing(ring, tolerance)) : polygon
    ) };
  }
  return geometry;
}

function simplifyFeatureCollection<T extends { features: unknown[] }>(collection: T, tolerance: number): T {
  return {
    ...collection,
    features: collection.features.map((feature) => {
      if (!feature || typeof feature !== "object") return feature;
      const candidate = feature as { geometry?: unknown };
      return { ...candidate, geometry: simplifyGeometry(candidate.geometry, tolerance) };
    }),
  };
}

async function fetchGeoJSON(url: string, label: string): Promise<unknown> {
  console.log(`  Fetching ${label}…`);
  const res = await fetch(url, {
    headers: { "User-Agent": "ares-farms-map-ingestion/1.0 (contact: ops@furlong.io)" },
  });
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} fetching ${label} from ${url}`
    );
  }
  const json = await res.json();
  return json;
}

function mergeFeatureCollections(
  collections: Array<{ type: string; features: unknown[] }>
): { type: "FeatureCollection"; features: unknown[] } {
  const allFeatures: unknown[] = [];
  for (const col of collections) {
    allFeatures.push(...col.features);
  }
  return { type: "FeatureCollection", features: allFeatures };
}

async function ingestStates(): Promise<AssetRecord> {
  const source = MAP_SOURCES.census_tiger_rest;
  const url = CENSUS_TIGER_STATES_URL;
  const generatedAt = new Date().toISOString();

  const raw = await fetchGeoJSON(url, "U.S. states (Census TIGER)");
  assertGeoJSONFeatureCollection(raw, "states ingestion");
  assertMinimumFeatureCount(raw.features, 50, "states");
  for (const f of raw.features) {
    assertNonEmptyGeometry(f, "states feature");
  }

  const simplified = simplifyFeatureCollection(raw, STATE_SIMPLIFICATION_TOLERANCE);
  const content = JSON.stringify(simplified);
  const contentHash = computeContentHash(content);
  const outputPath = path.join(PUBLIC_MAPS_DIR, "us-states.geojson");
  fs.writeFileSync(outputPath, content, "utf-8");

  console.log(
    `  ✓ States: ${raw.features.length} features → ${outputPath} [sha256:${contentHash.slice(0, 12)}…]`
  );

  return {
    filename: "us-states.geojson",
    content_hash: contentHash,
    feature_count: raw.features.length,
    source_name: source.source_name,
    source_url: url,
    source_authority_tier: source.source_authority_tier,
    license_or_public_domain_note: source.license_or_public_domain_note,
    fetched_at: generatedAt,
  };
}

async function ingestCounties(): Promise<AssetRecord> {
  const source = MAP_SOURCES.census_tiger_rest;
  const generatedAt = new Date().toISOString();
  const collections: Array<{ type: string; features: unknown[] }> = [];
  const fetchedUrls: string[] = [];

  for (const q of FEATURED_COUNTY_QUERIES) {
    const url = censusTigerCountyUrl(q.stateFips, q.county);
    fetchedUrls.push(url);
    const raw = await fetchGeoJSON(url, `${q.county}, ${q.state}`);
    assertGeoJSONFeatureCollection(raw, `county: ${q.county}`);
    if (raw.features.length === 0) {
      console.warn(
        `  ⚠ No features returned for ${q.county}, ${q.state}. Continuing.`
      );
    }
    for (const f of raw.features) {
      assertNonEmptyGeometry(f, `county: ${q.county}`);
    }
    collections.push(raw as { type: string; features: unknown[] });
  }

  const merged = mergeFeatureCollections(collections);
  const simplified = simplifyFeatureCollection(merged, COUNTY_SIMPLIFICATION_TOLERANCE);
  const content = JSON.stringify(simplified);
  const contentHash = computeContentHash(content);
  const outputPath = path.join(PUBLIC_MAPS_DIR, "us-counties.geojson");
  fs.writeFileSync(outputPath, content, "utf-8");

  console.log(
    `  ✓ Counties: ${merged.features.length} features → ${outputPath} [sha256:${contentHash.slice(0, 12)}…]`
  );

  return {
    filename: "us-counties.geojson",
    content_hash: contentHash,
    feature_count: merged.features.length,
    source_name: source.source_name,
    source_url: fetchedUrls.join("; "),
    source_authority_tier: source.source_authority_tier,
    license_or_public_domain_note: source.license_or_public_domain_note,
    fetched_at: generatedAt,
  };
}

async function writeMetadata(
  statesRecord: AssetRecord,
  countiesRecord: AssetRecord
): Promise<void> {
  const now = new Date().toISOString();
  const replayRef = buildReplayRef();
  const source = MAP_SOURCES.census_tiger_rest;

  const combinedHash = computeContentHash(
    statesRecord.content_hash + countiesRecord.content_hash
  );

  const metadata: MapAssetMetadata = {
    source_name: source.source_name,
    source_url: source.base_url,
    source_authority_tier: source.source_authority_tier,
    source_version_or_year: "2023",
    fetched_at: now,
    content_hash: combinedHash,
    license_or_public_domain_note: source.license_or_public_domain_note,
    simplification_level:
      `Cartographic boundary — Census TIGER State_County MapServer (geometryPrecision=4); topology-preserving coordinate simplification states=${STATE_SIMPLIFICATION_TOLERANCE}, counties=${COUNTY_SIMPLIFICATION_TOLERANCE}`,
    replay_ref: replayRef,
    generated_by: GENERATED_BY,
    generated_at: now,
    assets: {
      "us-states.geojson": statesRecord,
      "us-counties.geojson": countiesRecord,
    },
  };

  const outputPath = path.join(PUBLIC_MAPS_DIR, "us-map-metadata.json");
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`  ✓ Metadata written → ${outputPath}`);
  console.log(`  replay_ref: ${replayRef}`);
}

async function main(): Promise<void> {
  console.log("=== ingestMapAssets — Build 47 ===");
  console.log(
    "Source authority: U.S. Census Bureau TIGER Web Services (federal, public domain)"
  );
  console.log("");

  if (!fs.existsSync(PUBLIC_MAPS_DIR)) {
    fs.mkdirSync(PUBLIC_MAPS_DIR, { recursive: true });
  }

  console.log("Ingesting state boundaries…");
  const statesRecord = await ingestStates();

  console.log("Ingesting featured county boundaries…");
  const countiesRecord = await ingestCounties();

  console.log("Writing asset metadata…");
  await writeMetadata(statesRecord, countiesRecord);

  console.log("");
  console.log("=== Ingestion complete ===");
  console.log(
    "Run `npm run verify:map-assets` to confirm assets are valid."
  );
}

main().catch((err) => {
  console.error("FATAL: ingestMapAssets failed:", err);
  process.exit(1);
});
