export async function runPolicyEngine(input: any) {
  const location = input?.enriched?.location;

  const region = location?.region ?? "UNKNOWN";
  const county = location?.county ?? null;

  const policies: string[] = [];

  if (region === "Mid-Atlantic") {
    policies.push("USDA_HIGH_COMPLIANCE_REGION");
  }

  const eligibility = {
    usdaEligible: region !== "UNKNOWN",
    sbaEligible: true,
    flags: [] as string[],
  };

  return {
    ...input.enriched,
    policy: {
      region,
      county,
      policies,
      eligibility,
    },
  };
}
