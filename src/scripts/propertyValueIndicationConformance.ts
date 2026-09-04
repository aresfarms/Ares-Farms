import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { indicateMarketValue } from "@/lib/property/marketValueIndication";

const residential = indicateMarketValue({
  assessedTotalValue: 500_000,
  assessmentAsOf: "202301",
  stateCode: "MD",
  county: "Queen Anne's",
  propertyType: "single family residential home",
  knownPriceUsd: 575_000,
  knownPriceLabel: "Asking price",
});
assert.equal(residential.status, "indicated");
assert.equal(residential.profileId, "residential");
assert.equal(residential.methodCode, "residential-assessment-hpi");
assert(residential.midUsd && residential.midUsd > 500_000);
assert(residential.method.includes("exact MD FHFA single-family HPI movement"));

const undatedResidential = indicateMarketValue({
  assessedTotalValue: 629_000,
  assessmentAsOf: null,
  stateCode: "DE",
  county: "Sussex",
  propertyType: "residential home",
  knownPriceUsd: 2_500_000,
  knownPriceLabel: "Under contract at",
});
assert.equal(undatedResidential.status, "needs-property-evidence");
assert.equal(undatedResidential.methodCode, "none");
assert(undatedResidential.method.includes("did not publish the assessment vintage"));
assert.equal(undatedResidential.midUsd, null);

const commercialWithoutIncome = indicateMarketValue({
  assessedTotalValue: 1_000_000,
  assessmentAsOf: "2025-01-01",
  stateCode: "MD",
  propertyType: "30 room hotel hospitality",
});
assert.equal(commercialWithoutIncome.status, "needs-property-evidence");
assert.equal(commercialWithoutIncome.profileId, "hospitality");
assert.equal(commercialWithoutIncome.methodCode, "none");
assert(commercialWithoutIncome.method.includes("does not apply a residential house-price index"));

const commercialIncome = indicateMarketValue({
  propertyType: "hotel hospitality property",
  noiAnnual: 500_000,
  capRateLowPct: 8,
  capRateHighPct: 10,
  knownPriceUsd: 8_000_000,
  knownPriceLabel: "Asking price",
});
assert.equal(commercialIncome.status, "indicated");
assert.equal(commercialIncome.methodCode, "commercial-income-capitalization");
assert.equal(commercialIncome.lowUsd, 5_000_000);
assert.equal(commercialIncome.highUsd, 6_250_000);
assert.equal(commercialIncome.midUsd, 5_556_000);
assert(commercialIncome.divergence?.verdict.includes("Asking price is a seller signal"));

const farm = indicateMarketValue({
  stateCode: "MD",
  propertyType: "working farm",
  acreage: 60,
});
assert.equal(farm.status, "indicated");
assert.equal(farm.methodCode, "farm-state-acreage");
assert.equal(farm.midUsd, 585_000);
assert.equal(farm.lowUsd, 351_000);
assert.equal(farm.highUsd, 819_000);
assert(farm.method.includes("USDA NASS 2025 MD average farm real-estate value"));

const land = indicateMarketValue({
  stateCode: "MD",
  propertyType: "vacant unimproved land",
  acreage: 10,
});
assert.equal(land.status, "needs-property-evidence");
assert.equal(land.methodCode, "none");
assert(land.method.includes("will not apply a residential HPI to bare land"));

const source = readFileSync("src/lib/property/marketValueIndication.ts", "utf8");
assert(!source.includes("long-run rate. Treat this indication"));
assert(source.includes("exactResidentialIndexFactor"));
assert(source.includes("STATE_FARMLAND"));
assert(source.includes("commercial-income-capitalization"));
assert(source.includes("Asking price is a seller signal, not proof of market value"));

const chassis = readFileSync("src/components/property/lanes/GovernedLaneChassis.tsx", "utf8");
assert(chassis.includes("Furlong Property Estimate — screening"));
assert(chassis.includes("Needs property-specific valuation evidence"));
assert(chassis.includes("record.propertyValueScreen"));
assert(chassis.includes("import type { MarketValueIndication }"));
assert(!chassis.includes("const valuation = indicateMarketValue"));

const resolver = readFileSync("src/lib/property/jurisdictionParcelResolver.ts", "utf8");
assert(resolver.includes("assessmentAsOf: clean(primary.LASTASSD)"));
assert(resolver.includes("sourceAsOf: clean(primary.SDATDATE)"));
assert(!resolver.includes("assessmentAsOf: clean(primary.SDATDATE)"));

const propertyFacts = readFileSync("src/app/api/public/property-facts/route.ts", "utf8");
assert(propertyFacts.includes("propertyValueScreen: indicateMarketValue"));
assert(propertyFacts.includes("assessmentAsOf: jurisdictionParcel?.assessmentAsOf"));

const proformaRoute = readFileSync("src/app/api/public/property-proforma-pdf/route.ts", "utf8");
assert(proformaRoute.includes("A county tax assessment is NEVER substituted for acquisition/market value"));
assert(!proformaRoute.includes("screeningPrice = assessedTotal"));

const pdf = readFileSync("src/lib/pdf/generatePropertyEvaluationPdf.ts", "utf8");
assert(pdf.includes("Furlong Property Estimate — Screening"));
assert(pdf.includes("Needs property-specific valuation evidence"));

const workbench = readFileSync("src/components/property/OperatingModelWorkbench.tsx", "utf8");
assert(workbench.includes("Market cap rate — low %"));
assert(workbench.includes("It will not apply a residential house-price index or invent a generic cap rate"));
assert(workbench.includes("Furlong Property Estimate — income-capitalization screen"));

console.log(JSON.stringify({
  ok: true,
  residential: { method: residential.methodCode, midpoint: residential.midUsd },
  undatedResidential: { status: undatedResidential.status, publishesNumber: false },
  commercial: { method: commercialIncome.methodCode, low: commercialIncome.lowUsd, mid: commercialIncome.midUsd, high: commercialIncome.highUsd },
  farm: { method: farm.methodCode, low: farm.lowUsd, mid: farm.midUsd, high: farm.highUsd },
  bareLand: { status: land.status, publishesNumber: false },
  hardRules: {
    fhfaResidentialOnly: true,
    undatedAssessmentCannotBeIndexed: true,
    mdDataLinkageDateIsNotValuationDate: true,
    commercialRequiresNoiAndMarketCapRate: true,
    farmUsesUsdaAgriculturalAnchor: true,
    askingPriceIsNotMarketTruth: true,
  },
}, null, 2));
