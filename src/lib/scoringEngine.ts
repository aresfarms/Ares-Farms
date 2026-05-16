export function scoreApplicant(applicant: any) {
  const credit = applicant.creditScore ?? 0;
  const liquidity = applicant.liquidity ?? 0;
  const experience = applicant.experienceLevel ?? 0;
  const acreage = applicant.acreage ?? 0;

  const usdaFsaScore =
    (acreage * 2) + (experience * 10) + (liquidity / 1000);

  const usdaBnIScore =
    credit * 0.1 + liquidity * 0.0005 + experience * 15;

  const sbaScore =
    credit * 0.12 + liquidity * 0.0007 + applicant.collateralEquity * 0.0004;

  const recommendedProgram =
    Math.max(usdaFsaScore, usdaBnIScore, sbaScore) === sbaScore
      ? "SBA"
      : usdaFsaScore > usdaBnIScore
      ? "USDA FSA"
      : "USDA B&I";

  const confidence = Math.min(
    (credit + liquidity / 1000 + experience * 10) / 300,
    1
  );

  return {
    usdaFsaScore: Number(usdaFsaScore.toFixed(1)),
    usdaBnIScore: Number(usdaBnIScore.toFixed(1)),
    sbaScore: Number(sbaScore.toFixed(1)),
    recommendedProgram,
    confidence,
    explanation: [
      "Scores derived from credit, liquidity, experience, and acreage.",
      "Higher SBA weight favors credit + collateral strength.",
      "USDA favors acreage + farming experience.",
    ],
  };
}
