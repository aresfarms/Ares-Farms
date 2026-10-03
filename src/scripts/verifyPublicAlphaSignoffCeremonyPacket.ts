import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  composePublicAlphaSignoffCeremonyPacket,
  PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE,
} from "../lib/governance/publicAlphaSignoffCeremonyPacket";

const packet = composePublicAlphaSignoffCeremonyPacket({
  generatedAt: "2026-09-30T18:00:00.000Z",
});

assert.equal(packet.predecessor, "4D_CONTROLLED_PROMOTION_READINESS_RECONCILIATION");
assert.equal(packet.ceremonyStatus, "READY_FOR_OWNER_AND_INDEPENDENT_REVIEW");
assert.equal(packet.quorumRule, "OWNER_PLUS_INDEPENDENT_REVIEW");
assert.equal(packet.minimumAffirmativeVotes, 2);
assert.equal(packet.ownerDecisionRecordCount, 5);
assert.equal(packet.reviewDecisionCount, 0);
assert.equal(packet.voteRecordingPermitted, false);
assert.equal(packet.decisions.length, 5);
assert.equal(
  packet.decisions.every(
    (x) => x.status === "OWNER_DECISION_RECORDED_PENDING_INDEPENDENT_REVIEW",
  ),
  true,
);
assert.equal(
  packet.decisions.every(
    (x) =>
      x.ownerDecisionRecordedBy === "Caitlin L. Hudson, PhD, PE" &&
      x.ownerDecisionRecordedAt.length > 0 &&
      x.ownerRecordedDecision.length > 0,
  ),
  true,
);

const environmental = packet.decisions.find(
  (x) => x.decisionId === "module_21_environmental_compliance_featured_or_deferred",
);
assert.ok(environmental);
assert.match(environmental.ownerRecordedDecision, /FEATURED for Public Alpha/);
assert.match(environmental.ownerRecordedDecision, /qualified independent environmental reviewer/);
assert.match(environmental.ownerRecordedDecision, /2-of-3 founder sign-off/);
assert.doesNotMatch(environmental.ownerRecordedDecision, /Deferred for Alpha/);

const lender = packet.decisions.find(
  (x) => x.decisionId === "module_10_connectors_live_or_simulated",
);
assert.ok(lender);
assert.match(lender.ownerRecordedDecision, /Simulated\/non-binding lender review only/);
assert.match(lender.ownerRecordedDecision, /live lender connectors remain blocked/);

const namedAuthority = packet.decisions.find(
  (x) => x.decisionId === "named_governance_authority",
);
assert.ok(namedAuthority);
assert.match(namedAuthority.ownerRecordedDecision, /Caitlin L\. Hudson, PhD, PE/);

const passConditions = packet.entryConditions.filter((x) => x.status === "PASS");
const externalConditions = packet.entryConditions.filter(
  (x) => x.status === "EXTERNAL_EVIDENCE_REQUIRED",
);
assert.equal(passConditions.length, 7);
assert.equal(externalConditions.length, 4);
assert.deepEqual(
  externalConditions.map((x) => x.conditionId).sort(),
  [
    "environmental_founder_quorum",
    "environmental_independent_reviewer",
    "participant_terms",
    "security_human_review",
  ],
);

const dr = packet.entryConditions.find((x) => x.conditionId === "dr_restore");
assert.ok(dr);
assert.equal(dr.status, "PASS");
assert.ok(dr.evidenceRef);
const drPath = path.join(process.cwd(), dr.evidenceRef);
assert.equal(existsSync(drPath), true, "DR evidence referenced by the ceremony must exist.");
const drEvidence = JSON.parse(readFileSync(drPath, "utf8")) as {
  outcome?: string;
  cleanupVerified?: boolean;
  liveDatabaseModifiedByDrill?: boolean;
  checks?: Array<{ pass?: boolean }>;
};
assert.equal(drEvidence.outcome, "PASS");
assert.equal(drEvidence.cleanupVerified, true);
assert.equal(drEvidence.liveDatabaseModifiedByDrill, false);
assert.equal(drEvidence.checks?.every((x) => x.pass === true), true);

assert.equal(packet.engineeringStatus, "PASS");
assert.equal(packet.publicAlphaStatus, "PENDING_SIGNOFF");
assert.equal(packet.productionStatus, "BLOCKED");
assert.equal(packet.productionAuthorizationGranted, false);
assert.equal(packet.externalActionsPermitted, false);
assert.match(packet.evidenceSnapshotHash, /^[a-f0-9]{64}$/);

console.log(
  JSON.stringify(
    {
      ok: true,
      rule: PUBLIC_ALPHA_SIGNOFF_CEREMONY_RULE,
      predecessor: packet.predecessor,
      ceremonyStatus: packet.ceremonyStatus,
      ownerDecisionsRecorded: packet.ownerDecisionRecordCount,
      independentReviewDecisionsRecorded: packet.reviewDecisionCount,
      passedEntryConditions: passConditions.length,
      externalEvidenceConditions: externalConditions.map((x) => x.conditionId),
      drRestoreEvidenceVerified: true,
      publicAlphaStatus: packet.publicAlphaStatus,
      productionStatus: packet.productionStatus,
    },
    null,
    2,
  ),
);
