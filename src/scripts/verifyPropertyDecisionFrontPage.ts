import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const spec = fs.readFileSync(
  path.join(root, "docs/PRODUCT_PROPERTY_DECISION_FRONT_PAGE_V1.md"),
  "utf8",
);
const panel = fs.readFileSync(
  path.join(root, "src/components/property/PropertyDecisionRankingPanel.tsx"),
  "utf8",
);
const workspace = fs.readFileSync(
  path.join(root, "src/components/property/PropertyEvaluationWorkspace.tsx"),
  "utf8",
);
const journey = fs.readFileSync(
  path.join(root, "src/components/borrower/CustomerJourneyBar.tsx"),
  "utf8",
);

const failures: string[] = [];

for (const phrase of [
  "The first property-analysis screen is a decision front page",
  "EXPLORE",
  "UNDERSTAND",
  "PREPARE",
  "FINANCE",
  "OPERATE",
  "No plan is expanded on first render",
  "How ranking works",
  "Report-commerce UI is hidden until selection",
]) {
  if (!spec.includes(phrase)) failures.push("UX contract missing: " + phrase);
}

for (const phrase of [
  "Three property plans, ranked from the same evidence",
  "Open this plan",
  'role="tablist"',
  'role="tab"',
  'role="tabpanel"',
  "How ranking works",
  "Advisory only — not a loan approval, appraisal, permit, environmental",
]) {
  if (!panel.includes(phrase)) failures.push("Decision panel missing: " + phrase);
}

if (!panel.includes('aria-pressed={active}')) {
  failures.push("Plan choice does not expose selected state with aria-pressed.");
}
if (!panel.includes('data-testid="selected-property-plan"')) {
  failures.push("Selected-plan detail region is missing.");
}
if (!panel.includes("reportOffer &&")) {
  failures.push("Report offer is not selection-gated inside the plan detail.");
}
if (panel.includes("Furlong compares the strongest single enterprise")) {
  failures.push("Long methodology copy returned to the initial decision front.");
}

for (const phrase of [
  'const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)',
  'onSelectionChange={setSelectedPlanId}',
  'data-testid="selected-plan-detailed-workspace"',
  'hidden={!deepView && !selectedPlanId}',
  'display: deepView || selectedPlanId ? "grid" : "none"',
  "setSelectedPlanId(null);",
]) {
  if (!workspace.includes(phrase)) failures.push("Workspace gate missing: " + phrase);
}

if (!workspace.includes("<CustomerJourneyBar")) {
  failures.push("Canonical five-stage journey rail is not mounted.");
}
if (!workspace.includes("Furlong · The Land Ledger")) {
  failures.push("Land Ledger property identity masthead is missing.");
}
if (!workspace.includes("DATA VERIFIED")) {
  failures.push("Data verification stamp is missing.");
}
if (!workspace.includes("A furlong — 220 yards of ground — measured, sourced, and logged.")) {
  failures.push("Short Land Ledger trust line is missing.");
}
if (!workspace.includes("reportOffer={")) {
  failures.push("Report commerce is not passed into the selected-plan gate.");
}
if (/PropertyDecisionRankingPanel plan=\{scenarioRankingPlan\} \/>/.test(workspace)) {
  failures.push("Ungated legacy ranking panel call remains.");
}

for (const stage of [
  'label: "Explore"',
  'label: "Understand"',
  'label: "Prepare"',
  'label: "Finance"',
  'label: "Operate"',
]) {
  if (!journey.includes(stage)) failures.push("Journey bar missing stage: " + stage);
}

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        rule: "PROPERTY-DECISION-FRONT-PAGE-001",
        failures,
      },
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
      rule: "PROPERTY-DECISION-FRONT-PAGE-001",
      initialDecisionFrontOnly: true,
      planSelectionRequiredForDetails: true,
      reportCommerceSelectionGated: true,
      methodologyProgressivelyDisclosed: true,
      journeyRailPreserved: true,
      landLedgerIdentityPreserved: true,
      deepViewBypassPreserved: true,
    },
    null,
    2,
  ),
);
