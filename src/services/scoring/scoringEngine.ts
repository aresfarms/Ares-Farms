export async function calculatePropertyScore(input: any) {
  const financials = input?.financials || {};
  const metadata = input?.metadata || {};

  const revenue = Number(financials.revenue ?? 0);
  const expenses = Number(financials.expenses ?? 0);
  const acres = Number(metadata.acres ?? 0);

  const margin = revenue > 0 ? (revenue - expenses) / revenue : 0;
  const acreageScore = Math.min(acres / 100, 1);

  const composite =
    margin * 0.6 +
    acreageScore * 0.3 +
    (metadata.type === "row-crop" ? 0.1 : 0.05);

  return {
    score: composite, // 👈 CRITICAL FIX (single scalar)
  };
}
