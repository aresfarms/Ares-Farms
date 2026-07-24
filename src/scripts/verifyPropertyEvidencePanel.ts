import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const root = process.cwd();
const panel = fs.readFileSync(path.join(root, "src/components/property/PropertyEvidencePanel.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx"), "utf8");
assert(panel.includes('data-testid="property-evidence-panel"'), "Evidence panel test hook is required.");
for (const label of ["Verified", "Supported", "Inferred", "Unknown", "Stale", "Confirmation required"]) assert(panel.includes(label), `Missing visible status ${label}`);
assert(panel.includes("block final reliance"), "Panel must visibly state reliance blockers.");
assert(workspace.includes("buildPropertyEvidenceManifest"), "Workspace must build the canonical manifest.");
assert(workspace.includes("<PropertyEvidencePanel manifest={propertyEvidenceManifest}"), "Workspace must render the canonical manifest.");
assert(workspace.includes('kind: "water"') && workspace.includes('kind: "insurance"') && workspace.includes('kind: "public-project"') && workspace.includes('kind: "government-action"'), "All evidence domains must be represented when unresolved.");
console.log(JSON.stringify({ ok: true, rule: "TESTER-EVIDENCE-PANEL-001", visibleStatuses: ["verified", "supported", "inferred", "unknown", "stale", "confirmation-required"], blocksReliance: true }, null, 2));
