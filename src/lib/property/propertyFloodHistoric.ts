/**
 * Property → flood / historic place-fact reads (SOURCE-INTELLIGENCE unit).
 *
 * Mirrors propertyOpportunityZones / propertyHubzones: read the frozen snapshot,
 * return a render-if-positive fact or null.
 *  - FLOOD: only SFHA (Special Flood Hazard Area) renders — an informational,
 *    insurance/lender-relevant fact about the PLACE; minimal-hazard X zones are
 *    omitted (no noise). NOT a benefit program; never a program match.
 *  - HISTORIC: in a National Register area — the property-side gate of the
 *    federal rehab tax credit (36 CFR §60); renders as a verified place-fact.
 */

import {
  PROPERTY_FLOOD_HISTORIC_FACTS,
  PROPERTY_FLOOD_HISTORIC_PROVENANCE,
} from "./propertyFloodHistoricGenerated";

export interface PropertyFloodFact {
  floodZone: string;
  asOf: string;
}
export interface PropertyHistoricFact {
  historicName: string | null;
  asOf: string;
}

/** SFHA-only flood fact (A- and V-prefixed zones); null when minimal-hazard or unresolved. */
export function sfhaForProperty(canonicalPropertyId: string): PropertyFloodFact | null {
  const f = PROPERTY_FLOOD_HISTORIC_FACTS[canonicalPropertyId];
  if (!f || !f.isSfha || !f.floodZone) return null;
  return { floodZone: f.floodZone, asOf: PROPERTY_FLOOD_HISTORIC_PROVENANCE.asOf };
}

/** National Register fact; null when not in a listed area or unresolved. */
export function historicForProperty(canonicalPropertyId: string): PropertyHistoricFact | null {
  const f = PROPERTY_FLOOD_HISTORIC_FACTS[canonicalPropertyId];
  if (!f || !f.inNationalRegisterArea) return null;
  return { historicName: f.historicName, asOf: PROPERTY_FLOOD_HISTORIC_PROVENANCE.asOf };
}
