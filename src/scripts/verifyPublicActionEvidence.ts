import { buildPublicActionRiskImpact } from "@/lib/property/propertyRiskEvidence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const source = {
  authority: "State Department of Transportation",
  jurisdiction: "Example County, PA",
  reference: "TIP 2027-2030 Project 1142",
  asOf: "2026-07-24",
};

const impact = buildPublicActionRiskImpact({
  publicProject: {
    kind: "public-project",
    status: "right-of-way-anticipated",
    confidence: "verified",
    source,
    projectName: "Route 18 access-control and widening project",
    projectType: "road",
    accessEffect: "restrictive",
    affectedScenarioIds: ["owner-operated"],
    notes: ["Preliminary plans show driveway consolidation and anticipated right-of-way acquisition."],
  },
  governmentAction: {
    kind: "government-action",
    status: "enacted-not-yet-effective",
    confidence: "verified",
    source: { ...source, authority: "County Council", reference: "Ordinance 2026-17" },
    governmentBody: "Example County Council",
    actionNumber: "Ordinance 2026-17",
    officialTitle: "Commercial water allocation ordinance",
    lastOfficialAction: "Enacted July 12, 2026",
    implementationDate: "2027-01-01",
    geographicScope: "Countywide commercial parcels",
    affectedScenarioIds: ["owner-operated"],
    notes: ["Implementation rules are adopted but not yet effective."],
  },
});

const adjustment = impact.scenarioAdjustments?.["owner-operated"];
assert(impact.publicProject === "verified-constrained", "Anticipated right-of-way must be a verified constraint.");
assert(impact.governmentAction === "verified-constrained", "Enacted future action must be a verified constraint.");
assert((adjustment?.publicProjectPenalty ?? 0) >= 24, "Right-of-way exposure must carry a material penalty.");
assert((adjustment?.governmentActionPenalty ?? 0) >= 14, "Enacted-not-effective action must carry a material scenario penalty.");

const deadAction = buildPublicActionRiskImpact({
  governmentAction: {
    kind: "government-action",
    status: "failed",
    confidence: "verified",
    source: { ...source, authority: "State Legislature", reference: "HB 100" },
    governmentBody: "State Legislature",
    actionNumber: "HB 100",
    officialTitle: "Failed proposal",
    lastOfficialAction: "Failed final passage",
    geographicScope: "Statewide",
    affectedScenarioIds: ["owner-operated"],
  },
});
assert(deadAction.governmentAction === "verified-clear", "Failed action must not be treated as a current constraint.");
assert((deadAction.scenarioAdjustments?.["owner-operated"]?.governmentActionPenalty ?? -1) === 0, "Failed action must have zero penalty.");

console.log(JSON.stringify({ ok: true, rule: "PUBLIC-ACTION-EVIDENCE-001", impact, deadAction }, null, 2));
