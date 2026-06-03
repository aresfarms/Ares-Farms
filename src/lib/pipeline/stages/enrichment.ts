import { getFederalRegion } from "@/lib/geo/federalRegions";

export async function runEnrichment(input: any) {
  const location = input.location || {};

  const state = location.state;
  const county = location.county;
  const country = location.country ?? "US";

  // Step 1 — preserve existing region if valid
  let region = location.region;

  // Step 2 — infer region if missing or invalid
  if (!region || region === "UNKNOWN") {
    region = getFederalRegion(state) || "UNKNOWN";
  }

  // Step 3 — DO NOT overwrite county if it exists
  const finalCounty = county ?? null;

  return {
    ...input,
    location: {
      ...location,
      state,
      county: finalCounty,
      region,
      country,
    },
    region,
    county: finalCounty,
    enriched: true,
  };
}
