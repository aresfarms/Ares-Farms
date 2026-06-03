export function runDecisionEngine(score: any, risk: any) {
  const compositeScore = score.score - (risk.riskScore * 0.3);

  return {
    decision: compositeScore > 0.6 ? "APPROVE" : "REJECT",
    compositeScore,
    breakdown: {
      financialScore: score.score,
      complianceScore: 0,
      riskScore: risk.riskScore,
    },
  };
}
