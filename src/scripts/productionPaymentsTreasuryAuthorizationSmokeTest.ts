import { existsSync } from "node:fs";
import path from "node:path";
import { productionPaymentsTreasuryAuthorization as authorization, productionPaymentsTreasuryControlInventory as inventory, productionPaymentsTreasuryAuthorizationVersion as version } from "@/lib/governance/productionPaymentsTreasuryAuthorizationInventory";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function main(): void {
  assert(inventory.length >= 8, "Payments and treasury inventory is incomplete.");
  assert(inventory.every(x => x.qualifiedTreasuryAuthorityRequired && x.separationOfPowersRequired && x.humanApprovalRequired), "Human financial authority controls are incomplete.");
  assert(inventory.every(x => x.processorCertificationRequired && x.paymentAuthorityRequired && x.feeScheduleApprovalRequired), "Processor/payment/fee controls are incomplete.");
  assert(inventory.every(x => x.borrowerFeeDisclosureRequired && x.refundPolicyRequired && x.disputePolicyRequired && x.reconciliationPolicyRequired), "Disclosure/refund/dispute/reconciliation controls are incomplete.");
  assert(inventory.every(x => x.immutableLedgerRequired && x.deterministicReplayRequired && x.auditEvidenceRequired), "Ledger/replay/audit controls are incomplete.");
  assert(inventory.every(x => x.classificationRequired && x.reserveFloorProtectionRequired && x.rollbackKillSwitchRequired), "Classification/reserve/rollback controls are incomplete.");
  assert(inventory.every(x => !x.executionApproved && !x.liveMoneyMovementPermitted), "Financial execution must default fail-closed.");
  assert(authorization.approvalRequired && !authorization.approvalGranted && !authorization.productionAuthorized, "Human approval boundary was not preserved.");
  assert(existsSync(path.join(process.cwd(), "src/lib/billing/paymentConnectorControlStore.ts")), "Payment connector control store is missing.");
  assert(existsSync(path.join(process.cwd(), "src/lib/treasury/treasuryGovernanceGuard.ts")), "Treasury governance guard is missing.");
  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), version, operations: inventory.length, liveMoneyMovementPermitted: false, message: "Production payments and treasury authorization inventory passed fail-closed." }, null, 2));
}
main();
