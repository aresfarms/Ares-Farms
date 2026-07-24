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
  assert(store.releaseGovernanceEvidenceFor("platform").length === 5, "Release evidence stages must remain distinct.");
  console.log(JSON.stringify({ ok: true, records: 5, productionBlocked: true, deploymentExecuted: false }, null, 2));
  rmSync(dir, { recursive: true, force: true });
}

void main();
