import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const root = process.cwd();
const panel = fs.readFileSync(path.join(root, "src/components/property/PropertyEvidencePanel.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx"), "utf8");
const ingestion = fs.readFileSync(path.join(root, "src/lib/property/propertyEvidenceIngestion.ts"), "utf8");
assert(panel.includes('data-testid="property-evidence-panel"'), "Evidence panel test hook is required.");
for (const label of ["Verified", "Supported", "Inferred", "Unknown", "Stale", "Confirmation required"]) assert(panel.includes(label), `Missing visible status ${label}`);
assert(panel.includes("block final reliance"), "Panel must visibly state reliance blockers.");
assert(workspace.includes("buildPropertyEvidenceManifest"), "Workspace must build the canonical manifest.");
assert(!workspace.includes("<PropertyEvidencePanel manifest={propertyEvidenceManifest}"), "Customer workspace must not render the internal evidence manifest.");
assert(ingestion.includes('kind: "water"') && ingestion.includes('kind: "insurance"') && ingestion.includes('kind: "public-project"') && ingestion.includes('kind: "government-action"'), "All evidence domains must be represented when unresolved.");
console.log(JSON.stringify({ ok: true, rule: "TESTER-EVIDENCE-PANEL-001", internalManifestPreserved: true, customerPanelHidden: true }, null, 2));
