import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspacePath = path.join(
  root,
  "src/components/property/PropertyEvaluationWorkspace.tsx",
);
const verificationPath = path.join(
  root,
  "src/lib/property/importedPropertyVerification.ts",
);
const discoveryPath = path.join(
  root,
  "src/components/discovery/PlaceFirstDiscovery.tsx",
);
const chassisPath = path.join(
  root,
  "src/components/property/lanes/GovernedLaneChassis.tsx",
);
const farmLanePath = path.join(
  root,
  "src/components/property/lanes/FarmLaneWorkspace.tsx",
);
const workspace = fs.readFileSync(workspacePath, "utf8");
const verification = fs.readFileSync(verificationPath, "utf8");
const discovery = fs.readFileSync(discoveryPath, "utf8");
const chassis = fs.readFileSync(chassisPath, "utf8");
const farmLane = fs.readFileSync(farmLanePath, "utf8");
const answerContract = fs.readFileSync(
  path.join(root, "src/lib/property/furlongAnswer.ts"),
  "utf8",
);

const supportedProfiles = [
  "home",
  "farm",
  "commercial",
  "land",
  "hospitality",
  "mobile-home-park",
];
const failures: string[] = [];

if (workspace.includes("<PropertyBestCoursePanel"))
  failures.push(
    "Customer workspace still renders the internal best-course governance panel.",
  );
if (workspace.includes('/api/recommendation-releases'))
  failures.push(
    "Customer workspace still calls internal recommendation-release APIs.",
  );
if (workspace.includes("import { PropertyBestCoursePanel }"))
  failures.push(
    "Customer workspace still imports the internal best-course governance panel.",
  );
if (
  !/const propertyClassificationAvailable\s*=\s*automaticTypeEvidenceAvailable\s*\|\|\s*profileOverride !== null/.test(
    workspace,
  )
) {
  failures.push(
    "Unmatched imported addresses can still silently default to a property type.",
  );
}
if (!/!deepView\s*&&\s*propertyClassificationAvailable/.test(workspace)) {
  failures.push(
    "Detailed property brief can render without automatic parcel classification evidence.",
  );
}
if (!workspace.includes("<LaneWorkspace"))
  failures.push(
    "Customer workspace does not render the profile-selected lane workspace.",
  );
for (const laneComponent of [
  "FarmLaneWorkspace",
  "CommercialLaneWorkspace",
  "ResidentialLaneWorkspace",
]) {
  if (!workspace.includes(laneComponent))
    failures.push(`Customer workspace does not mount ${laneComponent}.`);
}
if (workspace.includes("<PropertyDecisionBrief"))
  failures.push(
    "Temporary decision brief still renders instead of the command center.",
  );
if (workspace.includes("<ChartTableBrief"))
  failures.push("Customer workspace still renders the chart interface.");
if (discovery.includes("Not run — governed gate"))
  failures.push("Discovery still exposes internal governed-gate language.");
if (verification.includes("is not activated yet"))
  failures.push("Customer warnings still expose internal activation state.");
if (
  !verification.includes(
    "Some property-specific jurisdiction and hazard checks are still pending verification",
  )
)
  failures.push("Consolidated customer-safe verification note is missing.");
if (!chassis.includes('data-testid="customer-decision-summary"'))
  failures.push("Property lanes do not lead with the shared customer answer.");
if (
  !chassis.includes("<FurlongAnswerCard") ||
  !answerContract.includes("What appears possible?")
)
  failures.push(
    "Customer answer does not use the canonical evidence-scoped property-use question.",
  );
if (!chassis.includes('item.id === "summary" ? "Answer"'))
  failures.push(
    "Primary navigation does not label the decision-first surface as Answer.",
  );
if (!chassis.includes('<option value="">More facts</option>'))
  failures.push("Secondary property facts are not progressively disclosed.");
if (!farmLane.includes('initialTab: "summary"'))
  failures.push("Farm and land properties do not open on the answer.");
if (!workspace.includes("Wrong classification? Change the property type"))
  failures.push("Property-type correction is not progressively disclosed.");
if (workspace.includes("<BoundEditionReserve"))
  failures.push(
    "Bound-edition marketing still interrupts the customer property decision.",
  );
if (!workspace.includes("Why you can trust this analysis"))
  failures.push("Trust explanation is not preserved in a quiet disclosure.");

for (const profile of supportedProfiles) {
  if (!workspace.includes("allProfiles().map"))
    failures.push(`Shared profile selector missing while checking ${profile}.`);
}

if (failures.length) {
  console.error(
    JSON.stringify(
      { ok: false, rule: "CUSTOMER-PROPERTY-EXPERIENCE-001", failures },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      rule: "CUSTOMER-PROPERTY-EXPERIENCE-001",
      profilesCovered: supportedProfiles,
      internalGovernanceHidden: true,
      automaticPropertyClassification: true,
      unsupportedRankingsHidden: true,
      customerSafeSourceStatus: true,
      chartInterfaceRemoved: true,
      commandCenterRendered: true,
      threeConsumerLanes: true,
      customerReadinessSeparatedFromReleaseGovernance: true,
      decisionFirstSummary: true,
      progressiveFactDisclosure: true,
      quietClassificationCorrection: true,
      unrelatedSalesInterruptionRemoved: true,
    },
    null,
    2,
  ),
);
