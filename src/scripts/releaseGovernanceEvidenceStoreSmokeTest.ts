import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "furlong-release-evidence-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;

  const store = await import("@/lib/governance/releaseGovernanceEvidenceStore");
  const freeze = store.recordReleaseGovernanceEvidence({
    kind: "RELEASE_CANDIDATE_FREEZE_HOLD",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "freeze remains blocked",
    replayRef: "release-evidence-smoke-freeze",
  });
  const cutover = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_CUTOVER_HOLD",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "cutover remains blocked",
    replayRef: "release-evidence-smoke-cutover",
  });
  const board = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_RELEASE_BOARD_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "release board remains blocked",
    replayRef: "release-evidence-smoke-board",
  });
  const finalAuthority = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_FINAL_AUTHORITY_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "final authority remains blocked",
    replayRef: "release-evidence-smoke-final-authority",
  });
  assert(freeze.productionBlocked && cutover.productionBlocked && board.productionBlocked && finalAuthority.productionBlocked, "Release evidence must remain production blocked.");
  assert(!freeze.deploymentExecuted && !cutover.deploymentExecuted, "Release evidence may not execute deployment.");
  assert(store.latestReleaseGovernanceEvidence("platform", "RELEASE_CANDIDATE_FREEZE_HOLD")?.evidenceId === freeze.evidenceId, "Freeze evidence did not persist.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_CUTOVER_HOLD")?.evidenceId === cutover.evidenceId, "Cutover evidence did not persist.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_RELEASE_BOARD_PACKET")?.evidenceId === board.evidenceId, "Release board evidence did not persist.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_FINAL_AUTHORITY_PACKET")?.evidenceId === finalAuthority.evidenceId, "Final authority evidence did not persist.");
  const ceremony = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_ACTIVATION_CEREMONY_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "activation ceremony remains blocked",
    replayRef: "release-evidence-smoke-ceremony",
  });
  assert(ceremony.productionBlocked && !ceremony.deploymentExecuted, "Ceremony evidence must remain blocked.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_ACTIVATION_CEREMONY_PACKET")?.evidenceId === ceremony.evidenceId, "Ceremony evidence did not persist.");
  const verification = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_POST_ACTIVATION_VERIFICATION_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "post-activation verification remains blocked",
    replayRef: "release-evidence-smoke-verification",
  });
  assert(verification.productionBlocked && !verification.deploymentExecuted, "Verification evidence must remain blocked.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_POST_ACTIVATION_VERIFICATION_PACKET")?.evidenceId === verification.evidenceId, "Verification evidence did not persist.");
  const reliance = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_RELIANCE_VERIFICATION_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "production reliance remains blocked",
    replayRef: "release-evidence-smoke-reliance",
  });
  assert(reliance.productionBlocked && !reliance.deploymentExecuted, "Reliance evidence must remain blocked.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_RELIANCE_VERIFICATION_PACKET")?.evidenceId === reliance.evidenceId, "Reliance evidence did not persist.");
  const examination = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_REGULATORY_EXAMINATION_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "regulatory examination remains blocked",
    replayRef: "release-evidence-smoke-examination",
  });
  assert(examination.productionBlocked && !examination.deploymentExecuted, "Examination evidence must remain blocked.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_REGULATORY_EXAMINATION_PACKET")?.evidenceId === examination.evidenceId, "Examination evidence did not persist.");
  const response = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_REGULATORY_RESPONSE_PACKET",
    scope: "platform",
    actorId: "release-manager-test",
    reviewNote: "regulatory response remains blocked",
    replayRef: "release-evidence-smoke-regulatory-response",
  });
  assert(response.productionBlocked && !response.deploymentExecuted, "Regulatory response evidence must remain blocked.");
  assert(store.latestReleaseGovernanceEvidence("platform", "PRODUCTION_REGULATORY_RESPONSE_PACKET")?.evidenceId === response.evidenceId, "Regulatory response evidence did not persist.");
  assert(store.releaseGovernanceEvidenceFor("platform").length === 9, "Release evidence stages must remain distinct.");
  console.log(JSON.stringify({ ok: true, records: 9, productionBlocked: true, deploymentExecuted: false }, null, 2));
  rmSync(dir, { recursive: true, force: true });
}

void main();
