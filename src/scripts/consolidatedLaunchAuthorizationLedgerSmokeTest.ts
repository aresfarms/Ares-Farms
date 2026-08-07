import { consolidatedLaunchAuthorization as authorization, launchAuthorizationDecisions as decisions, launchAuthorizationRequirements as requirements, CONSOLIDATED_LAUNCH_LEDGER_VERSION as version } from "@/lib/governance/consolidatedLaunchAuthorizationLedger";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function main(): void {
  assert(requirements.length === 10, "All ten P5 blockers must be represented.");
  assert(new Set(requirements.map((x) => x.blockerId)).size === 10, "Blocker IDs must be unique.");
  assert(requirements.every((x) => x.minimumApprovals === x.authorityRoles.length), "Every named authority role must approve.");
  assert(decisions.length === requirements.reduce((n, x) => n + x.authorityRoles.length, 0), "Decision matrix is incomplete.");
  assert(decisions.every((x) => x.decision === "PENDING" && !x.decidedBy && !x.decidedAtUtc), "Automation must not pre-approve a human decision.");
  assert(authorization.proxyApprovalForbidden && authorization.separationOfDutiesRequired, "Human identity boundaries are incomplete.");
  assert(!authorization.approvalsComplete && !authorization.finalLaunchHoldReleased && !authorization.productionAuthorized, "Launch ledger must default fail-closed.");
  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), version, blockers: requirements.length, requiredHumanDecisions: decisions.length, approvalsComplete: false, productionAuthorized: false }, null, 2));
}
main();
