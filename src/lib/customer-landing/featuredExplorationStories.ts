/**
 * Customer landing — Featured Exploration data (Build 45).
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
 */

export type ExplorationNode = {
  x: number; // 0–100, percentage across the decorative map canvas
  y: number; // 0–100
  type: string;
};

export type FeaturedStory = {
  state: string;
  county: string;
  opportunity: string;
  pathway: string;
  story: string;
  focusPoint: { x: number; y: number };
  color: string;
  connectedNodes: ExplorationNode[];
};

export const FEATURED_EXPLORATION_LABEL = "Featured Exploration";

export const FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE =
  "Illustrative example — no geolocation or exact address.";

export const CURATED_EXPLORATION_STORIES: FeaturedStory[] = [
  {
    state: "Tennessee",
    county: "Maury County",
    opportunity: "Property & Land Possibilities",
    pathway: "Property & Land → Financing & Capital",
    story:
      "Some properties may have more than one path forward. Furlong helps you explore acquisition, readiness, financing, and next-step considerations before you commit.",
    focusPoint: { x: 63, y: 58 },
    color: "#4fc3f7",
    connectedNodes: [
      { x: 58, y: 57, type: "Property" },
      { x: 63, y: 58, type: "Pathway" },
      { x: 68, y: 55, type: "Capital" },
    ],
  },
  {
    state: "Iowa",
    county: "Story County",
    opportunity: "Farms & Agriculture",
    pathway: "Agriculture → Programs & Incentives",
    story:
      "Agricultural projects can connect to financing, conservation, infrastructure, and program opportunities people often do not know to explore.",
    focusPoint: { x: 50, y: 42 },
    color: "#4edf7e",
    connectedNodes: [
      { x: 45, y: 44, type: "Farm" },
      { x: 50, y: 42, type: "Programs" },
      { x: 55, y: 39, type: "Incentives" },
    ],
  },
  {
    state: "Pennsylvania",
    county: "Lancaster County",
    opportunity: "Small Business Growth",
    pathway: "Business → Readiness → Capital",
    story:
      "A small business may have growth options beyond one loan or one lender. Furlong helps illuminate readiness gaps, capital paths, and next questions.",
    focusPoint: { x: 75, y: 39 },
    color: "#ffb74d",
    connectedNodes: [
      { x: 70, y: 40, type: "Business" },
      { x: 75, y: 39, type: "Readiness" },
      { x: 79, y: 37, type: "Capital" },
    ],
  },
  {
    state: "Missouri",
    county: "Boone County",
    opportunity: "Environmental & Compliance",
    pathway: "Site Questions → Compliance → Safer Decisions",
    story:
      "Environmental and compliance questions can change what is realistic, financeable, or safe to pursue. Furlong helps surface those questions earlier.",
    focusPoint: { x: 54, y: 52 },
    color: "#81c784",
    connectedNodes: [
      { x: 50, y: 52, type: "Site" },
      { x: 54, y: 52, type: "Compliance" },
      { x: 59, y: 50, type: "Decision" },
    ],
  },
  {
    state: "North Carolina",
    county: "Catawba County",
    opportunity: "Housing & Development",
    pathway: "Housing → Infrastructure → Programs",
    story:
      "Development projects often involve more than construction costs. Furlong helps explore funding, infrastructure, readiness, and community-impact pathways.",
    focusPoint: { x: 78, y: 56 },
    color: "#f06292",
    connectedNodes: [
      { x: 74, y: 55, type: "Housing" },
      { x: 78, y: 56, type: "Infrastructure" },
      { x: 82, y: 58, type: "Programs" },
    ],
  },
];

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
    label: "Housing & Development",
    blurb: "Funding, infrastructure, readiness, and community impact.",
  },
  {
    slug: "programs-incentives",
    label: "Programs & Incentives",
    blurb: "Programs and incentives people often do not know to explore.",
  },
  {
    slug: "not-sure",
    label: "I’m Not Sure Yet",
    blurb: "Start broad and explore the full map at your own pace.",
  },
];

export function explorationHref(slug: string): string {
  return `/onboarding?explore=${encodeURIComponent(slug)}`;
}
