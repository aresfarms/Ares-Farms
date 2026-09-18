import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { farmBestUse, type FarmPropertyFacts } from "@/lib/property/farmAnswerEngine";
import { assessAlfalfaSuitability, type AgronomicSoilEvidence } from "@/lib/property/cropSuitability";
import { parseSoilRows, soilPointQuery } from "@/lib/property/soilsLive";
import { polygonToWkt } from "@/lib/property/parcelSoils";
import { zoningUseInterpretation } from "@/lib/property/zoningUseCurated";

const asOf = "2026-09-08";
const soil: AgronomicSoilEvidence = {
 mapUnitName: "Ingleside loamy sand, 2 to 5 percent slopes", dominantComponent: "Ingleside",
 farmlandClass: "All areas are prime farmland", drainageClass: "Well drained", slopePct: 3,
 capabilityClass: 2, spatialScope: "point-map-unit", parcelCoveragePct: null,
};
const base: FarmPropertyFacts = { acres: 59.34, county: "Caroline County", state: "MD",
 croplandRentPerAcre: 137, pastureRentPerAcre: null, stateFarmlandPerAcre: 9750,
 soil, evidenceAsOf: asOf, zoningCode: "R", primeFarmland: soil.farmlandClass,
 capabilityClass: 2, drainageClass: "Well drained" };
const seippes = farmBestUse(base);
assert.equal(seippes.evidenceStatus, "screening");
assert(seippes.options.every(o => o.tier === "needs-evidence" && o.economicsBasis === "unpriced"));
assert.equal(seippes.parcelPortfolio.modeledNoiAnnual, null);
assert.match(seippes.headline, /not naming or ranking/);
assert.match(seippes.options.find(o => /Alfalfa/.test(o.name))!.why, /naturally extremely to strongly acid unless limed/);
assert(seippes.options.some(o => /Grass hay/.test(o.name)));
assert.equal(farmBestUse({ ...base, acres: null }).evidenceStatus, "insufficient");
assert(farmBestUse({ ...base, acres: 800, cornYieldPerAcre: 190 }).options.every(o => o.tier === "needs-evidence"), "Large acreage plus county yield is not a verified business plan.");
assert.equal(assessAlfalfaSuitability(soil, asOf).status, "needs-evidence");
assert.equal(assessAlfalfaSuitability({ ...soil, fieldPh: { value: 5.2, sourceRef: "fixture-soil-lab", sampledAt: "2026-07-01", coversProposedAcres: true } }, asOf).status, "constraint");
const completeSoil: AgronomicSoilEvidence = { ...soil, spatialScope: "parcel-intersection", parcelCoveragePct: 100,
 fieldPh: { value: 6.8, sourceRef: "fixture-soil-lab", sampledAt: "2026-07-01", coversProposedAcres: true },
 cropReview: { crop: "alfalfa", sourceRef: "fixture-agronomist", reviewedAt: "2026-08-01", coversProposedAcres: true,
 waterVerified: true, climateVerified: true, nutrientsVerified: true, establishmentVerified: true, marketVerified: true } };
assert.equal(assessAlfalfaSuitability(completeSoil, asOf).status, "supported-screen", "Adequate evidence must unlock a testable alternative; alfalfa is not geographically banned.");
assert.equal(assessAlfalfaSuitability({ ...completeSoil, drainageClass: "Poorly drained" }, asOf).status, "constraint");
assert.equal(assessAlfalfaSuitability({ ...completeSoil, fieldPh: { ...completeSoil.fieldPh!, sampledAt: "2027-01-01" } }, asOf).status, "needs-evidence");
assert.equal(assessAlfalfaSuitability({ ...completeSoil, fieldPh: { ...completeSoil.fieldPh!, sampledAt: "2020-01-01" } }, asOf).status, "needs-evidence");
const reviewed: FarmPropertyFacts = { ...base, soil: completeSoil, tillableAcres: 50, pastureAcres: 0,
 forestedAcres: 9.34, wetlandAcres: 0, developedAcres: 0, otherAcres: 0, hardinessZone: "7b",
 waterCapacityVerified: true, buyerDemandVerified: true, competitionVerified: true, zoningSourceUrl: "https://example.gov/zoning",
 parcelPortfolioNoiAnnual: 99999999, parcelPortfolioBasis: "Deliberately unrelated amount must be ignored",
 enterpriseBudgets: [
  { name: "Alfalfa with woodland", annualRevenue: 120000, annualOperatingCosts: 75000, annualReplacementReserve: 5000, startupCapital: 60000, sourceRef: "fixture-reviewed-budget-a", asOf: "2026-08-01", coversWholeParcel: true, agronomyVerified: true, marketVerified: true, legalUseVerified: true },
  { name: "Grain rotation with woodland", annualRevenue: 100000, annualOperatingCosts: 70000, annualReplacementReserve: 5000, startupCapital: 40000, sourceRef: "fixture-reviewed-budget-b", asOf: "2026-08-01", coversWholeParcel: true, agronomyVerified: true, marketVerified: true, legalUseVerified: true },
 ] };
assert.equal(farmBestUse(reviewed).evidenceStatus, "supported-screen");
assert.equal(farmBestUse(reviewed).parcelPortfolio.modeledNoiAnnual, 40000);
assert(farmBestUse({ ...reviewed, pastureAcres: 20 }).options.every(o => o.tier === "needs-evidence"), "Overlapping acreage cannot support a plan.");
assert.equal(farmBestUse({ ...reviewed, enterpriseBudgets: reviewed.enterpriseBudgets!.slice(0,1) }).evidenceStatus, "screening");
const headers = ["mukey","muname","farmlndcl","cokey","compname","comppct_r","drainagecl","slope_r","niccdcd","chkey","hzdept_r","hzdepb_r","ph1to1h2o_l","ph1to1h2o_r","ph1to1h2o_h"];
const rows = [headers, ["1","Ingleside","Prime","c1","Ingleside","75","Well drained","3","2","h1","0","20","4","5.2","5.5"], ["1","Ingleside","Prime","c2","Minor component","25","Poorly drained","0","2","h2","0","10",null,"",null]];
const parsed = parseSoilRows(rows, asOf)!;
assert.equal(parsed.components!.length, 2);
assert.equal(parsed.components![1].horizons[0].phRepresentative, null);
assert.equal(parsed.parcelCoveragePct, null, "75% of a map unit must never become 75% of a parcel.");
assert.equal(soilPointQuery(NaN, -75), null);
assert.match(soilPointQuery(38,-75)!, /LEFT JOIN chorizon/);
assert.equal(polygonToWkt({ type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,0]]] }), "POLYGON((0 0,1 0,1 1,0 0))");
assert.equal(polygonToWkt({ type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1]]] }), null);
assert.equal(polygonToWkt({ type: "Polygon", coordinates: [[["malicious SQL",0],[1,0],[1,1],[0,0]]] }), null);
const zoning = zoningUseInterpretation({state: "MD", county: "Caroline County", zoningCode: "R"});
assert.equal(zoning?.zoningLabel, "R - Rural District");
const chassis = readFileSync("src/components/property/lanes/GovernedLaneChassis.tsx", "utf8");
assert(!chassis.includes("leads Furlong's preliminary agricultural enterprise screen"));
assert(chassis.includes("farmScreen?.headline"));
const route = readFileSync("src/app/api/public/property-facts/route.ts", "utf8");
assert(route.includes("fetchMarylandParcelSoils") && route.includes("basePlaceIntelligence.soilProfile = parcelSoils"));
console.log(JSON.stringify({ok:true,rule:"FARM-EVIDENCE-INTEGRITY-002",seippesDoesNotRankAlfalfa:true,adequateEvidenceUnlocksScreen:true,wholeParcelBudgetArithmetic:40000,fieldPhNotMappedPh:true,pointNotParcel:true}));
