import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

/**
 * 🌎 PHASE 4 — ECONOMIC ENGINE
 * Macro + commodity + regional farm economics simulation layer
 */

export function economicEngine(farm: FarmProfile) {
  const acreage = farm.acreage;
  const soil = farm.soilType;
  const irrigation = farm.irrigation?.type;

  /**
   * 📊 BASE COMMODITY PRICE SIGNALS (SIMPLIFIED MARKET MODEL)
   */
  const commodityMarket = {
    corn: 180,
    soybeans: 420,
    wheat: 210,
    hay: 140,
    vegetables: 520,
  };

  /**
   * 🌾 PRODUCTION WEIGHTING BY FARM TYPE
   */
  let cropPriceIndex = 1;

  if (soil === "loam") cropPriceIndex += 0.15;
  if (soil === "sandy") cropPriceIndex -= 0.1;
  if (soil === "clay") cropPriceIndex -= 0.05;

  if (irrigation === "drip") cropPriceIndex += 0.1;
  if (irrigation === "none") cropPriceIndex -= 0.2;

  /**
   * 🌍 REGIONAL ECONOMIC PRESSURE MODEL
   */
  const scaleFactor =
    acreage > 100 ? 1.3 : acreage > 50 ? 1.1 : 0.9;

  /**
   * 💰 INPUT COST INFLATION MODEL
   */
  const inputCostIndex =
    soil === "sandy"
      ? 1.2
      : soil === "clay"
      ? 1.1
      : 1.0;

  /**
   * 🌾 ESTIMATED FARM OUTPUT VALUE MODEL
   */
  const estimatedRevenuePerAcre =
    (commodityMarket.corn +
      commodityMarket.soybeans +
      commodityMarket.wheat) /
    3;

  const adjustedRevenuePerAcre =
    estimatedRevenuePerAcre *
    cropPriceIndex *
    scaleFactor;

  const totalMarketRevenue =
    adjustedRevenuePerAcre * acreage;

  /**
   * 📉 MARKET VOLATILITY MODEL
   */
  let volatility = 0.2;

  if (soil === "sandy") volatility += 0.15;
  if (irrigation === "none") volatility += 0.2;
  if (acreage > 120) volatility += 0.1;

  /**
   * 📊 ECONOMIC PRESSURE INDEX
   */
  const economicPressure =
    inputCostIndex * volatility * scaleFactor;

  /**
   * 🧠 MARKET OPPORTUNITY SCORE
   */
  const opportunityScore =
    cropPriceIndex * (1 - volatility) * scaleFactor;

  /**
   * 🚨 ECONOMIC FLAGS
   */
  const flags: string[] = [];

  if (volatility > 0.6) {
    flags.push("High commodity market volatility exposure");
  }

  if (economicPressure > 0.7) {
    flags.push("High production cost pressure environment");
  }

  if (opportunityScore > 1.2) {
    flags.push("Strong regional market opportunity detected");
  }

  /**
   * 📦 OUTPUT
   */
  return {
    market: {
      commodityMarket,
      estimatedRevenuePerAcre,
      totalMarketRevenue,
    },

    factors: {
      cropPriceIndex,
      scaleFactor,
      inputCostIndex,
      volatility,
    },

    indicators: {
      economicPressure,
      opportunityScore,
    },

    flags,
  };
}
