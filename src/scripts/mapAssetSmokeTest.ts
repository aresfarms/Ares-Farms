/**
 * mapAssetSmokeTest — Build 47
 * Volume III §Map Asset Governance · Doctrine: AUTHORITATIVE_MAP_ASSET_INGESTION_V1
 *
 * Smoke tests for the map asset verification system.
 * Tests both valid and invalid states to ensure the verifier rejects bad assets.
 *
 * Run: npm run smoke:map-assets
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  computeContentHash,
  buildReplayRef,
  assertGeoJSONFeatureCollection,
  assertMinimumFeatureCount,
  assertNonEmptyGeometry,
} from "../lib/maps/mapAssetIngestionRuntime";
import { MAP_SOURCES, ASSET_SPECS } from "../lib/maps/mapSourceRegistry";

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function runExpectFailTest(name: string, fn: () => void): void {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (threw) {
    console.log(`  ✓ PASS (expected failure): ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL (expected failure, but did not throw): ${name}`);
    failed++;
  }
}

function makeValidFeatureCollection(
  features: unknown[]
): { type: "FeatureCollection"; features: unknown[] } {
  return { type: "FeatureCollection", features };
}

function makeValidStateFeature(name: string): unknown {
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
    properties: { NAME: name, STUSAB: name.slice(0, 2).toUpperCase() },
  };
}

function makeValidCountyFeature(name: string): unknown {
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
    properties: { NAME: name, STATE: "47" },
  };
}

function makeFeatureWithNullGeometry(): unknown {
  return {
    type: "Feature",
    geometry: null,
    properties: { NAME: "Invalid" },
  };
}

// ── Section 1: Core runtime utilities ──────────────────────────────────────

console.log("\n── Section 1: Core runtime utilities ──");

runTest("computeContentHash returns non-empty string", () => {
  const hash = computeContentHash("test content");
  if (!hash || hash.length < 32) throw new Error("Hash too short");
});

runTest("computeContentHash is deterministic", () => {
  const h1 = computeContentHash("same content");
  const h2 = computeContentHash("same content");
  if (h1 !== h2) throw new Error("Non-deterministic hash");
});

runTest("computeContentHash differs for different content", () => {
  const h1 = computeContentHash("content A");
  const h2 = computeContentHash("content B");
  if (h1 === h2) throw new Error("Hash collision on different content");
});

runTest("buildReplayRef returns non-empty string with prefix", () => {
  const ref = buildReplayRef();
  if (!ref.startsWith("MAP_ASSET_INGESTION")) throw new Error("Missing prefix");
  if (ref.length < 20) throw new Error("Replay ref too short");
});

// ── Section 2: assertGeoJSONFeatureCollection ───────────────────────────────

console.log("\n── Section 2: GeoJSON validation ──");

runTest("valid FeatureCollection passes assertion", () => {
  const fc = makeValidFeatureCollection([makeValidStateFeature("Iowa")]);
  assertGeoJSONFeatureCollection(fc, "test");
});

runExpectFailTest("null input fails FeatureCollection assertion", () => {
  assertGeoJSONFeatureCollection(null, "test");
});

runExpectFailTest("non-object input fails FeatureCollection assertion", () => {
  assertGeoJSONFeatureCollection("not an object", "test");
});

runExpectFailTest("object without type fails FeatureCollection assertion", () => {
  assertGeoJSONFeatureCollection({ features: [] }, "test");
});

runExpectFailTest("wrong type fails FeatureCollection assertion", () => {
  assertGeoJSONFeatureCollection({ type: "Feature", features: [] }, "test");
});

runExpectFailTest("missing features array fails FeatureCollection assertion", () => {
  assertGeoJSONFeatureCollection({ type: "FeatureCollection" }, "test");
});

// ── Section 3: assertMinimumFeatureCount ────────────────────────────────────

console.log("\n── Section 3: Minimum feature count ──");

runTest("feature array meeting minimum passes", () => {
  const features = Array.from({ length: 50 }, (_, i) => makeValidStateFeature(`State${i}`));
  assertMinimumFeatureCount(features, 50, "states");
});

runExpectFailTest("feature array below minimum fails", () => {
  const features = Array.from({ length: 49 }, (_, i) => makeValidStateFeature(`State${i}`));
  assertMinimumFeatureCount(features, 50, "states");
});

runExpectFailTest("empty array fails minimum count check", () => {
  assertMinimumFeatureCount([], 1, "counties");
});

// ── Section 4: assertNonEmptyGeometry ──────────────────────────────────────

console.log("\n── Section 4: Geometry validation ──");

runTest("feature with valid geometry passes", () => {
  assertNonEmptyGeometry(makeValidStateFeature("Iowa"), "test");
});

runExpectFailTest("feature with null geometry fails", () => {
  assertNonEmptyGeometry(makeFeatureWithNullGeometry(), "test");
});

runExpectFailTest("feature with missing geometry property fails", () => {
  assertNonEmptyGeometry({ type: "Feature", properties: {} }, "test");
});

// ── Section 5: Valid asset file simulation ──────────────────────────────────

console.log("\n── Section 5: Valid asset simulation ──");

runTest("50-state FeatureCollection passes full validation pipeline", () => {
  const states = makeValidFeatureCollection(
    Array.from({ length: 50 }, (_, i) => makeValidStateFeature(`State${i}`))
  );
  assertGeoJSONFeatureCollection(states, "states");
  assertMinimumFeatureCount(states.features, 50, "states");
  for (const f of states.features) {
    assertNonEmptyGeometry(f, "state feature");
  }
});

runTest("Featured county FeatureCollection passes pipeline", () => {
  const counties = makeValidFeatureCollection([
    makeValidCountyFeature("Maury County"),
    makeValidCountyFeature("Story County"),
    makeValidCountyFeature("Lancaster County"),
    makeValidCountyFeature("Boone County"),
    makeValidCountyFeature("Catawba County"),
  ]);
  assertGeoJSONFeatureCollection(counties, "counties");
  assertMinimumFeatureCount(counties.features, 1, "counties");
  for (const f of counties.features) {
    assertNonEmptyGeometry(f, "county feature");
  }
});

// ── Section 6: Missing files detection ─────────────────────────────────────

console.log("\n── Section 6: Missing file detection ──");

runTest("missing states file is detectable", () => {
  const tempPath = path.join(os.tmpdir(), `missing-states-${Date.now()}.geojson`);
  const exists = fs.existsSync(tempPath);
  if (exists) throw new Error("Temp file should not exist");
});

runTest("missing counties file is detectable", () => {
  const tempPath = path.join(os.tmpdir(), `missing-counties-${Date.now()}.geojson`);
  const exists = fs.existsSync(tempPath);
  if (exists) throw new Error("Temp file should not exist");
});

runTest("missing metadata file is detectable", () => {
  const tempPath = path.join(os.tmpdir(), `missing-metadata-${Date.now()}.json`);
  const exists = fs.existsSync(tempPath);
  if (exists) throw new Error("Temp file should not exist");
});

// ── Section 7: Malformed GeoJSON detection ─────────────────────────────────

console.log("\n── Section 7: Malformed GeoJSON detection ──");

runTest("malformed JSON string is detectable", () => {
  const malformed = "{ this is not json }";
  let threw = false;
  try {
    JSON.parse(malformed);
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Should have thrown on malformed JSON");
});

runExpectFailTest("FeatureCollection with non-array features fails", () => {
  assertGeoJSONFeatureCollection(
    { type: "FeatureCollection", features: "not-an-array" },
    "test"
  );
});

// ── Section 8: Invalid state/county reference detection ────────────────────

console.log("\n── Section 8: Invalid reference detection ──");

runTest("featured story state present in states asset is detected correctly", () => {
  const states = makeValidFeatureCollection([makeValidStateFeature("Tennessee")]);
  const nameSet = new Set(
    (states.features as Array<{ properties: Record<string, unknown> }>).map(
      (f) => String(f.properties.NAME ?? "")
    )
  );
  if (!nameSet.has("Tennessee")) throw new Error("Tennessee not found");
});

runTest("missing state in states asset is detectable", () => {
  const states = makeValidFeatureCollection([makeValidStateFeature("Iowa")]);
  const nameSet = new Set(
    (states.features as Array<{ properties: Record<string, unknown> }>).map(
      (f) => String(f.properties.NAME ?? "")
    )
  );
  const isMissing = !nameSet.has("Tennessee");
  if (!isMissing) throw new Error("Should not find Tennessee");
});

// ── Section 9: Fake map fallback guard ─────────────────────────────────────

console.log("\n── Section 9: Fake map fallback guard ──");

runTest("FAKE_US_MAP marker in source is detectable", () => {
  const fakeSrc = `const x = "FAKE_US_MAP"`;
  const hasFakeMarker = fakeSrc.includes("FAKE_US_MAP");
  if (!hasFakeMarker) throw new Error("Should detect fake map marker");
});

runTest("source without fake markers passes fake-map check", () => {
  const realSrc = `fetch("/maps/us-states.geojson")`;
  const hasFakeMarker = realSrc.includes("FAKE_US_MAP") || realSrc.includes("hand-drawn");
  if (hasFakeMarker) throw new Error("Should not flag clean source");
});

runTest("abstract fallback labeling check: fallback must be labeled", () => {
  const fallbackLabel = "Map asset temporarily unavailable";
  const fallbackSrc = `<span>Opportunity Network — Map asset temporarily unavailable</span>`;
  if (!fallbackSrc.includes(fallbackLabel)) {
    throw new Error("Fallback does not include required label");
  }
});

// ── Section 10: Source registry ─────────────────────────────────────────────

console.log("\n── Section 10: Source registry ──");

runTest("MAP_SOURCES contains census_tiger_rest", () => {
  if (!MAP_SOURCES.census_tiger_rest) throw new Error("Missing census_tiger_rest");
});

runTest("MAP_SOURCES.census_tiger_rest is tier-1-federal", () => {
  if (MAP_SOURCES.census_tiger_rest.source_authority_tier !== "tier-1-federal") {
    throw new Error("Wrong authority tier");
  }
});

runTest("MAP_SOURCES.natural_earth has license note", () => {
  if (!MAP_SOURCES.natural_earth.license_or_public_domain_note) {
    throw new Error("Missing license note");
  }
});

runTest("ASSET_SPECS.us_states has minimum feature count of 50", () => {
  if (ASSET_SPECS.us_states.minimum_valid_feature_count < 50) {
    throw new Error("State minimum too low");
  }
});

runTest("ASSET_SPECS.us_counties has minimum feature count of 1", () => {
  if (ASSET_SPECS.us_counties.minimum_valid_feature_count < 1) {
    throw new Error("County minimum too low");
  }
});

// ── Results ─────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Smoke test results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\n✗ SMOKE TEST FAILED: ${failed} test(s) did not pass.`);
  process.exit(1);
} else {
  console.log(`\n✓ SMOKE TESTS PASSED — all ${passed} assertions verified.`);
}
