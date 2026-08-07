import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-final-canary-"),
  );
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "final-canary-test-secret";
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  const bootstrap =
    await import("@/lib/property/officialEvidenceLiveBootstrap");
  const batch =
    await import("@/lib/property/officialEvidenceBatchReplayVerification");
  const approvals =
    await import("@/lib/property/officialEvidenceApprovalPacket");
  const handoff = await import("@/lib/property/officialEvidenceReviewHandoff");
  const ceremony =
    await import("@/lib/property/officialEvidenceRecomputationCeremony");
  const packet =
    await import("@/lib/property/officialEvidenceFinalCanaryPacket");
  const release =
    await import("@/lib/property/officialEvidenceSchedulerRelease");
  store.writeOfficialEvidenceRefreshState({
    sourceId: "parcel-tax-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "tax-final-canary-v1",
  });
  store.writeOfficialEvidenceRefreshState({
    sourceId: "well-permit-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "well-final-canary-v1",
  });
  let premature = false;
  try {
    packet.createFinalCanaryReleasePacket({
      actorId: "op",
      actorName: "Operator",
      reason: "premature",
    });
  } catch {
    premature = true;
  }
  ok(
    premature,
    "Final packet must fail before approvals, handoff, and ceremony.",
  );
  bootstrap.bootstrapLiveEvidenceReplayReview("2026-07-25T21:00:00Z");
  batch.runGovernedBatchReplayVerification({
    actorId: "op",
    actorName: "Operator",
    reason: "Verify all four.",
    at: "2026-07-25T21:01:00Z",
  });
  const ap = approvals.createApprovalPacket({
    actorId: "op",
    actorName: "Operator",
    reason: "Prepare decisions.",
    at: "2026-07-25T21:02:00Z",
  });
  for (const item of ap.items)
    approvals.decideApprovalPacketItem({
      packetId: ap.packetId,
      kind: item.kind,
      decision: "APPROVE",
      actorId: "op",
      actorName: "Operator",
      reason: `Approve ${item.kind}.`,
      at: "2026-07-25T21:03:00Z",
    });
  const h = handoff.recordReviewHandoff({
    actorId: "op",
    actorName: "Operator",
    reason: "Ready for final ceremony.",
    at: "2026-07-25T21:04:00Z",
  });
  ceremony.recordRecomputationActivationCeremony({
    action: "FINALIZE",
    actorId: "op",
    actorName: "Operator",
    reason: "Finalize after handoff.",
    at: "2026-07-25T21:05:00Z",
  });
  const p = packet.createFinalCanaryReleasePacket({
    actorId: "op",
    actorName: "Operator",
    reason: "Bind final canary release.",
    at: "2026-07-25T21:06:00Z",
  });
  ok(
    p.handoffReceiptId === h.receiptId,
    "Packet must bind exact handoff receipt.",
  );
  ok(
    packet.currentFinalCanaryReleasePacket()?.packetId === p.packetId,
    "Current packet must be valid.",
  );
  release.recordSchedulerRelease({
    action: "AUTHORIZE",
    actorId: "op",
    actorName: "Operator",
    reason: "Authorize paused canary.",
    at: "2026-07-25T21:07:00Z",
  });
  ok(
    release.schedulerReleaseAuthorized(),
    "Authorization must succeed only after final packet.",
  );
  ok(
    !release.schedulerResumePermitted(),
    "Final packet must not resume scheduler.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-FINAL-CANARY-PACKET-001",
        prematureBlocked: premature,
        packetId: p.packetId,
        resumePermitted: false,
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
