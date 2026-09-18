import fs from "node:fs";
import path from "node:path";
import {
  AUTHORIZATION_GATE_NAMES,
  authorizeDispatch,
  buildDeterministicPackage,
  captureSubmissionConsent,
  dispatchWithSandboxAdapter,
  registerRecipient,
  replayDeliveryTruth,
  retryDelayMs,
} from "@/lib/lender-submission/runtime";
import { LENDER_SUBMISSION_DOCTRINE, LENDER_SUBMISSION_STATES, canTransition } from "@/lib/lender-submission/doctrine";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(action: () => unknown, message: string) {
  let threw = false;
  try { action(); } catch { threw = true; }
  assert(threw, message);
}

const sources = [
  { sourceRef: "vault://doc-b", sourceVersion: "v7", canonicalName: "02_financial_statement.pdf", mediaType: "application/pdf", dataCategory: "financial", classification: "RESTRICTED" as const, malwareScanStatus: "CLEAN" as const, redactionStatus: "APPLIED" as const, overlayVersion: "overlay-de-v2", authenticityEvidenceRef: "auth-fin-001", authenticityClassification: "CORROBORATED" as const, content: "financial-bytes" },
  { sourceRef: "vault://doc-a", sourceVersion: "v3", canonicalName: "01_application.json", mediaType: "application/json", dataCategory: "application", classification: "CONFIDENTIAL" as const, malwareScanStatus: "CLEAN" as const, redactionStatus: "NOT_REQUIRED" as const, overlayVersion: "overlay-de-v2", authenticityEvidenceRef: "auth-app-001", authenticityClassification: "DIRECT_SOURCE_VERIFIED" as const, content: "application-bytes" },
];
const base = { caseId: "11111111-1111-4111-8111-111111111111", packageVersionId: "22222222-2222-4222-8222-222222222222", version: 1, frozenAt: "2026-08-06T12:00:00.000Z", sources };
const pkg = buildDeterministicPackage(base);
const consent = captureSubmissionConsent({ accepted: true, caseId: base.caseId, packageVersionId: pkg.packageVersionId, manifestSha256: pkg.manifestSha256, customerId: "customer-1", lenderId: "lender-1", recipientScope: "commercial-credit-team", purpose: "financing review", channel: "secure-api", dataCategories: ["application", "financial"], consentedAt: "2026-08-06T12:05:00.000Z", expiresAt: "2026-08-07T12:05:00.000Z" });
const recipient = registerRecipient({ lenderId: "lender-1", channel: "secure-api", destination: "https://sandbox.lender.invalid/inbox", verificationLevel: "V2_OUT_OF_BAND", verifiedAt: "2026-08-06T12:06:00.000Z", expiresAt: "2026-08-07T12:06:00.000Z" });
const passingGates = Object.fromEntries(AUTHORIZATION_GATE_NAMES.map((gate) => [gate, "PASS" as const]));

function main() {
  const mode = process.argv[2] ?? "all";
  assert(LENDER_SUBMISSION_STATES.length === 20, "The canonical 20-state workflow must be complete.");
  assert(canTransition("DRAFT", "BUILDING") && !canTransition("DRAFT", "DISPATCHING"), "State transitions must be explicit and fail closed.");

  const repeat = buildDeterministicPackage({ ...base, sources: [...sources].reverse() });
  assert(pkg.manifestSha256 === repeat.manifestSha256 && pkg.packageBytes.equals(repeat.packageBytes), "The same frozen sources must build byte-identically regardless of input order.");
  const mutated = buildDeterministicPackage({ ...base, sources: [{ ...sources[0], content: "changed" }, sources[1]] });
  assert(mutated.manifestSha256 !== pkg.manifestSha256, "Package mutation must change the manifest hash.");
  expectThrow(() => captureSubmissionConsent({ ...consent, accepted: false }), "Consent must be explicit.");

  const allowed = authorizeDispatch({ environment: "sandbox", caseId: base.caseId, package: pkg, consent, recipient, adapterId: "sandbox-v1", gates: passingGates, now: "2026-08-06T12:10:00.000Z", expiresAt: "2026-08-06T13:10:00.000Z" });
  assert(allowed.allowed, "Every sandbox gate explicitly passing must authorize.");
  for (const signal of ["MISSING", "UNKNOWN", "STALE", "CONFLICT", "ERROR", "FAIL"] as const) {
    const denied = authorizeDispatch({ environment: "sandbox", caseId: base.caseId, package: pkg, consent, recipient, adapterId: "sandbox-v1", gates: { ...passingGates, observability: signal }, now: "2026-08-06T12:10:00.000Z", expiresAt: "2026-08-06T13:10:00.000Z" });
    assert(!denied.allowed, `${signal} authorization evidence must deny dispatch.`);
  }
  const production = authorizeDispatch({ environment: "production", caseId: base.caseId, package: pkg, consent, recipient, adapterId: "sandbox-v1", gates: passingGates, now: "2026-08-06T12:10:00.000Z", expiresAt: "2026-08-06T13:10:00.000Z" });
  assert(!production.allowed && production.gateResults.promotion === "FAIL", "Production delivery must remain blocked.");
  const weakRecipient = { ...recipient, verificationLevel: "V1_DOMAIN" as const };
  const weakRecipientDecision = authorizeDispatch({ environment: "sandbox", caseId: base.caseId, package: pkg, consent, recipient: weakRecipient, adapterId: "sandbox-v1", gates: passingGates, now: "2026-08-06T12:10:00.000Z", expiresAt: "2026-08-06T13:10:00.000Z" });
  assert(!weakRecipientDecision.allowed, "V0/V1 recipients must be denied; only active V2/V3 verification can dispatch.");
  expectThrow(() => buildDeterministicPackage({ ...base, sources: [{ ...sources[0], malwareScanStatus: "PENDING" as never }, sources[1]] }), "Uncleared package content must be rejected.");

  const accepted = dispatchWithSandboxAdapter({ authorization: allowed, idempotencyKey: "submission-1", attemptNumber: 1 });
  const duplicate = dispatchWithSandboxAdapter({ authorization: allowed, idempotencyKey: "submission-1", attemptNumber: 1 });
  assert(accepted.providerReference === duplicate.providerReference, "Sandbox delivery must be idempotent.");
  const unknown = dispatchWithSandboxAdapter({ authorization: allowed, idempotencyKey: "submission-2", attemptNumber: 1, simulate: "unknown" });
  assert(unknown.status === "UNKNOWN" && !unknown.retryable && unknown.reconciliationRequired, "Unknown delivery must never resend and must open reconciliation.");
  expectThrow(() => dispatchWithSandboxAdapter({ authorization: allowed, idempotencyKey: "submission-3", attemptNumber: 6 }), "More than five attempts must be rejected.");
  assert(dispatchWithSandboxAdapter({ authorization: allowed, idempotencyKey: "submission-4", attemptNumber: 1, simulate: "timeout_before_acceptance" }).retryable, "A timeout proven before acceptance may retry.");
  assert(dispatchWithSandboxAdapter({ authorization: allowed, idempotencyKey: "submission-5", attemptNumber: 1, simulate: "timeout_after_acceptance" }).reconciliationRequired, "A timeout after possible acceptance must reconcile without retry.");
  assert(retryDelayMs(2, "submission-4") > retryDelayMs(1, "submission-4"), "Retry backoff with deterministic jitter must increase.");
  assert(replayDeliveryTruth(["ATTEMPTED", "PROVIDER_ACCEPTED", "DELIVERED"]) === "DELIVERED", "Replay must preserve the strongest proven delivery truth.");
  assert(replayDeliveryTruth(["PROVIDER_ACCEPTED", "UNKNOWN"]) === "UNKNOWN", "Unknown truth must dominate until reconciled.");

  assert(moduleManifests.some((entry) => entry.id === "lender-submission" && entry.productionBlocked), "Governed lender-submission module must be registered and production-blocked.");
  assert(eventContractRegistry.some((entry) => entry.eventType === "lender.submission.package.frozen" && entry.replayRequired), "Package freeze event must be replayable.");
  for (const file of ["docs/doctrine/CANON_LENDER_SUBMISSION_001.md", "docs/TECH_LENDER_DELIVERY_001.md", "docs/runbooks/OPS_LENDER_SUBMISSION_001.md", "src/lib/db/migrations/0045_lender_submission_governance.sql"]) assert(fs.existsSync(path.join(process.cwd(), file)), `${file} must exist.`);
  console.log(`PASS lender submission ${mode}: deterministic package, exact consent, verified recipient, fail-closed authorization, sandbox delivery, retry/reconciliation, replay, and production block.`);
}

main();
