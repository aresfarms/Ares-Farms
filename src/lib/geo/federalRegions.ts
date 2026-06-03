/**
 * Federal Region Utilities
 *
 * Master Volume Governance:
 * - Vol I: Provides governed geographic authority mapping.
 * - Vol II: Supports regulatory jurisdiction routing.
 * - Vol III: Keeps enrichment logic centralized and deterministic.
 * - Vol IV: Supports operational onboarding workflows.
 * - Vol V: Enables explainable geographic classification.
 *
 * Purpose:
 * This module maps U.S. states to federal regions for onboarding,
 * enrichment, compliance routing, and future jurisdiction-aware logic.
 */

export const stateToFederalRegion: Record<string, string> = {
  AL: "Region 4",
  AK: "Region 10",
  AZ: "Region 9",
  AR: "Region 6",
  CA: "Region 9",
  CO: "Region 8",
  CT: "Region 1",
  DE: "Region 3",
  FL: "Region 4",
  GA: "Region 4",
  HI: "Region 9",
  ID: "Region 10",
  IL: "Region 5",
  IN: "Region 5",
  IA: "Region 7",
  KS: "Region 7",
  KY: "Region 4",
  LA: "Region 6",
  ME: "Region 1",
  MD: "Region 3",
  MA: "Region 1",
  MI: "Region 5",
  MN: "Region 5",
  MS: "Region 4",
  MO: "Region 7",
  MT: "Region 8",
  NE: "Region 7",
  NV: "Region 9",
  NH: "Region 1",
  NJ: "Region 2",
  NM: "Region 6",
  NY: "Region 2",
  NC: "Region 4",
  ND: "Region 8",
  OH: "Region 5",
  OK: "Region 6",
  OR: "Region 10",
  PA: "Region 3",
  RI: "Region 1",
  SC: "Region 4",
  SD: "Region 8",
  TN: "Region 4",
  TX: "Region 6",
  UT: "Region 8",
  VT: "Region 1",
  VA: "Region 3",
  WA: "Region 10",
  WV: "Region 3",
  WI: "Region 5",
  WY: "Region 8",
  DC: "Region 3",
};

export function getFederalRegion(state?: string | null) {
  if (!state) {
    return "Unknown";
  }

  const normalizedState = state.trim().toUpperCase();

  return stateToFederalRegion[normalizedState] ?? "Unknown";
}

export async function runEnrichment(input: any) {
  const location = input?.location || {};
  const state = location?.state || input?.state || null;

  return {
    ...input,
    enrichment: {
      ...(input?.enrichment || {}),
      federalRegion: getFederalRegion(state),
    },
  };
}
