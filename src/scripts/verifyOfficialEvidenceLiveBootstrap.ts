import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-live-bootstrap-"),
  );
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "live-bootstrap-test-secret";
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  const bootstrap =
    await import("@/lib/property/officialEvidenceLiveBootstrap");
  const packets =
    await import("@/lib/property/officialEvidenceReplayPacketStore");
  const registry =
    await import("@/lib/property/officialEvidenceRecomputationHandlerRegistry");
  store.writeOfficialEvidenceRefreshState({
    sourceId: "parcel-tax-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "tax-live-v1",
  });
  store.writeOfficialEvidenceRefreshState({
    sourceId: "well-permit-authority",
    snapshots: [],
    receipts: [],
    publishedVersion: "well-live-v1",
  });
  const first = bootstrap.bootstrapLiveEvidenceReplayReview(
    "2026-07-25T19:00:00Z",
  );
  const second = bootstrap.bootstrapLiveEvidenceReplayReview(
    "2026-07-25T19:01:00Z",
  );
  ok(
    first.created.length === 4,
    "Bootstrap must create four genuine replay packets.",
  );
  ok(second.created.length === 0, "Bootstrap must be idempotent.");
  ok(
    packets.listEvidenceReplayPackets().length === 4,
    "Exactly four packets must exist.",
  );
  ok(
    registry
      .listGovernedRecomputationHandlers()
      .filter((r) => r.status === "approved").length === 0,
    "Bootstrap must not approve handlers.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-LIVE-BOOTSTRAP-001",
        created: first.created,
        idempotent: true,
        approved: 0,
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
