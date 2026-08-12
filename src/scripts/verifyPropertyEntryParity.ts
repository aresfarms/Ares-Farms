import assert from "node:assert/strict";

import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import { findCanonicalPropertyByExactAddress, findCanonicalPropertyById, recordsForReview, PROPERTY_SOURCE_IDS } from "@/lib/property/propertyData";

function governingFingerprint(href: string): string {
  const url = new URL(href, "https://furlong.test");
  const ignored = new Set(["entryMethod", "lens"]);
  return [...url.searchParams.entries()]
    .filter(([key]) => !ignored.has(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

const property = PROPERTY_SOURCE_IDS
  .flatMap((sourceId) => recordsForReview(sourceId))
  .find((candidate) => Boolean(candidate.source_records[0]?.exactAddress));

assert(property, "A canonical property with an exact address is required for the parity proof.");
const source = property.source_records[0];
const manualMatch = findCanonicalPropertyByExactAddress(source.exactAddress!);
assert(manualMatch, "Manual exact-address intake must resolve to a canonical property.");
assert.equal(manualMatch.canonical_property_id, property.canonical_property_id);
assert.equal(findCanonicalPropertyById(property.canonical_property_id)?.canonical_property_id, property.canonical_property_id);

const base = {
  propertyId: property.canonical_property_id,
  title: `${source.propertyType} in ${source.town}`,
  location: `${source.town}, ${source.state}`,
  propertyType: source.propertyType,
  priceLabel: source.price == null ? "Price not verified" : `$${source.price.toLocaleString("en-US")}`,
  vintage: source.listingDate ?? property.fetched_at,
  sourceLabel: property.source_name,
  pathways: [] as string[],
  town: source.town,
  county: source.county,
  state: source.state,
  sourceId: source.sourceId,
  exactAddress: source.exactAddress,
};

const manualHref = buildPropertyAnalysisHref({
  ...base,
  entryMethod: "manual-address",
  startingLens: "property-discovery",
});
const mapHref = buildPropertyAnalysisHref({
  ...base,
  entryMethod: "map-card",
  startingLens: "farms-agriculture",
});

assert.equal(
  governingFingerprint(manualHref),
  governingFingerprint(mapHref),
  "Entry method and lane may alter presentation context, but never governing property analysis inputs."
);

console.log(JSON.stringify({
  ok: true,
  rule: "ENTRY-PARITY-001",
  canonicalPropertyId: property.canonical_property_id,
  matchedAddress: source.exactAddress,
  governingFingerprint: governingFingerprint(manualHref),
  manualEntryMethod: new URL(manualHref, "https://furlong.test").searchParams.get("entryMethod"),
  mapEntryMethod: new URL(mapHref, "https://furlong.test").searchParams.get("entryMethod"),
}, null, 2));
