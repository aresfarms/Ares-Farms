/**
 * SECURITY-DRILLS-001 — Security drill framework (governance only; simulation).
 *
 * Defines the cyber drill scenarios and the drill record contract, and provides
 * deterministic POSTURE simulations that exercise the real governance gates from
 * the other modules — a drill "passes" when the system is correctly postured
 * (the protective control is engaged / blocking as designed). No live action is
 * taken; drills read gates, they don't trip them.
 *
 * Master Volume traceability: Vol IV (runbooks/drills), Vol III-B (runtime).
 */

import { immutableBackupVerified } from "./backupGovernance";
import { recoveryCertificationValid } from "./recoveryCertification";
import { secretsGovernanceVerified } from "./secretsGovernance";
import { dnsGovernanceVerified, productionDnsCutoverAllowed } from "./dnsGovernance";
import { forensicReadinessVerified } from "./forensicPreservation";
import { evaluateUnderLockdown } from "./securityLockdownRuntime";
import { rebuildOrderValid } from "./cloudRecoveryManifest";

export const SECURITY_DRILLS_DOCTRINE_ID = "SECURITY-DRILLS-001";
export const SECURITY_DRILLS_VERSION = "security-drill-framework-v0.1.0";

export type DrillScenario =
  | "ransomware"
  | "database-destruction"
  | "dns-takeover"
  | "credential-theft"
  | "cloud-account-compromise"
  | "insider-threat";

export const DRILL_SCENARIOS: DrillScenario[] = [
  "ransomware", "database-destruction", "dns-takeover", "credential-theft", "cloud-account-compromise", "insider-threat",
];

export type DrillResult = "not-run" | "pass" | "fail";

export interface DrillRecord {
  drill_id: string;
  scenario: DrillScenario;
  date: string | null;
  result: DrillResult;
  lessons_learned: string[];
  remediation_items: string[];
}

/** Seeded — every drill scheduled but NOT YET RUN. A human records real runs. */
export const DRILL_REGISTRY: DrillRecord[] = DRILL_SCENARIOS.map((s) => ({
  drill_id: `drill-${s}`,
  scenario: s,
  date: null,
  result: "not-run",
  lessons_learned: [],
  remediation_items: [],
}));

/**
 * Simulate the POSTURE for a scenario: returns whether the protective controls
 * are correctly engaged (the recovery floor exists, or the dangerous action is
 * blocked). This is read-only and deterministic.
 */
export function simulateDrill(scenario: DrillScenario): { scenario: DrillScenario; postureReady: boolean; checks: { name: string; ok: boolean }[] } {
  const checks: { name: string; ok: boolean }[] = [];
  switch (scenario) {
    case "ransomware":
      checks.push({ name: "immutable backup is the recovery floor", ok: immutableBackupVerified() });
      checks.push({ name: "recovery certification valid", ok: recoveryCertificationValid() });
      checks.push({ name: "forensic preservation ready", ok: forensicReadinessVerified() });
      break;
    case "database-destruction":
      checks.push({ name: "immutable backup verified", ok: immutableBackupVerified() });
      checks.push({ name: "rebuild order valid", ok: rebuildOrderValid().ok });
      break;
    case "dns-takeover":
      checks.push({ name: "DNS governance verified", ok: dnsGovernanceVerified() });
      checks.push({ name: "production DNS cutover still BLOCKED until verified", ok: productionDnsCutoverAllowed() === false || dnsGovernanceVerified() });
      break;
    case "credential-theft":
      checks.push({ name: "secrets governance verified (vault-backed + rotation)", ok: secretsGovernanceVerified() });
      checks.push({ name: "lockdown denies external sync", ok: evaluateUnderLockdown("external-sync", "SECURITY_LOCKDOWN").allowed === false });
      break;
    case "cloud-account-compromise":
      checks.push({ name: "rebuild order valid", ok: rebuildOrderValid().ok });
      checks.push({ name: "lockdown denies deployments", ok: evaluateUnderLockdown("deployment", "SECURITY_LOCKDOWN").allowed === false });
      checks.push({ name: "forensic preservation ready", ok: forensicReadinessVerified() });
      break;
    case "insider-threat":
      checks.push({ name: "lockdown denies admin mutations", ok: evaluateUnderLockdown("admin-mutation", "SECURITY_LOCKDOWN").allowed === false });
      checks.push({ name: "forensic preservation ready", ok: forensicReadinessVerified() });
      break;
  }
  return { scenario, postureReady: checks.every((c) => c.ok), checks };
}

/** All drill postures (used by the resilience dashboard + verify). */
export function drillReadiness() {
  const sims = DRILL_SCENARIOS.map(simulateDrill);
  // The lockdown-blocking posture should ALWAYS hold even pre-production (the
  // deny policy is wired now); the verify asserts those specific checks.
  const lockdownChecksReady = sims
    .flatMap((s) => s.checks)
    .filter((c) => /lockdown denies/.test(c.name))
    .every((c) => c.ok);
  return {
    doctrine: SECURITY_DRILLS_DOCTRINE_ID,
    scenarios: DRILL_SCENARIOS.length,
    drillsRun: DRILL_REGISTRY.filter((d) => d.result !== "not-run").length,
    lockdownPostureReady: lockdownChecksReady,
    fullPostureReady: sims.every((s) => s.postureReady),
    perScenario: sims.map((s) => ({ scenario: s.scenario, postureReady: s.postureReady })),
  };
}
