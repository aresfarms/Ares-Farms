import { buildPostSaleTaxScenario } from "@/lib/property/ownershipCostModel";
import { buildPropertyEvidenceManifest } from "@/lib/property/propertyEvidenceManifest";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const tax = buildPostSaleTaxScenario({ price: 800_000, sellerCurrentAnnualTax: 4_000, currentTaxTransfersUnchanged: false }, { taxContext: { effectiveRatePct: 1.5, source: "official planning rate" } } as never);
const manifest = buildPropertyEvidenceManifest({
  tax,
  generatedAt: "2026-07-24T12:00:00.000Z",
  evidence: [
    { kind: "water", status: "adequate-private-source", confidence: "verified", source: { authority: "State well office", jurisdiction: "Example County, MD", reference: "WELL-85", asOf: "2026-06-01" }, affectedScenarioIds: ["operating-agriculture"], sourceProfile: { sourceType: "irrigation-well", testedYieldGpm: 85, peakDemandAdequate: true } },
    { kind: "insurance", status: "unknown-pending-quote", confidence: "unresolved", affectedScenarioIds: ["operating-agriculture"] },
    { kind: "public-project", status: "preliminary-design", confidence: "verified", source: { authority: "State DOT", jurisdiction: "Example County, MD", reference: "TIP-2040", asOf: "2024-01-01" }, projectName: "Route widening", affectedScenarioIds: ["operating-agriculture"] },
    { kind: "government-action", status: "failed", confidence: "verified", source: { authority: "County Council", jurisdiction: "Example County, MD", reference: "Bill 12", asOf: "2026-07-01" }, governmentBody: "County Council", officialTitle: "Bill 12", lastOfficialAction: "Failed", geographicScope: "Countywide", affectedScenarioIds: [] },
  ],
});
assert(manifest.items.find((x) => x.domain === "water")?.status === "verified", "Current official well evidence must be verified.");
assert(manifest.items.find((x) => x.domain === "insurance")?.status === "professional-confirmation-required", "Pending quote must require professional confirmation.");
assert(manifest.items.find((x) => x.domain === "public-project")?.status === "stale", "Old DOT evidence must be stale.");
assert(manifest.items.find((x) => x.domain === "tax")?.status === "professional-confirmation-required", "Unresolved post-sale tax must require confirmation.");
assert(manifest.relianceAllowed === false, "Blocking evidence must prevent reliance.");
assert(manifest.unresolvedDomains.includes("tax") && manifest.unresolvedDomains.includes("insurance") && manifest.unresolvedDomains.includes("public-project"), "All blocking domains must be reported.");
console.log(JSON.stringify({ ok: true, rule: "PROPERTY-EVIDENCE-MANIFEST-001", counts: manifest.counts, relianceAllowed: manifest.relianceAllowed, unresolvedDomains: manifest.unresolvedDomains, items: manifest.items.map(({ domain, status, label }) => ({ domain, status, label })) }, null, 2));
