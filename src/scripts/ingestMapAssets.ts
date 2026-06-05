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

  const content = JSON.stringify(raw, null, 2);
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
  const content = JSON.stringify(merged, null, 2);
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
      "Cartographic boundary — Census TIGER State_County MapServer (geometryPrecision=4)",
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
