export type FarmType =
  | "row_crop"
  | "livestock"
  | "mixed"
  | "orchard"
  | "greenhouse"
  | "specialty";

export type IrrigationType =
  | "none"
  | "rainfed"
  | "drip"
  | "sprinkler"
  | "flood"
  | "center_pivot";

export type SoilType =
  | "clay"
  | "sandy"
  | "loam"
  | "silt"
  | "rocky"
  | "mixed"
  | "unknown";

export type WaterAccessType =
  | "well"
  | "municipal"
  | "river"
  | "rainfed"
  | "unknown";

export interface FarmProfile {
  tenantId: string;
  farmName?: string;

  location: {
    state?: string;
    county?: string;
    region?: string;
  };

  acreage: number;
  farmType: FarmType;
  soilType: SoilType;

  irrigation: {
    type: IrrigationType;
    waterAccess: WaterAccessType;
    reliabilityScore?: number;
  };

  crops: string[];
  livestock: string[];
  equipment: string[];

  financial: {
    creditScore: number;
    liquidity: number;
    collateralEquity: number;
    annualRevenue?: number;
    debtObligations?: number;
  };

  operations: {
    experienceLevel: number;
    laborType?: "owner" | "family" | "hired" | "mixed";
    seasonalDependency?: boolean;
  };

  riskContext?: {
    floodRisk?: "low" | "medium" | "high";
    droughtRisk?: "low" | "medium" | "high";
    climateZone?: string;
  };

  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}
