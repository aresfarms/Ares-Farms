/**
 * HUBZone badge framing (CORE / shared substrate).
 *
 * Turns a resolved HUBZone place-fact into PlaceFactBadge props with the STRICT
 * public-surface framing: a fact about the LOCATION, never about a business. No
 * "you qualify / certified / approved / guaranteed." HUBZone *certification*
 * (principal office, 35% employee residency, SBA small-business status) is
 * business-side qualification and stays off this surface — exactly as
 * buyer-eligibility stays off Opportunity Zones.
 *
 * Freshness honesty: expired designations are labeled historical; every render
 * carries the effective date and "verify current designation with SBA". Pure (no
 * domain imports) — stays core substrate the property surface may import.
 */

import type { PlaceFactBadgeProps } from "@/components/place-facts/PlaceFactBadge";

export interface HubzoneBadgeInput {
  hubzoneType: string;
  effective: string;
  expiration: string | null;
  isCurrent: boolean;
  area?: string | null;
  geoid?: string | null;
}

export const HUBZONE_BADGE_DISCLAIMER =
  "This is a place-fact about the location — it is not eligibility, certification, " +
  "or a guarantee for any business. HUBZone certification depends on a business " +
  "meeting SBA criteria. Designations change — verify current designation with SBA.";

export const HUBZONE_BADGE_SOURCE_CITATION =
  "Source: SBA HUBZone (effective 2023-07-01) + U.S. Census geocoder · public domain · maps.certify.sba.gov";

/** Badge label — current vs expired/historical, with the SBA category. */
export function hubzoneBadgeLabel(input: HubzoneBadgeInput): string {
  if (!input.isCurrent) {
    return `HUBZone (${input.hubzoneType}) — historical / expired`;
  }
  return `Designated HUBZone (${input.hubzoneType})`;
}

/** Build reusable PlaceFactBadge props for a HUBZone location. */
export function hubzoneBadgeProps(input: HubzoneBadgeInput): PlaceFactBadgeProps {
  const asOf = input.isCurrent
    ? input.effective
    : `${input.effective} · expired ${input.expiration ?? "unknown"}`;
  const expiryNote =
    input.expiration && input.isCurrent
      ? ` · designation expires ${input.expiration} (time-limited)`
      : "";
  const geography = [input.area, input.geoid ? `tract/area ${input.geoid}` : null]
    .filter(Boolean)
    .join(" · ");
  return {
    label: hubzoneBadgeLabel(input),
    asOf,
    tone: input.isCurrent ? "affirmative" : "historical",
    disclaimer:
      (input.isCurrent
        ? "This location is in a designated HUBZone. "
        : "This location's HUBZone designation has expired (historical). ") +
      HUBZONE_BADGE_DISCLAIMER,
    sourceCitation: HUBZONE_BADGE_SOURCE_CITATION,
    geographyNote: geography ? `${geography}${expiryNote}` : expiryNote || undefined,
  };
}
