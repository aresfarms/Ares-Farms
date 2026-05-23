export function runScoring(enriched: any) {
  const revenue = enriched?.financials?.revenue ?? 0;
  const expenses = enriched?.financials?.expenses ?? 0;
  const acres = enriched?.metadata?.acres ?? 0;

  const financialScore = revenue > 0 ? Math.max(0, revenue / (revenue + expenses)) : 0;
  const acreageScore = Math.min(1, acres / 100);

  const score =
    (financialScore * 0.6) +
    (acreageScore * 0.4);

  return {
    credit: financialScore,
    liquidity: financialScore * 0.9,
    experience: 0.5,
    collateral: acreageScore,
    acreage: acreageScore,
    sba: score,
    score,
  };
}
