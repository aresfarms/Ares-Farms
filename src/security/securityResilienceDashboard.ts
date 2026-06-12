/**
 * CYBER-RESILIENCE-DASHBOARD — the single read-only resilience view + the
 * production gate for the Security & Cyber Resilience Foundation.
 *
 * Aggregates the eight module statuses into one dashboard, computes an overall
 * Cyber Resilience Score, and owns the FIVE production blockers. ANY failed
 * blocker sets production_ready=false. Honest by construction: every underlying
 * control defaults to unverified, so production_ready is false until a human
 * verifies backups, DNS, secrets, forensics, and recovery — and records review.
 *
 * Does NOT weaken the existing FortKnox / domain governance — it composes with
 * them. No live production actions.
 */

import { recoveryFrameworkInvariants, RECOVERY_STATES } from "./securityRecoveryFramework";
import { backupGovernanceStatus, immutableBackupVerified } from "./backupGovernance";
import { recoveryCertificationStatus, recoveryCertificationValid } from "./recoveryCertification";
import { dnsGovernanceStatus, dnsGovernanceVerified } from "./dnsGovernance";
import { secretRiskDashboard, secretsGovernanceVerified } from "./secretsGovernance";
import { forensicReadinessStatus, forensicReadinessVerified } from "./forensicPreservation";
import { cloudRecoveryStatus, rebuildOrderValid } from "./cloudRecoveryManifest";
import { drillReadiness } from "./securityDrillFramework";
import { lockdownStatus } from "./securityLockdownRuntime";

export const CYBER_RESILIENCE_DOCTRINE_ID = "CYBER-RESILIENCE-DASHBOARD";
export const CYBER_RESILIENCE_VERSION = "security-resilience-dashboard-v0.1.0";

/** Human attestation that the cyber-resilience review occurred. Set ONLY by a human. */
export const CYBER_RESILIENCE_HUMAN_REVIEW_COMPLETE = false;

export type ResilienceBlocker =
  | "SEC-DR-001"
  | "SEC-BACKUP-001"
  | "SEC-DNS-001"
  | "SEC-SECRET-001"
  | "SEC-FORENSICS-001";

export const RESILIENCE_BLOCKERS: ResilienceBlocker[] = [
  "SEC-DR-001", "SEC-BACKUP-001", "SEC-DNS-001", "SEC-SECRET-001", "SEC-FORENSICS-001",
];

/** Each blocker is SATISFIED only when its control(s) are verified. */
function blockerSatisfied(id: ResilienceBlocker): boolean {
  switch (id) {
    // DR readiness = framework intact + a VALID (present, unexpired, sim-backed) recovery certification.
    case "SEC-DR-001": return recoveryFrameworkInvariants().ok && recoveryCertificationValid();
    case "SEC-BACKUP-001": return immutableBackupVerified();
    case "SEC-DNS-001": return dnsGovernanceVerified();
    case "SEC-SECRET-001": return secretsGovernanceVerified();
    case "SEC-FORENSICS-001": return forensicReadinessVerified();
  }
}

export function resilienceProductionBlockers(): { id: ResilienceBlocker; open: boolean }[] {
  return RESILIENCE_BLOCKERS.map((id) => ({ id, open: !blockerSatisfied(id) }));
}
export function openResilienceBlockers(): ResilienceBlocker[] {
  return resilienceProductionBlockers().filter((b) => b.open).map((b) => b.id);
}

/**
 * production_ready is true ONLY when every blocker is satisfied AND a human
 * review is recorded. Any failed blocker → false.
 */
export function productionReady(): boolean {
  return openResilienceBlockers().length === 0 && CYBER_RESILIENCE_HUMAN_REVIEW_COMPLETE;
}

export type PanelStatus = "ready" | "partial" | "blocked";
export interface ResiliencePanel { key: string; status: PanelStatus; detail: string }

function panel(key: string, ready: boolean, partial: boolean, detail: string): ResiliencePanel {
  return { key, status: ready ? "ready" : partial ? "partial" : "blocked", detail };
}

/** The eight-panel cyber-resilience dashboard + overall score. */
export function securityResilienceDashboard() {
  const backup = backupGovernanceStatus();
  const cert = recoveryCertificationStatus();
  const dns = dnsGovernanceStatus();
  const secrets = secretRiskDashboard();
  const forensics = forensicReadinessStatus();
  const cloud = cloudRecoveryStatus();
  const drills = drillReadiness();

  const panels: ResiliencePanel[] = [
    panel("Backup Status", backup.counts.verified > 0, backup.counts.total > 0, `${backup.counts.verified}/${backup.counts.total} backups verified`),
    panel("Immutable Vault Status", backup.immutableBackupVerified, backup.immutableTierCount > 0, backup.immutableBackupVerified ? "Tier C immutable vault verified + restore-tested" : `${backup.immutableTierCount} Tier C vault(s) defined; verification pending`),
    panel("Recovery Certification", cert.valid, !!cert.certification_date, cert.valid ? `certified (score ${cert.recovery_score})` : `${cert.reason} — ${cert.simulationsPassed}/${cert.simulationsTotal} sims passed`),
    panel("Secret Rotation Health", secrets.verified, secrets.secrets.length > 0, secrets.verified ? "all secrets vault-backed + rotation current" : `${secrets.overdueOrUnknown} secret(s) overdue/unknown; hardcoded-scan attested=${secrets.noHardcodedSecretsAttested}`),
    panel("DNS Governance Health", dns.verified, dns.domains.length > 0, dns.verified ? "registrar + DNS controls verified" : `controls pending across ${dns.domains.length} domain(s); cutover allowed=${dns.productionDnsCutoverAllowed}`),
    panel("Forensic Readiness", forensics.verified, forensics.wired > 0, `${forensics.wired}/${forensics.evidenceClasses} evidence classes wired`),
    panel("Cloud Recovery Readiness", false, cloud.orderValid, cloud.orderValid ? `${cloud.steps}-step rebuild plan documented; execution gated on human review` : "rebuild order invalid"),
    panel("Security Drill Readiness", drills.fullPostureReady, drills.lockdownPostureReady, `${drills.drillsRun}/${drills.scenarios} drills run; lockdown posture ready=${drills.lockdownPostureReady}`),
  ];

  const ready = panels.filter((p) => p.status === "ready").length;
  const partial = panels.filter((p) => p.status === "partial").length;
  // Score: ready=full credit, partial=half. Honest — low until controls verified.
  const cyber_resilience_score = Math.round(((ready + partial * 0.5) / panels.length) * 100);

  return {
    doctrine: CYBER_RESILIENCE_DOCTRINE_ID,
    panels,
    cyber_resilience_score,
    blockers: resilienceProductionBlockers(),
    openBlockers: openResilienceBlockers(),
    humanReviewComplete: CYBER_RESILIENCE_HUMAN_REVIEW_COMPLETE,
    production_ready: productionReady(),
    composesWith: { recoveryStates: RECOVERY_STATES.length, lockdown: lockdownStatus().mode, rebuildOrderValid: rebuildOrderValid().ok },
  };
}
