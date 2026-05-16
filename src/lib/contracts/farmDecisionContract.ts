export type FarmDecisionResponse = {
  tenantId: string;

  scores: {
    credit: number;
    liquidity: number;
    experience: number;
    collateral: number;
    acreage: number;
    sba: number;
  };

  decision: {
    crops: string[];
    livestock: string[];
    equipment: string[];
    vendors: string[];
    reports: string[];
  };

  financial: {
    revenue?: any;
    expenses?: any;
    profit?: any;
    risk?: any;
  };

  risk: {
    volatility: number;
    survivability: number;
    warnings: string[];
  };

  economic: {
    market?: any;
    factors?: any;
    indicators?: any;
    flags?: string[];
  };

  rules: {
    eligibility?: string[];
    violations?: string[];
    restrictions?: string[];
    complianceStatus?: string;
    riskLevel?: string;
  };

  system: {
    pipelineVersion: string;
    status: "deterministic" | "fallback" | "partial";
  };
};

/**
 * 🧯 SAFE FALLBACK RESPONSE (prevents UI crashes)
 */
export const EMPTY_FARM_RESPONSE: FarmDecisionResponse = {
  tenantId: "unknown",

  scores: {
    credit: 0,
    liquidity: 0,
    experience: 0,
    collateral: 0,
    acreage: 0,
    sba: 0,
  },

  decision: {
    crops: [],
    livestock: [],
    equipment: [],
    vendors: [],
    reports: [],
  },

  financial: {},

  risk: {
    volatility: 0,
    survivability: 0,
    warnings: [],
  },

  economic: {
    flags: [],
  },

  rules: {
    eligibility: [],
    violations: [],
    restrictions: [],
    complianceStatus: "unknown",
    riskLevel: "unknown",
  },

  system: {
    pipelineVersion: "phase-6-contract",
    status: "fallback",
  },
};
