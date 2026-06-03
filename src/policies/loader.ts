import SBA from "./tenant/SBA_BANK_001.json";
import type { Policy } from "@/types/policy";

const policies: Record<string, Policy> = {
  SBA_BANK_001: SBA,
};

export function getPolicyByTenant(tenantId: string): Policy {
  const policy = policies[tenantId];

  if (!policy) {
    throw new Error(`No policy found for tenant ${tenantId}`);
  }

  return policy;
}
