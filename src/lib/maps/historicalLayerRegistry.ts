/**
 * Historical Layer Registry — Build 47-A
 * Volume III §Map Asset Governance · Doctrine: MAP_LAYER_GOVERNANCE_V1
 *
 * Defines the supported historical time periods for the Living Opportunity Map.
 * Each period describes what data is available, its sources, and its coverage.
 *
 * Historical layers require separate asset ingestion from USGS HTMC,
 * BLM GLO Records, and other approved historical sources. See mapSourceRegistry.ts.
 * Not all periods have data available for all regions — coverage is documented per period.
 *
 * The homepage does not expose a period selector directly. Historical context is
 * surfaced through curated featured exploration stories (featuredExplorationStories.ts).
 */

export type HistoricalPeriodId =
  | "1860s"
  | "1900s"
  | "1950s"
  | "1980s"
  | "current";

export type HistoricalPeriod = {
  id: HistoricalPeriodId;
  label: string;
  approximateYearRange: [number, number];
  description: string;
  dataAvailable: boolean;
  primarySourceIds: string[];
  regionalCoverage: string;
  contextNote: string;
  replay_ref_prefix: string;
};

export const HISTORICAL_PERIODS: Record<HistoricalPeriodId, HistoricalPeriod> = {

  "1860s": {
    id: "1860s",
    label: "1860s",
    approximateYearRange: [1857, 1872],
    description:
      "Early settlement era. Railroad expansion, original public land survey completion, " +
      "and initial agricultural patterns. Reflects pre-industrial land use.",
    dataAvailable: false,
    primarySourceIds: ["usgs_htmc", "blm_glro"],
    regionalCoverage:
      "GLO land patents available nationally. USGS topographic maps limited — " +
      "early survey coverage concentrated in Northeast and Midwest.",
    contextNote:
      "This era reflects original settlement patterns: how land was first divided, " +
      "what early rail and river routes determined, and where agricultural regions began.",
    replay_ref_prefix: "HIST_LAYER_1860S",
  },

  "1900s": {
    id: "1900s",
    label: "1900s",
    approximateYearRange: [1895, 1915],
    description:
      "Peak agricultural era. USGS systematic topographic survey underway nationally. " +
      "Rail networks mature. Agricultural specialization by region established.",
    dataAvailable: false,
    primarySourceIds: ["usgs_htmc", "usgs_gnis", "blm_glro"],
    regionalCoverage:
      "USGS topographic maps available for most of the eastern and central U.S. " +
      "Western mountain coverage incomplete. GLO surveys complete.",
    contextNote:
      "This era shows the mature agricultural landscape and infrastructure that " +
      "defined regional economies for generations. Rail corridors, county seats, " +
      "and agricultural patterns visible in this era often persist today.",
    replay_ref_prefix: "HIST_LAYER_1900S",
  },

  "1950s": {
    id: "1950s",
    label: "1950s",
    approximateYearRange: [1948, 1962],
    description:
      "Post-war expansion era. Agricultural modernization, highway construction, " +
      "and suburban development. Conservation programs beginning.",
    dataAvailable: false,
    primarySourceIds: ["usgs_htmc", "noaa_climate", "usda_nrcs"],
    regionalCoverage:
      "USGS 7.5-minute topographic maps available for most of the U.S. " +
      "Coverage is near-national at 1:24,000 scale. " +
      "NOAA climate data available from 1895.",
    contextNote:
      "This era captures the moment when many regions made irreversible transitions: " +
      "from small-scale to industrial agriculture, from rail to highway, " +
      "from forest to cropland or back. Conservation programs of the 1950s " +
      "shaped today's protected landscapes.",
    replay_ref_prefix: "HIST_LAYER_1950S",
  },

  "1980s": {
    id: "1980s",
    label: "1980s",
    approximateYearRange: [1978, 1992],
    description:
      "Agricultural crisis era. Farm consolidation, conservation easement programs, " +
      "environmental regulation growth. FSA cropland data begins this period.",
    dataAvailable: false,
    primarySourceIds: ["usgs_htmc", "usda_fsa", "noaa_climate", "usda_nrcs"],
    regionalCoverage:
      "Complete USGS topographic coverage. USDA agricultural data comprehensive. " +
      "NOAA climate records continuous. EPA environmental data growing.",
    contextNote:
      "The 1980s farm crisis reshaped land ownership patterns across the Midwest. " +
      "Conservation Reserve Program (CRP) enrolled millions of acres. " +
      "The ownership and program patterns from this era often define today's opportunities.",
    replay_ref_prefix: "HIST_LAYER_1980S",
  },

  current: {
    id: "current",
    label: "Current",
    approximateYearRange: [2020, 2026],
    description:
      "Modern boundaries and features from Census Bureau TIGER data (2023 vintage). " +
      "Current state and county boundaries, modern infrastructure, current program zones.",
    dataAvailable: true,
    primarySourceIds: ["census_tiger_rest", "usgs_national_map"],
    regionalCoverage: "National — complete for all 50 states, DC, and territories.",
    contextNote:
      "Current data is the default view. All featured explorations that do not specify " +
      "a historical period use this layer.",
    replay_ref_prefix: "HIST_LAYER_CURRENT",
  },
};

export function getPeriodById(id: HistoricalPeriodId): HistoricalPeriod {
  return HISTORICAL_PERIODS[id];
}

export function getAvailablePeriods(): HistoricalPeriod[] {
  return Object.values(HISTORICAL_PERIODS).filter((p) => p.dataAvailable);
}

export function getPeriodLabel(id: HistoricalPeriodId): string {
  return HISTORICAL_PERIODS[id].label;
}
