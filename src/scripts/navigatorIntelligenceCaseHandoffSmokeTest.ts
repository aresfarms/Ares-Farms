import { intelligenceCaseHandoff } from "@/app/api/public/navigator/converse/route";
import { FRESH_JOURNEY, type JourneyState } from "@/lib/navigator/narrativeInterpreter";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const journey: JourneyState = {
  ...FRESH_JOURNEY,
  entryMode: "own-asset",
  dealType: "working-farm",
  story: ["My private transcript text must not cross the handoff."],
  context: {
    ...FRESH_JOURNEY.context,
    addressText: "123 Private Farm Lane",
    state: "PA",
    propertyKind: "farm",
    acreage: 200,
  },
  property: { source: "plain-address", addressText: "123 Private Farm Lane", state: "PA", locality: null, resolution: "address-text", parcelId: null },
};

const first = intelligenceCaseHandoff(journey, ["crop-revenue", "cropland-rent"]);
const repeated = intelligenceCaseHandoff(journey, ["cropland-rent", "crop-revenue"]);
const changed = intelligenceCaseHandoff(journey, ["sell-vs-hold"]);
const enriched = intelligenceCaseHandoff(journey, ["crop-revenue", "program-stacking"], {
  caseId: "onboarding-existing-case",
  displayName: "Existing intelligence case",
  goal: "Evaluate the same opportunity.",
  state: "PA",
  customerTypes: ["farmer"],
  intendedUses: ["farm acquisition"],
});

assert(first.caseId === repeated.caseId, "Structured case reference must be deterministic.");
assert(first.caseId !== changed.caseId, "A materially different pathway set must produce a different case reference.");
assert(!first.href.includes("Private"), "Private transcript or address content leaked into the case link.");
assert(!first.href.includes("123"), "Street address leaked into the case link.");
assert(first.transcriptTransferred === false, "Transcript transfer must remain false.");
assert(first.identityTransferred === false, "Identity transfer must remain false.");
assert(first.addressTransferred === false, "Address transfer must remain false.");
assert(enriched.caseId === "onboarding-existing-case", "Navigator enrichment must preserve the existing case reference.");
assert(enriched.enrichmentMode === true, "Navigator enrichment mode must be explicit.");
assert(enriched.source === "NAVIGATOR_CASE_ENRICHMENT", "Navigator enrichment source must be explicit.");
assert(enriched.href.includes("farm+acquisition%2Ccrop-revenue%2Cprogram-stacking"), "Existing and new intended uses must merge.");
assert(enriched.href.includes("origin=navigator-enrichment"), "Navigator enrichment origin must be explicit.");

console.log(JSON.stringify({
  ok: true,
  deterministicCaseId: first.caseId === repeated.caseId,
  changedStructureChangedCaseId: first.caseId !== changed.caseId,
  transcriptTransferred: first.transcriptTransferred,
  identityTransferred: first.identityTransferred,
  addressTransferred: first.addressTransferred,
  existingCasePreserved: enriched.caseId === "onboarding-existing-case",
  enrichmentMode: enriched.enrichmentMode,
}, null, 2));
