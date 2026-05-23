import { complianceEngine } from "@/lib/engine/complianceEngine";

export async function runComplianceEngine(input: any) {
  return complianceEngine(input);
}
