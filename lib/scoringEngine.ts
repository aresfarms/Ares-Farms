export type Applicant = {
  veteran?: boolean;
  womanOwned?: boolean;
  minorityOwned?: boolean;
  firstTimeFarmer?: boolean;

  creditScore: number;
  liquidity: number;
  experienceLevel: number;
  collateralEquity: number;
  acreage: number;
};

type Scores = {
  usdaFsaScore: number;
  usdaBnIScore: number;
  sbaScore: number;

  recommendedProgram: "USDA_FSA" | "USDA_BNI" | "SBA";
  confidence: number;

  explanation: string[];
};

// -----------------------------
// Helpers (normalization layer)
// -----------------------------
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function normCredit(score: number) {
  return clamp01(score / 850);
}

function normLiquidity(x: number) {
  return clamp01(Math.log10(x + 1) / 6);
}

function normAcreage(x: number) {
  return clamp01(Math.log10(x + 1) / 3);
}

function normExperience(x: number) {
  return clamp01(x / 5);
}

function normCollateral(x: number) {
  return clamp01(Math.log10(x + 1) / 6);
}

// -----------------------------
// Core scoring engine
// -----------------------------
export function scoreApplicant(app: Applicant): Scores {
  const credit = normCredit(app.creditScore);
  const liquidity = normLiquidity(app.liquidity);
  const acreage = normAcreage(app.acreage);
  const exp = normExperience(app.experienceLevel);
  const collateral = normCollateral(app.collateralEquity);

  // USDA FSA (farm structure heavy)
  const usdaFsa =
    acreage * 0.45 +
    exp * 0.35 +
    credit * 0.20;

  // USDA BNI (balanced ag + financial)
  const usdaBnI =
    acreage * 0.25 +
    exp * 0.25 +
    credit * 0.25 +
    liquidity * 0.25;

  // SBA (financial + collateral heavy)
  const sba =
    credit * 0.40 +
    liquidity * 0.30 +
    collateral * 0.30;

  const usdaFsaScore = usdaFsa * 100;
  const usdaBnIScore = usdaBnI * 100;
  const sbaScore = sba * 100;

  // Determine best program
  const scores = [
    { name: "USDA_FSA" as const, value: usdaFsaScore },
    { name: "USDA_BNI" as const, value: usdaBnIScore },
    { name: "SBA" as const, value: sbaScore },
  ];

  const sorted = [...scores].sort((a, b) => b.value - a.value);

  const recommendedProgram = sorted[0].name;

  // Confidence = separation between top 2
  const gap = (sorted[0].value - sorted[1].value) / 100;
  const confidence = clamp01(gap);

  // Explanation engine
  const explanation: string[] = [];

  if (app.acreage < 10) {
    explanation.push("Farm scale is limiting USDA FSA eligibility (low acreage).");
  }

  if (credit > 0.7) {
    explanation.push("Strong credit profile supports SBA lending eligibility.");
  } else {
    explanation.push("Moderate credit profile limits SBA strength.");
  }

  if (liquidity > 0.5) {
    explanation.push("Liquidity supports lender risk tolerance.");
  } else {
    explanation.push("Low liquidity constrains financing options.");
  }

  if (exp < 0.3) {
    explanation.push("Limited farming experience impacts USDA eligibility.");
  }

  explanation.push(`Decision separation gap: ${(gap * 100).toFixed(1)}%`);

  return {
    usdaFsaScore,
    usdaBnIScore,
    sbaScore,
    recommendedProgram,
    confidence,
    explanation,
  };
}
