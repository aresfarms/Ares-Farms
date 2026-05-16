export type ApplicantInput = {
  creditScore: number;
  liquidity: number;
  experienceLevel: number;
  collateralEquity: number;
  acreage: number;
};

export type ScoreOutput = {
  credit: number;
  liquidity: number;
  experience: number;
  collateral: number;
  acreage: number;
  sba: number;
};

function normalizeCredit(score: number) {
  return Math.min(Math.max((score - 300) / 550, 0), 1);
}

function normalizeLiquidity(value: number) {
  return Math.min(value / 200000, 1);
}

function normalizeExperience(level: number) {
  return Math.min(level / 10, 1);
}

function normalizeCollateral(value: number) {
  return Math.min(value / 500000, 1);
}

function normalizeAcreage(value: number) {
  return Math.min(value / 200, 1);
}

export function calculatePropertyScore(input: ApplicantInput): ScoreOutput {
  const credit = normalizeCredit(input.creditScore);
  const liquidity = normalizeLiquidity(input.liquidity);
  const experience = normalizeExperience(input.experienceLevel);
  const collateral = normalizeCollateral(input.collateralEquity);
  const acreage = normalizeAcreage(input.acreage);

  const sba =
    credit * 0.35 +
    liquidity * 0.2 +
    experience * 0.15 +
    collateral * 0.2 +
    acreage * 0.1;

  return {
    credit,
    liquidity,
    experience,
    collateral,
    acreage,
    sba,
  };
}
