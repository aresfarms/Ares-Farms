export function classify(score: number) {
  if (score >= 220) return "APPROVED";
  if (score >= 140) return "CONDITIONAL";
  return "DECLINED";
}

export function aggregateExposure(portfolio: any[]) {
  return portfolio.reduce((a, p) => a + p.score, 0);
}
