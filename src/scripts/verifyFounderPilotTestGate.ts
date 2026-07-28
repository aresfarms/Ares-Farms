import { buildInternalChangeVerificationReport, internalChangeReportHash } from "@/lib/governance/internalChangeVerification";
import { evaluateFounderPilotTestGate } from "@/lib/governance/founderPilotTestGate";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
const input = {
  evidence: {
    requestId: "pilot-test", requestVersion: "v1", requirementText: "Permit Caitlin and Stuart to conduct controlled internal testing.", successCriteria: ["Testing only"],
    changeOwner: "CAITLIN" as const, domain: "TECHNICAL_GOVERNANCE" as const, commitSha: "abcdef1234567", imageDigest: `sha256:${"a".repeat(64)}`,
    buildId: "build", buildStatus: "SUCCESS" as const, changedComponents: ["pilot gate"], affectedRoutes: ["/governance/founder-change-review"], affectedPermissions: ["Caitlin and Stuart only"],
    databaseChanges: [], configurationChanges: ["Founder identity bindings"], tests: [{ name: "pilot gate", status: "PASS" as const, evidenceRef: "verify" }], securityFindings: [], knownLimitations: ["Francis not yet bound"], unverifiedClaims: ["Human testing remains required"],
    rollbackImageDigest: `sha256:${"b".repeat(64)}`, rollbackProcedure: "Restore prior image.", releaseInvariants: ["No public launch"], postReleaseChecks: [{ name: "live actions remain blocked", status: "PASS" as const }],
  },
  summary: { whatChanged: "A testing-only founder pilot gate was added.", whyItChanged: "To let Caitlin and Stuart test before broader review.", whoIsAffected: "Caitlin and Stuart.", whatTestsProved: ["The pilot cannot authorize launch."], whatTestsDidNotProve: ["The platform is not approved for public use."], principalRisks: ["Testing feedback may identify defects."], rollbackExplanation: "Restore the prior image." },
  ownerAttestation: null, reviewerApprovals: [],
};
const hash = internalChangeReportHash(input);
const report = buildInternalChangeVerificationReport({ ...input, ownerAttestation: { principal: "CAITLIN", signedAt: "2026-07-26T20:00:00Z", signatureRef: "owner-sig", statement: "Implemented for pilot testing.", reportSha256: hash } });
const ready = evaluateFounderPilotTestGate({ report, acceptance: { tester: "STUART", decision: "GREEN_LIGHT", signedAt: "2026-07-26T20:05:00Z", signatureRef: "stuart-sig", reportSha256: report.reportSha256, checklistVersion: "pilot-v1", checklistAnswers: [{ itemId: "testing-only-boundary", answer: "YES" }] } });
assert(ready.status === "READY_FOR_CONTROLLED_INTERNAL_PILOT", "Valid two-founder pilot must be ready.");
assert(!ready.publicLaunchAllowed && !ready.externalActionsAllowed && !ready.paymentCaptureAllowed && !ready.noticeSendAllowed && !ready.officialRelianceAllowed, "Pilot must not grant live authority.");
const stale = evaluateFounderPilotTestGate({ report, acceptance: { tester: "STUART", decision: "GREEN_LIGHT", signedAt: "2026-07-26T20:05:00Z", signatureRef: "stuart-sig", reportSha256: "wrong", checklistVersion: "pilot-v1", checklistAnswers: [] } });
assert(stale.status === "BLOCKED", "Stale acceptance must block.");
console.log(JSON.stringify({ ok: true, rule: ready.rule, twoFounderPilot: true, francisMayRemainUnbound: true, testingOnly: true, publicLaunchAllowed: false, liveActionsAllowed: false }, null, 2));
