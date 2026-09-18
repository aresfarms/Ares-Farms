import { getFederalRegion } from "@/lib/geo/federalRegions";

export async function runPolicyEngine(input: any) {
  const location = input.location || {};

  const state = location.state;
  const county = location.county;
  const region = location.region ?? getFederalRegion(state);

  const acres = input.metadata?.acres ?? 0;

  const policies: string[] = [];
  const eligibility = {
    usdaEligible: true,
    sbaEligible: true,
    flags: [] as string[],
  };

  // -----------------------------
  // USDA RULES
  // -----------------------------

  // Rule: Hobby farm detection
  if (acres < 50) {
    policies.push("USDA_HOBBY_FARM_RISK");
    eligibility.flags.push("Small acreage may be hobby farm classification risk");
  }

  // Rule: Rural requirement heuristic
  if (!region || region === "UNKNOWN") {
    policies.push("USDA_REGION_UNVERIFIED");
    eligibility.usdaEligible = false;
  }

  // Rule: Mid-Atlantic stricter compliance sensitivity
  if (region === "Mid-Atlantic") {
    policies.push("USDA_HIGH_COMPLIANCE_REGION");
  }

  // -----------------------------
  // SBA RULES
  // -----------------------------

  const revenue = input.financials?.revenue ?? 0;

  // SBA micro-business threshold check
  if (revenue > 500000) {
    policies.push("SBA_REVENUE_ABOVE_MICRO_LIMIT");
  }

  // SBA agricultural eligibility proxy
  if (acres < 10) {
    policies.push("SBA_LOW_AGRI_SCALE");
  }

  // -----------------------------
  // COUNTY OVERRIDES (HOOK READY)
  // -----------------------------

  const highRegulationCounties: string[] = [
    // future: flood zones, zoning overlays, environmental restrictions
  ];

  if (county && highRegulationCounties.includes(county)) {
    policies.push("COUNTY_HIGH_REGULATION");
    eligibility.flags.push("County-level regulatory restriction detected");
  }

  // -----------------------------
  // FINAL ELIGIBILITY DETERMINATION
  // -----------------------------

  if (policies.includes("USDA_REGION_UNVERIFIED")) {
    eligibility.usdaEligible = false;
  }

  if (policies.includes("SBA_LOW_AGRI_SCALE")) {
    eligibility.sbaEligible = false;
  }

  return {
    ...input,

    policy: {
      region,
      county,
      policies,
      eligibility,
    },
  };
}
