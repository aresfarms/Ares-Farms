/**
 * Search-and-bring-back guidance (implementation rule, 2026-06-11).
 *
 * HONESTY RULE: Furlong must NOT claim it found real candidate properties
 * unless the candidate source, listing/feed, parcel resolver, and source
 * permissions are LIVE AND VERIFIED. None are yet (`CANDIDATE_SOURCES_LIVE` =
 * false), so open discovery suggests legitimate SEARCH CRITERIA, permitted-use
 * direction, property types, external-site filters, and what to paste back
 * into the Navigator — it never invents property matches or implies live
 * inventory coverage that does not exist.
 */

import type { PropertyContext } from "./possibilityCheck";

/** Flipped only when feed + resolver + permissions are live AND human-verified. */
export const CANDIDATE_SOURCES_LIVE = false;

export interface SearchGuidance {
  honestyNote: string;
  criteria: string[];
  propertyTypes: string[];
  filters: string[];
  bringBack: string;
}

export function buildSearchGuidance(c: PropertyContext): SearchGuidance {
  const kind = c.propertyKind;
  const base: SearchGuidance = {
    honestyNote:
      "We won't pretend to have candidate properties — our live candidate feed isn't switched on yet. " +
      "What we CAN do is sharpen exactly what to search for, and analyze anything you bring back.",
    criteria: [],
    propertyTypes: [],
    filters: [],
    bringBack:
      "When something catches your eye on Zillow, Redfin, Crexi, or LoopNet, paste the link (or the address) " +
      "back here and the Navigator will run the full reality check on it.",
  };
  if (kind === "farm") {
    base.criteria = [
      "Acreage with documented water access (well, surface rights, or municipal)",
      "Outside Special Flood Hazard Areas unless priced for it",
      "Agricultural or ag-residential zoning (check the county's permitted-use table)",
    ];
    base.propertyTypes = ["farms & ranches", "raw land with ag zoning", "homesteads with outbuildings"];
    base.filters = [
      "Zillow/Redfin: lot size ≥ 10 acres, keyword 'farm' or 'pasture'",
      "LandWatch/Land.com: filter by water features + road frontage",
      "Crexi/LoopNet: agricultural land category, owner-user listings",
    ];
  } else if (kind === "commercial") {
    base.criteria = [
      "Zoning that already permits your intended use (avoid variance-dependent deals)",
      "Utility capacity on-site (3-phase power, water/sewer taps)",
      "Truck/customer access appropriate to the operation",
    ];
    base.propertyTypes = ["light industrial / flex", "retail storefront", "mixed-use"];
    base.filters = ["Crexi/LoopNet: filter by zoning + building class + lot size", "Set price-per-SF alerts rather than total price"];
  } else {
    base.criteria = [
      "Lots with usable outdoor space or enclosed structures (income optionality)",
      "Jurisdictions whose ordinances permit accessory/home-occupation uses",
      "No-HOA or HOA-with-CC&Rs-in-hand (so the rules are checkable)",
    ];
    base.propertyTypes = ["single-family with garage/yard", "small multi-family", "land with utilities at the road"];
    base.filters = [
      "Zillow/Redfin: keyword 'no HOA', lot size filter, 'as-is' flag for value entries",
      "Save searches and let the alerts do the watching",
    ];
  }
  return base;
}
