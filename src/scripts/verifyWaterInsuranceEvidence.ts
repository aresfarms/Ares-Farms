import { buildWaterInsuranceRiskImpact, validatePropertyRiskEvidence } from "@/lib/property/propertyRiskEvidence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const official = {
  authority: "County Water and Sewer Department",
  jurisdiction: "Example County, MD",
  reference: "Capital Facilities Map 2026-04",
  asOf: "2026-04-15",
};

const clear = buildWaterInsuranceRiskImpact({
  water: { kind: "water", status: "adequate-public-service", confidence: "verified", source: official, affectedScenarioIds: ["owner-operated"] },
  insurance: { kind: "insurance", status: "normally-insurable", confidence: "verified", source: { ...official, authority: "State Insurance Filing Office" }, affectedScenarioIds: ["owner-operated"] },
});
assert(clear.water === "verified-clear" && clear.insurance === "verified-clear", "Clear official evidence must map to verified-clear.");
assert((clear.scenarioAdjustments?.["owner-operated"]?.waterPenalty ?? -1) === 0, "Adequate water must have no penalty.");

const unknown = buildWaterInsuranceRiskImpact({
  water: { kind: "water", status: "unresolved", confidence: "unresolved" },
  insurance: { kind: "insurance", status: "unknown-pending-quote", confidence: "unresolved" },
});
assert(unknown.water === "unknown" && unknown.insurance === "unknown", "Unresolved evidence must stay unknown.");

const constrained = buildWaterInsuranceRiskImpact({
  water: { kind: "water", status: "fire-flow-constrained", confidence: "verified", source: official, affectedScenarioIds: ["owner-operated"], notes: ["Required fire flow is unavailable."] },
  insurance: { kind: "insurance", status: "materially-uninsurable", confidence: "verified", source: { ...official, authority: "Licensed surplus-lines market survey" }, affectedScenarioIds: ["owner-operated"], notes: ["No lender-compliant quote identified."] },
});
const stressed = constrained.scenarioAdjustments?.["owner-operated"];
assert((stressed?.waterPenalty ?? 0) >= 25, "Verified fire-flow constraint must carry a strong penalty.");
assert((stressed?.insurancePenalty ?? 0) >= 35, "Material uninsurability must carry a strong penalty.");

const irrigationWell = buildWaterInsuranceRiskImpact({
  water: {
    kind: "water",
    status: "adequate-private-source",
    confidence: "verified",
    source: { ...official, authority: "State Water Resources Administration", reference: "Well permit W-2026-1842 and yield test" },
    affectedScenarioIds: ["operating-agriculture"],
    annualCost: 4200,
    sourceProfile: {
      sourceType: "irrigation-well",
      wellDepthFeet: 480,
      aquiferName: "Regional confined aquifer",
      testedYieldGpm: 85,
      sustainableWithdrawalGallonsPerDay: 90000,
      irrigatedAcresSupported: 75,
      peakDemandAdequate: true,
      waterQualityTested: true,
      treatmentRequired: false,
      withdrawalPermitRequired: true,
      withdrawalPermitVerified: true,
      waterRightRunsWithLand: true,
      droughtRestrictionExposure: "conditional",
      sharedSource: false,
      redundantSourceAvailable: true,
      annualEnergyCost: 2400,
      annualMaintenanceReserve: 1200,
      replacementReserve: 600,
    },
  },
});
const wellAdjustment = irrigationWell.scenarioAdjustments?.["operating-agriculture"];
assert((wellAdjustment?.waterPenalty ?? -1) === 0, "Verified adequate irrigation well must not be penalized.");
assert((wellAdjustment?.waterBenefit ?? 0) >= 8, "Verified high-capacity agricultural well must receive a ranking benefit.");

const untestedWellErrors = validatePropertyRiskEvidence({
  kind: "water",
  status: "adequate-private-source",
  confidence: "verified",
  source: official,
  sourceProfile: { sourceType: "deep-well" },
});
assert(untestedWellErrors.some((error) => error.includes("tested yield")), "A verified well without a yield test must fail validation.");

const invalid = validatePropertyRiskEvidence({ kind: "water", status: "adequate-public-service", confidence: "verified" });
assert(invalid.length >= 4, "Verified evidence without official metadata must fail validation.");

console.log(JSON.stringify({ ok: true, rule: "WATER-INSURANCE-EVIDENCE-001", clear, irrigationWell, unknown, constrained, untestedWellErrors, invalidErrors: invalid }, null, 2));
