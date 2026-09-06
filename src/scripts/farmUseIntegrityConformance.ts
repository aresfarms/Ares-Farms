import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { farmBestUse } from "@/lib/property/farmAnswerEngine";
import { zoningUseInterpretation } from "@/lib/property/zoningUseCurated";

const carolineR = zoningUseInterpretation({ state: "MD", county: "Caroline County", zoningCode: "R" });
assert(carolineR, "Caroline County R zoning interpretation must resolve.");
assert.equal(carolineR.zoningLabel, "R - Rural District");
assert(carolineR.propertyWideCandidates.some((v) => /minor subdivision/i.test(v)));
assert(carolineR.propertyWideCandidates.some((v) => /agricultural tourism/i.test(v)));
assert.match(carolineR.developmentNote, /Do not label development marginal/i);

const unknownAcres = farmBestUse({
  acres: null,
  county: "Caroline County",
  state: "MD",
  croplandRentPerAcre: 137,
  pastureRentPerAcre: null,
  stateFarmlandPerAcre: null,
  nearestMetroMiles: null,
  primeFarmland: "All areas are prime farmland",
  capabilityClass: 2,
  drainageClass: "Well drained",
  cornYieldPerAcre: null,
  soybeanYieldPerAcre: null,
  wheatYieldPerAcre: null,
  yieldYear: null,
  landUse: "Agricultural",
  zoningCode: "R",
  zoningLabel: carolineR.zoningLabel,
  zoningSummary: carolineR.summary,
  zoningSource: carolineR.sourceName,
  zoningSourceUrl: carolineR.sourceUrl,
  propertyWideCandidates: carolineR.propertyWideCandidates,
  developmentNote: carolineR.developmentNote,
  energyNote: carolineR.energyNote,
});
assert.equal(unknownAcres.evidenceStatus, "insufficient");
assert(unknownAcres.options.every((o) => o.tier === "needs-evidence"));
assert.match(unknownAcres.headline, /not naming a best agricultural enterprise/i);
assert.match(unknownAcres.headline, /Prime-soil status by itself cannot make commodity row crops the answer/i);

const seippesScreen = farmBestUse({
  acres: 59.34,
  county: "Caroline County",
  state: "MD",
  croplandRentPerAcre: 137,
  pastureRentPerAcre: null,
  stateFarmlandPerAcre: null,
  nearestMetroMiles: null,
  primeFarmland: "All areas are prime farmland",
  capabilityClass: 2,
  drainageClass: "Well drained",
  cornYieldPerAcre: null,
  soybeanYieldPerAcre: null,
  wheatYieldPerAcre: null,
  yieldYear: null,
  landUse: "Agricultural",
  zoningCode: "R",
  zoningLabel: carolineR.zoningLabel,
  zoningSummary: carolineR.summary,
  zoningSource: carolineR.sourceName,
  zoningSourceUrl: carolineR.sourceUrl,
  propertyWideCandidates: carolineR.propertyWideCandidates,
  developmentNote: carolineR.developmentNote,
  energyNote: carolineR.energyNote,
  publicWater: false,
  publicSewer: false,
});
assert.equal(seippesScreen.scope, "agricultural-enterprise-screen");
assert.equal(seippesScreen.evidenceStatus, "screening");
assert.notEqual(seippesScreen.options[0]?.name, "Commodity row crops (corn/soy/wheat)");
assert(seippesScreen.options.every((o) => o.tier !== "leading-screen"));
assert.match(seippesScreen.headline, /not labeling any agricultural enterprise the leading use yet/i);
const commodity = seippesScreen.options.find((o) => o.name.startsWith("Commodity row crops"));
assert(commodity, "Commodity option should remain visible as an agricultural possibility.");
assert.notEqual(commodity.tier, "leading-screen");
assert.match(commodity.why, /below stand-alone commodity scale/i);
assert.equal(seippesScreen.propertyWideContext.zoning, "R - Rural District");
assert(seippesScreen.propertyWideContext.candidates.some((v) => /rural residential/i.test(v)));
assert.match(seippesScreen.propertyWideContext.note, /TDR receiving-versus-sending status/i);

const genuineCommodityScale = farmBestUse({
  acres: 800,
  county: "Example County",
  state: "MD",
  croplandRentPerAcre: 220,
  pastureRentPerAcre: 80,
  stateFarmlandPerAcre: null,
  nearestMetroMiles: 120,
  primeFarmland: "All areas are prime farmland",
  capabilityClass: 2,
  drainageClass: "Well drained",
  cornYieldPerAcre: 190,
  soybeanYieldPerAcre: 62,
  wheatYieldPerAcre: 80,
  yieldYear: 2025,
  landUse: "Agricultural",
  zoningCode: "AG",
});
assert.equal(genuineCommodityScale.options[0]?.name, "Commodity row crops (corn/soy/wheat)");
assert.equal(genuineCommodityScale.options[0]?.tier, "leading-screen");

const root = process.cwd();
const route = fs.readFileSync(path.join(root, "src/app/api/public/property-facts/route.ts"), "utf8");
const tab = fs.readFileSync(path.join(root, "src/components/property/lanes/FarmAgricultureTab.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx"), "utf8");
assert(route.includes("applyResolvedFarmParcelContext"));
assert(route.includes("resolvedAcreageText"));
assert(tab.includes("LEADING AG SCREEN"));
assert(!tab.includes('label: "BEST FIT"'));
assert(tab.includes("Property-wide use context"));
assert(workspace.includes("No lead sale or file auction"));
assert(workspace.includes("No pay-to-rank"));
assert(!workspace.includes("Complete the property basics before Furlong recommends a course"));
assert(!workspace.includes("takes no cut of your transaction"));

console.log(JSON.stringify({
  ok: true,
  unknownAcreageFailsClosed: true,
  seippesFixture: {
    acres: 59.34,
    zoning: seippesScreen.propertyWideContext.zoning,
    firstAgriculturalCandidate: seippesScreen.options[0]?.name ?? null,
    anyLeadingUseClaim: seippesScreen.options.some((o) => o.tier === "leading-screen"),
    commodityPosition: seippesScreen.options.findIndex((o) => o.name.startsWith("Commodity row crops")) + 1,
    commodityIsBest: false,
    propertyWideHighestBestUseClaimed: false,
  },
  genuineCommodityScaleStillPossible: genuineCommodityScale.options[0]?.name,
  mixedEconomicsLabeled: seippesScreen.options.every((o) => Boolean(o.economicsBasis)),
  borrowerControlledRoutingCopy: true,
}, null, 2));
