/**
 * Place-Facts: Opportunity Zone designation lookup
 *
 * Public entry point for OZ tract matching. Wraps the governed adapter with
 * Vol III place-facts semantics: deterministic, versioned, replay-safe,
 * returns a factual designation result (not a scored recommendation).
 *
 * Governing sources:
 * - IRC §1400Z-1 designation list via HUD GIS FeatureServer/13 (8,765 tracts)
 * - US Census Bureau Geocoding Services (Public_AR_Current benchmark)
 *
 * Classification: PUBLIC — OZ designation is a published government fact.
 * Replay: fetchedAt timestamp + adapterVersion + geoid chain is the replay key.
 */

export {
  lookupOpportunityZone,
  geocodeToCensusTract,
  queryHudOzByGeoid,
  opportunityZonesAdapter,
  OZ_ADAPTER_VERSION,
  CENSUS_GEOCODER_URL,
  HUD_OZ_FEATURE_URL,
  type OZLookupResult,
  type CensusGeocodeResult,
} from "@/lib/scrapers/adapters/opportunity-zones";

/**
 * Convenience helper: returns true/false with the tract ID if designated.
 * Suitable for display and filtering — not for loan scoring or underwriting.
 */
export async function isInOpportunityZone(
  street: string,
  city: string,
  state: string,
  zip?: string
): Promise<{ designated: boolean; tractId: string | null; rural: boolean; error: string | null }> {
  const { lookupOpportunityZone } = await import(
    "@/lib/scrapers/adapters/opportunity-zones"
  );
  const result = await lookupOpportunityZone(street, city, state, zip);
  return {
    designated: result.designated,
    tractId: result.tractId,
    rural: result.rural,
    error: result.error,
  };
}
