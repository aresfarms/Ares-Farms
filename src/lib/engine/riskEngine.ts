import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

/**
 * ⚠️ PHASE 3 — RISK ENGINE
 * Converts farm conditions into financial stress + survival modeling
 */

export function riskEngine(farm: FarmProfile, sbaScore: number) {
  const acreage = farm.acreage;

  /**
   * 🌦️ ENVIRONMENTAL RISK MODEL
   */
  const floodRiskMap = {
    low: 0.2,
    medium: 0.5,
    high: 0.9,
  };

  const droughtRiskMap = {
    low: 0.2,
    medium: 0.5,
    high: 0.9,
  };

  const floodRisk =
    floodRiskMap[
      farm.riskContext?.floodRisk as keyof typeof floodRiskMap
    ] ?? 0.5;

  const droughtRisk =
    droughtRiskMap[
      farm.riskContext?.droughtRisk as keyof typeof droughtRiskMap
    ] ?? 0.5;

  /**
   * 🌍 LOCATION / SCALE RISK
   */
  const scaleRisk =
    acreage > 120 ? 0.4 : acreage > 50 ? 0.6 : 0.8;

  /**
   * 💰 FINANCIAL VOLATILITY MODEL
   */
  const liquidity = farm.financial?.liquidity || 100000;
  const collateral = farm.financial?.collateralEquity || 100000;

  const liquidityRisk = liquidity < 50000 ? 0.9 : liquidity < 150000 ? 0.6 : 0.3;
  const collateralRisk = collateral < 75000 ? 0.9 : collateral < 150000 ? 0.6 : 0.3;

  /**
   * 📉 MARKET / SBA STABILITY FACTOR
   */
  const marketRisk = sbaScore < 0.4 ? 0.8 : sbaScore < 0.7 ? 0.5 : 0.2;

  /**
   * 🧠 COMPOSITE RISK SCORE
   */
  const volatility =
    floodRisk * 0.2 +
    droughtRisk * 0.2 +
    scaleRisk * 0.15 +
    liquidityRisk * 0.2 +
    collateralRisk * 0.15 +
    marketRisk * 0.1;

  /**
   * 📊 LOAN SURVIVABILITY INDEX
   */
  const liquidityFactor = Math.min(liquidity / 200000, 1);

  const survivability =
    (1 - volatility) * 0.6 +
    liquidityFactor * 0.4;

  /**
   * 🚨 RISK FLAGS
   */
  const warnings: string[] = [];

  if (volatility > 0.7) {
    warnings.push("High systemic farm volatility risk");
  }

  if (liquidityRisk > 0.7) {
    warnings.push("Liquidity stress risk detected");
  }

  if (floodRisk > 0.7) {
    warnings.push("Environmental flood exposure elevated");
  }

  if (droughtRisk > 0.7) {
    warnings.push("Environmental drought exposure elevated");
  }

  if (survivability < 0.5) {
    warnings.push("Low loan survivability under stress conditions");
  }

  /**
   * 📦 OUTPUT
   */
  return {
    volatility,
    survivability,

    components: {
      floodRisk,
      droughtRisk,
      scaleRisk,
      liquidityRisk,
      collateralRisk,
      marketRisk,
    },

    warnings,
  };
}
