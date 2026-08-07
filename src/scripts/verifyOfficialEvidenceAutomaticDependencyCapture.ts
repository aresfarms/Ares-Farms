import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-auto-lineage-"));
  const { writeOfficialEvidenceRefreshState } = await import("@/lib/property/officialEvidenceRuntimeStore");
  const { captureGeneratedEvidenceArtifact } = await import("@/lib/property/officialEvidenceGenerationCapture");
  const { listDownstreamArtifacts } = await import("@/lib/property/officialEvidenceDownstreamInvalidation");
  writeOfficialEvidenceRefreshState({ sourceId: "parcel-tax-authority", snapshots: [], receipts: [], publishedVersion: "tax-v7" });
  writeOfficialEvidenceRefreshState({ sourceId: "well-permit-authority", snapshots: [], receipts: [], publishedVersion: "well-v3" });
  const propertyId = "property-auto-1";
  for (const kind of ["property-report", "top-three", "tax-scenario", "qualification-result"] as const) {
    captureGeneratedEvidenceArtifact({ kind, propertyId, artifactId: `${kind}:${propertyId}` });
  }
  const artifacts = listDownstreamArtifacts();
  assert(artifacts.length === 4, "All four real artifact classes must register automatically.");
  for (const artifact of artifacts) {
    assert(artifact.dependencies.some(x => x.sourceId === "parcel-tax-authority" && x.sourceVersion === "tax-v7"), "Parcel-tax lineage must be captured automatically.");
    assert(artifact.dependencies.some(x => x.sourceId === "well-permit-authority" && x.sourceVersion === "well-v3"), "Well-permit lineage must be captured automatically.");
  }
  const discover = fs.readFileSync("src/app/(public)/discover/page.tsx", "utf8");
  const workspace = fs.readFileSync("src/components/property/PropertyEvaluationWorkspace.tsx", "utf8");
  const financing = fs.readFileSync("src/app/api/financing/intake/route.ts", "utf8");
  assert(discover.includes('kind: "property-report"'), "Property-report path must capture lineage.");
  assert(workspace.includes('kind: "top-three"') && workspace.includes('kind: "tax-scenario"'), "Top Three and tax paths must capture lineage.");
  assert(financing.includes('kind: "qualification-result"'), "Qualification path must capture lineage.");
  console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-AUTOMATIC-DEPENDENCY-CAPTURE-001", artifacts: artifacts.map(x => x.kind), dependencies: artifacts[0].dependencies }, null, 2));
}
main().catch(error => { console.error(error); process.exit(1); });
