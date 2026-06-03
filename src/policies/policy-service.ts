export async function getPolicyByTenant(tenantId: string) {
  // temporary deterministic policy for stable dev system

  return {
    version: "v1.0",
    thresholds: {
      approve: 200,
      conditional: 120,
    },
    weights: {
      fsa: 1.2,
      bni: 1.1,
      sba: 2.5,
    },
  };
}
