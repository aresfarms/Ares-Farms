import { executeCorePipeline } from "@/lib/core/pipeline";

export function runApplyEdge(input: any) {
  const normalized = {
    credit: Number(input.creditScore ?? 0),
    liquidity: Number(input.liquidity ?? 0),
    experience: Number(input.experienceLevel ?? 0),
    collateral: Number(input.collateralEquity ?? 0),
    acreage: Number(input.acreage ?? 0),
    userId: input.userId ?? "unknown",
    name: input.name ?? "Test Farm",
  };

  const result = executeCorePipeline(normalized);

  return {
    userId: normalized.userId,
    name: normalized.name,
    ...result,
  };
}
