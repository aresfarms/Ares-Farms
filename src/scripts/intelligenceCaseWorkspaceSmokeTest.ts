import { composeIntelligenceCaseWorkspace } from "@/lib/intelligence/intelligenceCaseWorkspaceRuntime";

const workspace = composeIntelligenceCaseWorkspace({
  caseId: "case-smoke-001",
  displayName: "Wellsville Farm Evaluation",
  goal: "Evaluate acquisition, revenue, environmental, and capital pathways.",
  state: "PA",
  customerTypes: ["beginning farmer", "rural small business"],
  intendedUses: ["equine", "specialty crops", "farm retail"],
});
if (workspace.contractVersion !== "intelligence-workspace-v1") throw new Error("Wrong workspace contract.");
if (workspace.recommendation.state !== "DRAFT") throw new Error("Workspace must begin in DRAFT.");
if (!workspace.productionBlocked || !workspace.humanReviewRequired || !workspace.advisoryOnly) throw new Error("Governance boundary missing.");
if (workspace.outcome.status !== "NOT_STARTED") throw new Error("Outcome must begin NOT_STARTED.");
if (!workspace.scenarios.length) throw new Error("No scenarios composed.");
console.log(JSON.stringify({ ok: true, evidence: workspace.evidence.length, scenarios: workspace.scenarios.length, conflicts: workspace.conflictCount, recommendationState: workspace.recommendation.state, outcomeState: workspace.outcome.status }, null, 2));
