import { buildInfrastructureRiskFromEvidence, ingestPropertyEvidence, mergeWithDefaultPropertyEvidence } from "@/lib/property/propertyEvidenceIngestion";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const facts = [
  { label: "Irrigation well", value: "85 GPM deep well", text: "Tested irrigation well reaches a confined aquifer and has adequate peak capacity.", provenance: "County Health Department · Well completion record as of 2026-05-01", tone: "positive" as const },
  { label: "Route 12 widening", value: "Right-of-way anticipated", text: "Preliminary plans show acquisition anticipated along the frontage.", provenance: "State DOT · Project 12 as of 2026-06-15", tone: "caution" as const },
];
const ingested = ingestPropertyEvidence({ facts, unknowns: [], profileId: "farm", location: "Example County, MD" });
const merged = mergeWithDefaultPropertyEvidence({ ingested, location: "Example County, MD" });
const water = merged.find((item) => item.kind === "water");
const project = merged.find((item) => item.kind === "public-project");
const insurance = merged.find((item) => item.kind === "insurance");
assert(water?.confidence === "verified" && water.status === "adequate-private-source", "Verified well fact must replace default water unknown.");
assert(project?.confidence === "verified" && project.status === "right-of-way-anticipated", "Official DOT fact must replace default project unknown.");
assert(insurance?.confidence === "unresolved", "Missing insurance evidence must remain unresolved.");
const impact = buildInfrastructureRiskFromEvidence(merged);
assert(impact.water === "verified-clear", "Ingested verified well must feed the ranking risk contract.");
assert(impact.publicProject === "verified-constrained", "Ingested DOT exposure must feed the ranking risk contract.");
console.log(JSON.stringify({ ok: true, rule: "AUTOMATIC-EVIDENCE-INGESTION-001", kinds: merged.map((item) => ({ kind: item.kind, status: item.status, confidence: item.confidence })) }, null, 2));
