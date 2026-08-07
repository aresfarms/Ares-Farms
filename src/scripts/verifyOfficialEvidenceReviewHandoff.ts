import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-review-handoff-"),
  );
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "handoff-test-secret";
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  const bootstrap =
    await import("@/lib/property/officialEvidenceLiveBootstrap");
  const batch =
    await import("@/lib/property/officialEvidenceBatchReplayVerification");
  const packet = await import("@/lib/property/officialEvidenceApprovalPacket");
  const handoff = await import("@/lib/property/officialEvidenceReviewHandoff");
  store.writeOfficialEvidenceRefreshState({
    sourceId: "parcel-tax-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "tax-handoff-v1",
  });
  store.writeOfficialEvidenceRefreshState({
    sourceId: "well-permit-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "well-handoff-v1",
  });
  let blocked = false;
  try {
    handoff.recordReviewHandoff({
      actorId: "op",
      actorName: "Operator",
      reason: "premature",
    });
  } catch {
    blocked = true;
  }
  ok(blocked, "Premature handoff must be blocked.");
  bootstrap.bootstrapLiveEvidenceReplayReview("2026-07-25T21:00:00Z");
  batch.runGovernedBatchReplayVerification({
    actorId: "op",
    actorName: "Operator",
    reason: "Verify all builders.",
    at: "2026-07-25T21:01:00Z",
  });
  const p = packet.createApprovalPacket({
    actorId: "op",
    actorName: "Operator",
    reason: "Prepare decisions.",
    at: "2026-07-25T21:02:00Z",
  });
  for (const item of p.items)
    packet.decideApprovalPacketItem({
      packetId: p.packetId,
      kind: item.kind,
      decision: "APPROVE",
      actorId: "op",
      actorName: "Operator",
      reason: `Approve ${item.kind}.`,
      at: "2026-07-25T21:03:00Z",
    });
  const receipt = handoff.recordReviewHandoff({
    actorId: "op",
    actorName: "Operator",
    reason: "All four decisions reviewed and ready for final ceremony.",
    at: "2026-07-25T21:04:00Z",
  });
  ok(
    receipt.readyForFinalCeremony,
    "Handoff must be ready after four current approvals.",
  );
  ok(
    !receipt.checklist.ceremonyFinalized,
    "Handoff must not finalize ceremony.",
  );
  ok(
    !receipt.checklist.resumePermitted,
    "Handoff must not permit scheduler resume.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-REVIEW-HANDOFF-001",
        prematureBlocked: blocked,
        ready: receipt.readyForFinalCeremony,
        schedulerResume: receipt.checklist.resumePermitted,
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
