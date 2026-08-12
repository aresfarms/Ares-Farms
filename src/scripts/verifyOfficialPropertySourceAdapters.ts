import { parcelTaxEvidenceRecords, wellPermitEvidenceRecords } from "@/lib/property/officialPropertySourceAdapters";
import type { CanonicalProperty } from "@/lib/property/propertyTypes";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const property = { canonical_property_id: "property-1", parcel_refs: ["parcel-1"] } as CanonicalProperty;
const tax = parcelTaxEvidenceRecords(property, [{ parcelId: "parcel-1", authority: "County Treasurer", jurisdiction: "Example County, MD", reference: "2026 tax card", retrievedAt: "2026-07-24T22:00:00Z", asOf: "2026-07-01", replayRef: "replay:tax:1", currentAnnualTax: 4200, transferContinuityVerified: false }]);
const well = wellPermitEvidenceRecords(property, [{ parcelId: "parcel-1", authority: "State Water Authority", jurisdiction: "Example County, MD", permitNumber: "W-100", retrievedAt: "2026-07-24T22:00:00Z", asOf: "2026-07-01", replayRef: "replay:well:1", sourceType: "irrigation-well", testedYieldGpm: 85, status: "adequate-private-source" }]);
assert(tax.length === 1 && tax[0].parcelMatchConfidence === "exact" && tax[0].domain === "tax", "Exact parcel tax record must be emitted as tax evidence.");
assert(tax[0].notes?.some((line) => line.includes("informational only")), "Unverified transfer continuity must remain informational.");
assert(well.length === 1 && well[0].domain === "water", "Exact well permit must become structured water evidence.");
assert(well[0].notes?.some((line) => line.includes("85 GPM")), "Tested well yield must be preserved.");
assert(parcelTaxEvidenceRecords(property, []).length === 0, "No activated source record must produce no evidence.");
console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-PROPERTY-SOURCE-ADAPTERS-001", tax: tax[0], well: well[0] }, null, 2));
