import type { CountyCollege } from "./countyCollegesGenerated";

/** Branch campuses omitted by institution-main-address IPEDS county joins. */
export const COUNTY_COLLEGE_BRANCHES: Record<string, CountyCollege[]> = {
  "10005": [
    { name: "Delaware Technical Community College — Owens Campus", city: "Georgetown", state: "DE", level: "community college", lat: 38.697667, lon: -75.408352 },
  ],
};

export const COUNTY_COLLEGE_BRANCHES_PROVENANCE = {
  source: "Branch-campus correction layer; campus-level institutional records",
  asOf: "2026-07-26",
} as const;
