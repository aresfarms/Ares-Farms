import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-approval-packet-"),
  );
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "approval-packet-test-secret";
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  const bootstrap =
    await import("@/lib/property/officialEvidenceLiveBootstrap");
  const batch =
    await import("@/lib/property/officialEvidenceBatchReplayVerification");
  const packets = await import("@/lib/property/officialEvidenceApprovalPacket");
  const registry =
    await import("@/lib/property/officialEvidenceRecomputationHandlerRegistry");
  store.writeOfficialEvidenceRefreshState({
    sourceId: "parcel-tax-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "tax-packet-v1",
  });
  store.writeOfficialEvidenceRefreshState({
    sourceId: "well-permit-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "well-packet-v1",
  });
  bootstrap.bootstrapLiveEvidenceReplayReview("2026-07-25T20:00:00Z");
  const receipt = batch.runGovernedBatchReplayVerification({
    actorId: "op-review",
    actorName: "Reviewer",
    reason: "Verify all four builders.",
    at: "2026-07-25T20:01:00Z",
  });
  ok(receipt.allMatched, "Batch replay must match before packet creation.");
  const packet = packets.createApprovalPacket({
    actorId: "op-review",
    actorName: "Reviewer",
    reason: "Prepare four independent decisions.",
    at: "2026-07-25T20:02:00Z",
  });
  ok(
    packet.items.length === 4,
    "Approval packet must contain exactly four independently reviewable items.",
  );
  ok(
    registry
      .listGovernedRecomputationHandlers()
      .filter((r) => r.status === "approved").length === 0,
    "Packet creation must not approve handlers.",
  );
  packets.decideApprovalPacketItem({
    packetId: packet.packetId,
    kind: "tax-scenario",
    decision: "APPROVE",
    actorId: "op-review",
    actorName: "Reviewer",
    reason: "Tax implementation and replay reviewed.",
    at: "2026-07-25T20:03:00Z",
  });
  ok(
    registry
      .listGovernedRecomputationHandlers()
      .filter((r) => r.status === "approved").length === 1,
    "One decision must approve only one handler.",
  );
  let staleBlocked = false;
  const top = registry.latestGovernedRecomputationHandler("top-three")!;
  registry.registerGovernedRecomputationHandler(
    {
      ...top,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      reviewReason: "changed",
      handlerId: top.handlerId + "-changed",
      sourcePath: top.sourcePath + "#changed",
    },
    () => ({
      artifactHash: "b".repeat(64),
      dependencies: [],
      generatedAt: "2026-07-25T20:04:00Z",
      productionEvidence: true,
    }),
  );
  try {
    packets.decideApprovalPacketItem({
      packetId: packet.packetId,
      kind: "top-three",
      decision: "APPROVE",
      actorId: "op-review",
      actorName: "Reviewer",
      reason: "Attempt stale approval.",
    });
  } catch {
    staleBlocked = true;
  }
  ok(staleBlocked, "Packet must fail closed after handler drift.");
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-FOUR-DECISION-PACKET-001",
        items: packet.items.map((i) => i.kind),
        approved: 1,
        staleBlocked,
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
