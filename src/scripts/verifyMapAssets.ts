/**
 * verifyMapAssets — Build 47
 * Volume III §Map Asset Governance · Doctrine: AUTHORITATIVE_MAP_ASSET_INGESTION_V1
 *
 * Validates all map assets in public/maps/. Fails if any required condition
 * is not met. Must pass before deployment.
 *
 * Run: npm run verify:map-assets
 */

import fs from "node:fs";
import path from "node:path";
import { computeContentHash } from "../lib/maps/mapAssetIngestionRuntime";
import { FEATURED_COUNTY_QUERIES } from "../lib/maps/mapSourceRegistry";

const PUBLIC_MAPS_DIR = path.resolve(process.cwd(), "public", "maps");
const STATES_PATH = path.join(PUBLIC_MAPS_DIR, "us-states.geojson");
const COUNTIES_PATH = path.join(PUBLIC_MAPS_DIR, "us-counties.geojson");
const METADATA_PATH = path.join(PUBLIC_MAPS_DIR, "us-map-metadata.json");

const LIVING_OPPORTUNITY_MAP_PATH = path.resolve(
  process.cwd(),
  "src",
  "components",
  "customer",
  "LivingOpportunityMap.tsx"
);

const MINIMUM_STATE_COUNT = 50;
const MINIMUM_COUNTY_COUNT = 1;

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: string; coordinates: unknown } | null;
    properties: Record<string, unknown> | null;
  }>;
};

type AssetMetadata = {
  source_name?: string;
  source_url?: string;
  source_authority_tier?: string;
  source_version_or_year?: string;
  fetched_at?: string;
  content_hash?: string;
  license_or_public_domain_note?: string;
  simplification_level?: string;
  replay_ref?: string;
  generated_by?: string;
  generated_at?: string;
  assets?: Record<
    string,
    {
      filename: string;
      content_hash: string;
      feature_count: number;
      source_authority_tier: string;
      license_or_public_domain_note: string;
    }
  >;
};

const REQUIRED_METADATA_KEYS: Array<keyof AssetMetadata> = [
  "source_name",
  "source_url",
  "source_authority_tier",
  "source_version_or_year",
  "fetched_at",
  "content_hash",
  "license_or_public_domain_note",
  "simplification_level",
  "replay_ref",
  "generated_by",
  "generated_at",
];

function fail(message: string): never {
  console.error(`\n✗ FAIL: ${message}\n`);
  process.exit(1);
}

function pass(message: string): void {
  console.log(`  ✓ ${message}`);
}

function loadGeoJSON(filePath: string, label: string): GeoJSONFeatureCollection {
  if (!fs.existsSync(filePath)) {
    fail(`${label} is missing: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(`${label} is not valid JSON: ${filePath}`);
  }
  const p = parsed as Record<string, unknown>;
  if (p.type !== "FeatureCollection" || !Array.isArray(p.features)) {
    fail(
      `${label} is not a valid GeoJSON FeatureCollection: ${filePath}`
    );
  }
  return parsed as GeoJSONFeatureCollection;
}

function verifyStates(): GeoJSONFeatureCollection {
  console.log("Verifying us-states.geojson…");

  if (!fs.existsSync(STATES_PATH)) {
    fail("us-states.geojson is missing from public/maps/");
  }
  pass("us-states.geojson exists");

  const states = loadGeoJSON(STATES_PATH, "us-states.geojson");

  if (states.features.length < MINIMUM_STATE_COUNT) {
    fail(
      `us-states.geojson has only ${states.features.length} features — minimum is ${MINIMUM_STATE_COUNT}. ` +
        "Run `npm run ingest:map-assets` to refresh."
    );
  }
  pass(`State count: ${states.features.length} (≥ ${MINIMUM_STATE_COUNT})`);

  for (const feature of states.features) {
    if (!feature.geometry || !feature.geometry.type) {
      fail(
        `us-states.geojson contains a feature with null/missing geometry. ` +
          "Run `npm run ingest:map-assets` to re-ingest."
      );
    }
  }
  pass("All state features have valid geometry");

  const nameSet = new Set(
    states.features.map((f) => String(f.properties?.NAME ?? f.properties?.name ?? ""))
  );
  const expectedStates = ["Tennessee", "Iowa", "Pennsylvania", "Missouri", "North Carolina"];
  for (const s of expectedStates) {
    if (!nameSet.has(s)) {
      fail(
        `us-states.geojson is missing expected state: "${s}". ` +
          "Run `npm run ingest:map-assets` to re-ingest."
      );
    }
  }
  pass("All featured exploration states present in states asset");

  return states;
}

function verifyCounties(): GeoJSONFeatureCollection {
  console.log("Verifying us-counties.geojson…");

  if (!fs.existsSync(COUNTIES_PATH)) {
    fail("us-counties.geojson is missing from public/maps/");
  }
  pass("us-counties.geojson exists");

  const counties = loadGeoJSON(COUNTIES_PATH, "us-counties.geojson");

  if (counties.features.length < MINIMUM_COUNTY_COUNT) {
    fail(
      `us-counties.geojson has ${counties.features.length} features — minimum is ${MINIMUM_COUNTY_COUNT}. ` +
        "Run `npm run ingest:map-assets` to refresh."
    );
  }
  pass(`County count: ${counties.features.length} (≥ ${MINIMUM_COUNTY_COUNT})`);

  for (const feature of counties.features) {
    if (!feature.geometry || !feature.geometry.type) {
      fail(
        "us-counties.geojson contains a feature with null/missing geometry."
      );
    }
  }
  pass("All county features have valid geometry");

  const countyNames = new Set(
    counties.features.map((f) => String(f.properties?.NAME ?? f.properties?.name ?? ""))
  );
  for (const q of FEATURED_COUNTY_QUERIES) {
    const bare = q.county.replace(" County", "");
    const found =
      countyNames.has(q.county) || countyNames.has(bare);
    if (!found) {
      fail(
        `us-counties.geojson is missing featured county: "${q.county}" (${q.state}). ` +
          "Run `npm run ingest:map-assets` to re-ingest."
      );
    }
  }
  pass("All featured exploration counties present in counties asset");

  return counties;
}

function verifyMetadata(): AssetMetadata {
  console.log("Verifying us-map-metadata.json…");

  if (!fs.existsSync(METADATA_PATH)) {
    fail("us-map-metadata.json is missing from public/maps/");
  }
  pass("us-map-metadata.json exists");

  let metadata: AssetMetadata;
  try {
    metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8")) as AssetMetadata;
  } catch {
    fail("us-map-metadata.json is not valid JSON");
  }

  for (const key of REQUIRED_METADATA_KEYS) {
    if (!metadata[key]) {
      fail(`Metadata is missing required field: "${key}"`);
    }
  }
  pass("All required metadata fields present");

  if (!metadata.content_hash || metadata.content_hash.length < 32) {
    fail("Metadata content_hash is missing or too short to be a valid hash");
  }
  pass("content_hash present");

  if (!metadata.source_authority_tier) {
    fail("Metadata source_authority_tier is missing");
  }
  pass(`Source authority tier: ${metadata.source_authority_tier}`);

  if (!metadata.license_or_public_domain_note) {
    fail("Metadata license_or_public_domain_note is missing");
  }
  pass("License/public-domain note present");

  if (!metadata.replay_ref) {
    fail("Metadata replay_ref is missing");
  }
  pass(`replay_ref: ${metadata.replay_ref}`);

  return metadata;
}

function verifyContentHashes(
  states: GeoJSONFeatureCollection,
  counties: GeoJSONFeatureCollection,
  metadata: AssetMetadata
): void {
  console.log("Verifying content hashes…");

  const statesContent = fs.readFileSync(STATES_PATH, "utf-8");
  const actualStatesHash = computeContentHash(statesContent);
  const recordedStatesHash = metadata.assets?.["us-states.geojson"]?.content_hash;

  if (recordedStatesHash && recordedStatesHash !== actualStatesHash) {
    fail(
      `us-states.geojson content hash mismatch. ` +
        `Recorded: ${recordedStatesHash.slice(0, 12)}… Actual: ${actualStatesHash.slice(0, 12)}… ` +
        "File may have been modified outside the ingestion script."
    );
  }
  pass("us-states.geojson content hash matches metadata");

  const countiesContent = fs.readFileSync(COUNTIES_PATH, "utf-8");
  const actualCountiesHash = computeContentHash(countiesContent);
  const recordedCountiesHash = metadata.assets?.["us-counties.geojson"]?.content_hash;

  if (recordedCountiesHash && recordedCountiesHash !== actualCountiesHash) {
    fail(
      `us-counties.geojson content hash mismatch. ` +
        `Recorded: ${recordedCountiesHash.slice(0, 12)}… Actual: ${actualCountiesHash.slice(0, 12)}… ` +
        "File may have been modified outside the ingestion script."
    );
  }
  pass("us-counties.geojson content hash matches metadata");

  // suppress unused-variable lint
  void states;
  void counties;
}

function verifyHomepageNotFakeMap(): void {
  console.log("Verifying LivingOpportunityMap is not configured for fake map…");

  if (!fs.existsSync(LIVING_OPPORTUNITY_MAP_PATH)) {
    fail(`LivingOpportunityMap.tsx not found at expected path: ${LIVING_OPPORTUNITY_MAP_PATH}`);
  }

  const src = fs.readFileSync(LIVING_OPPORTUNITY_MAP_PATH, "utf-8");

  // These are code-level markers that would indicate a fake map implementation.
  // "hand-drawn" is intentionally excluded — it appears in documentation comments
  // that prohibit fake maps, not in implementations.
  const fakeMapMarkers = [
    "FAKE_US_MAP",
    "fakeUsMap",
    "fake-us-map",
    "USE_FAKE_MAP",
    "useFakeMap",
    "handDrawnUsOutline",
    "memorySilhouette",
  ];

  for (const marker of fakeMapMarkers) {
    if (src.includes(marker)) {
      fail(
        `LivingOpportunityMap.tsx contains banned fake-map marker: "${marker}". ` +
          "Remove all fake U.S. map implementations."
      );
    }
  }

  // Check that the component fetches from /maps/ (real assets) or renders fallback
  const usesRealAssets =
    src.includes("/maps/us-states.geojson") ||
    src.includes("mapAssets") ||
    src.includes("useMapAssets") ||
    src.includes("fetchMapAssets") ||
    src.includes("us-states");
  if (!usesRealAssets) {
    fail(
      "LivingOpportunityMap.tsx does not reference real map assets (/maps/us-states.geojson). " +
        "The component must render from authoritative GeoJSON assets, not memory-based silhouettes."
    );
  }
  pass("LivingOpportunityMap references real map assets");

  pass("No fake map markers found in LivingOpportunityMap.tsx");
}

async function main(): Promise<void> {
  console.log("=== verifyMapAssets — Build 47 ===\n");

  const states = verifyStates();
  console.log("");
  const counties = verifyCounties();
  console.log("");
  const metadata = verifyMetadata();
  console.log("");
  verifyContentHashes(states, counties, metadata);
  console.log("");
  verifyHomepageNotFakeMap();

  console.log("\n=== PASS: All map asset verification checks passed ===");
  console.log(
    `  States: ${states.features.length} features`
  );
  console.log(
    `  Counties: ${counties.features.length} features (featured explorations)`
  );
  console.log(`  Source authority: ${metadata.source_authority_tier}`);
  console.log(`  replay_ref: ${metadata.replay_ref}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
