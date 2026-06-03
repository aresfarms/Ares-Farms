export function runRiskEngine(enriched: any) {
  const baseRisk = 0.5;

  return {
    riskScore: baseRisk,
    flags: baseRisk > 0.5 ? ["high_risk"] : [],
  };
}
