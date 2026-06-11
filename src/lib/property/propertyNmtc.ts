/**
 * Property → NMTC low-income-community read (SOURCE-INTELLIGENCE unit).
 * Snapshot-only, render-if-positive (mirrors propertyOpportunityZones).
 */
import { PROPERTY_NMTC_FACTS, PROPERTY_NMTC_PROVENANCE } from "./propertyNmtcGenerated";

export interface PropertyNmtcFactOut { tractId: string; asOf: string }

export function nmtcForProperty(canonicalPropertyId: string): PropertyNmtcFactOut | null {
  const f = PROPERTY_NMTC_FACTS[canonicalPropertyId];
  if (!f) return null;
  return { tractId: f.tractId, asOf: PROPERTY_NMTC_PROVENANCE.asOf };
}
