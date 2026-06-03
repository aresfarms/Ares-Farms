import { FarmProfile } from "@/lib/schemas/farmProfileSchema";

export function expenseEngine(farm: FarmProfile) {
  const acreage = farm.acreage;

  const landOperatingCost = acreage * 45;

  let equipmentCost = 0;

  if (acreage > 100) {
    equipmentCost = 25000;
  } else if (acreage > 40) {
    equipmentCost = 12000;
  } else {
    equipmentCost = 3000;
  }

  const cropCost =
    farm.crops.length > 0
      ? farm.crops.length * acreage * 12
      : acreage * 8;

  const livestockCost =
    farm.livestock.length > 0
      ? farm.livestock.length * 1500
      : 0;

  let irrigationCost = 0;

  switch (farm.irrigation.type) {
    case "center_pivot":
      irrigationCost = acreage * 60;
      break;
    case "sprinkler":
      irrigationCost = acreage * 40;
      break;
    case "drip":
      irrigationCost = acreage * 55;
      break;
    case "flood":
      irrigationCost = acreage * 20;
      break;
    default:
      irrigationCost = acreage * 10;
  }

  let laborCost = 0;

  switch (farm.operations.laborType) {
    case "hired":
      laborCost = acreage * 120;
      break;
    case "mixed":
      laborCost = acreage * 80;
      break;
    case "family":
      laborCost = acreage * 40;
      break;
    default:
      laborCost = acreage * 60;
  }

  const totalExpenses =
    landOperatingCost +
    equipmentCost +
    cropCost +
    livestockCost +
    irrigationCost +
    laborCost;

  return {
    breakdown: {
      landOperatingCost,
      equipmentCost,
      cropCost,
      livestockCost,
      irrigationCost,
      laborCost,
    },

    totals: {
      totalExpenses,
      perAcreCost: totalExpenses / Math.max(acreage, 1),
    },

    flags: {
      highCostFarm: totalExpenses > 50000,
      irrigationIntensive: irrigationCost > acreage * 40,
      laborIntensive: laborCost > acreage * 100,
    },
  };
}
