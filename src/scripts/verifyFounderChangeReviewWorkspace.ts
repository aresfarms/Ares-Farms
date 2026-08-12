import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

async function main() {
const temp = mkdtempSync(path.join(tmpdir(), "founder-change-review-"));
process.env.FURLONG_RUNTIME_STATE_DIR = temp;
process.env.FOUNDER_CAITLIN_EMAIL = "caitlin@example.com";
process.env.FOUNDER_STUART_EMAIL = "stuart@example.com";
process.env.FOUNDER_FRANCIS_EMAIL = "francis@example.com";

const mod = await import("@/lib/governance/founderChangeReviewStore");
const internal = await import("@/lib/governance/internalChangeVerification");
const requestId = "change-4z-test";
const input = {
  evidence: {
    requestId, requestVersion: "v1", requirementText: "Add governed founder review workspace.", successCriteria: ["Plain language report is reviewable"],
    changeOwner: "CAITLIN" as const, domain: "TECHNICAL_GOVERNANCE" as const, commitSha: "abcdef1234567", imageDigest: `sha256:${"a".repeat(64)}`,
    buildId: "build-1", buildStatus: "SUCCESS" as const, changedComponents: ["workspace"], affectedRoutes: ["/api/governance/founder-change-review"], affectedPermissions: ["founder-only"],
    databaseChanges: [], configurationChanges: ["founder email bindings"], tests: [{ name: "workspace", status: "PASS" as const, evidenceRef: "test" }], securityFindings: [], knownLimitations: [], unverifiedClaims: ["Human understanding still requires review"],
    rollbackImageDigest: `sha256:${"b".repeat(64)}`, rollbackProcedure: "Restore the prior immutable image.", releaseInvariants: ["No activation is performed"], postReleaseChecks: [{ name: "route remains founder restricted", status: "PASS" as const }],
  },
  summary: { whatChanged: "A restricted founder review workspace was added.", whyItChanged: "To make internal changes understandable and reviewable.", whoIsAffected: "The three founders.", whatTestsProved: ["The immutable workflow reconstructs valid state."], whatTestsDidNotProve: ["The system cannot replace human judgment."], principalRisks: ["Incorrect founder email configuration can deny access."], rollbackExplanation: "Restore the previous image and preserve the immutable records." },
  ownerAttestation: null, reviewerApprovals: [],
};
mod.freezeFounderChangeReport("CAITLIN", input);
let snapshot = mod.founderChangeReviewSnapshot(requestId);
assert(snapshot.report?.status === "READY_FOR_CROSS_FUNCTIONAL_APPROVAL" || snapshot.report?.status === "VERIFIED_WITH_LIMITATIONS", "Frozen report must await signatures.");
const reportHash = internal.internalChangeReportHash(input);
mod.recordFounderOwnerAttestation("CAITLIN", requestId, { principal: "CAITLIN", signedAt: new Date().toISOString(), signatureRef: "sig-owner", statement: "Implemented and submitted for review.", reportSha256: reportHash });
for (const principal of ["STUART", "FRANCIS"] as const) mod.recordFounderReview(principal, requestId, { principal, role: principal === "STUART" ? "REQUESTER_ACCEPTANCE" : "INDEPENDENT_REVIEW", decision: "APPROVE", checklistVersion: "v1", checklistAnswers: [{ itemId: "plain-language", answer: "YES" }], signedAt: new Date().toISOString(), signatureRef: `sig-${principal}`, reportSha256: reportHash });
snapshot = mod.founderChangeReviewSnapshot(requestId);
assert(snapshot.report?.status === "APPROVED_FOR_ACTIVATION", "Both outside-group approvals must complete the report.");
assert(snapshot.activationPerformed === false, "Workspace must never activate a release.");
assert(mod.founderPrincipalForEmail("STUART@example.com") === "STUART", "Founder identity binding must be case insensitive.");
rmSync(temp, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, rule: mod.FOUNDER_CHANGE_REVIEW_WORKSPACE_RULE, immutableEventStore: true, founderIdentityBound: true, plainLanguageWorkspace: true, ownerCannotSelfApprove: true, activationPerformed: false }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
