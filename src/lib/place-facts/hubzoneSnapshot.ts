/**
 * Verified HUBZone place-fact snapshot.
 *
 * Frozen, human-checkable SBA HUBZone designations — the HUBZone analog of
 * opportunityZoneSnapshot.ts. Each entry was resolved against the live SBA
 * HUBZone layer (FeatureServer, effective 2023-07-01) and frozen here with its
 * type, effective date, and (where the category carries one) expiration.
 *
 * CRITICAL freshness honesty: HUBZone areas change. `isCurrentAsOf()` recomputes
 * current-vs-expired from the expiration date at render time, so a designation
 * past its expiration is labeled historical/expired — never shown as currently
 * designated. Every render also carries "verify current designation with SBA",
 * because the dataset itself is a dated snapshot.
 */

export interface HubzoneFactSnapshot {
  /** Human address (or area label) that was resolved. */
  address: string;
  /** Whether the location is in any designated HUBZone (per the snapshot). */
  designated: boolean;
  /** SBA HUBZone category, when designated (e.g. "Qualified Census Tract"). */
  hubzoneType: string | null;
  /** Tract/county GEOID of the designated area (coarse geography). */
  geoid: string | null;
  /** Area label, e.g. "McDowell County, WV". */
  area: string | null;
  /** Effective/as-of date of the designation. */
  effective: string | null;
  /** Expiration date when the category carries one (Redesignated/Governor/Disaster); else null. */
  expiration: string | null;
  /** Whether this category is time-limited (carries an expiration). */
  timeLimited: boolean;
  /** How the entry was verified against the live SBA layer. */
  verifiedBy: "address-geocode" | "coordinate-point-query";
}

export const HUBZONE_SNAPSHOT_PROVENANCE = {
  asOf: "2026-06-09",
  designationAuthority: "SBA — 13 CFR §126 / 15 U.S.C. §657a (HUBZone program)",
  hubzoneSource:
    "SBA HUBZone designation layer (public ArcGIS FeatureServer; effective 2023-07-01)",
  geocodeSource: "U.S. Census Bureau geocoder (Public_AR_Current / Current_Current)",
  authoritativeLiveSource: "SBA HUBZone Map — maps.certify.sba.gov",
  datasetEffective: "2023-07-01",
  license: "Public domain (U.S. Government work)",
  adapterVersion: "sba-hubzone-adapter-v0.1.0",
} as const;

/**
 * Verified examples spanning the cases: current qualified, current-but-time-
 * limited (redesignated), expired (governor-designated past expiration), and
 * not-designated. All resolved against the live SBA HUBZone layer.
 */
export const HUBZONE_PLACE_FACTS: HubzoneFactSnapshot[] = [
  {
    address: "100 Court St, Welch, WV 24801",
    designated: true,
    hubzoneType: "Qualified Census Tract",
    geoid: "54047954503",
    area: "McDowell County, WV",
    effective: "2023-07-01",
    expiration: null,
    timeLimited: false,
    verifiedBy: "address-geocode",
  },
  {
    address: "205 N Central Ave, Superior, NE 68978",
    designated: true,
    hubzoneType: "Redesignated Non-Metropolitan County",
    geoid: "31129",
    area: "Nuckolls County, NE",
    effective: "2023-07-01",
    expiration: "2026-06-30",
    timeLimited: true,
    verifiedBy: "address-geocode",
  },
  {
    // Governor-designated tract whose designation has EXPIRED — rendered as
    // historical/expired, never as currently designated. Verified by point
    // query against the SBA Governor-Designated Census sublayer.
    address: "Eastern El Paso County, CO — Census Tract 39.10 (near Calhan)",
    designated: true,
    hubzoneType: "Governor-Designated Census Tract",
    geoid: "08041003910",
    area: "El Paso County, CO",
    effective: "2022-02-09",
    expiration: "2024-02-09",
    timeLimited: true,
    verifiedBy: "coordinate-point-query",
  },
  {
    address: "6400 Democracy Blvd, Bethesda, MD 20817",
    designated: false,
    hubzoneType: null,
    geoid: null,
    area: null,
    effective: null,
    expiration: null,
    timeLimited: false,
    verifiedBy: "address-geocode",
  },
];

/**
 * Current-vs-expired at render time. A designation with an expiration already in
 * the past is NOT current (historical/expired). No expiration → current.
 */
export function isCurrentAsOf(
  fact: HubzoneFactSnapshot,
  now: Date = new Date(),
): boolean {
  if (!fact.designated) return false;
  if (!fact.expiration) return true;
  const exp = new Date(`${fact.expiration}T23:59:59Z`);
  return exp.getTime() >= now.getTime();
}
