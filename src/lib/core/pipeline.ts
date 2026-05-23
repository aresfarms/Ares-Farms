export type CoreInput = {
  credit: number;
  liquidity: number;
  experience: number;
  collateral: number;
  acreage: number;
  userId: string;
  name: string;
};

export type CoreResult = {
  scores: {
    credit: number;
    liquidity: number;
    experience: number;
    collateral: number;
    acreage: number;
    sba: number;
  };
  risk: {
    riskScore: number;
  };
  decision: {
    decision: "APPROVE" | "REVIEW" | "REJECT";
    compositeScore: number;
  };
};

export function executeCorePipeline(input: CoreInput): CoreResult {
  const credit = Math.min(1, input.credit / 850);
  const liquidity = Math.min(1, input.liquidity / 200000);
  const experience = Math.min(1, input.experience / 10);
  const collateral = Math.min(1, input.collateral / 250000);
  const acreage = Math.min(1, input.acreage / 1000);

  const sba =
    credit * 0.3 +
    liquidity * 0.2 +
    experience * 0.15 +
    collateral * 0.2 +
    acreage * 0.15;

  const riskScore = 1 - sba;

  const decision =
    sba >= 0.7
      ? "APPROVE"
      : sba >= 0.5
      ? "REVIEW"
      : "REJECT";

  return {
    scores: {
      credit,
      liquidity,
      experience,
      collateral,
      acreage,
      sba,
    },
    risk: {
      riskScore,
    },
    decision: {
      decision,
      compositeScore: sba,
    },
  };
}
