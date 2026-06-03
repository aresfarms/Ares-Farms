export function runPolicyEngine(enriched: any) {
  return {
    policy: {
      region: enriched.region ?? "UNKNOWN",
      county: enriched.county ?? null,
      policies: [],
      eligibility: {
        usdaEligible: false,
        sbaEligible: true,
        flags: [],
      },
    },
  };
}
