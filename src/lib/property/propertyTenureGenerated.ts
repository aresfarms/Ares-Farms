/**
 * propertyTenureGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Tract-level owner-occupancy per property (ACS 5-year, table B25003 TENURE).
 * PLACEHOLDER: empty until the owner-run ingest executes (the Census API
 * requires an owner-registered key):
 *   CENSUS_API_KEY=<key> npx tsx src/scripts/ingestCensusTenure.ts
 * The brief renders NO tenure fact while this is empty (render-time honesty).
 */

export const PROPERTY_TENURE_PROVENANCE = {
  asOf: "pending",
  acsVintage: "ACS 5-year estimates, table B25003 (TENURE)",
  source: "U.S. Census Bureau API (api.census.gov)",
  license: "Public domain (U.S. Government work)",
  resolvedProperties: 0,
} as const;

export interface PropertyTenureFact {
  /** Share of occupied housing units in the tract that are owner-occupied (0-100). */
  ownerOccupiedPct: number;
  /** Total occupied units in the tract (estimate denominator). */
  occupiedUnits: number;
}

export const PROPERTY_TENURE_FACTS: Record<string, PropertyTenureFact> = {};
