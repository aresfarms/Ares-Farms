import { existsSync } from "node:fs";
import path from "node:path";
import { evaluateProductionCutoverHoldGate } from "@/lib/governance/productionCutoverHoldGate";
import { evaluateProductionReleaseBoard } from "@/lib/governance/productionReleaseBoard";
import { productionDomainCutoverAuthorization as authorization, productionDomainCutoverAuthorizationInventory as inventory, productionDomainCutoverAuthorizationVersion as version } from "@/lib/governance/productionDomainCutoverAuthorizationInventory";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function main(): void {
  assert(inventory.length >= 6, "Production domain/cutover inventory is incomplete.");
  assert(inventory.every((x) => x.domainOwnershipVerifiedRequired && x.dnsZoneAuthorityVerifiedRequired && x.exactDnsChangeSetRequired && x.ttlReductionPlanRequired), "DNS controls are incomplete.");
  assert(inventory.every((x) => x.managedCertificateRequired && x.certificateIssuanceVerifiedRequired && x.tlsPolicyRequired && x.cdnPolicyRequired && x.wafPolicyRequired), "TLS/CDN/WAF controls are incomplete.");
  assert(inventory.every((x) => x.healthProbeRequired && x.monitoringAndAlertingRequired && x.cutoverRunbookRequired && x.rollbackRunbookRequired && x.rollbackDrillRequired), "Cutover/rollback controls are incomplete.");
  assert(inventory.every((x) => x.qualifiedReleaseManagerRequired && x.releaseBoardApprovalRequired && x.finalLaunchHoldReleaseRequired), "Human release authority is incomplete.");
  assert(inventory.every((x) => !x.dnsCutoverApproved && !x.certificateActivationApproved && !x.publicExposureApproved && !x.finalLaunchHoldReleased), "Production edge capability must default fail-closed.");
  const hold = evaluateProductionCutoverHoldGate();
  const board = evaluateProductionReleaseBoard();
  assert(hold.summary.publicDnsCutoverAllowed === 0 && hold.summary.finalGoLiveHoldReleased === 0 && hold.summary.productionCutoverExecuted === 0, "Production cutover hold was not preserved.");
  assert(board.summary.publicDnsCutoverAllowed === 0 && board.summary.releaseBoardApprovalGranted === 0 && board.summary.launchHoldReleased === 0, "Release board hold was not preserved.");
  assert(authorization.approvalRequired && !authorization.approvalGranted && !authorization.productionAuthorized, "Human approval boundary was not preserved.");
  assert(existsSync(path.join(process.cwd(), "src/scripts/productionCutoverHoldGateSmokeTest.ts")), "Cutover hold smoke is missing.");
  assert(existsSync(path.join(process.cwd(), "src/scripts/productionReleaseBoardSmokeTest.ts")), "Release board smoke is missing.");
  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), version, surfaces: inventory.length, dnsCutoverPermitted: false, finalLaunchHoldReleased: false, message: "Production domain and cutover authorization inventory passed fail-closed." }, null, 2));
}
main();
