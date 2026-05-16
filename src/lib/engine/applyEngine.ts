import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

import { productionEngine } from "./productionEngine";
import { economicEngine } from "./economicEngine";
import { expenseEngine } from "./expenseEngine";
import { riskEngine } from "./riskEngine";
import { ruleEngine } from "./ruleEngine";
import { complianceEngine } from "./complianceEngine";
import { financialEngine } from "./financialEngine";

/**
 * 🌾 PHASE 2A — FARM PROFILE NORMALIZATION
 * Single canonical input structure for all engines
 */
function normalizeInput(input: any): FarmProfile {
  return {
    tenantId: input.tenantId ?? "dev",
    farmName: input.farmName,

    location: input.location ?? {
      state: undefined,
      county: undefined,
      region: undefined,
    },

    acreage: input.acreage ?? 50,
    farmType: input.farmType ?? "mixed",
    soilType: input.soilType ?? "unknown",

    irrigation: {
      type: input.irrigation?.type ?? "none",
      waterAccess: input.irrigation?.waterAccess ?? "unknown",
      reliabilityScore: input.irrigation?.reliabilityScore ?? 0.5,
    },

    crops: input.crops ?? [],
    livestock: input.livestock ?? [],
    equipment: input.equipment ?? [],

    financial: {
      creditScore: input.creditScore ?? 700,
      liquidity: input.liquidity ?? 100000,
      collateralEquity: input.collateralEquity ?? 100000,
      annualRevenue: input.annualRevenue ?? 0,
      debtObligations: input.debtObligations ?? 0,
    },

    operations: {
      experienceLevel: input.experienceLevel ?? 3,
      laborType: input.laborType ?? "owner",
      seasonalDependency: input.seasonalDependency ?? false,
    },

    riskContext: input.riskContext ?? {
      floodRisk: "medium",
      droughtRisk: "medium",
      climateZone: "unknown",
    },
  };
}

/**
 * 🌱 MAIN APPLY ENGINE (PHASE 2A FOUNDATION)
 */
export function applyEngine(input: any) {
  const farm = normalizeInput(input);

  /**
   * 📊 BASE SCORING LAYER
   */
  const credit = farm.financial.creditScore / 850;
  const liquidityScore = Math.min(farm.financial.liquidity / 200000, 1);
  const experience = farm.operations.experienceLevel / 10;
  const collateral = Math.min(farm.financial.collateralEquity / 300000, 1);
  const land = Math.min(farm.acreage / 200, 1);

  const sbaScore =
    credit * 0.3 +
    liquidityScore * 0.2 +
    experience * 0.15 +
    collateral * 0.25 +
    land * 0.1;

  const scores = {
    credit,
    liquidity: liquidityScore,
    experience,
    collateral,
    acreage: land,
    sba: sbaScore,
  };

  /**
   * 🌾 ENGINE STACK
   */
  const production = productionEngine(farm, sbaScore);
  const economic = economicEngine(farm);
  const expenses = expenseEngine(farm);
  const risk = riskEngine(farm, sbaScore);
  const rules = ruleEngine(farm);
  const compliance = complianceEngine(farm);

  const financial = financialEngine({
    production,
    economic,
    expenses,
    risk,
  });

  /**
   * 📦 FINAL RESPONSE (OPTION A CONTRACT)
   */
  return {
    tenantId: farm.tenantId,

    decision: {
      crops: production.crops,
      livestock: production.livestock,
      equipment: production.equipment,
      vendors: production.vendors,
      reports: production.reports,
    },

    scores,

    financial,
    risk,
    rules,
    compliance,
    economic,

    policyVersion: "v3.0-phase2a-farm-profile",
  };
}
