import type { OnboardingState, FarmType } from "@/state/onboarding/types";

/**
 * CORE DECISION ENGINE
 * Converts onboarding state → farm intelligence output
 */

export interface RecommendationResult {
  crops: string[];
  livestock: string[];
  equipment: string[];
  vendors: string[];
  reports: string[];
  warnings: string[];
  notes: string[];
}

export function makeDecision(state: OnboardingState): RecommendationResult {
  const crops: string[] = [];
  const livestock: string[] = [];
  const equipment: string[] = [];
  const vendors: string[] = [];
  const reports: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  // ----------------------------
  // FARM TYPE ROUTING
  // ----------------------------
  state.farmTypes?.forEach((type) => {
    switch (type as FarmType) {
      case "CROPS":
        crops.push("Row crops", "Specialty crops");
        equipment.push("Tractors", "Seeders", "Sprayers");
        reports.push("Soil suitability analysis");
        break;

      case "ORCHARD":
        crops.push("Fruit trees", "Nut trees");
        equipment.push("Pruning systems", "Orchard sprayers");
        reports.push("Tree density + yield projection report");
        break;

      case "LIVESTOCK":
        livestock.push("General livestock operations");
        equipment.push("Fencing", "Water systems", "Feed storage");
        reports.push("Livestock capacity analysis");
        break;

      case "POULTRY":
        livestock.push("Chickens", "Turkeys", "Ducks");
        equipment.push("Coops", "Ventilation systems", "Feeders");
        reports.push("Biosecurity + stocking density report");
        break;

      case "DAIRY":
        livestock.push("Dairy cattle");
        equipment.push("Milking systems", "Cooling storage");
        reports.push("Milk production feasibility report");
        break;

      case "BEEF":
        livestock.push("Beef cattle");
        equipment.push("Pasture fencing", "Rotational grazing systems");
        reports.push("Carrying capacity analysis");
        break;

      case "PIG":
        livestock.push("Swine operations");
        equipment.push("Waste management systems");
        reports.push("Environmental impact assessment");
        break;

      case "AQUACULTURE":
        warnings.push("Requires water rights verification");
        reports.push("Water system feasibility report");
        equipment.push("Pond systems", "Filtration systems");
        break;

      case "EXOTIC_BIRDS":
        warnings.push("Regulated exotic bird operations require state approval");
        reports.push("Compliance verification required");
        break;

      case "EXOTIC_ANIMALS":
        warnings.push("HIGH REGULATORY CATEGORY - STATE PERMIT REQUIRED");
        reports.push("Regulatory pre-clearance report");
        break;

      default:
        notes.push(`No predefined mapping for ${type}`);
    }
  });

  // ----------------------------
  // EXPERIENCE LEVEL LOGIC
  // ----------------------------
  switch (state.stage) {
    case "BEGINNER":
      notes.push("Beginner onboarding mode enabled");
      equipment.push("Starter kits recommended");
      break;

    case "ADVANCED":
      notes.push("Advanced optimization mode enabled");
      reports.push("Revenue optimization analysis");
      break;
  }

  // ----------------------------
  // GOALS LOGIC
  // ----------------------------
  state.goals?.forEach((goal) => {
    switch (goal) {
      case "PROFIT_MAXIMIZATION":
        reports.push("Profit optimization report");
        break;

      case "EXPANSION":
        reports.push("Expansion feasibility analysis");
        break;

      case "EXPORT_MARKETS":
        notes.push("Export logistics evaluation required");
        break;

      case "SUSTAINABILITY":
        reports.push("Environmental sustainability assessment");
        break;
    }
  });

  // ----------------------------
  // LOCATION LOGIC
  // ----------------------------
  if (state.location?.state) {
    notes.push(`Region-specific compliance: ${state.location.state}`);
  }

  return {
    crops,
    livestock,
    equipment,
    vendors,
    reports,
    warnings,
    notes,
  };
}

/**
 * OPTIONAL POLICY HOOK (for later integration)
 */
export function makeDecisionWithPolicy(
  state: OnboardingState,
  policy?: any
): RecommendationResult {
  // placeholder for future SBA/USDA rules integration
  return makeDecision(state);
}
