export async function runRiskEngine(input: any) {
  // Placeholder deterministic risk logic
  // (safe baseline until your real engine is wired)

  const baseRisk =
    (input?.financials?.expenses || 0) /
    (input?.financials?.revenue || 1);

  const regionMultiplier =
    input?.location?.region === "Mid-Atlantic"
      ? 1.1
      : input?.location?.region === "South"
      ? 1.2
      : 1.0;

  return {
    riskScore: Math.min(baseRisk * regionMultiplier, 1),
    flags: baseRisk > 0.5 ? ["high_expense_ratio"] : [],
  };
}
