export async function runRankingEngine(input: any) {
  const score = input.score?.score ?? 0;
  const risk = input.risk?.riskScore ?? 0;
  const decision = input.decision?.decision ?? "REVIEW";

  // -------------------------
  // BASE PRIORITY SCORE
  // -------------------------
  let adjustedScore = score * (1 - risk);

  // -------------------------
  // DECISION WEIGHTING
  // -------------------------
  if (decision === "APPROVE") adjustedScore += 0.1;
  if (decision === "REJECT") adjustedScore -= 0.1;

  // -------------------------
  // PRIORITY CLASSIFICATION
  // -------------------------
  let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";

  if (adjustedScore >= 0.75) priority = "HIGH";
  else if (adjustedScore >= 0.5) priority = "MEDIUM";
  else priority = "LOW";

  return {
    priority,
    adjustedScore,
  };
}
