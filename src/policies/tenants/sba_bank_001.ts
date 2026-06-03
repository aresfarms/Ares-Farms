export type TenantPolicy = {
  tenantId: string;
  version: string;

  thresholds: {
    approve: number;
    review: number;
  };
};

export const SBA_BANK_001_POLICY: TenantPolicy = {
  tenantId: "SBA_BANK_001",
  version: "v1.0",

  thresholds: {
    approve: 0.85,
    review: 0.75,
  },
};
