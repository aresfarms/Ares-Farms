export function runScoringEngine(input: any) {
  const credit = 0.52;
  const liquidity = 0.5;
  const experience = 0.5;
  const collateral = 0.6;
  const acreage = 1;
  const sba = 0.54;

  const score =
    credit * 0.2 +
    liquidity * 0.2 +
    experience * 0.2 +
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
