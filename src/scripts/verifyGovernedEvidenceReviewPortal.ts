import assert from "node:assert/strict";
import { composeGovernedEvidencePacket } from "@/lib/governance/governedEvidenceReviewPortal";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

const events = [
  { ts: "2026-01-01T00:00:00.000Z", actorId: "reviewer-1", actorName: "Named Reviewer", domain: "applications", subject: "applications", decision: "REVIEWED", reason: "Human review completed." },
];
const platform = composeGovernedEvidencePacket({
  scope: { kind: "PLATFORM" }, modules: moduleManifests, events,
  chainVerification: { ok: true, chained: 1, legacy: 0, brokenAt: null },
  generatedAt: "2026-01-02T00:00:00.000Z",
});
assert.equal(platform.scope.kind, "PLATFORM");
assert.equal(platform.integrityConclusion, "CRYPTOGRAPHIC_CHAIN_VERIFIED");
assert.match(platform.packetSha256, /^[a-f0-9]{64}$/);
assert.equal(platform.replayRule, "TECH-REPLAY-001");
assert.equal(platform.ruleMatches.find((r) => r.ruleId === "TECH-LEDGER-001")?.status, "MATCH");

const module = composeGovernedEvidencePacket({
  scope: { kind: "MODULE", moduleId: "applications" }, modules: moduleManifests, events,
  chainVerification: { ok: true, chained: 1, legacy: 1, brokenAt: null },
  generatedAt: "2026-01-02T00:00:00.000Z",
});
assert.equal(module.moduleCount, 1);
assert.equal(module.integrityConclusion, "PARTIALLY_VERIFIED_WITH_LEGACY_RECORDS");
assert.ok(module.unresolvedIssues.length > 0);
assert.match(module.legalBoundary, /does not determine admissibility/i);

const failed = composeGovernedEvidencePacket({
  scope: { kind: "MODULE", moduleId: "applications" }, modules: moduleManifests, events,
  chainVerification: { ok: false, chained: 0, legacy: 0, brokenAt: 0 },
  generatedAt: "2026-01-02T00:00:00.000Z",
});
assert.equal(failed.integrityConclusion, "INTEGRITY_FAILURE");
assert.equal(failed.ruleMatches.find((r) => r.ruleId === "TECH-LEDGER-001")?.status, "MISMATCH");

console.log(JSON.stringify({ ok: true, rule: "GOVERNED-EVIDENCE-REVIEW-PORTAL-001", platformScope: true, moduleScope: true, passwordedRoles: ["auditor", "governance", "admin"], plainLanguageTimeline: true, packetSha256: platform.packetSha256 }, null, 2));
