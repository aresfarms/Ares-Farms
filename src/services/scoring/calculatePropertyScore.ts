/**
 * Nonresidential property/project readiness diagnostic.
 *
 * This runtime is intentionally property/project-only. It does not accept or
 * score personal credit, personal/household income, DTI, personal liquidity,
 * personal net worth, or other borrower financial-profile fields. A selected
 * provider owns any borrower/business underwriting its program requires.
 */

export type PropertyProjectScoreInput = {
  propertyReadiness: number;
  programFit: number;
  evidenceCompleteness: number;
  executionReadiness: number;
  environmentalReadiness: number;
  propertyRisk: number;
};

export type PropertyProjectScoreOutput = {
  propertyReadiness: number;
  programFit: number;
  evidenceCompleteness: number;
  executionReadiness: number;
  environmentalReadiness: number;
  propertyRisk: number;
  propertyProject: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizePercent(value: number): number {
  return clamp01(value / 100);
}

export function calculatePropertyProjectScore(
  input: PropertyProjectScoreInput,
): PropertyProjectScoreOutput {
  const propertyReadiness = normalizePercent(input.propertyReadiness);
  const programFit = normalizePercent(input.programFit);
  const evidenceCompleteness = normalizePercent(input.evidenceCompleteness);
  const executionReadiness = normalizePercent(input.executionReadiness);
  const environmentalReadiness = normalizePercent(input.environmentalReadiness);
  const propertyRisk = normalizePercent(input.propertyRisk);

  const positive =
    propertyReadiness * 0.30 +
    programFit * 0.25 +
    evidenceCompleteness * 0.20 +
    executionReadiness * 0.15 +
    environmentalReadiness * 0.10;
  const propertyProject = clamp01(positive - propertyRisk * 0.15);

  return {
    propertyReadiness,
    programFit,
    evidenceCompleteness,
    executionReadiness,
    environmentalReadiness,
    propertyRisk,
    propertyProject,
  };
}
