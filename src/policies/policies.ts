export type PolicyWeights = {
  sba: number;
  usda: number;
  risk: number;
  climate: number;
};

export type PolicyThresholds = {
  approve: number;
  review: number;
  reject: number;
};

export const policyConfig: {
  weights: PolicyWeights;
  thresholds: PolicyThresholds;
} = {
  weights: {
    sba: 1.8,
    usda: 1.0,
    risk: 1.2,
    climate: 0.9,
  },

  thresholds: {
    approve: 220,
    review: 160,
    reject: 0,
  },
};

/**
 * 🧠 POLICY SCORING ENGINE
 */
export function calculatePolicyScore(input: {
  sba: number;
  usda: number;
  risk: number;
  climate: number;
}) {
  const { weights } = policyConfig;

  return (
    input.sba * weights.sba +
    input.usda * weights.usda +
    input.risk * weights.risk +
    input.climate * weights.climate
  );
}
