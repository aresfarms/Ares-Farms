import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const brief = read("src/lib/property/propertyBriefIntelligence.ts");
const imported = read("src/lib/property/importedPropertyVerification.ts");
const flood = read("src/lib/scrapers/adapters/femaHistoric.ts");
const geocoder = read("src/lib/scrapers/adapters/censusGeocoder.ts");
const prefetch = read("src/lib/property/propertyFactsPrefetch.ts");

assert.match(brief, /PUBLIC_ENV_LOOKUP_BUDGET_MS = 4_500/);
assert.match(brief, /settleEnvironmentalLookupWithin\(fetchSoilProfile/);
assert.match(brief, /settleEnvironmentalLookupWithin\(fetchClimateNormals/);
assert.match(brief, /settleEnvironmentalLookupWithin\(fetchEpaFacilityScreen/);
assert.match(brief, /settleEnvironmentalLookupWithin\(fetchUsdaRuralEligibility/);
assert.match(imported, /geocodeToCensusTract\([\s\S]*?\{ timeoutMs: 3_500 \}\)/);
assert.match(imported, /queryFloodZone\([\s\S]*?\{ timeoutMs: 2_500, attempts: 2 \}\)/);
assert.match(geocoder, /options\?\.timeoutMs \?\? 10_000/);
assert.match(flood, /options\?\.timeoutMs \?\? 15_000/);
assert.match(flood, /options\?\.attempts \?\? 6/);
assert.match(prefetch, /startPropertyFactsPrefetch/);

console.log(JSON.stringify({
  ok: true,
  rule: "PROPERTY-FACTS-LATENCY-BUDGET-001",
  publicPath: {
    geocoderTimeoutMs: 3500,
    femaTimeoutMs: 2500,
    femaAttempts: 2,
    environmentalSoftBudgetMs: 4500,
    prefetchEnabled: true,
  },
  durableIngestDefaultsPreserved: {
    geocoderTimeoutMs: 10000,
    femaTimeoutMs: 15000,
    femaAttempts: 6,
  },
  timeoutSemantics: "unknown/fail-safe; never converted to a negative property finding",
}, null, 2));
