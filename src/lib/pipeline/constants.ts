export const SCORING_WEIGHTS = {
  credit: 0.30,
  liquidity: 0.20,
  experience: 0.15,
  collateral: 0.20,
  acreage: 0.15,
} as const;

export const SCORING_LIMITS = {
  credit: 850,
  liquidity: 200000,
  experience: 10,
  collateral: 250000,
  acreage: 1000,
} as const;

export const DECISION_THRESHOLDS = {
  APPROVE: 0.7,
  REVIEW: 0.5,
} as const;
