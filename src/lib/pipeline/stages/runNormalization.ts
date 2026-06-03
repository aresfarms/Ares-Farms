export function runNormalization(input: any) {
  return {
    userId: input.userId ?? "unknown",
    name: input.name ?? "unnamed",
    location: {
      state: input.location?.state ?? null,
      county: input.location?.county ?? null,
      region: input.location?.region ?? "unknown",
      country: input.location?.country ?? "US",
    },
    financials: {
      revenue: input.financials?.revenue ?? 0,
      expenses: input.financials?.expenses ?? 0,
    },
    metadata: input.metadata ?? {},
    normalized: true,
  };
}
