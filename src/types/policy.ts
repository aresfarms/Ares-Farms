export type PolicyWeights = {
  fsa: number;
  bni: number;
  sba: number;
};

export type Policy = {
  tenantId: string;
  version: string;
  weights: PolicyWeights;
  thresholds: {
    approve: number;
    review: number;
  };
};
