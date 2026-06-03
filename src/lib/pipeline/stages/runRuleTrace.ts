export function runRuleTrace(score: any, risk: any) {
  return {
    trace: [
      {
        layer: "SCORING",
        rule: "BASE_SCORE",
        impact: 0,
        before: score.score,
        after: score.score,
        reason: "Base calculation",
      },
      {
        layer: "RISK",
        rule: "RISK_ADJUSTMENT",
        impact: -risk.riskScore * 0.3,
        before: score.score,
        after: score.score - risk.riskScore * 0.3,
        reason: "Risk adjustment applied",
      },
    ],
    finalScore: score.score - risk.riskScore * 0.3,
  };
}
