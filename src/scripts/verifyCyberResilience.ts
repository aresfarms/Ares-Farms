/**
 * verify:cyber-resilience — proves the Security & Cyber Resilience Foundation:
 * the frameworks exist and are correct, the FIVE production blockers all hold,
 * and production CANNOT pass while backup, DNS, secrets, forensics, or recovery
 * certification are unverified. Read-only; no live actions; touches a git-ignored
 * test ledger only.
 */

import { recoveryFrameworkInvariants, evaluateTransition, RECOVERY_STATES, CYBER_SCENARIOS } from "@/security/securityRecoveryFramework";
import { immutableBackupVerified, backupGovernanceStatus, BACKUP_TIERS } from "@/security/backupGovernance";
import { recoveryCertificationValid, recoveryCertificationStatus } from "@/security/recoveryCertification";
import { dnsGovernanceVerified, productionDnsCutoverAllowed, dnsGovernanceStatus } from "@/security/dnsGovernance";
import { secretsGovernanceVerified, secretRiskDashboard } from "@/security/secretsGovernance";
import { forensicReadinessVerified, openForensicCase, verifyForensicSeal } from "@/security/forensicPreservation";
import { evaluateUnderLockdown, lockdownInvariants, LOCKDOWN_DENIED, LOCKDOWN_ALLOWED } from "@/security/securityLockdownRuntime";
import { rebuildOrderValid, ASSUMED_LOSS } from "@/security/cloudRecoveryManifest";
import { drillReadiness, DRILL_SCENARIOS, simulateDrill } from "@/security/securityDrillFramework";
import {
  securityResilienceDashboard, productionReady, openResilienceBlockers, resilienceProductionBlockers, RESILIENCE_BLOCKERS,
} from "@/security/securityResilienceDashboard";
import { productionDnsCutoverAllowed as domainCutover } from "@/security/domainSecurityVerification";
import { SECURITY_CONTROLS, securityHardeningStatus } from "@/security/securityHardeningManifest";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// ── SECURITY-DR-001 ───────────────────────────────────────────────────────────
ok(RECOVERY_STATES.length === 8 && CYBER_SCENARIOS.length === 5, "8 recovery states + 5 cyber scenarios");
ok(recoveryFrameworkInvariants().ok, `recovery framework invariants — ${recoveryFrameworkInvariants().findings.join("; ")}`);
ok(evaluateTransition({ from: "NORMAL", to: "RECOVERY", operatorId: "op", rationale: "x" }).ok === false, "illegal transition NORMAL→RECOVERY rejected");
ok(evaluateTransition({ from: "RECOVERY", to: "RETURN_TO_SERVICE", operatorId: "op", rationale: "x" }).ok === false, "cannot RETURN_TO_SERVICE without REVALIDATION");
ok(evaluateTransition({ from: "REVALIDATION", to: "RETURN_TO_SERVICE", operatorId: "op", rationale: "validated" }).ok === true, "REVALIDATION→RETURN_TO_SERVICE allowed");
ok(evaluateTransition({ from: "REVALIDATION", to: "RETURN_TO_SERVICE", operatorId: "", rationale: "" }).ok === false, "transition needs operator + rationale (audit)");

// ── IMMUTABLE-BACKUP-001 ──────────────────────────────────────────────────────
ok(Object.keys(BACKUP_TIERS).length === 4, "4 backup tiers (A–D)");
ok(immutableBackupVerified() === false, "SEC-BACKUP: immutable backup NOT verified by default (production blocked)");
ok(backupGovernanceStatus().immutableTierCount >= 1, "at least one Tier C immutable vault defined");

// ── RECOVERY-CERT-001 ─────────────────────────────────────────────────────────
ok(recoveryCertificationValid() === false, "recovery certification invalid by default (missing) → blocks production");
ok(recoveryCertificationStatus().reason === "missing", "recovery cert status reports 'missing'");

// ── DNS-GOV-001 (extends, never weakens) ─────────────────────────────────────
ok(dnsGovernanceVerified() === false, "DNS governance NOT verified by default");
ok(productionDnsCutoverAllowed() === false, "SEC-DNS: production DNS cutover BLOCKED");
// composition: the DNS gate can only be MORE restrictive than the existing domain gate.
ok(!(productionDnsCutoverAllowed() === true && domainCutover() === false), "DNS-GOV cutover never looser than the existing domain gate (no weakening)");
ok(dnsGovernanceStatus().domains.length >= 2, "DNS governance covers the institutional domains");

// ── SECRET-GOV-001 ────────────────────────────────────────────────────────────
ok(secretsGovernanceVerified() === false, "SEC-SECRET: secrets governance NOT verified by default");
ok(secretRiskDashboard().overdueOrUnknown > 0, "Secret Risk Dashboard flags overdue/unknown rotations");
ok(secretRiskDashboard().serviceAccounts.length >= 3, "service-account inventory present");

// ── FORENSICS-001 ─────────────────────────────────────────────────────────────
ok(forensicReadinessVerified() === false, "SEC-FORENSICS: forensic readiness NOT fully wired by default");
const fcase = openForensicCase({ caseId: "FC-1", ts: "2026-06-11T00:00:00Z", scenario: "ransomware", actor: "ir-lead", evidence: [{ class: "audit-logs", ref: "audit-ledger.ndjson", sha256: "abc" }] });
ok(!!fcase.forensic_case_id && fcase.evidence_hash.startsWith("sha256:") && fcase.chain_of_custody.length >= 2, "forensic case has id + evidence_hash + chain_of_custody");
ok(verifyForensicSeal(fcase) === true, "forensic seal verifies");
const tampered = { ...fcase, evidence: [{ class: "audit-logs" as const, ref: "audit-ledger.ndjson", sha256: "DIFFERENT" }] };
ok(verifyForensicSeal(tampered) === false, "forensic seal DETECTS a tampered evidence manifest");

// ── SECURITY-LOCKDOWN-001 ─────────────────────────────────────────────────────
ok(lockdownInvariants().ok, `lockdown invariants — ${lockdownInvariants().findings.join("; ")}`);
for (const a of LOCKDOWN_DENIED) ok(evaluateUnderLockdown(a, "SECURITY_LOCKDOWN").allowed === false, `lockdown DENIES ${a}`);
for (const a of LOCKDOWN_ALLOWED) ok(evaluateUnderLockdown(a, "SECURITY_LOCKDOWN").allowed === true, `lockdown ALLOWS ${a} (read/forensic/recovery)`);
ok(evaluateUnderLockdown("deployment", "NORMAL").allowed === true, "normal mode does not block deployments");

// ── CLOUD-RECOVERY-001 ────────────────────────────────────────────────────────
ok(rebuildOrderValid().ok, `cloud rebuild order valid — ${rebuildOrderValid().findings.join("; ")}`);
ok(ASSUMED_LOSS.length === 5, "rebuild manifest assumes the 5-way simultaneous loss");

// ── SECURITY-DRILLS-001 ───────────────────────────────────────────────────────
ok(DRILL_SCENARIOS.length === 6, "6 drill scenarios");
ok(drillReadiness().lockdownPostureReady === true, "lockdown-deny posture holds now (wired)");
ok(drillReadiness().fullPostureReady === false, "full drill posture NOT ready until gates verified");
ok(simulateDrill("ransomware").postureReady === false, "ransomware drill not ready (no immutable backup/cert yet)");

// ── CYBER-RESILIENCE-DASHBOARD + the production gate ─────────────────────────
const dash = securityResilienceDashboard();
ok(dash.panels.length === 8, "dashboard shows the 8 resilience panels");
ok(RESILIENCE_BLOCKERS.length === 5, "five production blockers defined");
ok(productionReady() === false, "PRODUCTION GATE: production_ready=false (blockers open + no human review)");
// THE CORE PROOF: every one of the five blockers is OPEN while its control is unverified.
const open = openResilienceBlockers();
for (const id of ["SEC-DR-001", "SEC-BACKUP-001", "SEC-DNS-001", "SEC-SECRET-001", "SEC-FORENSICS-001"] as const)
  ok(open.includes(id), `${id} is OPEN until its control is verified (blocks production)`);
ok(resilienceProductionBlockers().every((b) => b.open), "ALL resilience blockers open by default");
ok(dash.cyber_resilience_score < 80, `cyber resilience score honest/low until verified (got ${dash.cyber_resilience_score})`);

// ── does NOT weaken existing FortKnox / domain governance ────────────────────
const ids = new Set(SECURITY_CONTROLS.map((c) => c.id));
for (const keep of ["B-deny-anon", "C-no-single-compromise", "J-hash-chain", "O-domain-registry"])
  ok(ids.has(keep), `existing control ${keep} still present (not weakened)`);
ok(securityHardeningStatus().gate === "ALPHA_PENDING", "security gate remains ALPHA_PENDING");
ok(SECURITY_CONTROLS.filter((c) => c.group === "P").length === 10, "10 cyber-resilience controls registered (group P)");

// ── report ────────────────────────────────────────────────────────────────────
console.log(`verify:cyber-resilience — score=${dash.cyber_resilience_score}/100 · production_ready=${dash.production_ready} · open blockers=${open.join(", ")}`);
if (fail.length) {
  console.error(`\n✗  verify:cyber-resilience FAIL — ${fail.length}:`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log(
  "\n✓  verify:cyber-resilience PASS — SECURITY-DR/BACKUP/RECOVERY-CERT/DNS/SECRET/FORENSICS/LOCKDOWN/CLOUD-RECOVERY/DRILLS/DASHBOARD in place; " +
    "forensic seal detects tamper; lockdown denies deploy/promote/connector/sync/admin and allows only audit/forensic/recovery; " +
    "and production_ready=false with ALL FIVE blockers OPEN while backup, DNS, secrets, forensics, and recovery certification are unverified. " +
    "Existing FortKnox + domain governance intact. No live production.",
);
process.exit(0);
