import assert from "node:assert/strict";
import { buildPropertyComparisonAnalysisReadiness } from "@/lib/intelligence/propertyComparisonAnalysisContext";
import { propertyReportPreparation } from "@/lib/intelligence/propertyReportPreparation";
import { storedEconomicPackages } from "@/lib/intelligence/storedEconomicEvidence";
import { readComparisonAccess, saveComparisonAccess } from "@/lib/intelligence/propertyComparisonAccess";
import { automatedReportFixture } from "./fixtures/automatedReportFixture";
import { exclusionFixture } from "./fixtures/candidateExclusion";
import { basePackage } from "./fixtures/economicEvidence";

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

  const asOf = new Date("2026-09-29T00:00:00Z");
  const facts = automatedReportFixture();
  const item = { ...claimed[0], propertyId: "synthetic-report-property",
    submittedAddress: "123 Fixture Road, Testville, MD 00000", normalizedAddress: "123 Fixture Rd, Testville, MD 00000" };
  let fresh = false;
  const resolver = async (_input: unknown, options?: { fresh?: boolean }) => { fresh = options?.fresh === true; return facts; };
  const readiness = await buildPropertyComparisonAnalysisReadiness(item, { resolveFacts: resolver, now: () => asOf });
  assert(fresh, "analysis collection must recheck current evidence");
  assert.equal(readiness.context.profileId, "farm", "assessor-resolved farm must not fall back to residential");
  assert.equal(readiness.context.askingPrice, null, "assessment must not become asking price");
  assert.equal(readiness.evidenceCapture?.checklist.length, 19);
  assert.equal(readiness.evidenceCapture?.checklist.find(c => c.domain === "property-identity")?.status, "captured");
  assert.equal(readiness.evidenceCapture?.checklist.find(c => c.domain === "acquisition-price")?.status, "needed");
  assert.equal(readiness.evidencePackages, null, "captured parcel evidence alone cannot authorize economics");
  const badFacts = structuredClone(facts);
  if (badFacts.ok && "verification" in badFacts) badFacts.verification.normalizedAddress = "999 Wrong Road, Testville, MD 00000";
  await assert.rejects(() => buildPropertyComparisonAnalysisReadiness(item, { resolveFacts: async () => badFacts, now: () => asOf }));
  const packages = (["best-single-enterprise", "best-mixed-use", "best-distinct-alternative"] as const).map((role, index) => {
    const p = structuredClone(basePackage);
    p.propertyId = item.propertyId; p.address = item.normalizedAddress;
    p.packageId = `intake-fixture-${index}`; p.candidate.id = `candidate-${index}`;
    p.candidate.title = `Synthetic use ${index}`; p.candidate.candidateRole = role;
    p.candidate.enterpriseComponents = index === 1 ? ["Use A", "Use B"] : ["Use A"];
    return p;
  });
  const completedItem = { ...item, status: "COMPLETED", resultSnapshot: {
    economicEvidencePackages: packages.map(p => ({ package: p, assessment: { status: "complete" } })),
  } };
  assert.equal(storedEconomicPackages(completedItem.resultSnapshot)?.length, 3, "read actual persisted wrappers");
  assert.equal(storedEconomicPackages({ economicEvidencePackages: [{ package: {} }, {}, {}] }), null);
  assert(propertyReportPreparation(completedItem, asOf).evidenceReady);
  assert.equal(propertyReportPreparation(completedItem, asOf).choices.length, 3);
  packages[0].constraints.zoning.status = "blocked";
  assert.equal(propertyReportPreparation(completedItem, asOf).choices.length, 2, "a blocked use is not a selectable vision");
  assert.equal(propertyReportPreparation(completedItem, new Date("2028-01-01")).evidenceReady, false, "saved assessment cannot conceal stale sources");
  assert.equal(propertyReportPreparation({ ...completedItem, propertyId: "another-property" }, asOf).evidenceReady, false);
  assert.equal(propertyReportPreparation({ ...completedItem, status: "ANALYZING" }, asOf).evidenceReady, false);
  const reopened = await buildPropertyComparisonAnalysisReadiness(completedItem, { resolveFacts: resolver, now: () => asOf });
  assert.equal(reopened.evidencePackages?.length, 3);
  const exclusions = packages.map(p => exclusionFixture(p.candidate.candidateRole, item.propertyId, item.normalizedAddress));
  const noGoItem = { ...completedItem, resultSnapshot: { economicEvidencePackages: [], candidateExclusions: exclusions } };
  const noGo = await buildPropertyComparisonAnalysisReadiness(noGoItem, { resolveFacts: resolver, now: () => asOf });
  assert.deepEqual(noGo.evidencePackages, []);
  assert.equal(noGo.candidateExclusions?.length, 3);
  const noGoPreparation = propertyReportPreparation(noGoItem, asOf);
  assert.equal(noGoPreparation.outcome, "no-supported-use");
  assert.equal(noGoPreparation.exclusions.length, 3, "show documented negative findings before payment");
  assert.equal(noGoPreparation.evidenceReady, true);
  let exclusionHandoff = false;
  await processPropertyComparisonAnalysisBatch({ traceId }, { ...dependencies,
    claim: (async () => [noGoItem]) as any, buildReadiness: async () => noGo,
    recordCompleted: (async (value: { evidencePackages: unknown[]; candidateExclusions?: unknown[] }) => {
      assert.equal(value.evidencePackages.length, 0); assert.equal(value.candidateExclusions?.length, 3);
      exclusionHandoff = true; return { id: noGoItem.id };
    }) as any,
  });
  assert(exclusionHandoff, "private worker must carry exclusions to the durable completion boundary");
  assert(!propertyReportPreparation({ ...noGoItem, resultSnapshot: { economicEvidencePackages: [] } }, asOf).evidenceReady);
  const expired = await buildPropertyComparisonAnalysisReadiness(completedItem, { resolveFacts: resolver, now: () => new Date("2028-01-01") });
  assert.equal(expired.evidencePackages, null);
  assert(expired.missingEvidence.some(gap => /stale|fresh|age/i.test(gap)));
  const store = new Map<string, string>();
  const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); } };
  const saved = { comparisonId: claimed[0].comparisonId, accessToken: "furlong-comparison-" + "a".repeat(43), propertyCount: 1, requestedResultCount: 1, expiresAt: "2099-01-01" };
  saveComparisonAccess(storage, saved);
  saveComparisonAccess(storage, { ...saved, comparisonId: claimed[2].comparisonId, accessToken: "furlong-comparison-" + "b".repeat(43) });
  assert.equal(readComparisonAccess(storage, saved.comparisonId)?.accessToken, saved.accessToken, "opening a second case must not lose the first credential");
  assert.equal(readComparisonAccess(storage, "unknown-case"), null, "never borrow another case's recovery token");
  assert.equal(readComparisonAccess({ getItem: () => "malformed" }), null);
  assert.equal(readComparisonAccess({ getItem: () => JSON.stringify({ ...saved, expiresAt: "2020-01-01" }) }), null);

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
