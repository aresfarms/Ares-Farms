import assert from "node:assert/strict";

import { processPropertyComparisonAnalysisBatch } from "@/lib/intelligence/propertyComparisonAnalysisWorker";
import type { PropertyComparisonAnalysisItem, PropertyComparisonAnalysisReadiness } from "@/lib/intelligence/propertyComparisonAnalysisContext";

const traceId = "verify-property-comparison-analysis-worker";
const claimed = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    comparisonId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    submittedAddress: "1 Evidence Gap Rd, Testville, MD 21000",
    normalizedAddress: "1 Evidence Gap Rd, Testville, MD 21000",
    propertyId: "imported:comparison:1",
    resultSnapshot: {},
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    comparisonId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    submittedAddress: "2 Complete Rd, Testville, MD 21000",
    normalizedAddress: "2 Complete Rd, Testville, MD 21000",
    propertyId: "imported:comparison:2",
    resultSnapshot: {},
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    comparisonId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    submittedAddress: "3 Context Error Rd, Testville, MD 21000",
    normalizedAddress: "3 Context Error Rd, Testville, MD 21000",
    propertyId: "imported:comparison:3",
    resultSnapshot: {},
  },
];

const context = (propertyId: string, address: string) => ({
  version: "property-comparison-analysis-context-v1.0.0" as const,
  propertyId,
  address,
  profileId: "commercial" as const,
  profileLabel: "Commercial property",
  propertyType: "Commercial",
  currentUse: "Commercial",
  askingPrice: 500_000,
  squareFeet: 10_000,
  acreageText: "2 acres",
  zoning: "C-2",
  county: "Test County",
  state: "MD",
  parcelAccountId: "TEST-1",
  sourceRefs: ["parcel:test"],
});

const gaps: Array<{ itemId: string; missingEvidence: string[] }> = [];
const completed: string[] = [];
const finalized: string[] = [];
let observedLimit = 0;

const dependencies = {
  claim: (async ({ limit }: { limit?: number; traceId: string }) => {
    observedLimit = limit ?? 0;
    return claimed;
  }) as any,
  buildReadiness: async (item: PropertyComparisonAnalysisItem): Promise<PropertyComparisonAnalysisReadiness> => {
    if (item.id.startsWith("3333")) throw new Error("context failure");
    if (item.id.startsWith("1111")) {
      return {
        context: context(item.propertyId!, item.normalizedAddress!),
        evidencePackages: null,
        missingEvidence: ["source-supported revenue is required"],
      };
    }
    return {
      context: context(item.propertyId!, item.normalizedAddress!),
      evidencePackages: [{}, {}, {}] as any,
      missingEvidence: [],
    };
  },
  recordCompleted: (async ({ itemId }: { itemId: string }) => {
    completed.push(itemId);
    return { id: itemId };
  }) as any,
  recordGap: (async ({ itemId, missingEvidence }: { itemId: string; missingEvidence: string[] }) => {
    gaps.push({ itemId, missingEvidence });
    return { id: itemId };
  }) as any,
  finalize: (async ({ comparisonId }: { comparisonId: string }) => {
    finalized.push(comparisonId);
    return { finalized: true };
  }) as any,
};

async function main() {
  const result = await processPropertyComparisonAnalysisBatch(
    { limit: 50, traceId },
    dependencies,
  );

  assert.equal(observedLimit, 10, "worker must cap an invocation at ten items");
  assert.equal(result.claimed, 3);
  assert.equal(result.processed, 3);
  assert.equal(result.completed, 1);
  assert.equal(result.needsEvidence, 2);
  assert.deepEqual(completed, [claimed[1].id]);
  assert.equal(gaps.length, 2);
  assert.match(gaps[0].missingEvidence.join(" "), /revenue/i);
  assert.match(gaps[1].missingEvidence.join(" "), /context could not be assembled/i);
  assert.deepEqual(
    finalized.sort(),
    [claimed[0].comparisonId, claimed[2].comparisonId].sort(),
    "each touched comparison must finalize once regardless of item count",
  );

  console.log(JSON.stringify({
    ok: true,
    rule: "PROPERTY-COMPARISON-ANALYSIS-WORKER-001",
    boundedLimit: observedLimit,
    completed: result.completed,
    needsEvidence: result.needsEvidence,
    finalizations: finalized.length,
  }, null, 2));

}

main().catch((error) => { console.error(error); process.exit(1); });
