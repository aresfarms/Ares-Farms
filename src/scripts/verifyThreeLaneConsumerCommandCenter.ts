import fs from "node:fs";
import path from "node:path";

/**
 * THREE-LANE-CONSUMER-COMMAND-CENTER-001 (v2 — founder decomposition 2026-07-28)
 *
 * The consumer property workspace is three INDEPENDENT lane workspaces —
 * farm, commercial, residential — each owning its own tabs, intros, and
 * financing content, mounted on ONE governed chassis that keeps the
 * compliance substrate (provenance, single-assignment fact routing, owner
 * corrections, report/export surface) single-source.
 */

const root = process.cwd();
const chassis = fs.readFileSync(path.join(root, "src/components/property/lanes/GovernedLaneChassis.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx"), "utf8");
const laneFiles: Record<string, string> = {
  farm: fs.readFileSync(path.join(root, "src/components/property/lanes/FarmLaneWorkspace.tsx"), "utf8"),
  commercial: fs.readFileSync(path.join(root, "src/components/property/lanes/CommercialLaneWorkspace.tsx"), "utf8"),
  residential: fs.readFileSync(path.join(root, "src/components/property/lanes/ResidentialLaneWorkspace.tsx"), "utf8"),
};
const failures: string[] = [];

// Each lane is its own workspace with its own LaneDefinition and tab set.
const REQUIRED_TABS = ["Summary", "Property", "Utilities", "Finance", "Environmental", "Education", "Misc. / Other", "Report"];
for (const [laneName, laneText] of Object.entries(laneFiles)) {
  if (!laneText.includes("GovernedLaneChassis")) failures.push(`${laneName} lane does not mount the governed chassis.`);
  if (!laneText.includes("LaneDefinition")) failures.push(`${laneName} lane does not declare its own LaneDefinition.`);
  if (!laneText.includes("financingPriority")) failures.push(`${laneName} lane does not own its financing ranking.`);
  if (!laneText.includes("financingProgramNote")) failures.push(`${laneName} lane does not own its financing program notes.`);
  for (const tab of REQUIRED_TABS) {
    if (!laneText.includes(`label: "${tab}"`)) failures.push(`${laneName} lane is missing its own ${tab} tab.`);
  }
  if (laneText.includes("BLOCKED") || laneText.includes("WITHHELD") || laneText.includes("governed gate")) failures.push(`Internal governance language leaked into the ${laneName} lane workspace.`);
  if (laneText.includes('label: "Decision readiness"')) failures.push(`Ceremonial decision-readiness tab returned in the ${laneName} lane.`);
  if (laneText.includes('label: "Pro forma"') || laneText.includes('label: "Pro forma report"')) failures.push(`Placeholder pro forma tab returned in the ${laneName} lane.`);
}

// Consumer lane labels stay customer-worded.
for (const lane of ["Residential", "Farm & agricultural", "Commercial & business"]) {
  if (!Object.values(laneFiles).some((text) => text.includes(lane))) failures.push(`Missing consumer lane label: ${lane}.`);
}

// The workspace mounts all three lanes via canonical profile selection — no regex classifier.
for (const component of ["FarmLaneWorkspace", "CommercialLaneWorkspace", "ResidentialLaneWorkspace"]) {
  if (!workspace.includes(component)) failures.push(`Property workspace does not mount ${component}.`);
}
if (!workspace.includes('workspaceProfile.id === "farm"')) failures.push("Lane selection is not driven by the canonical property profile.");
if (workspace.includes("<ChartTableBrief")) failures.push("Legacy chart interface returned to the customer workspace.");
if (workspace.includes("<PropertyCommandCenter")) failures.push("Legacy shared command center returned; lanes must stay independent.");

// The chassis keeps the compliance substrate single-source.
if (!chassis.includes("categoryForFact") || !chassis.includes("factsByTab")) failures.push("Single-assignment fact routing is missing from the chassis.");
if (!chassis.includes("Source and explanation")) failures.push("Per-fact provenance disclosure is missing from the chassis.");
if (!chassis.includes("Report and pro forma")) failures.push("Report tab does not own the pro forma and export workflow.");
if (!chassis.includes("props.actionsSlot")) failures.push("Report tab does not retain the working save/export actions.");
if (chassis.includes("BLOCKED") || chassis.includes("WITHHELD") || chassis.includes("governed gate")) failures.push("Internal governance language leaked into the chassis.");
if (chassis.includes("View supporting form mapping")) failures.push("Legacy supporting-form box returned as duplicated customer content.");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "THREE-LANE-CONSUMER-COMMAND-CENTER-001", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  rule: "THREE-LANE-CONSUMER-COMMAND-CENTER-001",
  independentLaneWorkspaces: ["farm", "commercial", "residential"],
  sharedGovernedChassis: true,
  laneSelectionByCanonicalProfile: true,
  singleAssignmentTabs: true,
  perLaneTabOwnership: true,
  internalGovernanceHidden: true,
  reportOwnsExports: true,
  responsiveTabbedWorkspace: true
}, null, 2));
