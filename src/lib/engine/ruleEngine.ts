import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

/**
 * 📜 PHASE 3B — RULE ENGINE
 * Deterministic compliance + eligibility + policy enforcement layer
 */

export function ruleEngine(farm: FarmProfile) {
  const acreage = farm.acreage;
  const irrigation = farm.irrigation?.type;
  const soil = farm.soilType;

  const rules: string[] = [];
  const violations: string[] = [];
  const restrictions: string[] = [];
  const eligibility: string[] = [];

  /**
   * 🌾 USDA / FARM PROGRAM ELIGIBILITY RULES
   */
  if (acreage >= 10) {
    eligibility.push("Eligible for USDA farm classification");
  } else {
    violations.push("Below USDA minimum acreage threshold");
  }

  if (acreage >= 40) {
    eligibility.push("Eligible for small farm subsidy programs");
  }

  if (acreage >= 100) {
    eligibility.push("Eligible for commercial farm loan programs");
  }

  /**
   * 💧 IRRIGATION POLICY RULES
   */
  if (irrigation === "none" && acreage > 80) {
    violations.push("High acreage without irrigation system");
    restrictions.push("Crop selection limited to drought-tolerant varieties");
  }

  if (irrigation === "flood" && acreage > 60) {
    restrictions.push("Flood irrigation limited under environmental guidance");
  }

  /**
   * 🌱 SOIL COMPATIBILITY RULES
   */
  if (soil === "sandy") {
    rules.push("Recommended: drought-resistant crops only");
  }

  if (soil === "clay") {
    rules.push("Recommended: moisture-retentive crop rotation");
  }

  /**
   * 🐄 LIVESTOCK REGULATION RULES
   */
  if (acreage < 20) {
    restrictions.push("Livestock limited to poultry/small animals");
  }

  if (acreage < 10) {
    restrictions.push("Commercial livestock operations not permitted");
  }

  /**
   * 💰 FINANCIAL POLICY FLAGS
   */
  const creditScore = farm.financial?.creditScore || 700;

  if (creditScore < 600) {
    restrictions.push("High-risk lending classification required");
    violations.push("Below minimum credit threshold for standard loans");
  }

  if (creditScore >= 750) {
    eligibility.push("Eligible for preferred lending tier");
  }

  /**
   * 🌍 ENVIRONMENTAL COMPLIANCE
   */
  if (farm.riskContext?.floodRisk === "high") {
    restrictions.push("Flood mitigation plan required");
  }

  if (farm.riskContext?.droughtRisk === "high") {
    restrictions.push("Water usage restrictions apply");
  }

  /**
   * 📦 FINAL RULE OUTPUT
   */
  return {
    rules,
    eligibility,
    violations,
    restrictions,

    complianceStatus:
      violations.length === 0 ? "compliant" : "restricted",

    riskLevel:
      violations.length > 2
        ? "high-risk"
        : violations.length > 0
        ? "moderate-risk"
        : "low-risk",
  };
}
