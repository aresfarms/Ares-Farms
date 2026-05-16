import { FarmDecisionResponse } from "@/lib/contracts/farmDecisionContract";

/**
 * 📊 PHASE 7 — MULTI-FARM RANKING ENGINE
 * Converts individual farm outputs into portfolio intelligence
 */

export type RankedFarm = FarmDecisionResponse & {
  rankScore: number;
  rankPosition: number;
};

export function rankingEngine(farms: FarmDecisionResponse[]) {
  if (!farms || farms.length === 0) {
    return {
      ranked: [],
      portfolio: {
        averageSba: 0,
        averageRisk: 0,
        averageSurvivability: 0,
        totalApplicants: 0,
      },
    };
  }

  /**
   * 🧠 SCORING MODEL (COMPOSITE LENDER SCORE)
   */
  const scored: RankedFarm[] = farms.map((farm) => {
    const sba = farm.scores?.sba || 0;
    const liquidity = farm.scores?.liquidity || 0;
    const risk = farm.risk?.volatility || 0;
    const survivability = farm.risk?.survivability || 0;
    const profit = farm.financial?.profit?.grossProfit || 0;

    /**
     * 📊 COMPOSITE RANK SCORE
     * weighted lending attractiveness model
     */
    const rankScore =
      sba * 0.35 +
      liquidity * 0.2 +
      survivability * 0.25 +
      (1 - risk) * 0.1 +
      Math.min(profit / 100000, 1) * 0.1;

    return {
      ...farm,
      rankScore,
      rankPosition: 0,
    };
  });

  /**
   * 🏆 SORT BY BEST TO WORST
   */
  const ranked = scored
    .sort((a, b) => b.rankScore - a.rankScore)
    .map((farm, index) => ({
      ...farm,
      rankPosition: index + 1,
    }));

  /**
   * 📦 PORTFOLIO METRICS
   */
  const portfolio = {
    averageSba:
      ranked.reduce((sum, f) => sum + (f.scores?.sba || 0), 0) /
      ranked.length,

    averageRisk:
      ranked.reduce((sum, f) => sum + (f.risk?.volatility || 0), 0) /
      ranked.length,

    averageSurvivability:
      ranked.reduce((sum, f) => sum + (f.risk?.survivability || 0), 0) /
      ranked.length,

    totalApplicants: ranked.length,
  };

  return {
    ranked,
    portfolio,
  };
}
