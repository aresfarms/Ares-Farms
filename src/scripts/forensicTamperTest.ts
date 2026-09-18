/**
 * SEC-FORENSICS-001 tamper test (evidence only — closes nothing).
 *
 * Exercises the forensic seal by hand per the go-live plan's "no-infra, do
 * anytime" item: open + seal a case, verify the intact seal holds, then alter
 * the evidence (a content hash, a ref, the manifest) and confirm the seal
 * DETECTS the tamper. Also confirms case_id / evidence_hash / chain_of_custody
 * are present. This is software evidence that the seal works; the counsel
 * evidentiary review that actually CLOSES the blocker is separate.
 */
import { openForensicCase, verifyForensicSeal, type ForensicCase } from "@/security/forensicPreservation";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) fail.push(m); };

const base = openForensicCase({
  caseId: "FC-TAMPER-TEST-0001",
  ts: "2026-06-14T00:00:00.000Z",
  scenario: "tamper-test",
  actor: "platform-security",
  evidence: [
    { class: "audit-logs", ref: "ledger:audit:abc", sha256: "a".repeat(64) },
    { class: "security-events", ref: "ledger:event:def", sha256: "b".repeat(64) },
  ],
});

// Structure present.
ok(!!base.forensic_case_id, "case carries case_id");
ok(base.evidence_hash.startsWith("sha256:"), "case carries evidence_hash (the seal)");
ok(base.chain_of_custody.length >= 2 && base.chain_of_custody.some((e) => e.action === "sealed"),
  "chain_of_custody recorded (opened + sealed)");

// Intact seal verifies.
ok(verifyForensicSeal(base) === true, "intact seal verifies (no tamper)");

// Tamper 1 — alter an evidence content hash.
const t1: ForensicCase = { ...base, evidence: base.evidence.map((e, i) => i === 0 ? { ...e, sha256: "c".repeat(64) } : e) };
ok(verifyForensicSeal(t1) === false, "TAMPER DETECTED: altered evidence content hash breaks the seal");

// Tamper 2 — alter an evidence ref.
const t2: ForensicCase = { ...base, evidence: base.evidence.map((e, i) => i === 1 ? { ...e, ref: "ledger:event:HACKED" } : e) };
ok(verifyForensicSeal(t2) === false, "TAMPER DETECTED: altered evidence ref breaks the seal");

// Tamper 3 — add an evidence item (manifest grows).
const t3: ForensicCase = { ...base, evidence: [...base.evidence, { class: "security-events", ref: "ledger:event:ghost", sha256: "d".repeat(64) }] };
ok(verifyForensicSeal(t3) === false, "TAMPER DETECTED: injected evidence item breaks the seal");

// Tamper 4 — swap the scenario (context binding).
const t4: ForensicCase = { ...base, scenario: "different-scenario" };
ok(verifyForensicSeal(t4) === false, "TAMPER DETECTED: altered scenario breaks the seal");

// Non-tamper — reordering evidence must NOT break the seal (manifest is sorted).
const t5: ForensicCase = { ...base, evidence: [...base.evidence].reverse() };
ok(verifyForensicSeal(t5) === true, "stable: reordering evidence does NOT false-trigger (sorted manifest)");

if (fail.length) { console.error(`\n✗ forensic tamper test FAIL — ${fail.length}`); process.exit(1); }
console.log("\n✓ SEC-FORENSICS-001 tamper test PASS — seal detects content/ref/injection/scenario tamper; case_id + evidence_hash + chain_of_custody present. EVIDENCE ONLY — counsel evidentiary review still required to close the blocker.");
process.exit(0);
