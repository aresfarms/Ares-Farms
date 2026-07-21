/**
 * Security Dashboard Status — single read-only view (control M).
 *
 * Aggregates MFA posture, scans, backups, ledger integrity, replay verification,
 * secret rotation, last restore test, and pen-test readiness into one status
 * object an operator surface can render. Honest: anything not actually wired
 * reads its real status (stub/partial/pending), never a green it hasn't earned.
 */

import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { securityHardeningStatus, SECURITY_HARDENING_GOVERNANCE } from "./securityHardeningManifest";
import { verifyLedgerChain } from "@/lib/security/ledgerHashChain";
import { readIncidentState } from "./securityIncidentRunbook";
import { domainDashboardPanel, type ControlLight } from "./domainSecurityVerification";
import { securityResilienceDashboard } from "./securityResilienceDashboard";

export type Light = "green" | "amber" | "red";
export interface DashboardLine { key: string; light: Light; detail: string }

/** Domain panel uses PASS/PENDING/PARTIAL/FAIL/N-A — map to the dashboard light. */
function lightFor(status: ControlLight): Light {
  if (status === "PASS") return "green";
  if (status === "FAIL") return "red";
  if (status === "N/A") return "green";
  return "amber"; // PENDING / PARTIAL — not earned yet
}

export function securityDashboard(): {
  gate: string;
  lines: DashboardLine[];
  counts: ReturnType<typeof securityHardeningStatus>["counts"];
  incident: ReturnType<typeof readIncidentState>;
  domains: ReturnType<typeof domainDashboardPanel>;
  resilience: ReturnType<typeof securityResilienceDashboard>;
} {
  const status = securityHardeningStatus();
  const chain = verifyLedgerChain(canonicalLandRegisterAuthority.path);
  const incident = readIncidentState();
  const domains = domainDashboardPanel();
  const resilience = securityResilienceDashboard();

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
    // Domain Asset Governance panel (DOMAIN-ASSET-001).
    ...domains.lines.map((l) => ({ key: `Domain · ${l.key}`, light: lightFor(l.status), detail: l.detail })),
    { key: "Domain · Last review date", light: domains.lastReviewDate ? "green" as Light : "amber" as Light, detail: domains.lastReviewDate ?? "no founder domain review recorded yet" },
    // Cyber Resilience panel (CYBER-RESILIENCE-DASHBOARD).
    ...resilience.panels.map((p) => ({ key: `Resilience · ${p.key}`, light: (p.status === "ready" ? "green" : p.status === "partial" ? "amber" : "red") as Light, detail: p.detail })),
    { key: "Resilience · Score", light: (resilience.cyber_resilience_score >= 80 ? "green" : resilience.cyber_resilience_score >= 40 ? "amber" : "red") as Light, detail: `Cyber Resilience Score ${resilience.cyber_resilience_score}/100 · production_ready=${resilience.production_ready} · open blockers: ${resilience.openBlockers.join(", ") || "none"}` },
  ];

  return { gate: SECURITY_HARDENING_GOVERNANCE, lines, counts: status.counts, incident, domains, resilience };
}
