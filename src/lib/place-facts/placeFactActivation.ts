/**
 * Place-Fact Source Activation — the recorded Module 22/23 decision for the
 * Opportunity Zone place-fact source.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DECISION (on the record — not implicit):
 *
 * `hud-opportunity-zones` is a new live external source (Census geocoder + HUD
 * GIS OZ layer). The question raised: does it route through the Module 22/23
 * human-approval gate like HUD/USDA listings, or are read-only reference/
 * place-fact lookups treated differently?
 *
 * ANSWER — it routes through the SAME gate for its LIVE capability, with one
 * deliberate, narrow difference for the frozen snapshot:
 *
 *   1. LIVE LOOKUP (lookupOpportunityZone — a live external fetch at request
 *      time) is NOT exempt. It ships PENDING_HUMAN_APPROVAL with
 *      liveFetchAllowed=false. The build does not self-activate a live external
 *      fetch. A qualified operator must approve Module 22 (Live Activation) and
 *      Module 23 (Legal/Licensing) before any request-time fetch is enabled —
 *      identical to HUD/USDA/Treasury/GSA in src/lib/property/sourceActivation.ts.
 *
 *   2. VERIFIED SNAPSHOT (opportunityZoneSnapshot.ts — a frozen, human-checkable
 *      government designation with provenance + vintage) MAY render as a factual
 *      place attribute WITHOUT flipping the live source on, because OZ
 *      designation under IRC §1400Z-1 is PUBLISHED, PUBLIC-DOMAIN U.S.
 *      Government data with no ToS barrier — the same class of reference fact the
 *      platform already treats as citable (FEMA flood zone, Census tract id,
 *      USDA rural overlay). It renders as a FACT ("this tract is a designated
 *      Opportunity Zone"), never as eligibility, a recommendation, or inventory.
 *
 * WHY the snapshot gets a different render rule than a listing: a LISTING asserts
 * "here is a property you could acquire" — commercial availability + licensing
 * risk → human activation gate before any display. A PLACE-FACT asserts "this
 * published government boundary contains this point" — a citable public-domain
 * reference, displayed with provenance + vintage. The Module 23 legal answer is
 * recorded below (public domain, no ToS); the Module 22 live-fetch concern is
 * honored by keeping the live call gated.
 *
 * This is NOT "place-facts are exempt from governance." Live fetch is gated like
 * everything else; only the published-fact snapshot renders, with its source and
 * as-of date shown.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Mirrors the shape of src/lib/property/sourceActivation.ts so an operator
 * review surface can read it the same way. Ships PENDING; the build never
 * self-approves.
 */

export type PlaceFactReviewStatus =
  | "PENDING_HUMAN_APPROVAL"
  | "APPROVED"
  | "BLOCKED";

export interface PlaceFactActivationRecord {
  sourceId: string;
  sourceName: string;
  /** Module 23 — Source Legal & Licensing Review. */
  module23: {
    status: PlaceFactReviewStatus;
    facts: string[];
    license: string;
    attributionRequired: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
  };
  /** Module 22 — Live Activation (governs the REQUEST-TIME live fetch only). */
  module22: {
    status: PlaceFactReviewStatus;
    capabilityGated: string;
    liveFetchAllowed: boolean;
    reviewedBy: string | null;
    reviewedAt: string | null;
  };
  /**
   * Whether the verified, public-domain snapshot may render as a place-fact.
   * True by the recorded decision above (published government reference data).
   * INDEPENDENT of liveFetchAllowed — the snapshot rendering never triggers a
   * live external call.
   */
  snapshotRenderAllowed: boolean;
}

export const OZ_PLACE_FACT_ACTIVATION: PlaceFactActivationRecord = {
  sourceId: "hud-opportunity-zones",
  sourceName: "HUD / Treasury Opportunity Zones",
  module23: {
    status: "PENDING_HUMAN_APPROVAL",
    facts: [
      "Designation authority: IRC §1400Z-1 — Treasury/IRS-certified Qualified Opportunity Zones (the 2018 designation round; 8,765 designated tracts).",
      "Designation list published by HUD GIS as an open ArcGIS feature layer (FeatureServer/13, field GEOID10) — U.S. Government work, public domain.",
      "Point-to-tract resolution uses the U.S. Census Bureau Geocoding Services (Public_AR_Current benchmark) — public, no API key, U.S. Government work.",
      "No ToS barrier to redisplay of the designation; this is a published government boundary fact, not licensed listing inventory.",
      "Displayed as a PLACE-FACT only ('this tract is a designated Opportunity Zone'). It is NOT eligibility, qualification, approval, or a tax-benefit guarantee — whether a buyer benefits is a separate buyer-qualification question handled elsewhere.",
    ],
    license: "Public domain (U.S. Government work) — HUD GIS OZ layer + Census geocoder",
    attributionRequired:
      'Display "Source: HUD GIS / Treasury (IRC §1400Z-1) + U.S. Census geocoder" with the tract id and as-of date on every place-fact.',
    reviewedBy: null,
    reviewedAt: null,
  },
  module22: {
    status: "PENDING_HUMAN_APPROVAL",
    capabilityGated:
      "Request-time live fetch to the Census geocoder + HUD OZ layer (lookupOpportunityZone). Gated until a human approves live activation.",
    liveFetchAllowed: false,
    reviewedBy: null,
    reviewedAt: null,
  },
  // The published-fact snapshot is allowed to render now (see decision above);
  // the live fetch above stays gated until human approval.
  snapshotRenderAllowed: true,
};

/**
 * HUBZone place-fact source — SAME recorded decision as OZ. The live request-time
 * SBA fetch is NOT exempt: it routes through Module 22/23, ships PENDING, and the
 * build never self-activates. The verified public-domain snapshot may render
 * (published SBA designation, citable) with provenance + effective + expiration.
 * Live fetch gated; snapshot cited; expired designations labeled historical.
 */
export const HUBZONE_PLACE_FACT_ACTIVATION: PlaceFactActivationRecord = {
  sourceId: "sba-hubzone",
  sourceName: "SBA HUBZone (Historically Underutilized Business Zone)",
  module23: {
    status: "PENDING_HUMAN_APPROVAL",
    facts: [
      "Designation authority: SBA — 13 CFR §126 / 15 U.S.C. §657a (HUBZone program).",
      "Designation categories (Qualified Census Tract, Qualified Non-Metropolitan County, Redesignated, Governor-Designated, Indian Land, Disaster Area) published via a public ArcGIS HUBZone layer, effective 2023-07-01 — U.S. Government work, public domain.",
      "Authoritative LIVE status is the SBA HUBZone Map (maps.certify.sba.gov); every render carries 'verify current designation with SBA'.",
      "FRESHNESS: HUBZone areas change. Redesignated / Governor-Designated / Disaster designations carry expiration dates; a designation past its expiration is rendered historical/expired, never as currently designated.",
      "Displayed as a PLACE-FACT only ('this location is in a designated HUBZone'). It is NOT eligibility, certification, or a guarantee for any business — HUBZone certification depends on a business meeting SBA criteria (principal office, 35% employee residency, SBA small-business status).",
    ],
    license: "Public domain (U.S. Government work) — SBA HUBZone layer + Census geocoder",
    attributionRequired:
      'Display "Source: SBA HUBZone (effective 2023-07-01) + U.S. Census geocoder" with the type, effective date, and (when present) expiration on every place-fact.',
    reviewedBy: null,
    reviewedAt: null,
  },
  module22: {
    status: "PENDING_HUMAN_APPROVAL",
    capabilityGated:
      "Request-time live fetch to the Census geocoder + SBA HUBZone layer (lookupHubzone). Gated until a human approves live activation.",
    liveFetchAllowed: false,
    reviewedBy: null,
    reviewedAt: null,
  },
  snapshotRenderAllowed: true,
};

/**
 * FEMA flood place-fact source — same governance posture: the frozen snapshot
 * may render as a public government fact, while the live request-time lookup
 * stays behind Module 22/23 approval.
 */
export const FEMA_FLOOD_PLACE_FACT_ACTIVATION: PlaceFactActivationRecord = {
  sourceId: "fema-flood",
  sourceName: "FEMA National Flood Hazard Layer",
  module23: {
    status: "PENDING_HUMAN_APPROVAL",
    facts: [
      "Source authority: FEMA National Flood Hazard Layer (NFHL), public ArcGIS service.",
      "Output is an informational place-fact about the mapped flood-zone posture of the location, not a benefit, approval, or eligibility determination.",
      "Public render must stay factual and constrained: flood-zone designation only, with provenance and as-of framing.",
      "This is U.S. Government source material and is treated as public-domain reference data.",
    ],
    license: "Public domain (U.S. Government work) — FEMA NFHL",
    attributionRequired:
      'Display "Source: FEMA National Flood Hazard Layer" with the flood-zone fact and as-of date on every place-fact.',
    reviewedBy: null,
    reviewedAt: null,
  },
  module22: {
    status: "PENDING_HUMAN_APPROVAL",
    capabilityGated:
      "Request-time live fetch to the FEMA NFHL flood zone layer. Gated until a human approves live activation.",
    liveFetchAllowed: false,
    reviewedBy: null,
    reviewedAt: null,
  },
  snapshotRenderAllowed: true,
};

/**
 * NPS National Register historic place-fact source — same pattern: snapshot can
 * render, live request-time lookup remains governed by Module 22/23 approval.
 */
export const NPS_HISTORIC_PLACE_FACT_ACTIVATION: PlaceFactActivationRecord = {
  sourceId: "nps-historic",
  sourceName: "NPS National Register of Historic Places",
  module23: {
    status: "PENDING_HUMAN_APPROVAL",
    facts: [
      "Source authority: National Park Service National Register of Historic Places polygons.",
      "Output is a property-side place-fact about whether the address falls within a National Register listed area, not a tax-credit approval or rehabilitation determination.",
      "Public render must stay factual and constrained: listed-area status plus resource name when present, with provenance and as-of framing.",
      "This is U.S. Government source material and is treated as public-domain reference data.",
    ],
    license: "Public domain (U.S. Government work) — NPS NRHP",
    attributionRequired:
      'Display "Source: NPS National Register of Historic Places" with the historic place-fact and as-of date on every place-fact.',
    reviewedBy: null,
    reviewedAt: null,
  },
  module22: {
    status: "PENDING_HUMAN_APPROVAL",
    capabilityGated:
      "Request-time live fetch to the NPS National Register polygon layer. Gated until a human approves live activation.",
    liveFetchAllowed: false,
    reviewedBy: null,
    reviewedAt: null,
  },
  snapshotRenderAllowed: true,
};

export const NMTC_PLACE_FACT_ACTIVATION: PlaceFactActivationRecord = {
  sourceId: "cdfi-nmtc",
  sourceName: "CDFI Fund NMTC Qualified Tracts",
  module23: {
    status: "PENDING_HUMAN_APPROVAL",
    facts: [
      "Source authority: CDFI Fund / U.S. Treasury NMTC Qualified Tracts layer (IRC §45D low-income community qualification).",
      "Output is a tract-level place-fact about whether the verified Census tract is NMTC-qualified, not an allocation, underwriting, or investor approval.",
      "Public render must stay factual and constrained: tract qualification status plus tract id and as-of framing.",
      "This is U.S. Government source material and is treated as public-domain reference data.",
    ],
    license: "Public domain (U.S. Government data) — CDFI Fund NMTC Qualified Tracts",
    attributionRequired:
      'Display "Source: CDFI Fund / U.S. Treasury NMTC Qualified Tracts" with the tract id and as-of date on every place-fact.',
    reviewedBy: null,
    reviewedAt: null,
  },
  module22: {
    status: "PENDING_HUMAN_APPROVAL",
    capabilityGated:
      "Request-time live fetch to the CDFI Fund NMTC Qualified Tracts source using the verified Census tract. Gated until a human approves live activation.",
    liveFetchAllowed: false,
    reviewedBy: null,
    reviewedAt: null,
  },
  snapshotRenderAllowed: true,
};

/** True only when BOTH modules are APPROVED — the gate for the HUBZone live fetch. */
export function isHubzoneLiveFetchActivated(): boolean {
  const r = HUBZONE_PLACE_FACT_ACTIVATION;
  return (
    r.module22.status === "APPROVED" &&
    r.module23.status === "APPROVED" &&
    r.module22.liveFetchAllowed === true
  );
}

/** Whether the verified HUBZone snapshot may render (decision: yes). */
export function isHubzoneSnapshotRenderAllowed(): boolean {
  return HUBZONE_PLACE_FACT_ACTIVATION.snapshotRenderAllowed === true;
}

/** True only when BOTH modules are APPROVED — the gate for the REQUEST-TIME live fetch. */
export function isOzLiveFetchActivated(): boolean {
  const r = OZ_PLACE_FACT_ACTIVATION;
  return (
    r.module22.status === "APPROVED" &&
    r.module23.status === "APPROVED" &&
    r.module22.liveFetchAllowed === true
  );
}

/** Whether the verified public-domain snapshot may render (decision: yes). */
export function isOzSnapshotRenderAllowed(): boolean {
  return OZ_PLACE_FACT_ACTIVATION.snapshotRenderAllowed === true;
}

/**
 * Registry of place-fact (reference) sources, keyed by sourceId. These are the
 * sources whose LIVE request-time fetch is gated behind Module 22/23 — distinct
 * from the property/listing sources in src/lib/property/sourceActivation.ts. The
 * operator Source Review screen reads this to offer governed, audit-logged
 * approval. Approving flips liveFetchAllowed:true (turns on the live fetch); the
 * citable public-domain SNAPSHOT already renders and keeps rendering regardless.
 *
 * Pure data (no fs) — the runtime overlay + decision recording live in the
 * server-only placeFactActivationStore.ts.
 */
export const PLACE_FACT_ACTIVATIONS: Record<string, PlaceFactActivationRecord> = {
  "hud-opportunity-zones": OZ_PLACE_FACT_ACTIVATION,
  "sba-hubzone": HUBZONE_PLACE_FACT_ACTIVATION,
  "fema-flood": FEMA_FLOOD_PLACE_FACT_ACTIVATION,
  "nps-historic": NPS_HISTORIC_PLACE_FACT_ACTIVATION,
  "cdfi-nmtc": NMTC_PLACE_FACT_ACTIVATION,
};

export const PLACE_FACT_SOURCE_IDS = Object.keys(PLACE_FACT_ACTIVATIONS);
