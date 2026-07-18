/**
 * Customer landing — Featured Exploration data (Build 45 → 47-A).
 *
 * Curated, ILLUSTRATIVE exploration stories for the Living Opportunity Map on
 * the public homepage. These are examples only:
 * - They are NOT personalized from the visitor's location.
 * - No live geolocation is used anywhere on the homepage.
 * - No exact addresses are shown.
 * - The map reveals opportunities, never the visitor.
 *
 * Copy posture: advisory only — "may," "can," "helps explore," "pathways, not
 * promises." No approval / guarantee / determination language.
 *
 * Stories have a `theme` field:
 *   "modern"     — contemporary opportunity context
 *   "historical" — educational historical context as discovery
 *   "evolution"  — then-to-now comparison (most compelling for discovery)
 *
 * Historical stories show real regions and real historical context but do not
 * represent specific property records, owners, or individuals.
 * Source: U.S. Census Bureau TIGER/Line (public domain) for coordinates.
 *         USGS, BLM, USDA data documented in featuredExplorationRegistry.ts.
 */

import type { FeaturedExplorationThemeId } from "@/lib/maps/featuredExplorationRegistry";
import type { FeaturedSeriesId } from "@/lib/customer-landing/featuredSeriesRegistry";

export type ExplorationTheme = "modern" | "historical" | "evolution";

export type ExplorationNode = {
  x: number; // retained for backwards compat
  y: number;
  type: string;
  latLon: { lat: number; lon: number }; // real illustrative coordinate within county
};

export type FeaturedStory = {
  state: string;
  stateAbbr: string;
  county: string;
  opportunity: string;
  pathway: string;
  story: string;
  focusPoint: { x: number; y: number };
  latLon: { lat: number; lon: number }; // real geographic county centroid (illustrative)
  color: string;
  connectedNodes: ExplorationNode[];
  // Discovery layer fields (Build 47-A)
  theme: ExplorationTheme;
  themeId?: FeaturedExplorationThemeId;
  period?: string;          // e.g. "1870s → Today" — shown in story card for historical/evolution stories
  historicalContext?: string; // educational note about the historical dimension
  // Series classification (Build 47-D)
  seriesId?: FeaturedSeriesId; // which featured series this story belongs to
  // Registry fields (Build 52 — America 250 Story Registry)
  headline?: string;        // Founder-authored title displayed prominently in StoryCard
  selectorLabel?: string;   // Short label for selector button (defaults to stateAbbr)
  stayNational?: boolean;   // Skip state zoom — hold national view for intro / overview stories
};

export const FEATURED_EXPLORATION_LABEL = "Featured Exploration";

export const FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE =
  "Illustrative example — not based on your location.";

/**
 * Illustrative geographic coordinates for featured explorations.
 * latLon values are real county centroids used to position markers on
 * the authoritative U.S. map. They do not represent specific properties,
 * addresses, or any individual. The map reveals opportunities, not the visitor.
 *
 * County centroid sources: U.S. Census Bureau TIGER/Line Shapefiles (public domain).
 * Connected node positions are illustrative offsets within the same county.
 * Historical context sourced from USGS, BLM GLO Records, and USDA public datasets.
 */
export const CURATED_EXPLORATION_STORIES: FeaturedStory[] = [

  // ── Modern opportunity stories (Build 47) ─────────────────────────────────

  {
    state: "Tennessee",
    stateAbbr: "TN",
    county: "Maury County",
    opportunity: "Property & Land Possibilities",
    pathway: "Property & Land → Financing & Capital",
    story:
      "Some properties may have more than one path forward. Furlong helps you explore acquisition, readiness, financing, and next-step considerations before you commit.",
    focusPoint: { x: 63, y: 58 },
    latLon: { lat: 35.617, lon: -87.101 },
    color: "#4fc3f7",
    theme: "modern",
    connectedNodes: [
      { x: 58, y: 57, type: "Property", latLon: { lat: 35.598, lon: -87.145 } },
      { x: 63, y: 58, type: "Pathway",  latLon: { lat: 35.617, lon: -87.101 } },
      { x: 68, y: 55, type: "Capital",  latLon: { lat: 35.636, lon: -87.052 } },
    ],
  },

  {
    state: "Iowa",
    stateAbbr: "IA",
    county: "Story County",
    opportunity: "Farms & Agriculture",
    pathway: "Agriculture → Grants, Programs & Incentives",
    story:
      "Agricultural projects can connect to financing, conservation, infrastructure, and program opportunities people often do not know to explore.",
    focusPoint: { x: 50, y: 42 },
    latLon: { lat: 42.034, lon: -93.457 },
    color: "#4edf7e",
    theme: "modern",
    connectedNodes: [
      { x: 45, y: 44, type: "Farm",       latLon: { lat: 41.985, lon: -93.520 } },
      { x: 50, y: 42, type: "Programs",   latLon: { lat: 42.034, lon: -93.457 } },
      { x: 55, y: 39, type: "Incentives", latLon: { lat: 42.079, lon: -93.385 } },
    ],
  },

  {
    state: "Pennsylvania",
    stateAbbr: "PA",
    county: "Lancaster County",
    opportunity: "Small Business Growth",
    pathway: "Business → Readiness → Capital",
    story:
      "A small business may have growth options beyond one loan or one lender. Furlong helps illuminate readiness gaps, capital paths, and next questions.",
    focusPoint: { x: 75, y: 39 },
    latLon: { lat: 40.038, lon: -76.251 },
    color: "#ffb74d",
    theme: "modern",
    connectedNodes: [
      { x: 70, y: 40, type: "Business",  latLon: { lat: 39.998, lon: -76.312 } },
      { x: 75, y: 39, type: "Readiness", latLon: { lat: 40.038, lon: -76.251 } },
      { x: 79, y: 37, type: "Capital",   latLon: { lat: 40.071, lon: -76.182 } },
    ],
  },

  {
    state: "Missouri",
    stateAbbr: "MO",
    county: "Boone County",
    opportunity: "Environmental & Compliance",
    pathway: "Site Questions → Compliance → Safer Decisions",
    story:
      "Environmental and compliance questions can change what is realistic, financeable, or safe to pursue. Furlong helps surface those questions earlier.",
    focusPoint: { x: 54, y: 52 },
    latLon: { lat: 38.970, lon: -92.324 },
    color: "#81c784",
    theme: "modern",
    connectedNodes: [
      { x: 50, y: 52, type: "Site",       latLon: { lat: 38.940, lon: -92.388 } },
      { x: 54, y: 52, type: "Compliance", latLon: { lat: 38.970, lon: -92.324 } },
      { x: 59, y: 50, type: "Decision",   latLon: { lat: 39.003, lon: -92.248 } },
    ],
  },

  {
    state: "North Carolina",
    stateAbbr: "NC",
    county: "Catawba County",
    opportunity: "Housing & Development",
    pathway: "Housing → Infrastructure → Programs",
    story:
      "Development projects often involve more than construction costs. Furlong helps explore funding, infrastructure, readiness, and community-impact pathways.",
    focusPoint: { x: 78, y: 56 },
    latLon: { lat: 35.661, lon: -81.175 },
    color: "#f06292",
    theme: "modern",
    connectedNodes: [
      { x: 74, y: 55, type: "Housing",        latLon: { lat: 35.645, lon: -81.228 } },
      { x: 78, y: 56, type: "Infrastructure", latLon: { lat: 35.661, lon: -81.175 } },
      { x: 82, y: 58, type: "Programs",       latLon: { lat: 35.678, lon: -81.115 } },
    ],
  },

  // ── Historical discovery stories (Build 47-A) ──────────────────────────────
  // These stories surface educational historical context through a modern map.
  // The base map remains the current Census GeoJSON. Historical context is
  // editorial copy informed by USGS, BLM, and USDA public-domain data.
  // No historical GeoJSON layer is required for these stories — they work
  // with the modern base map and story card context.

  {
    state: "Illinois",
    stateAbbr: "IL",
    county: "McLean County",
    opportunity: "Historic Rail Corridors",
    pathway: "Infrastructure History → Commerce → Modern Opportunity",
    story:
      "McLean County sat at the intersection of two major rail lines that shaped Midwest commerce. Historic routes that once moved grain now underpin regional supply chains and modern business opportunity.",
    focusPoint: { x: 55, y: 44 },
    latLon: { lat: 40.493, lon: -88.839 },
    color: "#7e57c2",
    theme: "evolution",
    themeId: "historic-rail-corridors",
    period: "1870s → Today",
    historicalContext:
      "The Illinois Central and Chicago & Alton railroads made Bloomington-Normal a " +
      "Midwest hub in the 1870s. Those infrastructure decisions shaped where agriculture " +
      "markets, logistics operations, and businesses concentrated — patterns still visible today.",
    connectedNodes: [
      { x: 51, y: 45, type: "Railroad",  latLon: { lat: 40.465, lon: -88.905 } },
      { x: 55, y: 44, type: "Commerce",  latLon: { lat: 40.493, lon: -88.839 } },
      { x: 60, y: 42, type: "Logistics", latLon: { lat: 40.525, lon: -88.762 } },
    ],
  },

  {
    state: "Kansas",
    stateAbbr: "KS",
    county: "Harvey County",
    opportunity: "Agricultural Transformation",
    pathway: "Heritage Farming → Land Patterns → Programs & Capital",
    story:
      "Mennonite settlers brought Turkey Red wheat to Harvey County in the 1870s, transforming the central plains. The agricultural patterns that took hold over generations shape land use, financing, and conservation options discoverable today.",
    focusPoint: { x: 44, y: 58 },
    latLon: { lat: 37.987, lon: -97.425 },
    color: "#ff8a65",
    theme: "evolution",
    themeId: "historic-agriculture",
    period: "1874 → Today",
    historicalContext:
      "When Mennonite immigrants arrived in Harvey County in 1874 with Turkey Red wheat seed, " +
      "they introduced a winter wheat variety that could survive Kansas winters and transformed " +
      "the Great Plains into one of the world's most productive grain regions. " +
      "That agricultural heritage shapes today's land values, program eligibility, and conservation obligations.",
    connectedNodes: [
      { x: 41, y: 59, type: "Land Use",  latLon: { lat: 37.963, lon: -97.490 } },
      { x: 44, y: 58, type: "Programs",  latLon: { lat: 37.987, lon: -97.425 } },
      { x: 48, y: 56, type: "Heritage",  latLon: { lat: 38.015, lon: -97.351 } },
    ],
  },

  {
    state: "Oregon",
    stateAbbr: "OR",
    county: "Linn County",
    opportunity: "Conservation History",
    pathway: "Timber History → Land Transition → Stewardship & Compliance",
    story:
      "Linn County's transition from old-growth timber to managed forests and conservation areas created new land ownership patterns, stewardship obligations, and ecological restoration opportunities that landowners continue navigating today.",
    focusPoint: { x: 9, y: 35 },
    latLon: { lat: 44.494, lon: -122.534 },
    color: "#4caf50",
    theme: "evolution",
    themeId: "conservation-success-stories",
    period: "1950s → Today",
    historicalContext:
      "Oregon's post-WWII timber boom transformed Linn County. By the 1990s, " +
      "federal land policy changes and conservation designations shifted ownership patterns " +
      "and created new stewardship obligations. Today, landowners in former timber regions " +
      "encounter compliance questions, conservation program opportunities, and financing paths " +
      "that reflect decades of land use transition.",
    connectedNodes: [
      { x: 7,  y: 34, type: "Conservation", latLon: { lat: 44.510, lon: -122.600 } },
      { x: 9,  y: 35, type: "Stewardship",  latLon: { lat: 44.494, lon: -122.534 } },
      { x: 12, y: 37, type: "Compliance",   latLon: { lat: 44.470, lon: -122.450 } },
    ],
  },
];

// ── America 250 Discovery Series ─────────────────────────────────────────────
// Canonical founder-authored stories are now maintained in the story registry.
// All deprecated placeholder copy (natural trading hub, Trade Hub, Innovation Hub,
// Canal Commerce as node type, Port → Commerce → Trade Route) has been removed.
// Source: src/lib/maps/america250StoryRegistry.ts (Build 52)
//
// Sequence: Intro → Capital Road-Trip → Delaware → Pennsylvania →
//           New York → Massachusetts → Virginia (placeholder) → Maine (placeholder)
//
// Do not re-add generic generated blurbs here. Narrative copy lives in the registry.

export { AMERICA_250_STORIES } from "@/lib/maps/america250StoryRegistry";

// Future expansion: New Hampshire, Rhode Island, Connecticut, New Jersey,
// Maryland, North Carolina, South Carolina, Georgia — ready to add as
// additional anchor states in the America 250 series.

export type ExplorationCategory = {
  slug: string;
  label: string;
  blurb: string;
};

/**
 * The eight homepage exploration categories. Each routes into the exploration
 * flow as /onboarding?explore=<slug> (no personal information is collected on
 * the homepage).
 */
export const EXPLORATION_CATEGORIES: ExplorationCategory[] = [
  {
    slug: "property-land",
    label: "Property & Land",
    blurb: "Acquisition, readiness, and what a property could support.",
  },
  {
    slug: "farms-agriculture",
    label: "Farms & Agriculture",
    blurb: "Financing, conservation, infrastructure, and programs.",
  },
  {
    slug: "small-business-growth",
    label: "Small Business Growth",
    blurb: "Readiness gaps, capital paths, and next questions.",
  },
  {
    slug: "environmental-compliance",
    label: "Environmental & Compliance",
    blurb: "Site questions that change what is realistic or safe.",
  },
  {
    slug: "financing-capital",
    label: "Financing & Capital",
    blurb: "The kinds of financing that might fit a project like yours.",
  },
  {
    slug: "housing-development",
    label: "Newsletters & Podcasts",
    blurb: "The Furlong Compass — your industry's tailored newsletters and podcasts, in your voice.",
  },
  {
    slug: "programs-incentives",
    label: "Grants, Programs & Incentives",
    blurb: "Grants, tax credits, cost-share, and incentive programs people often don't know to explore — the add-ons that stack onto a project.",
  },
  {
    slug: "not-sure",
    label: "I'm Not Sure Yet",
    blurb: "Start broad and explore the full map at your own pace.",
  },
];

export function explorationHref(slug: string): string {
  return `/onboarding?explore=${encodeURIComponent(slug)}`;
}
