/**
 * propertyAmenitiesGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Daily-life amenity facts per LIVE property within ~5 miles, resolved offline
 * via the Overpass API. LICENSE: ODbL — rendered facts must credit
 * "© OpenStreetMap contributors (ODbL)". PLACEHOLDER: empty until
 * `npm run ingest:osm-amenities` runs; the brief renders NO amenity fact while
 * empty (render-time honesty) and keeps the daily-life honest-unknown instead.
 */

export const PROPERTY_AMENITIES_PROVENANCE = {
  asOf: "pending",
  source: "OpenStreetMap via Overpass API",
  license: "ODbL — © OpenStreetMap contributors",
  radiusMiles: 10,
  resolvedProperties: 0,
} as const;

export interface AmenityCategoryFact {
  count: number;
  nearestName: string | null;
  nearestMiles: number | null;
}

export const PROPERTY_AMENITY_FACTS: Record<string, Record<string, AmenityCategoryFact>> = {};
