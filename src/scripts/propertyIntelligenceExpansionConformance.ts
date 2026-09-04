import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { modelCommercialUses } from "@/lib/property/commercialUseModel";

const screen = modelCommercialUses({
  zoning: "Commercial hospitality district",
  landUse: "30-room independent hotel",
  squareFeet: 28000,
  town: "Sample Town",
  county: "Sample County",
  stateCode: "DE",
  screeningPrice: 2_500_000,
  benchRatePct: 6.5,
});

assert.equal(screen.currentUse, "30-room independent hotel");
assert.equal(screen.propertyClassification, "Commercial—hospitality");
assert.equal(screen.bestSupportedUse?.use, "Extended-stay hospitality");
assert(screen.bestSupportedUse, "Commercial screen must retain a best-supported modeled use when inputs support one.");
assert(screen.secondaryOpportunity, "Commercial screen must surface a secondary opportunity.");
assert.match(screen.secondaryOpportunity!.use, /senior housing|independent-living/i);
assert.equal(screen.secondaryOpportunity!.financialModelAvailable, false, "Senior housing cannot receive invented NOI/DSCR from a generic square-foot model.");
assert(screen.secondaryOpportunity!.conversion.zoningReviewMonths.low >= 4);
assert(screen.secondaryOpportunity!.conversion.endToEndMonths.high >= 24);
assert(screen.secondaryOpportunity!.conversion.resubmissionUpperMonths >= 36);
assert(screen.secondaryOpportunity!.conversion.professionalSoftCost.low > 0);
assert.equal(screen.secondaryOpportunity!.conversion.municipalFees, "VERIFY_LOCAL_FEE_SCHEDULE");
assert(screen.secondaryOpportunity!.conversion.steps.length >= 5);

const ui = readFileSync("src/components/property/lanes/FinanceAnalysisPanel.tsx", "utf8");
for (const required of [
  "Property classification",
  "Current use",
  "Best-supported use",
  "Secondary opportunity",
  "Approval runway",
  "Screening professional-cost allowance",
  "How Furlong streamlines the zoning/conversion path",
]) assert(ui.includes(required), `Customer-facing property intelligence copy missing: ${required}`);

const pdf = readFileSync("src/app/api/public/property-proforma-pdf/route.ts", "utf8");
assert(pdf.includes("SECONDARY OPPORTUNITY & APPROVAL RUNWAY"));
assert(pdf.includes("Professional soft-cost allowance"));
assert(pdf.includes("unit/room model required"));

const alternatives = readFileSync("src/lib/property/commercialAlternativeUses.ts", "utf8");
assert(alternatives.includes("Extended-stay hospitality"));
assert(alternatives.includes("Senior housing / independent-living conversion"));

const doctrine = readFileSync("docs/MASTER_VOLUME_AMENDMENT_2026-09-04_PROPERTY_INTELLIGENCE.md", "utf8");
for (const rule of [
  "USDA + FSA + SBA + conventional",
  "progressive disclosure",
  "zoning/conversion runway",
  "does not replace a municipal determination",
]) assert(doctrine.includes(rule), `Master Volume amendment missing rule: ${rule}`);

console.log(JSON.stringify({
  ok: true,
  commercialPropertyIntelligence: {
    propertyClassificationVisible: true,
    currentUseVisible: true,
    bestSupportedUseVisible: true,
    seniorHousingSecondaryOpportunity: true,
    zoningTimelineVisible: true,
    conversionSoftCostVisible: true,
    resubmissionRiskVisible: true,
    noInventedSeniorHousingDscr: true,
  },
  reportStrategy: {
    combinedProgramFamilies: ["USDA", "FSA", "SBA", "conventional"],
    progressiveDisclosure: true,
    approvalExecutionRisk: true,
  },
}, null, 2));
