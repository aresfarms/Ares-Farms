import type { OnboardingState, FarmType } from "@/state/onboarding/types";
import type { VendorMatch } from "./types";

/**
 * VENDOR ROUTING ENGINE
 * Maps farm state → vendor categories
 */
export function routeVendors(state: OnboardingState): VendorMatch[] {
  const matches: VendorMatch[] = [];

  const farmTypes = state.farmTypes || [];

  // ----------------------------
  // FARM TYPE → VENDOR MAPPING
  // ----------------------------
  farmTypes.forEach((type: FarmType) => {
    switch (type) {
      case "CROPS":
      case "ORCHARD":
      case "VINEYARD":
        matches.push({
          category: "SEEDS",
          reason: "Crop production requires seed sourcing",
          priority: 10,
        });

        matches.push({
          category: "EQUIPMENT",
          reason: "Planting and harvesting equipment required",
          priority: 9,
        });

        matches.push({
          category: "IRRIGATION",
          reason: "Water management required for crop systems",
          priority: 8,
        });
        break;

      case "LIVESTOCK":
      case "BEEF":
      case "DAIRY":
      case "PIG":
        matches.push({
          category: "LIVESTOCK_SUPPLY",
          reason: "Animal operations require livestock supply chain",
          priority: 10,
        });

        matches.push({
          category: "VETERINARY",
          reason: "Animal health and compliance required",
          priority: 10,
        });
        break;

      case "POULTRY":
      case "EXOTIC_BIRDS":
        matches.push({
          category: "LIVESTOCK_SUPPLY",
          reason: "Poultry sourcing required",
          priority: 10,
        });

        matches.push({
          category: "VETERINARY",
          reason: "Biosecurity and health compliance required",
          priority: 10,
        });
        break;

      case "AQUACULTURE":
        matches.push({
          category: "ENVIRONMENTAL_SERVICES",
          reason: "Water systems require environmental compliance review",
          priority: 10,
        });
        break;

      case "EXOTIC_ANIMALS":
        matches.push({
          category: "INSURANCE",
          reason: "High-risk category requires liability coverage review",
          priority: 10,
        });

        matches.push({
          category: "VETERINARY",
          reason: "Specialized exotic animal care required",
          priority: 10,
        });
        break;
    }
  });

  // ----------------------------
  // FINANCING LOGIC
  // ----------------------------
  if (state.goals?.includes("EXPANSION")) {
    matches.push({
      category: "BANKING",
      reason: "Expansion typically requires financing support",
      priority: 10,
    });
  }

  if (state.goals?.includes("LAND_ACQUISITION")) {
    matches.push({
      category: "USDA_PROGRAMS",
      reason: "Land acquisition may qualify for USDA/FSA programs",
      priority: 10,
    });
  }

  return matches.sort((a, b) => b.priority - a.priority);
}
