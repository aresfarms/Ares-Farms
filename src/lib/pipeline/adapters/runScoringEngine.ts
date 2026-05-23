export async function runScoringEngine(input: any, risk: any) {
  const financials = input.financials ?? {};

  const revenue = financials.revenue ?? 0;
  const expenses = financials.expenses ?? 0;

  const acres = input.metadata?.acres ?? 0;

  // -------------------------
  // FINANCIAL SCORE (SAFE MATH)
  // -------------------------
  const margin = revenue > 0 ? (revenue - expenses) / revenue : 0;

  const credit = Math.max(0, Math.min(1, margin));
  const liquidity = revenue > 0 ? Math.min(1, revenue / 500000) : 0;
  const experience = 0.5; // placeholder stable baseline
  const collateral = Math.min(1, acres / 100);
  const acreage = Math.min(1, acres / 50);

  const sba = (credit + liquidity + collateral) / 3;

  const score =
    credit * 0.25 +
    liquidity * 0.2 +
    experience * 0.15 +
    collateral * 0.2 +
    acreage * 0.1 +
    sba * 0.1;

  return {
    credit,
    liquidity,
    experience,
    collateral,
    acreage,
    sba,
    score,
  };
}
