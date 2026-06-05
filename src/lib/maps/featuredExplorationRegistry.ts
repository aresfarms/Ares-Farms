/**
 * Featured Exploration Registry — Build 47-A
 * Volume III §Map Asset Governance · Doctrine: MAP_LAYER_GOVERNANCE_V1
 *
 * Canonical registry of the editorial themes for the Living Opportunity Map's
 * featured exploration system. These themes define what kinds of stories the
 * map tells — not the individual stories themselves (see featuredExplorationStories.ts).
 *
 * The homepage rotates through curated stories from these themes. Visitors
 * should feel: "There is always something interesting to discover."
 *
 * Privacy posture: The map reveals regions, patterns, and history — never
 * the visitor. No theme may suggest personalization, geolocation, or
 * individual-level data. "The map reveals opportunities, not the visitor."
 */

import type { MapLayerId } from "./mapLayerRegistry";
import type { HistoricalPeriodId } from "./historicalLayerRegistry";

export type FeaturedExplorationThemeId =
  | "historic-agriculture"
  | "historic-rail-corridors"
  | "land-stewardship-evolution"
  | "water-resource-history"
  | "community-growth-patterns"
  | "conservation-success-stories"
  | "regional-industry-evolution";

export type StoryPerspective =
  | "modern"       // Contemporary opportunity context
  | "historical"   // Historical context as discovery
  | "evolution";   // Then-to-now comparison

export type FeaturedExplorationTheme = {
  id: FeaturedExplorationThemeId;
  label: string;
  homepageTeaser: string;
  description: string;
  perspective: StoryPerspective;
  relevantLayers: MapLayerId[];
  relevantPeriods: HistoricalPeriodId[];
  discoveryPrompt: string;
  privacyNote: string;
};

export const FEATURED_EXPLORATION_THEMES: Record<
  FeaturedExplorationThemeId,
  FeaturedExplorationTheme
> = {

  "historic-agriculture": {
    id: "historic-agriculture",
    label: "Historic Agriculture",
    homepageTeaser: "Agricultural patterns that transformed over generations.",
    description:
      "How agricultural regions evolved — from original cultivation to modern farming " +
      "systems — and what those patterns reveal about today's financing, program, " +
      "and stewardship opportunities.",
    perspective: "evolution",
    relevantLayers: ["modern", "agriculture", "historical"],
    relevantPeriods: ["1900s", "1950s", "1980s", "current"],
    discoveryPrompt:
      "Explore how a region's agricultural identity shapes what programs, " +
      "financing paths, and conservation options may exist today.",
    privacyNote:
      "Stories show regional patterns and historical land use, not individual farms or owners.",
  },

  "historic-rail-corridors": {
    id: "historic-rail-corridors",
    label: "Historic Rail Corridors",
    homepageTeaser: "Historic rail corridors that shaped modern business growth.",
    description:
      "Rail infrastructure built in the 1860s–1900s created the economic geography " +
      "of entire regions. Historic corridors reveal where commercial opportunity, " +
      "logistics, and community growth concentrate today.",
    perspective: "evolution",
    relevantLayers: ["modern", "infrastructure", "historical"],
    relevantPeriods: ["1860s", "1900s", "1950s", "current"],
    discoveryPrompt:
      "Explore how historic transportation routes shaped where opportunity concentrates — " +
      "and what that means for businesses considering those regions today.",
    privacyNote:
      "Stories show regional infrastructure patterns and historical transportation history, " +
      "not individual businesses or properties.",
  },

  "land-stewardship-evolution": {
    id: "land-stewardship-evolution",
    label: "Land Stewardship Evolution",
    homepageTeaser: "How this region's land stewardship responsibilities evolved over time.",
    description:
      "Conservation easements, stewardship programs, and land use obligations have " +
      "transformed millions of acres. Understanding how stewardship responsibilities " +
      "evolved reveals what a landowner may face today.",
    perspective: "evolution",
    relevantLayers: ["modern", "environmental", "program", "historical"],
    relevantPeriods: ["1950s", "1980s", "current"],
    discoveryPrompt:
      "Explore how stewardship responsibilities have grown in a region — " +
      "and what that may mean for financing, compliance, and program eligibility today.",
    privacyNote:
      "Stories show regional stewardship patterns, not individual property records or owners.",
  },

  "water-resource-history": {
    id: "water-resource-history",
    label: "Water Resource History",
    homepageTeaser: "Watershed history that shaped land value and risk.",
    description:
      "Flood histories, watershed changes, wetland evolution, and water rights patterns " +
      "reveal environmental context that affects land use, financing, and compliance " +
      "for generations after the original events.",
    perspective: "evolution",
    relevantLayers: ["modern", "environmental", "historical"],
    relevantPeriods: ["1900s", "1950s", "1980s", "current"],
    discoveryPrompt:
      "Explore how a region's water history shapes what is realistic, financeable, " +
      "or safe to pursue today — and what compliance questions to ask first.",
    privacyNote:
      "Stories show regional watershed patterns and environmental history, not individual parcels.",
  },

  "community-growth-patterns": {
    id: "community-growth-patterns",
    label: "Community Growth Patterns",
    homepageTeaser: "How a region grew — and what that growth created.",
    description:
      "Population shifts, development waves, and community evolution reveal " +
      "infrastructure gaps, housing opportunities, and business needs. " +
      "Understanding growth patterns helps identify where opportunity still exists.",
    perspective: "evolution",
    relevantLayers: ["modern", "infrastructure", "historical"],
    relevantPeriods: ["1950s", "1980s", "current"],
    discoveryPrompt:
      "Explore how population and development shaped a region — " +
      "and where growth created today's infrastructure needs, housing gaps, " +
      "and business opportunities.",
    privacyNote:
      "Stories show regional demographic and development patterns using Census data, " +
      "not individual household information.",
  },

  "conservation-success-stories": {
    id: "conservation-success-stories",
    label: "Conservation Success Stories",
    homepageTeaser: "Conservation history that changed what land can become.",
    description:
      "National parks, wilderness designations, conservation easements, and " +
      "ecosystem restoration programs transformed regions. These transitions " +
      "create adjacent opportunities for compatible land use, ecotourism, " +
      "and stewardship-aligned financing.",
    perspective: "historical",
    relevantLayers: ["modern", "environmental", "program"],
    relevantPeriods: ["1950s", "1980s", "current"],
    discoveryPrompt:
      "Explore how conservation designations shaped a region — " +
      "and what stewardship, program, and financing opportunities exist near " +
      "protected lands today.",
    privacyNote:
      "Stories show regional conservation boundaries from NPS and USDA data, " +
      "not individual property records.",
  },

  "regional-industry-evolution": {
    id: "regional-industry-evolution",
    label: "Regional Industry Evolution",
    homepageTeaser: "How a region's industries transformed — and what that means today.",
    description:
      "Timber to conservation. Mining to recreation. Manufacturing to logistics. " +
      "Regional industry transitions create lasting patterns of land ownership, " +
      "infrastructure, workforce, and regulatory context that shape current opportunity.",
    perspective: "evolution",
    relevantLayers: ["modern", "infrastructure", "agriculture", "historical"],
    relevantPeriods: ["1900s", "1950s", "1980s", "current"],
    discoveryPrompt:
      "Explore how industrial transitions shaped a region's economic geography — " +
      "and what those transitions mean for land, financing, and compliance today.",
    privacyNote:
      "Stories show regional industry patterns and historical land use, " +
      "not individual business records.",
  },
};

export function getThemeById(
  id: FeaturedExplorationThemeId
): FeaturedExplorationTheme {
  return FEATURED_EXPLORATION_THEMES[id];
}

export function getAllThemes(): FeaturedExplorationTheme[] {
  return Object.values(FEATURED_EXPLORATION_THEMES);
}

export function getThemesByPerspective(
  perspective: StoryPerspective
): FeaturedExplorationTheme[] {
  return Object.values(FEATURED_EXPLORATION_THEMES).filter(
    (t) => t.perspective === perspective
  );
}
