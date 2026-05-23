export function buildRanking(score: any, risk: any) {
  const base = score?.score ?? 0;
  const riskPenalty = risk?.riskScore ?? 0;

  const adjustedScore = Math.max(0, base - riskPenalty);

  let priority: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (adjustedScore > 0.7) priority = "HIGH";
  else if (adjustedScore > 0.4) priority = "MEDIUM";

  return {
    priority,
    adjustedScore,
  };
}
