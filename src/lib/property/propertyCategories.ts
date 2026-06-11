/**
 * Property categories — the top-level grouping for the Property hub.
 *
 * The hub organizes listings CATEGORY → STATE (never a flat dump). Categories
 * map from a source record's propertyType. Categories with no live inventory are
 * hidden entirely (the hub renders only non-empty categories), so "Commercial /
 * Hospitality / Businesses" simply do not appear until their commercial
 * government adapters (GSA realestatesales.gov, Treasury, FDIC) come online.
 *
 * Edge-safe: pure data + helpers.
 */

import type { PropertySourceId } from "./propertyTypes";

export type PropertyCategoryId =
  | "homes"
  | "farms-ranches"
  | "land"
  | "commercial"
  | "hospitality"
  | "businesses"
  | "misc";

export interface PropertyCategory {
  id: PropertyCategoryId;
  label: string;
  blurb: string;
}

/** Display order = array order. */
export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  { id: "homes",         label: "Homes",               blurb: "Single-family and multifamily homes." },
  { id: "farms-ranches", label: "Farms & Ranches",     blurb: "Working farms, ranches, and agricultural land." },
  { id: "land",          label: "Land",                blurb: "Vacant land and lots." },
  { id: "commercial",    label: "Commercial",          blurb: "Retail, office, warehouse, and industrial property." },
  { id: "hospitality",   label: "Hospitality / Hotels", blurb: "Hotels, motels, and lodging." },
  { id: "businesses",    label: "Businesses",          blurb: "Operating businesses offered for sale." },
  { id: "misc",          label: "Misc",                blurb: "Property that fits no other category yet." },
];

const CATEGORY_BY_ID = new Map(PROPERTY_CATEGORIES.map((c) => [c.id, c]));

export function categoryById(id: string | null | undefined): PropertyCategory | null {
  return id ? CATEGORY_BY_ID.get(id as PropertyCategoryId) ?? null : null;
}

/**
 * Map a source record's propertyType into a top-level category. Handles the
 * current PropertyType union (home/farm/ranch/multifamily/land/other) and is
 * forward-compatible with the commercial types the future government adapters
 * will emit (retail/warehouse/hotel/business/…), so those categories light up
 * automatically once their data lands. Unknown → Misc (never dropped).
 */
export function categoryForType(propertyType: string): PropertyCategoryId {
  const t = propertyType.toLowerCase();
  if (t === "home" || t === "multifamily" || t === "house" || t === "residential") return "homes";
  if (t === "farm" || t === "ranch" || t === "agricultural") return "farms-ranches";
  if (t === "land" || t === "lot" || t === "vacant") return "land";
  if (t === "commercial" || t === "retail" || t === "office" || t === "warehouse" || t === "industrial") return "commercial";
  if (t === "hotel" || t === "motel" || t === "hospitality" || t === "lodging") return "hospitality";
  if (t === "business" || t === "operating-business") return "businesses";
  return "misc";
}

/**
 * Category for a real listing — data-driven, not just the declared type string.
 *
 * A record with NO structure (no bedrooms and no square footage) but WITH
 * acreage is genuinely Land, regardless of how its source labeled the type. This
 * correctly splits the handful of bare-parcel listings out of "Homes" without
 * mislabeling ranch-STYLE houses (3 bed / ~1,300 sq ft) as farms or ranches.
 * Everything with a structure falls through to its declared type.
 */
export function categoryForRecord(record: {
  propertyType: string;
  bedrooms: number | null;
  squareFeet: number | null;
  acreageText: string | null;
}): PropertyCategoryId {
  const hasStructure = (record.bedrooms ?? 0) > 0 || (record.squareFeet ?? 0) > 0;
  const hasAcreage = !!(record.acreageText && record.acreageText.trim());
  if (!hasStructure && hasAcreage) return "land";
  return categoryForType(record.propertyType);
}

/**
 * Illustrative financing-pathway tags carried (as navigation context only — no
 * PII) when a visitor opens the Property → Finance bridge. These describe the
 * KIND of pathway a property like this may fit; they are never an eligibility
 * determination. Providers help the visitor explore them.
 */
export function financingPathwayTags(
  sourceId: PropertySourceId,
  categoryId: PropertyCategoryId,
): string[] {
  if (categoryId === "businesses") return ["SBA"];
  if (sourceId === "usda") return ["USDA"];
  if (sourceId === "hud") return ["FHA", "Conventional"];
  return ["Conventional"];
}
