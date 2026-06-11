/**
 * Property place-fact OVERLAY — SERVER-ONLY (fs).
 *
 * The committed snapshots (propertyOpportunityZonesGenerated / propertyHubzones
 * Generated) are written by the ingest scripts. The daily refresh re-pulls
 * auction feeds and can ADD new properties; placeFactRefresh resolves those new
 * ids and writes them here (data/property-placefacts-overlay.json, git-ignored).
 * The property-side reads consult this overlay first, then the committed
 * snapshot — so a newly-added auction property is "checked, not designated"
 * (present in the overlay) rather than "not checked" (absent everywhere).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import type { PropertyOzFact } from "./propertyOpportunityZonesGenerated";
import type { PropertyHubzoneFact } from "./propertyHubzonesGenerated";

const OVERLAY_PATH = path.join(process.cwd(), "data", "property-placefacts-overlay.json");

export interface PlaceFactOverlay {
  asOf: string;
  /** Every overlay-resolved property (designated OR not) → presence = checked. */
  oz: Record<string, PropertyOzFact>;
  /** Only designated HUBZone properties (mirrors the committed snapshot). */
  hubzone: Record<string, PropertyHubzoneFact>;
  /** All property ids the overlay has attempted to resolve (the "checked" set). */
  checkedIds: string[];
}

export function readPlaceFactOverlay(): PlaceFactOverlay {
  try {
    const o = JSON.parse(fs.readFileSync(OVERLAY_PATH, "utf8"));
    return { asOf: o.asOf ?? "", oz: o.oz ?? {}, hubzone: o.hubzone ?? {}, checkedIds: o.checkedIds ?? [] };
  } catch {
    return { asOf: "", oz: {}, hubzone: {}, checkedIds: [] };
  }
}

export function writePlaceFactOverlay(o: PlaceFactOverlay): void {
  fs.mkdirSync(path.dirname(OVERLAY_PATH), { recursive: true });
  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(o, null, 2) + "\n", "utf8");
}

export function ozOverlayFact(id: string): PropertyOzFact | undefined {
  return readPlaceFactOverlay().oz[id];
}
export function hubzoneOverlayFact(id: string): PropertyHubzoneFact | undefined {
  return readPlaceFactOverlay().hubzone[id];
}
