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
  recommendedProgram: "GRANT" | "USDA_BNI" | "SBA";
  confidence: number;
  explanation: string[];
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Core scoring model (0–100)
 */
export function matchPrograms(applicant: Applicant): EligibilityResult {
  // -------------------------
  // FARM SCALE (USDA FSA)
  // -------------------------
  let fsa =
    applicant.acreage * 2 +
    applicant.experienceLevel * 5 +
    (applicant.firstTimeFarmer ? 10 : 0);

  fsa = clamp(fsa);

  // -------------------------
  // FINANCIAL STRENGTH (BNI)
  // -------------------------
  let bni =
    (applicant.creditScore - 300) / 5 +
    applicant.liquidity / 2000 +
    applicant.collateralEquity / 5000;

  bni = clamp(bni);

  // -------------------------
  // SBA (credit-heavy hybrid)
  // -------------------------
  let sba =
    (applicant.creditScore - 300) / 5 +
    applicant.liquidity / 2500 +
    applicant.experienceLevel * 3;

  sba = clamp(sba);

  // -------------------------
  // GRANT BOOST
  // -------------------------
  let grantBoost = 0;

  if (applicant.firstTimeFarmer) grantBoost += 20;
  if (applicant.womanOwned) grantBoost += 15;
  if (applicant.veteran) grantBoost += 15;
  if (applicant.acreage < 10) grantBoost += 10;

  grantBoost = clamp(grantBoost);

  // -------------------------
  // PROGRAM DECISION (WEIGHTED)
  // -------------------------
  const scores = [
    { name: "GRANT", value: fsa * 0.4 + grantBoost * 0.6 },
    { name: "USDA_BNI", value: fsa * 0.25 + bni * 0.75 },
    { name: "SBA", value: sba * 0.7 + bni * 0.3 },
  ] as const;

  const best = scores.reduce((a, b) => (a.value > b.value ? a : b));

  // confidence = separation between best and second best
  const sorted = [...scores].sort((a, b) => b.value - a.value);
  const confidence = clamp((sorted[0].value - sorted[1].value) / 100);

  // -------------------------
  // EXPLANATION ENGINE
  // -------------------------
  const explanation: string[] = [];

  if (fsa < 50)
    explanation.push("Farm scale is limiting USDA eligibility (acreage/experience).");

  if (bni > 80)
    explanation.push("Strong financial position supports lending approval.");

  if (sba > 80)
    explanation.push("Strong credit profile supports SBA lending.");

  if (grantBoost > 30)
    explanation.push("Demographic + first-time farmer factors improve grant eligibility.");

  explanation.push(`Model confidence: ${(confidence * 100).toFixed(1)}%`);

  return {
    usdaFsaScore: fsa,
    usdaBnIScore: bni,
    sbaScore: sba,
    grantBoost,
    recommendedProgram: best.name,
    confidence,
    explanation,
  };
}
