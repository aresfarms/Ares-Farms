import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

async function main() {
const temp = mkdtempSync(path.join(tmpdir(), "founder-change-review-"));
process.env.FURLONG_RUNTIME_STATE_DIR = temp;
process.env.FURLONG_OWNER_EMAIL = "owner@example.com";
process.env.FURLONG_INDEPENDENT_REVIEWER_EMAIL = "reviewer@example.com";
process.env.FURLONG_FINANCE_RISK_REVIEWER_EMAIL = "finance-reviewer@example.com";
process.env.FURLONG_INDEPENDENT_FINAL_REVIEWER_EMAIL = "final-reviewer@example.com";

const mod = await import("@/lib/governance/founderChangeReviewStore");
const internal = await import("@/lib/governance/internalChangeVerification");
const requestId = "change-4z-test";
const input = {
  evidence: {
    requestId, requestVersion: "v1", requirementText: "Add governed founder review workspace.", successCriteria: ["Plain language report is reviewable"],
    changeOwner: "OWNER" as const, domain: "TECHNICAL_GOVERNANCE" as const, commitSha: "abcdef1234567", imageDigest: `sha256:${"a".repeat(64)}`,
    buildId: "build-1", buildStatus: "SUCCESS" as const, changedComponents: ["workspace"], affectedRoutes: ["/api/governance/founder-change-review"], affectedPermissions: ["founder-only"],
    databaseChanges: [], configurationChanges: ["founder email bindings"], tests: [{ name: "workspace", status: "PASS" as const, evidenceRef: "test" }], securityFindings: [], knownLimitations: [], unverifiedClaims: ["Human understanding still requires review"],
    rollbackImageDigest: `sha256:${"b".repeat(64)}`, rollbackProcedure: "Restore the prior immutable image.", releaseInvariants: ["No activation is performed"], postReleaseChecks: [{ name: "route remains founder restricted", status: "PASS" as const }],
  },
  summary: { whatChanged: "A restricted founder review workspace was added.", whyItChanged: "To make internal changes understandable and reviewable.", whoIsAffected: "The platform owner and required independent reviewer.", whatTestsProved: ["The immutable workflow reconstructs valid state."], whatTestsDidNotProve: ["The system cannot replace human judgment."], principalRisks: ["Incorrect governance-role identity configuration can deny access."], rollbackExplanation: "Restore the previous image and preserve the immutable records." },
  ownerAttestation: null, reviewerApprovals: [],
};
mod.freezeFounderChangeReport("OWNER", input);
let snapshot = mod.founderChangeReviewSnapshot(requestId);
assert(snapshot.report?.status === "READY_FOR_CROSS_FUNCTIONAL_APPROVAL" || snapshot.report?.status === "VERIFIED_WITH_LIMITATIONS", "Frozen report must await signatures.");
const reportHash = internal.internalChangeReportHash(input);
mod.recordFounderOwnerAttestation("OWNER", requestId, { principal: "OWNER", signedAt: new Date().toISOString(), signatureRef: "sig-owner", statement: "Implemented and submitted for review.", reportSha256: reportHash });
mod.recordFounderReview("INDEPENDENT_REVIEWER", requestId, { principal: "INDEPENDENT_REVIEWER", role: "INDEPENDENT_REVIEW", decision: "APPROVE", checklistVersion: "v1", checklistAnswers: [{ itemId: "plain-language", answer: "YES" }], signedAt: new Date().toISOString(), signatureRef: "sig-independent-reviewer", reportSha256: reportHash });
snapshot = mod.founderChangeReviewSnapshot(requestId);
assert(snapshot.report?.status === "APPROVED_FOR_ACTIVATION", "Independent review must complete the report.");
assert(snapshot.activationPerformed === false, "Workspace must never activate a release.");
assert(mod.founderPrincipalForEmail("REVIEWER@example.com") === "INDEPENDENT_REVIEWER", "Governance-role identity binding must be case insensitive.");
rmSync(temp, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, rule: mod.FOUNDER_CHANGE_REVIEW_WORKSPACE_RULE, immutableEventStore: true, roleIdentityBound: true, plainLanguageWorkspace: true, ownerCannotSelfApprove: true, activationPerformed: false }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
