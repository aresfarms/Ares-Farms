import assert from "node:assert/strict";
import {
  composePublicAlphaSignoffCeremonyPacket,
  PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE,
} from "../lib/governance/publicAlphaSignoffCeremonyPacket";

const packet = composePublicAlphaSignoffCeremonyPacket({
  generatedAt: "2026-07-26T12:00:00.000Z",
});
assert.equal(packet.predecessor, "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION");
assert.equal(packet.ceremonyStatus, "READY_FOR_OWNER_AND_INDEPENDENT_REVIEW");
assert.equal(packet.quorumRule, "OWNER_PLUS_INDEPENDENT_REVIEW");
assert.equal(packet.minimumAffirmativeVotes, 2);
assert.equal(packet.reviewDecisionCount, 0);
assert.equal(packet.voteRecordingPermitted, false);
assert.equal(packet.decisions.length, 5);
assert.equal(packet.decisions.every((x) => x.status === "PENDING_OWNER_DECISION"), true);
assert.equal(packet.entryConditions.filter((x) => x.status === "PASS").length, 6);
assert.equal(packet.entryConditions.filter((x) => x.status === "EXTERNAL_EVIDENCE_REQUIRED").length, 2);
assert.equal(packet.engineeringStatus, "PASS");
assert.equal(packet.publicAlphaStatus, "PENDING_SIGNOFF");
assert.equal(packet.productionStatus, "BLOCKED");
assert.equal(packet.productionAuthorizationGranted, false);
assert.equal(packet.externalActionsPermitted, false);
assert.match(packet.evidenceSnapshotHash, /^[a-f0-9]{64}$/);
console.log(JSON.stringify({
  ok: true,
  rule: PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE,
  predecessor: packet.predecessor,
  ceremonyStatus: packet.ceremonyStatus,
  pendingOwnerDecisions: packet.decisions.length,
  externalEvidenceConditions: 2,
  voteRecorded: false,
  productionStatus: packet.productionStatus,
}, null, 2));
