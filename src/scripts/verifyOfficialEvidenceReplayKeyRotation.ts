import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-replay-key-rotation-"));
  process.env.EVIDENCE_REPLAY_SIGNING_KEY_ID = "evidence-replay-v1";
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "old-key";
  const store = await import("@/lib/property/officialEvidenceReplayPacketStore");
  const packet = store.preserveSignedReplayPacket({ artifactId:"rotation:1", propertyId:"p1", kind:"tax-scenario", dependencies:[], replayInput:{price:1}, replayOutput:{tax:1} });
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET_EVIDENCE_REPLAY_V1 = "old-key";
  process.env.EVIDENCE_REPLAY_SIGNING_KEY_ID = "evidence-replay-v2";
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "new-key";
  ok(store.verifySignedReplayPacket(packet).valid, "Existing v1 packets must remain verifiable after active-key rotation.");
  const next = store.preserveSignedReplayPacket({ artifactId:"rotation:2", propertyId:"p2", kind:"tax-scenario", dependencies:[], replayInput:{price:2}, replayOutput:{tax:2} });
  ok(next.keyId === "evidence-replay-v2" && store.verifySignedReplayPacket(next).valid, "New packets must use and verify against v2.");
  console.log(JSON.stringify({ ok:true, rule:"OFFICIAL-EVIDENCE-REPLAY-KEY-ROTATION-001", oldKeyId:packet.keyId, activeKeyId:next.keyId }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
