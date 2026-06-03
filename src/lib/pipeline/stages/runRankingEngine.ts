export function runRankingEngine(score: any) {
  const adjustedScore = score.score * 0.3;

  return {
    priority: adjustedScore > 0.6 ? "HIGH" : "LOW",
    adjustedScore,
  };
}
