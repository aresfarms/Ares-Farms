/**
 * countyBroadbandGenerated — GENERATED FILE. Do not edit by hand.
 * EMPTY until ingest:fcc-broadband runs (needs owner FCC credential).
 */
export const COUNTY_BROADBAND_PROVENANCE = {
  asOf: null as string | null,
  bdcAsOf: null as string | null,
  source: "FCC National Broadband Map (Broadband Data Collection)",
  resolvedCounties: 0,
} as const;
export interface CountyBroadband { pctServed: number; pctWired: number; locations: number; }
export const COUNTY_BROADBAND: Record<string, CountyBroadband> = {};
