/**
 * Property → HUBZone read (SOURCE-INTELLIGENCE unit).
 *
 * Reads the frozen, public-domain SBA HUBZone snapshot
 * (propertyHubzonesGenerated) for a property and returns the designation with a
 * computed current/expired flag, or null. Mirrors propertyOpportunityZones.ts.
 * Renders from the SNAPSHOT only; the live HUBZone fetch stays Module 22/23 gated.
 */

import {
  PROPERTY_HUBZONE_FACTS,
  PROPERTY_HUBZONE_PROVENANCE,
} from "./propertyHubzonesGenerated";
import { hubzoneOverlayFact } from "./placeFactOverlay";

export interface PropertyHubzoneDesignation {
  hubzoneType: string;
  geoid: string;
  effective: string;
  expiration: string | null;
  /** false when a time-limited designation is past its expiration (historical). */
  isCurrent: boolean;
  asOf: string;
}

/**
 * The HUBZone place-fact for a property, or null when not designated / not
 * resolved. `isCurrent` is recomputed against `now` so an expired designation
 * reads historical — never "currently designated".
 */
export function designatedHubzoneForProperty(
  canonicalPropertyId: string,
  now: Date = new Date(),
): PropertyHubzoneDesignation | null {
  // Overlay (newly-refreshed auctions) first, then the committed snapshot.
  const fact = hubzoneOverlayFact(canonicalPropertyId) ?? PROPERTY_HUBZONE_FACTS[canonicalPropertyId];
  if (!fact) return null;
  const isCurrent = !fact.expiration
    ? true
    : new Date(`${fact.expiration}T23:59:59Z`).getTime() >= now.getTime();
  return {
    hubzoneType: fact.hubzoneType,
    geoid: fact.geoid,
    effective: fact.effective,
    expiration: fact.expiration,
    isCurrent,
    asOf: PROPERTY_HUBZONE_PROVENANCE.asOf,
  };
}
