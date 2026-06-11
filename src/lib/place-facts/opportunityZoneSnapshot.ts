/**
 * Verified Opportunity Zone place-fact snapshot.
 *
 * Frozen, human-checkable government designations — the published-fact analog of
 * hudReoGenerated.ts. Each entry was resolved through the real chain
 * (Census geocoder → HUD OZ layer, FeatureServer/13) and FROZEN here with its
 * source provenance + as-of date, so the snapshot renders deterministically
 * without a request-time live fetch (which stays gated — see placeFactActivation).
 *
 * Every `designated` value below was verified against the live HUD OZ layer on
 * the asOf date. Re-running the live chain (once Module 22 is approved) is what
 * would refresh these; until then they render as a dated snapshot, honestly.
 */

export interface OzPlaceFactSnapshot {
  /** Human-entered address that was geocoded (display + provenance). */
  address: string;
  /** 11-digit Census tract GEOID the address resolved to. */
  geoid: string;
  /** Census tract display name (e.g. "Census Tract 8024.05"). */
  tractName: string;
  stateAbbr: string;
  stateName: string;
  /** THE place-fact: is this tract a designated Opportunity Zone? */
  designated: boolean;
  /** HUD's rural flag for designated tracts (false when not designated). */
  rural: boolean;
  geocodeLat: number;
  geocodeLon: number;
}

export const OZ_SNAPSHOT_PROVENANCE = {
  designationAuthority: "IRC §1400Z-1 (Treasury/IRS-certified Qualified Opportunity Zones, 2018 round)",
  ozSource: "HUD GIS — Opportunity_Zones FeatureServer/13 (field GEOID10)",
  geocodeSource: "U.S. Census Bureau Geocoding Services (Public_AR_Current / Current_Current)",
  designatedTractCount: 8765,
  license: "Public domain (U.S. Government work)",
  asOf: "2026-06-09",
  adapterVersion: "hud-oz-adapter-v0.1.0",
} as const;

/**
 * Verified examples spanning the full boolean: designated (urban + rural) and
 * not-designated. Real addresses, real tracts, real designations.
 */
export const OZ_PLACE_FACTS: OzPlaceFactSnapshot[] = [
  {
    address: "4600 Silver Hill Rd, Suitland, MD 20746",
    geoid: "24033802405",
    tractName: "Census Tract 8024.05",
    stateAbbr: "MD",
    stateName: "Maryland",
    designated: true,
    rural: false,
    geocodeLat: 38.845053,
    geocodeLon: -76.928366,
  },
  {
    address: "200 SE Frank Phillips Blvd, Bartlesville, OK 74003",
    geoid: "40147000300",
    tractName: "Census Tract 3",
    stateAbbr: "OK",
    stateName: "Oklahoma",
    designated: true,
    rural: true,
    geocodeLat: 36.751127,
    geocodeLon: -95.975897,
  },
  {
    address: "6400 Democracy Blvd, Bethesda, MD 20817",
    geoid: "24031704501",
    tractName: "Census Tract 7045.01",
    stateAbbr: "MD",
    stateName: "Maryland",
    designated: false,
    rural: false,
    geocodeLat: 39.023797,
    geocodeLon: -77.127896,
  },
  {
    address: "100 W Main St, Floyd, VA 24091",
    geoid: "51063920104",
    tractName: "Census Tract 9201.04",
    stateAbbr: "VA",
    stateName: "Virginia",
    designated: false,
    rural: false,
    geocodeLat: 36.911244,
    geocodeLon: -80.320301,
  },
];
