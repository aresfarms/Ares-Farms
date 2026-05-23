export function enrich(normalized: any) {
  return {
    ...normalized,
    region: normalized?.location?.region ?? "UNKNOWN",
    county: normalized?.location?.county ?? null,
    enriched: true,
  };
}
