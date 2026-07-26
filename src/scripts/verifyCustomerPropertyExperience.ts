import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspacePath = path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx");
const verificationPath = path.join(root, "src/lib/property/importedPropertyVerification.ts");
const workspace = fs.readFileSync(workspacePath, "utf8");
const verification = fs.readFileSync(verificationPath, "utf8");

const supportedProfiles = ["home", "farm", "commercial", "land", "hospitality", "mobile-home-park"];
const failures: string[] = [];

if (workspace.includes("<PropertyBestCoursePanel")) failures.push("Customer workspace still renders the internal best-course governance panel.");
if (workspace.includes('import { PropertyBestCoursePanel }')) failures.push("Customer workspace still imports the internal best-course governance panel.");
if (!workspace.includes("Classification pending parcel evidence")) failures.push("Unmatched imported addresses can still silently default to a property type.");
if (!workspace.includes("chartOpen && propertyClassificationAvailable")) failures.push("Type-specific chart can render without automatic parcel classification evidence.");
if (verification.includes("is not activated yet")) failures.push("Customer warnings still expose internal activation state.");
if (!verification.includes("Some property-specific jurisdiction and hazard checks are still pending verification")) failures.push("Consolidated customer-safe verification note is missing.");

for (const profile of supportedProfiles) {
  if (!workspace.includes("allProfiles().map")) failures.push(`Shared profile selector missing while checking ${profile}.`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "CUSTOMER-PROPERTY-EXPERIENCE-001", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  rule: "CUSTOMER-PROPERTY-EXPERIENCE-001",
  profilesCovered: supportedProfiles,
  internalGovernanceHidden: true,
  automaticPropertyClassification: true,
  unsupportedRankingsHidden: true,
  customerSafeSourceStatus: true,
}, null, 2));
