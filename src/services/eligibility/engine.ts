export type Applicant = {
  veteran: boolean;
  womanOwned: boolean;
  minorityOwned: boolean;
  firstTimeFarmer: boolean;
  creditScore: number;
  liquidity: number;
  experienceLevel: number;
  collateralEquity: number;
  acreage: number;
};

export type EligibilityResult = {
  usdaFsaScore: number;
  usdaBnIScore: number;
  sbaScore: number;
  grantBoost: number;
  recommendedProgram: "USDA_FSA" | "USDA_BNI" | "SBA" | "GRANT";
};

export function runEligibilityEngine(applicant: Applicant): EligibilityResult {
  const {
    veteran,
    womanOwned,
    minorityOwned,
    firstTimeFarmer,
    creditScore,
    liquidity,
    experienceLevel,
    collateralEquity,
    acreage,
  } = applicant;

  // -------------------------
  // USDA FSA SCORE
  // -------------------------
  const usdaFsaScore = clamp(
    30 +
      acreage * 1.2 +
      experienceLevel * 8 +
      (firstTimeFarmer ? 15 : 0) +
      (collateralEquity > 50000 ? 10 : 0),
    0,
    100
  );

  // -------------------------
  // USDA B&I SCORE
  // -------------------------
  const usdaBnIScore = clamp(
    25 +
      liquidity / 5000 +
      collateralEquity / 10000 +
      creditScore / 10 +
      (acreage > 10 ? 10 : 0),
    0,
    100
  );

  // -------------------------
  // SBA SCORE
  // -------------------------
  const sbaScore = clamp(
    creditScore / 8 +
      liquidity / 3000 +
      collateralEquity / 12000 +
      experienceLevel * 5,
    0,
    100
  );

  // -------------------------
  // GRANT BOOST
  // -------------------------
  const grantBoost = clamp(
    (veteran ? 20 : 0) +
      (womanOwned ? 20 : 0) +
      (minorityOwned ? 25 : 0) +
      (firstTimeFarmer ? 15 : 0),
    0,
    100
  );

  // -------------------------
  // DECISION ENGINE
  // -------------------------
  let recommendedProgram: EligibilityResult["recommendedProgram"] = "SBA";

  if (grantBoost >= 40) {
    recommendedProgram = "GRANT";
  } else if (usdaFsaScore >= usdaBnIScore && usdaFsaScore >= sbaScore) {
    recommendedProgram = "USDA_FSA";
  } else if (usdaBnIScore >= usdaFsaScore && usdaBnIScore >= sbaScore) {
    recommendedProgram = "USDA_BNI";
  }

  return {
    usdaFsaScore,
    usdaBnIScore,
    sbaScore,
    grantBoost,
    recommendedProgram,
  };
}

// -------------------------
// UTIL
// -------------------------
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
