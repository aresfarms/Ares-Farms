import { ingestStructuredPropertyEvidence } from "@/lib/property/propertyEvidenceIngestion";
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
const record = {
  recordId: "well-001", domain: "water" as const, status: "adequate-private-source",
  sourceId: "md-well-registry", sourceName: "Maryland Well Registry", authority: "Maryland Department of the Environment",
  jurisdiction: "Caroline County, MD", reference: "Permit W-12345", retrievedAt: "2026-07-24T21:30:00Z", asOf: "2026-07-20",
  effectiveDate: "2026-07-20", replayRef: "replay:well-001:v1", canonicalPropertyId: "parcel-123",
  parcelMatchMethod: "parcel-id" as const, parcelMatchConfidence: "exact" as const,
  affectedScenarioIds: ["operating-agriculture"], notes: ["85 GPM irrigation well"],
};
const [evidence] = ingestStructuredPropertyEvidence([record]);
assert(evidence.kind === "water" && evidence.confidence === "verified", "Structured record must become verified water evidence.");
assert(evidence.source?.replayRef === record.replayRef, "Replay reference must survive ingestion.");
assert(evidence.source?.effectiveDate === record.effectiveDate, "Effective date must survive ingestion.");
assert(evidence.source?.reference.includes(record.sourceId) && evidence.source.reference.includes(record.canonicalPropertyId), "Source identity and parcel match must survive ingestion.");
let rejected = false;
try { ingestStructuredPropertyEvidence([{ ...record, parcelMatchConfidence: "review-required" }]); } catch { rejected = true; }
assert(rejected, "Review-required parcel matches must fail closed.");
console.log(JSON.stringify({ ok: true, rule: "STRUCTURED-OFFICIAL-EVIDENCE-001", source: evidence.source }, null, 2));
