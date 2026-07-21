import { productionConnectorActivationAuthorization as auth, productionConnectorActivationInventory as inventory, productionConnectorActivationVersion as version } from "@/lib/governance/productionConnectorActivationInventory";

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(message); }

function main(): void {
  assert(inventory.length > 0, "Connector activation inventory must not be empty.");
  assert(inventory.every((x) => x.adapterCertificationRequired), "Every connector must require adapter certification.");
  assert(inventory.every((x) => x.monitoringAndAlertingRequired), "Every connector must require monitoring.");
  assert(inventory.every((x) => x.rollbackPlanRequired), "Every connector must require rollback.");
  assert(inventory.every((x) => x.killSwitchRequired), "Every connector must require a kill switch.");
  assert(inventory.every((x) => x.provenanceRequired && x.deterministicReplayRequired), "Every connector must require provenance and replay.");
  assert(inventory.every((x) => !x.liveExecutionApproved && !x.liveExecutionPermitted), "Live execution must remain blocked.");
  assert(auth.approvalRequired && !auth.approvalGranted, "Human approval must remain pending.");
  assert(!auth.liveExternalExecutionPermitted && !auth.productionAuthorized, "Production connector execution must remain blocked.");
  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), version, blockerId: auth.blockerId, connectors: inventory.length, liveExternalExecutionPermitted: false, message: "Production connector activation inventory passed fail-closed." }, null, 2));
}
main();
