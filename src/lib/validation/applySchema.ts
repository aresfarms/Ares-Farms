export type ApplyInput = {
  creditScore: number;
  liquidity: number;
  experienceLevel: number;
  collateralEquity: number;
  acreage: number;
};

export function applySchema(input: any): ApplyInput {
  if (!input) {
    throw new Error("Missing input");
  }

  return {
    creditScore: Number(input.creditScore),
    liquidity: Number(input.liquidity),
    experienceLevel: Number(input.experienceLevel),
    collateralEquity: Number(input.collateralEquity),
    acreage: Number(input.acreage),
  };
}
