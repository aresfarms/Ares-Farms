/**
 * Map Layer Registry — Build 47-A
 * Volume III §Map Asset Governance · Doctrine: MAP_LAYER_GOVERNANCE_V1
 *
 * Defines all overlay layers the Living Opportunity Map supports.
 * Architecture allows layers to be added without rebuilding the base map.
 * Each layer has an `isAvailable` flag — false means the architecture is
 * in place but data has not yet been ingested for that layer.
 *
 * Do not add a layer unless a governing source in mapSourceRegistry.ts
 * supports it and the data can be ingested without live page-load fetches.
 */

import type { AuthorityTier } from "./mapSourceRegistry";

export type MapLayerId =
  | "modern"
  | "historical"
  | "opportunity"
  | "program"
  | "agriculture"
  | "environmental"
  | "infrastructure";

export type MapLayer = {
  id: MapLayerId;
  label: string;
  description: string;
  editorialNote: string;
  isAvailable: boolean;
  primarySourceIds: string[];
  minimumAuthorityTier: AuthorityTier;
  supportedPeriods: string[];
  homepageVisible: boolean;
};

export const MAP_LAYERS: Record<MapLayerId, MapLayer> = {
  modern: {
    id: "modern",
    label: "Modern Map",
    description: "Current U.S. state and county boundaries from Census Bureau TIGER data.",
    editorialNote: "The standard base map. Shows current boundaries and modern opportunity context.",
    isAvailable: true,
    primarySourceIds: ["census_tiger_rest"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["current"],
    homepageVisible: true,
  },

  historical: {
    id: "historical",
    label: "Historical Map",
    description:
      "Historical topographic maps and boundary data from USGS HTMC and BLM GLO Records. " +
      "Covers selected decades from the 1860s through the 1980s.",
    editorialNote:
      "Reveals how a region looked and functioned in the past. " +
      "Useful for understanding land use history, infrastructure evolution, and agricultural patterns.",
    isAvailable: false,
    primarySourceIds: ["usgs_htmc", "blm_glro", "usgs_gnis"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["1860s", "1900s", "1950s", "1980s"],
    homepageVisible: false,
  },

  opportunity: {
    id: "opportunity",
    label: "Opportunity Layer",
    description:
      "Program eligibility zones, financing opportunity indicators, and readiness context " +
      "derived from USDA, BLM, and Census program data.",
    editorialNote:
      "Shows where programs and financing paths concentrate. " +
      "Illustrative only — not a guarantee of eligibility or approval.",
    isAvailable: false,
    primarySourceIds: ["usda_nrcs", "blm_national_surface", "census_tiger_rest"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["current"],
    homepageVisible: false,
  },

  program: {
    id: "program",
    label: "Program Layer",
    description:
      "Mapped program zones from USDA, conservation programs, and federal assistance areas. " +
      "Shows regions with active program activity.",
    editorialNote:
      "Program boundaries change. This layer reflects data at time of last ingestion. " +
      "Always verify current program terms before relying on this layer.",
    isAvailable: false,
    primarySourceIds: ["usda_nrcs", "usda_fsa", "nps_boundaries"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["current"],
    homepageVisible: false,
  },

  agriculture: {
    id: "agriculture",
    label: "Agriculture Layer",
    description:
      "Cropland patterns, soil classification, and agricultural land use from USDA NRCS " +
      "Web Soil Survey and FSA Cropland Data Layer.",
    editorialNote:
      "Reveals what a region has grown and what soils support. " +
      "Historical crop data from 1997 onward; soil surveys from initial survey dates.",
    isAvailable: false,
    primarySourceIds: ["usda_nrcs", "usda_fsa"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["current", "1980s", "1950s"],
    homepageVisible: false,
  },

  environmental: {
    id: "environmental",
    label: "Environmental Layer",
    description:
      "Watershed boundaries, flood history, wetland extents, and conservation area boundaries " +
      "from NOAA and USGS hydrography data.",
    editorialNote:
      "Shows environmental context that may affect land use, financing eligibility, " +
      "and compliance obligations. Not a regulatory determination.",
    isAvailable: false,
    primarySourceIds: ["noaa_climate", "noaa_coast", "usgs_national_map"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["current", "1980s"],
    homepageVisible: false,
  },

  infrastructure: {
    id: "infrastructure",
    label: "Infrastructure Layer",
    description:
      "Transportation networks, rail corridors, utility infrastructure, and community facilities " +
      "from USGS National Map transportation data.",
    editorialNote:
      "Historic and current infrastructure patterns reveal access, connectivity, and development history. " +
      "Historic rail corridors often show where commercial opportunity patterns persist.",
    isAvailable: false,
    primarySourceIds: ["usgs_national_map", "usgs_htmc", "census_tiger_rest"],
    minimumAuthorityTier: "tier-1-federal",
    supportedPeriods: ["current", "1950s", "1900s", "1860s"],
    homepageVisible: false,
  },
};

export function getAvailableLayers(): MapLayer[] {
  return Object.values(MAP_LAYERS).filter((l) => l.isAvailable);
}

export function getHomepageVisibleLayers(): MapLayer[] {
  return Object.values(MAP_LAYERS).filter((l) => l.homepageVisible && l.isAvailable);
}

export function getLayerById(id: MapLayerId): MapLayer {
  return MAP_LAYERS[id];
}
