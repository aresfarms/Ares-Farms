import { matchPrograms } from "@/services/eligibility/programMatcher";

export async function runDealPipeline(applicant: any) {
  const eligibility = matchPrograms(applicant);

  const nextSteps: string[] = [];

  // USDA FSA readiness
  if (eligibility.usdaFsaScore < 70) {
    nextSteps.push("Strengthen farm-scale qualification (acreage + experience)");
  }

  // SBA readiness
  if (eligibility.sbaScore < 70) {
    nextSteps.push("Improve credit profile or increase liquidity reserves");
  }

  // USDA B&I liquidity/collateral check
  if (eligibility.usdaBnIScore < 70) {
    nextSteps.push("Increase liquidity or collateral backing");
  }

  // Grant logic
  if (eligibility.grantBoost < 40) {
    nextSteps.push("Improve eligibility for grants (veteran/woman/minority/first-time farmer status benefits)");
  }

  // fallback
  if (nextSteps.length === 0) {
    nextSteps.push("Ready for lender prequalification");
  }

  return {
    applicant,
    eligibility,
    nextSteps,
  };
}
