/**
 * Security Dashboard Status — single read-only view (control M).
 *
 * Aggregates MFA posture, scans, backups, ledger integrity, replay verification,
 * secret rotation, last restore test, and pen-test readiness into one status
 * object an operator surface can render. Honest: anything not actually wired
 * reads its real status (stub/partial/pending), never a green it hasn't earned.
 */

import { securityHardeningStatus, SECURITY_HARDENING_GOVERNANCE } from "./securityHardeningManifest";
import { verifyLedgerChain } from "@/lib/security/ledgerHashChain";
import { readIncidentState } from "./securityIncidentRunbook";
import { AUDIT_LEDGER_PATH } from "@/lib/property/auditLedger";

export type Light = "green" | "amber" | "red";
export interface DashboardLine { key: string; light: Light; detail: string }

export function securityDashboard(): {
  gate: string;
  lines: DashboardLine[];
  counts: ReturnType<typeof securityHardeningStatus>["counts"];
  incident: ReturnType<typeof readIncidentState>;
} {
  const status = securityHardeningStatus();
  const chain = verifyLedgerChain(AUDIT_LEDGER_PATH);
  const incident = readIncidentState();

  const lines: DashboardLine[] = [
    { key: "Operator MFA", light: process.env.OPERATOR_MFA_ENFORCED === "true" ? "green" : "amber", detail: process.env.OPERATOR_MFA_ENFORCED === "true" ? "enforced" : "IdP/IAP wiring pending (Phase 4)" },
    { key: "Secret scanning", light: "green", detail: "CI gitleaks + verify:secret-scan" },
    { key: "Dependency/SCA", light: "green", detail: "npm audit (high) in CI" },
    { key: "SBOM", light: "green", detail: "CycloneDX artifact in CI" },
    { key: "Ledger integrity (audit)", light: chain.ok ? "green" : "red", detail: chain.ok ? `chain verified (${chain.chained} chained, ${chain.legacy} legacy)` : `BROKEN at line ${chain.brokenAt}` },
    { key: "Replay verification", light: "amber", detail: "endpoint behind API perimeter; deny-log guard pending" },
    { key: "Secret rotation", light: "amber", detail: "procedure documented; Secret Manager (GCP) pending" },
    { key: "Backups / last restore test", light: "amber", detail: "Cloud SQL PITR planned; restore-test drill pending (no DB yet)" },
    { key: "Treasury freeze", light: incident.treasuryFrozen ? "red" : "green", detail: incident.treasuryFrozen ? "FROZEN (incident active)" : "available, not engaged" },
    { key: "Forensic lockdown", light: incident.forensicLockdown ? "red" : "green", detail: incident.forensicLockdown ? "ENGAGED" : "available, not engaged" },
    { key: "Pen-test readiness", light: "red", detail: "checklist ready; third-party pentest NOT scheduled — production blocked" },
  ];

  return { gate: SECURITY_HARDENING_GOVERNANCE, lines, counts: status.counts, incident };
}
