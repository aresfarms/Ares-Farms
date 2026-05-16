// MODULE 1: CORE SCORING ENGINE (LOCKED)
// Pure business logic only — no external dependencies

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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeCredit(score: number): number {
  // 300–850 scale
  return clamp01((score - 300) / (850 - 300));
}

function normalizeLiquidity(liquidity: number): number {
  // soft cap scaling (log-like behavior)
  return clamp01(Math.log10(liquidity + 1) / 6);
}

function normalizeExperience(level: number): number {
  // assume 0–10 scale
  return clamp01(level / 10);
}

function normalizeCollateral(value: number): number {
  return clamp01(Math.log10(value + 1) / 6);
}

function normalizeAcreage(acres: number): number {
  // diminishing returns after ~200 acres
  return clamp01(acres / 200);
}

/**
 * CORE SCORING FUNCTION (single responsibility)
 */
export function calculatePropertyScore(input: ApplicantInput): ScoreOutput {
  const credit = normalizeCredit(input.creditScore);
  const liquidity = normalizeLiquidity(input.liquidity);
  const experience = normalizeExperience(input.experienceLevel);
  const collateral = normalizeCollateral(input.collateralEquity);
  const acreage = normalizeAcreage(input.acreage);

  // Equal-weight baseline model (NO external policy dependency in Module 1)
  const sba =
    credit * 0.35 +
    liquidity * 0.15 +
    experience * 0.15 +
    collateral * 0.25 +
    acreage * 0.10;

  return {
    credit,
    liquidity,
    experience,
    collateral,
    acreage,
    sba,
  };
}
