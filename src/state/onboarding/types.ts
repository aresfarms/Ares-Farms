// src/state/onboarding/types.ts

export type FarmerStage =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED";

export type FarmType =
  | "CROPS"
  | "LIVESTOCK"
  | "POULTRY"
  | "DAIRY"
  | "BEEF"
  | "PIG"
  | "SHEEP_GOAT"
  | "ORCHARD"
  | "VINEYARD"
  | "AQUACULTURE"
  | "EXOTIC_ANIMALS"
  | "EXOTIC_BIRDS"
  | "HAY_FORAGE"
  | "MIXED_USE"
  | "CUSTOM";

export type GoalType =
  | "PROFIT_MAXIMIZATION"
  | "HOBBY_FARM"
  | "EXPANSION"
  | "LAND_ACQUISITION"
  | "SUSTAINABILITY"
  | "EXPORT_MARKETS";

export type ReportIntent =
  | "GENERAL_INSIGHT"
  | "PROPERTY_OPTIMIZATION"
  | "FINANCING_READINESS"
  | "ENVIRONMENTAL_GENERAL"
  | "PHASE_I"
  | "PHASE_II"
  | "PHASE_III"
  | "SOIL_CERTIFICATION";

export interface OnboardingState {
  tenantId: string;

  stage?: FarmerStage;

  location?: {
    country: string;
    state?: string;
    region?: string;
  };

  farmTypes: FarmType[];

  goals: GoalType[];

  acreage?: number;

  interests?: {
    soilAnalysis: boolean;
    environmentalReports: boolean;
    financing: boolean;
    vendorRecommendations: boolean;
    commodityIntelligence: boolean;
  };

  reportIntent?: ReportIntent[];

  currentStep: number;

  completed: boolean;

  createdAt: string;
  updatedAt: string;
}
