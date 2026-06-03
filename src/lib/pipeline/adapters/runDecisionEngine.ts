export async function runDecisionEngine(input: any) {
  const risk = input.risk?.riskScore ?? 0;
  const compliance = input.policy?.eligibility?.usdaEligible ? 1 : 0;

  const financialScore = input.score?.score ?? 0;

  const region = input.region ?? input.location?.region ?? "UNKNOWN";
  const county = input.county ?? input.location?.county ?? null;

  // -------------------------
  // GEO MODIFIER
  // -------------------------
  let geoModifier = 1.0;

  if (region === "Mid-Atlantic") geoModifier -= 0.05;
  if (region === "Northeast") geoModifier -= 0.05;
  if (region === "West") geoModifier -= 0.02;
  if (region === "Midwest") geoModifier -= 0.02;
  if (region === "South") geoModifier -= 0.02;

  // -------------------------
  // COMPOSITE SCORE
  // -------------------------
  const compositeScore =
    financialScore * 0.6 +
    compliance * 0.25 +
    (1 - risk) * 0.15;

  const adjustedScore = compositeScore * geoModifier;

  // -------------------------
  // DECISION LOGIC
  // -------------------------
  let decision: "APPROVE" | "REVIEW" | "REJECT" = "REVIEW";

  if (adjustedScore >= 0.75) decision = "APPROVE";
  else if (adjustedScore < 0.45) decision = "REJECT";

  return {
    decision,
    compositeScore,
    breakdown: {
      financialScore,
      complianceScore: compliance,
      riskScore: risk,
    },
    metadata: {
      region,
      county,
      type: input.metadata?.type ?? null,
    },
  };
}
