import { SBA_BANK_001_POLICY } from "@/policies/tenants/sba_bank_001";

export function getPolicy(tenantId: string) {
  switch (tenantId) {
    case "SBA_BANK_001":
      return SBA_BANK_001_POLICY;

    default:
      return SBA_BANK_001_POLICY;
  }
}
