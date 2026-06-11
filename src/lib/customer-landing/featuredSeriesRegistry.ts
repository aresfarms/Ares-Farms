/**
 * Featured Series Registry — Build 47-D
 *
 * Canonical registry for the Living Opportunity Map's featured series system.
 * Each series groups a set of exploration stories with consistent branding,
 * purpose, and editorial posture.
 *
 * Series types:
 *   "standard"       — General illustrative explorations (default)
 *   "america-250"    — America's 250th Anniversary discovery series (2026)
 *   "agriculture"    — Agricultural heritage and opportunity
 *   "conservation"   — Conservation history and land stewardship
 *   "infrastructure" — Infrastructure development and regional growth
 *
 * The map architecture (projection, animation, sequence) is UNCHANGED.
 * Series only affect story selection and section branding.
 *
 * Privacy posture (all series):
 *   "The map reveals opportunities, not the visitor."
 *   No geolocation. No visitor identification. No personal data.
 */

export type FeaturedSeriesId =
  | "standard"
  | "america-250"
  | "agriculture"
  | "conservation"
  | "infrastructure";

export type FeaturedSeries = {
  id: FeaturedSeriesId;
  /** Short label — section heading, aria-label */
  label: string;
  /** Badge text shown in the map header */
  badge: string;
  /** One-line tagline below the badge */
  tagline: string;
  /** Longer description for accessibility / screen readers */
  description: string;
};

export const FEATURED_SERIES: Record<FeaturedSeriesId, FeaturedSeries> = {
  "standard": {
    id: "standard",
    label: "Featured Exploration",
    badge: "Featured Exploration",
    tagline: "Illustrative examples — not based on your location.",
    description:
      "Curated illustrative exploration stories from across America. " +
      "Not personalized. Not based on your location.",
  },

  "america-250": {
    id: "america-250",
    label: "America 250 Featured Exploration",
    badge: "America 250 · Featured Exploration",
    tagline:
      "Illustrative examples from 250 years of American land, agriculture, and community.",
    description:
      "Discover how places, communities, agriculture, infrastructure, and opportunity " +
      "evolved across America over 250 years. " +
      "Educational and exploratory — not political, not nostalgic. " +
      "Illustrative examples — not based on your location.",
  },

  "agriculture": {
    id: "agriculture",
    label: "Agriculture Featured Exploration",
    badge: "Agriculture · Featured Exploration",
    tagline: "How agricultural regions and opportunities evolved across America.",
    description:
      "Exploration stories focused on farms, conservation programs, " +
      "and agricultural heritage. Illustrative — not based on your location.",
  },

  "conservation": {
    id: "conservation",
    label: "Conservation Featured Exploration",
    badge: "Conservation · Featured Exploration",
    tagline: "How land stewardship and conservation shaped American communities.",
    description:
      "Exploration stories focused on conservation history, land transitions, " +
      "and stewardship. Illustrative — not based on your location.",
  },

  "infrastructure": {
    id: "infrastructure",
    label: "Infrastructure Featured Exploration",
    badge: "Infrastructure · Featured Exploration",
    tagline: "How infrastructure created economic growth and regional opportunity.",
    description:
      "Exploration stories focused on transportation corridors, commerce, " +
      "and infrastructure development. Illustrative — not based on your location.",
  },
};

/** Look up a series by ID; falls back to "standard" if not found. */
export function getFeaturedSeries(id: FeaturedSeriesId): FeaturedSeries {
  return FEATURED_SERIES[id] ?? FEATURED_SERIES["standard"];
}

/**
 * Detect the active series from a story array.
 * Returns the seriesId of the first story; defaults to "standard".
 */
export function detectSeriesId(
  stories: Array<{ seriesId?: FeaturedSeriesId }>
): FeaturedSeriesId {
  return stories[0]?.seriesId ?? "standard";
}
