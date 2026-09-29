import type { PropertyFactsSnapshot } from "@/lib/property/propertyFactsService";
/** Synthetic contract fixture; never launch evidence or a customer property. */
export function automatedReportFixture(): PropertyFactsSnapshot {
  return {
    ok: true, propertyId: "synthetic-report-property",
    propertyRecord: {
      exactAddress: "123 Fixture Rd, Testville, MD 00000", propertyType: "farm", rawPropertyStyle: "Farm",
      recordBasis: "matched-jurisdiction-parcel-record", parcelRefs: ["SYNTHETIC-PARCEL-1"],
      town: "Testville", state: "MD", zip: "00000", description: "SYNTHETIC TEST PROPERTY",
      acreageText: "20 acres", squareFeet: 1500, yearBuilt: 1980, landUse: "Agricultural",
      zoning: null, assessedTotalValue: 250000, assessmentAsOf: "2025-01-01",
      parcelSourceName: "Synthetic contract fixture", parcelSourceAsOf: "2026-09-01",
      parcelSourceUrl: "https://example.invalid/synthetic-parcel", listingStatus: null,
      priceEvidence: { status: "price-pending", amountUsd: null },
    },
    verification: { status: "verified", normalizedAddress: "123 Fixture Rd, Testville, MD 00000",
      restrictions: [], warnings: ["Synthetic test data: not a real property."], liveChecks: {}, lookupOutcomes: {} },
    verifiedPrograms: [],
    placeIntelligence: {
      verifiedFacts: [{ label: "Size", value: "20 acres", text: "Synthetic parcel area.",
        provenance: "Synthetic contract fixture, 2026-09-01", tone: "neutral" }],
      unknowns: [{ label: "Operating costs", pointer: "Operator", howToFind: "Obtain a complete sourced operating budget." }],
      farmEnterpriseAnswers: null, residentialAnswers: null, commercialAnswers: null,
      mechanics: null, pathwaysProse: null, diligenceCosts: [],
    },
    propertyEvidenceRecords: [],
  } as unknown as PropertyFactsSnapshot;
}
