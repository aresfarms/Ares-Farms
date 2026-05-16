import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

/**
 * 🌾 PHASE 2C — CONTEXT-AWARE PRODUCTION ENGINE
 * Now dynamically responds to farm conditions
 */
export function productionEngine(farm: FarmProfile, sbaScore: number) {
  const crops: string[] = [];
  const livestock: string[] = [];
  const equipment: string[] = [];
  const vendors: string[] = [];
  const reports: string[] = [];

  const acreage = farm.acreage;
  const irrigation = farm.irrigation.type;
  const soil = farm.soilType;

  /**
   * 🌱 CROP INTELLIGENCE (CONTEXT-AWARE)
   */
  if (soil === "loam" && irrigation !== "none") {
    crops.push("Corn (high yield optimized soil)");
    crops.push("Soybeans (rotation + nitrogen efficiency)");
  }

  if (soil === "sandy") {
    crops.push("Peanuts (sandy soil tolerance)");
    crops.push("Sweet potatoes (low nutrient soil adaptability)");
  }

  if (soil === "clay") {
    crops.push("Wheat (clay soil resilience)");
    crops.push("Barley (moisture retention adaptation)");
  }

  if (acreage < 30) {
    crops.push("Specialty vegetables (high-margin small acreage)");
    crops.push("Herbs (basil, cilantro, niche markets)");
  }

  if (acreage > 80 && sbaScore > 0.6) {
    crops.push("Commodity expansion crops (corn/soy rotation scaling)");
  }

  /**
   * 🐄 LIVESTOCK INTELLIGENCE
   */
  if (acreage > 120 && sbaScore > 0.7) {
    livestock.push("Beef cattle (scale grazing operation)");
  } else if (acreage > 40) {
    livestock.push("Goats (brush control + low maintenance)");
    livestock.push("Sheep (dual meat/wool production)");
  } else {
    livestock.push("Poultry (eggs or meat production)");
  }

  /**
   * 🚜 EQUIPMENT INTELLIGENCE
   */
  if (acreage > 100) {
    equipment.push("High horsepower tractor (75–120 HP)");
    equipment.push("Grain storage silo system");
  } else if (acreage > 40) {
    equipment.push("Compact tractor (25–60 HP)");
    equipment.push("Mid-scale irrigation system");
  } else {
    equipment.push("Small-scale farming tools");
  }

  /**
   * 💰 VENDOR ROUTING INTELLIGENCE
   */
  if (sbaScore > 0.75) {
    vendors.push("USDA Farm Service Agency (FSA)");
    vendors.push("Commercial ag lenders");
  } else if (sbaScore > 0.5) {
    vendors.push("Regional credit unions");
    vendors.push("Micro-loan farm programs");
  } else {
    vendors.push("Beginner farmer assistance programs");
  }

  /**
   * 📄 REPORT GENERATION
   */
  reports.push("AI Farm Summary Report");

  if (sbaScore > 0.6) {
    reports.push("Expansion & Profitability Analysis");
  }

  if (acreage > 80) {
    reports.push("Commodity Scaling Strategy Report");
  }

  return {
    crops,
    livestock,
    equipment,
    vendors,
    reports,
  };
}
