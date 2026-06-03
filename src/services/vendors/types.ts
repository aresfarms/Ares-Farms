export type VendorCategory =
  | "TRACTORS"
  | "EQUIPMENT"
  | "SEEDS"
  | "IRRIGATION"
  | "FENCING"
  | "LIVESTOCK_SUPPLY"
  | "VETERINARY"
  | "BANKING"
  | "INSURANCE"
  | "SOIL_TESTING"
  | "ENVIRONMENTAL_SERVICES"
  | "USDA_PROGRAMS"
  | "FSA_PROGRAMS"
  | "EXPORT_LOGISTICS";

export interface Vendor {
  id: string;

  name: string;

  category: VendorCategory;

  region?: {
    country: string;
    state?: string;
  };

  url: string;

  approved: boolean;

  preferred: boolean;

  complianceTags: string[];

  specialties: string[];
}

export interface VendorMatch {
  category: VendorCategory;
  reason: string;
  priority: number;
}
