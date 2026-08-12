/**
 * SECURITY-DR-001 — Cyber Recovery Framework (governance only; no live actions).
 *
 * The institutional state machine for responding to a cyber event. It defines
 * the recovery states, the legal transitions between them, and the threat
 * scenarios each state covers. This module DECIDES NOTHING on its own — it is the
 * doctrine + transition guard a human operator drives during an incident, and
 * the substrate the resilience dashboard reads. Default state is NORMAL.
 *
 * Master Volume traceability: Vol IV (Operational Runbooks), Vol III-B
 * (Governance Runtime), TECH-LEDGER-001 (every transition is audit-logged),
 * TECH-REPLAY-001 (transitions are reconstructable). Composes with the FortKnox
 * incident runbook (securityIncidentRunbook) — it does not replace it.
 */

export const SECURITY_DR_DOCTRINE_ID = "SECURITY-DR-001";
export const SECURITY_DR_VERSION = "security-recovery-framework-v0.1.0";

export type RecoveryState =
  | "NORMAL"
  | "SECURITY_ALERT"
  | "CONTAINMENT"
  | "LOCKDOWN"
  | "FORENSIC"
  | "RECOVERY"
  | "REVALIDATION"
  | "RETURN_TO_SERVICE";

export const RECOVERY_STATES: RecoveryState[] = [
  "NORMAL", "SECURITY_ALERT", "CONTAINMENT", "LOCKDOWN",
  "FORENSIC", "RECOVERY", "REVALIDATION", "RETURN_TO_SERVICE",
];

/** The cyber scenarios this framework is designed to carry. */
export type CyberScenario =
  | "ransomware"
  | "extortion"
  | "cloud-account-compromise"
  | "insider-compromise"
  | "infrastructure-destruction";

export const CYBER_SCENARIOS: CyberScenario[] = [
  "ransomware", "extortion", "cloud-account-compromise", "insider-compromise", "infrastructure-destruction",
];

/**
 * Legal forward transitions. Escalation to LOCKDOWN / FORENSIC is reachable from
 * any active-incident state; RETURN_TO_SERVICE requires passing REVALIDATION.
 * (You can always drop back to NORMAL only AFTER return-to-service, never as a
 * shortcut around revalidation.)
 */
const TRANSITIONS: Record<RecoveryState, RecoveryState[]> = {
  NORMAL: ["SECURITY_ALERT"],
  SECURITY_ALERT: ["CONTAINMENT", "LOCKDOWN", "NORMAL"],
  CONTAINMENT: ["LOCKDOWN", "FORENSIC", "RECOVERY"],
  LOCKDOWN: ["FORENSIC", "CONTAINMENT"],
  FORENSIC: ["RECOVERY"],
  RECOVERY: ["REVALIDATION"],
  REVALIDATION: ["RETURN_TO_SERVICE", "RECOVERY"], // failed revalidation → back to recovery
  RETURN_TO_SERVICE: ["NORMAL"],
};

/** Each scenario's recommended entry path (advisory — the human drives it). */
export const SCENARIO_PLAYBOOK: Record<CyberScenario, { mustReach: RecoveryState[]; note: string }> = {
  ransomware: { mustReach: ["LOCKDOWN", "FORENSIC", "RECOVERY", "REVALIDATION"], note: "Isolate, preserve evidence, restore from an IMMUTABLE backup (never pay), revalidate before return." },
  extortion: { mustReach: ["CONTAINMENT", "FORENSIC"], note: "Preserve evidence + engage counsel/law enforcement; never act on the attacker's instructions." },
  "cloud-account-compromise": { mustReach: ["LOCKDOWN", "FORENSIC", "RECOVERY"], note: "Revoke sessions/keys, rotate secrets, rebuild from the cloud-recovery manifest." },
  "insider-compromise": { mustReach: ["CONTAINMENT", "FORENSIC"], note: "Revoke the actor's access under multi-party control; preserve their action trail." },
  "infrastructure-destruction": { mustReach: ["RECOVERY", "REVALIDATION"], note: "Rebuild from immutable backups + the cloud-recovery manifest; revalidate integrity." },
};

export function canTransition(from: RecoveryState, to: RecoveryState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export interface TransitionRequest {
  from: RecoveryState;
  to: RecoveryState;
  scenario?: CyberScenario;
  operatorId: string;
  rationale: string;
}
export interface TransitionVerdict {
  ok: boolean;
  reasons: string[];
}

/** Guard a state transition (no state is mutated here — caller persists + logs). */
export function evaluateTransition(req: TransitionRequest): TransitionVerdict {
  const reasons: string[] = [];
  if (!RECOVERY_STATES.includes(req.from)) reasons.push(`unknown from-state ${req.from}`);
  if (!RECOVERY_STATES.includes(req.to)) reasons.push(`unknown to-state ${req.to}`);
  if (!canTransition(req.from, req.to)) reasons.push(`illegal transition ${req.from} → ${req.to}`);
  if (!req.operatorId || !req.rationale?.trim()) reasons.push("operator + rationale required (audit)");
  // RETURN_TO_SERVICE is the one-way valve out of an incident — it must come
  // through REVALIDATION, never directly.
  if (req.to === "RETURN_TO_SERVICE" && req.from !== "REVALIDATION") reasons.push("RETURN_TO_SERVICE requires passing REVALIDATION first");
  return { ok: reasons.length === 0, reasons };
}

/** The current institutional recovery state. Default NORMAL; flipped only by a human. */
export const CURRENT_RECOVERY_STATE: RecoveryState = "NORMAL";

/** Whole-set invariants the verifier asserts. */
export function recoveryFrameworkInvariants(): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  if (RECOVERY_STATES.length !== 8) findings.push("must define exactly 8 recovery states");
  if (CYBER_SCENARIOS.length !== 5) findings.push("must cover 5 cyber scenarios");
  // No transition may skip REVALIDATION on the way to RETURN_TO_SERVICE.
  for (const s of RECOVERY_STATES) {
    if (s !== "REVALIDATION" && TRANSITIONS[s].includes("RETURN_TO_SERVICE")) {
      findings.push(`${s} must not jump straight to RETURN_TO_SERVICE (revalidation gate)`);
    }
  }
  return { ok: findings.length === 0, findings };
}
