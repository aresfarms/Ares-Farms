/**
 * Opportunity Zone badge framing (CORE / shared substrate).
 *
 * Turns a resolved OZ place-fact into PlaceFactBadge props with the STRICT
 * public-surface framing: a fact about the LOCATION, never about a person. No
 * "you qualify / approved / guaranteed / your tax break" — buyer-qualification
 * stays off Furlong. This module is pure (no domain imports) so it remains core
 * substrate that the property surface (a divestible unit) may import.
 */

import type { PlaceFactBadgeProps } from "@/components/place-facts/PlaceFactBadge";

export interface OzBadgeInput {
  /** Coarse tract GEOID the location falls in (never an exact address). */
  tractId: string;
  /** HUD rural flag for the designated tract. */
  rural: boolean;
  /** As-of date of the frozen snapshot. */
  asOf: string;
}

export const OZ_BADGE_LABEL = "Designated Opportunity Zone tract";

export const OZ_BADGE_DISCLAIMER =
  "This is a place-fact about the location — not eligibility, qualification, or a " +
  "guaranteed tax benefit for any person. Whether anyone benefits depends on their " +
  "own situation.";

export const OZ_BADGE_SOURCE_CITATION =
  "Source: HUD GIS / Treasury (IRC §1400Z-1) + U.S. Census geocoder · public domain";

/** Build the reusable badge props for a designated-OZ location. */
export function ozBadgeProps(input: OzBadgeInput): PlaceFactBadgeProps {
  return {
    label: OZ_BADGE_LABEL,
    asOf: input.asOf,
    disclaimer: OZ_BADGE_DISCLAIMER,
    sourceCitation: OZ_BADGE_SOURCE_CITATION,
    geographyNote: `Census tract ${input.tractId}${input.rural ? " · rural (HUD)" : ""}`,
  };
}
