import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-approval-completion-"),
  );
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET =
    "approval-completion-test-secret";
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  const bootstrap =
    await import("@/lib/property/officialEvidenceLiveBootstrap");
  const batch =
    await import("@/lib/property/officialEvidenceBatchReplayVerification");
  const packets = await import("@/lib/property/officialEvidenceApprovalPacket");
  const ceremony =
    await import("@/lib/property/officialEvidenceRecomputationCeremony");
  for (const [sourceId, publishedVersion] of [
    ["parcel-tax-authority", "tax-completion-v1"],
    ["well-permit-authority", "well-completion-v1"],
  ] as const) {
    store.writeOfficialEvidenceRefreshState({
      sourceId,
      snapshots: [],
      receipts: [],
      publishedVersion,
    });
  }
  bootstrap.bootstrapLiveEvidenceReplayReview("2026-07-25T21:00:00Z");
  batch.runGovernedBatchReplayVerification({
    actorId: "op-review",
    actorName: "Reviewer",
    reason: "Verify four builders.",
    at: "2026-07-25T21:01:00Z",
  });
  const packet = packets.createApprovalPacket({
    actorId: "op-review",
    actorName: "Reviewer",
    reason: "Prepare completion packet.",
    at: "2026-07-25T21:02:00Z",
  });
  let prematureBlocked = false;
  try {
    ceremony.recordRecomputationActivationCeremony({
      action: "FINALIZE",
      actorId: "op-review",
      actorName: "Reviewer",
      reason: "Too early.",
    });
  } catch {
    prematureBlocked = true;
  }
  ok(
    prematureBlocked,
    "Ceremony must not finalize before four separate decisions.",
  );
  for (const [index, kind] of (
    [
      "tax-scenario",
      "top-three",
      "qualification-result",
      "property-report",
    ] as const
  ).entries()) {
    packets.decideApprovalPacketItem({
      packetId: packet.packetId,
      kind,
      decision: "APPROVE",
      actorId: "op-review",
      actorName: "Reviewer",
      reason: `Reviewed ${kind}.`,
      at: `2026-07-25T21:0${index + 3}:00Z`,
    });
  }
  const completion = packets.approvalCompletionStatus();
  ok(
    completion.complete && completion.allApproved && completion.current,
    "All four current packet items must be complete and approved.",
  );
  const finalized = ceremony.recordRecomputationActivationCeremony({
    action: "FINALIZE",
    actorId: "op-review",
    actorName: "Reviewer",
    reason: "Four current approvals complete.",
    at: "2026-07-25T21:08:00Z",
  });
  ok(
    finalized.readyAtDecision && ceremony.recomputationActivationFinalized(),
    "Ceremony must finalize only after approval completion.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-APPROVAL-COMPLETION-001",
        prematureBlocked,
        packetId: packet.packetId,
        complete: completion.complete,
        allApproved: completion.allApproved,
        current: completion.current,
      },
      null,
      2,
    ),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
