import assert from "node:assert/strict";

import { farmBestUse, type FarmPropertyFacts } from "@/lib/property/farmAnswerEngine";

const base = (overrides: Partial<FarmPropertyFacts> = {}): FarmPropertyFacts => ({
  acres: null,
  county: "Example County",
  state: "MD",
  croplandRentPerAcre: null,
  pastureRentPerAcre: null,
  stateFarmlandPerAcre: null,
  evidenceAsOf: "2026-09-08",
  ...overrides,
});

const acreageOnly = farmBestUse(base({ acres: 800, primeFarmland: "All areas are prime farmland" }));
assert.notEqual(acreageOnly.evidenceStatus, "supported-screen");
assert.equal(acreageOnly.options.some((option) => option.tier === "leading-screen"), false);
assert.match(acreageOnly.headline, /not naming or ranking a best agricultural enterprise/i);
assert.ok(acreageOnly.missingCriticalInputs.some((item) => /parcel-boundary soil coverage/i.test(item)));
assert.ok(acreageOnly.missingCriticalInputs.some((item) => /buyer demand/i.test(item)));
assert.ok(acreageOnly.missingCriticalInputs.some((item) => /water\/irrigation capacity/i.test(item)));
assert.ok(acreageOnly.options.find((option) => option.name.includes("Commodity row crops"))?.why.includes("Acreage alone does not determine"));

const eightyPrime = farmBestUse(base({ acres: 80, primeFarmland: "All areas are prime farmland", capabilityClass: 2, drainageClass: "Well drained", cornYieldPerAcre: 190, soybeanYieldPerAcre: 60 }));
assert.equal(eightyPrime.options.some((option) => option.tier === "leading-screen"), false, "prime soil + acreage + county yields cannot create a best enterprise without whole-parcel comparable budgets and parcel evidence");

const noHbu = acreageOnly.propertyWideContext.note.toLowerCase();
assert.ok(noHbu.includes("highest/best-supported use") || noHbu.includes("highest"), "property-wide HBU must remain separately evidence-gated");

console.log(JSON.stringify({
  ok: true,
  rule: "PROPERTY-BEST-USE-EVIDENCE-001",
  guarantees: [
    "acreage and prime-soil labels cannot establish profitability",
    "county yields cannot become parcel yields",
    "agricultural enterprise ranking requires parcel soil/field evidence, demand, competition, water, zoning and comparable whole-parcel budgets",
    "agricultural enterprise screen cannot masquerade as property-wide highest-and-best use",
  ],
}, null, 2));
