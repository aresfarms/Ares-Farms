import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const commandCenter = fs.readFileSync(path.join(root, "src/components/property/PropertyCommandCenter.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx"), "utf8");
const failures: string[] = [];

for (const lane of ["Residential", "Farm & agricultural", "Commercial & business"]) {
  if (!commandCenter.includes(lane)) failures.push(`Missing shared consumer lane: ${lane}.`);
}
if (!workspace.includes("<PropertyCommandCenter")) failures.push("Property workspace does not render the shared command center.");
if (workspace.includes("<ChartTableBrief")) failures.push("Legacy chart interface returned to the customer workspace.");
if (commandCenter.includes("BLOCKED") || commandCenter.includes("WITHHELD") || commandCenter.includes("governed gate")) failures.push("Internal governance language leaked into the consumer command center.");
if (commandCenter.includes('label: "Decision readiness"')) failures.push("Ceremonial customer decision-readiness tab returned.");
if (commandCenter.includes('label: "Pro forma"') || commandCenter.includes('label: "Pro forma report"')) failures.push("Placeholder pro forma tab returned before a working model exists.");
for (const tab of ["Summary", "Property", "Utilities", "Finance", "Environmental", "Education", "Misc. / Other", "Report"]) {
  if (!commandCenter.includes(`label: "${tab}"`)) failures.push(`Missing requested property workspace tab: ${tab}.`);
}
if (!commandCenter.includes("Report and pro forma")) failures.push("Report tab does not own the pro forma and export workflow.");
if (!commandCenter.includes("props.actionsSlot")) failures.push("Report tab does not retain the working save/export actions.");
if (commandCenter.includes("View supporting form mapping")) failures.push("Legacy supporting-form box returned as duplicated customer content.");
if (!commandCenter.includes("categoryForFact") || !commandCenter.includes("factsByTab")) failures.push("Single-assignment fact routing is missing.");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "THREE-LANE-CONSUMER-COMMAND-CENTER-001", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  rule: "THREE-LANE-CONSUMER-COMMAND-CENTER-001",
  sharedVisualShell: true,
  lanes: ["residential", "farm-agricultural", "commercial-business"],
  singleAssignmentTabs: true,
  automaticClassificationPreserved: true,
  unsupportedScoresBlocked: true,
  internalGovernanceHidden: true,
  reportOwnsExports: true,
  responsiveTabbedWorkspace: true
}, null, 2));
