/**
 * Property → Opportunity Zone read (SOURCE-INTELLIGENCE unit).
 *
 * Reads the frozen, public-domain OZ snapshot (propertyOpportunityZonesGenerated)
 * for a given canonical property and returns the designated place-fact, or null.
 * This read lives WITH the property data (source-intelligence unit) — the core
 * place-facts substrate never reaches into this unit, only the other way around.
 *
 * Renders from the SNAPSHOT only; the request-time live OZ fetch stays Module
 * 22/23 gated (liveFetchAllowed:false).
 */

import {
  PROPERTY_OZ_FACTS,
  PROPERTY_OZ_PROVENANCE,
} from "./propertyOpportunityZonesGenerated";
import { ozOverlayFact } from "./placeFactOverlay";

export interface PropertyOzDesignation {
  tractId: string;
  rural: boolean;
  asOf: string;
}

/**
 * The OZ place-fact for a property, ONLY when its tract is a designated
 * Opportunity Zone. Returns null when not designated or not resolved — the
 * public card then renders no badge (absence is fine on a listing).
 */
export function designatedOzForProperty(
  canonicalPropertyId: string,
): PropertyOzDesignation | null {
  // Overlay (newly-refreshed auctions) first, then the committed snapshot.
  const fact = ozOverlayFact(canonicalPropertyId) ?? PROPERTY_OZ_FACTS[canonicalPropertyId];
  if (!fact || !fact.designated || !fact.tractId) return null;
  return {
    tractId: fact.tractId,
    rural: fact.rural,
    asOf: PROPERTY_OZ_PROVENANCE.asOf,
  };
}
