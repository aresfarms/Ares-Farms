// MODULE 2: POLICY INJECTION LAYER
// Pure config normalization only (NO scoring logic)

export type PolicyWeights = {
  credit: number;
  liquidity: number;
  experience: number;
  collateral: number;
  acreage: number;
};

export type PolicyThresholds = {
  approve: number;
  review: number;
  decline?: number;
};

export type Policy = {
  version: string;
  weights: PolicyWeights;
  thresholds: PolicyThresholds;
};

export type ScoringContext = {
  weights: PolicyWeights;
  thresholds: PolicyThresholds;
  version: string;
};

/**
 * Converts raw tenant policy into safe, normalized runtime context
 */
export function buildScoringContext(policy: Policy): ScoringContext {
  return {
    version: policy.version,

    weights: {
      credit: policy.weights.credit ?? 0,
      liquidity: policy.weights.liquidity ?? 0,
      experience: policy.weights.experience ?? 0,
      collateral: policy.weights.collateral ?? 0,
      acreage: policy.weights.acreage ?? 0,
    },

    thresholds: {
      approve: policy.thresholds.approve ?? 0.7,
      review: policy.thresholds.review ?? 0.5,
      decline: policy.thresholds.decline ?? 0.3,
    },
  };
}
