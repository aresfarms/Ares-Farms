/**
 * Place-Facts: HUBZone designation lookup (entry point).
 *
 * Public entry point for SBA HUBZone place-fact matching, mirroring
 * opportunityZoneLookup.ts. The request-time LIVE fetch is gated behind Module
 * 22/23 (placeFactActivation.ts); the verified snapshot renders with provenance,
 * effective date, and expiration.
 *
 * Classification: PUBLIC — HUBZone designation is published government data.
 * Freshness: designations change; renders carry as-of + expiration and label
 * expired designations historical (never "currently designated").
 */

export {
  lookupHubzone,
  geocodeToCensusTract,
  hubzoneAdapter,
  isDesignationCurrent,
  HUBZONE_ADAPTER_VERSION,
  HUBZONE_FEATURE_BASE,
  HUBZONE_SOURCE_LABEL,
  type HubzoneLookupResult,
  type HubzoneMatch,
} from "@/lib/scrapers/adapters/hubzone";

/**
 * Convenience helper — designation, type, and freshness for an address.
 * Suitable for display/filtering, not business HUBZone certification.
 */
export async function isInHubzone(
  street: string,
  city: string,
  state: string,
  zip?: string,
): Promise<{
  designated: boolean;
  hubzoneType: string | null;
  effective: string | null;
  expiration: string | null;
  isCurrent: boolean;
  error: string | null;
}> {
  const { lookupHubzone } = await import("@/lib/scrapers/adapters/hubzone");
  const r = await lookupHubzone(street, city, state, zip);
  return {
    designated: r.designated,
    hubzoneType: r.hubzoneType,
    effective: r.effective,
    expiration: r.expiration,
    isCurrent: r.isCurrent,
    error: r.error,
  };
}
