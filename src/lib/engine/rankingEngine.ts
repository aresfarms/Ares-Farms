/**
 * Ranking Engine
 *
 * Master Volume Governance:
 * - Vol I: Provides governed decision-support ranking authority.
 * - Vol II: Supports risk-aware and classification-aware evaluation.
 * - Vol III: Keeps ranking behavior centralized and deterministic.
 * - Vol IV: Supports operational review and repeatable scoring.
 * - Vol V: Enables explainable, replayable, and observable ranking logic.
 *
 * Purpose:
 * This module provides the canonical ranking engine surface.
 * During migration, both `runRankingEngine` and `rankingEngine`
 * are exported so legacy route imports remain stable.
 */

export type RankingInput = {
  id?: string;
  score?: number;
  riskScore?: number;
  complianceScore?: number;
  financialScore?: number;
  operationalScore?: number;
  [key: string]: any;
};

export type RankingResult = {
  id?: string;
  rankScore: number;
  rankBand: "HIGH" | "MEDIUM" | "LOW";
  explanation: string[];
  input: RankingInput;
};

export async function runRankingEngine(
  input: RankingInput
): Promise<RankingResult> {
  const financialScore = Number(input.financialScore ?? input.score ?? 0);
  const complianceScore = Number(input.complianceScore ?? 0);
  const operationalScore = Number(input.operationalScore ?? 0);
  const riskScore = Number(input.riskScore ?? 0);

  const rankScore =
    financialScore * 0.4 +
    complianceScore * 0.25 +
    operationalScore * 0.25 -
    riskScore * 0.1;

  const normalizedRankScore = Math.max(0, Math.min(100, rankScore));

  const rankBand =
    normalizedRankScore >= 75
      ? "HIGH"
      : normalizedRankScore >= 50
        ? "MEDIUM"
        : "LOW";

  return {
    id: input.id,
    rankScore: normalizedRankScore,
    rankBand,
    explanation: [
      "Ranking calculated using governed financial, compliance, operational, and risk inputs.",
      "This is a deterministic migration-safe ranking surface.",
    ],
    input,
  };
}

/**
 * Temporary compatibility export.
 *
 * Legacy routes import `rankingEngine`.
 * Final routes should eventually call `runRankingEngine`.
 */
export const rankingEngine = runRankingEngine;
