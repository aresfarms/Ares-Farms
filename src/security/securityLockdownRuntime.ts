/**
 * SECURITY-LOCKDOWN-001 — Security lockdown runtime (governance only).
 *
 * Adds the SECURITY_LOCKDOWN runtime mode. When ACTIVE it denies every
 * state-changing / outward-facing action — deployments, promotions, external
 * connectors, external synchronization, admin mutations — and permits ONLY
 * audit, forensics, and read-only recovery. Default mode is NORMAL (lockdown
 * off). Engaging/clearing lockdown is a privileged, multi-party founder action
 * (composes with securityGovernanceVerification) — this module is the deny/allow
 * policy + the audit-safe guard, never an auto-trigger.
 *
 * Master Volume traceability: Vol III-B runtime guard, Vol IV incident runbooks.
 */

export const SECURITY_LOCKDOWN_DOCTRINE_ID = "SECURITY-LOCKDOWN-001";
export const SECURITY_LOCKDOWN_VERSION = "security-lockdown-runtime-v0.1.0";

export type RuntimeSecurityMode = "NORMAL" | "SECURITY_LOCKDOWN";

/** Default mode. Flipped ONLY by a human under multi-party control. */
export const RUNTIME_SECURITY_MODE: RuntimeSecurityMode = "NORMAL";

/** Actions the runtime classifies for the lockdown policy. */
export type GovernedAction =
  | "deployment"
  | "promotion"
  | "external-connector"
  | "external-sync"
  | "admin-mutation"
  | "audit-read"
  | "forensic-collect"
  | "read-only-recovery";

/** Under SECURITY_LOCKDOWN, ONLY these actions are permitted. */
export const LOCKDOWN_ALLOWED: GovernedAction[] = ["audit-read", "forensic-collect", "read-only-recovery"];

/** Actions explicitly DENIED under lockdown (everything state-changing / outward). */
export const LOCKDOWN_DENIED: GovernedAction[] = ["deployment", "promotion", "external-connector", "external-sync", "admin-mutation"];

export interface LockdownDecision {
  allowed: boolean;
  mode: RuntimeSecurityMode;
  reason: string;
}

/**
 * The policy decision for an action in a given mode. Fail-closed: an unknown
 * action under lockdown is DENIED.
 */
export function evaluateUnderLockdown(action: GovernedAction, mode: RuntimeSecurityMode = RUNTIME_SECURITY_MODE): LockdownDecision {
  if (mode !== "SECURITY_LOCKDOWN") return { allowed: true, mode, reason: "normal mode" };
  if (LOCKDOWN_ALLOWED.includes(action)) return { allowed: true, mode, reason: "permitted under lockdown (read/forensic/recovery)" };
  return { allowed: false, mode, reason: "DENIED under SECURITY_LOCKDOWN" };
}

/** Convenience guards for the most consequential actions. */
export const deploymentsAllowed = (mode?: RuntimeSecurityMode) => evaluateUnderLockdown("deployment", mode).allowed;
export const promotionsAllowed = (mode?: RuntimeSecurityMode) => evaluateUnderLockdown("promotion", mode).allowed;
export const externalConnectorsAllowed = (mode?: RuntimeSecurityMode) => evaluateUnderLockdown("external-connector", mode).allowed;
export const externalSyncAllowed = (mode?: RuntimeSecurityMode) => evaluateUnderLockdown("external-sync", mode).allowed;
export const adminMutationsAllowed = (mode?: RuntimeSecurityMode) => evaluateUnderLockdown("admin-mutation", mode).allowed;

export function lockdownStatus() {
  return {
    doctrine: SECURITY_LOCKDOWN_DOCTRINE_ID,
    mode: RUNTIME_SECURITY_MODE,
    active: RUNTIME_SECURITY_MODE === "SECURITY_LOCKDOWN",
    allowedUnderLockdown: LOCKDOWN_ALLOWED,
    deniedUnderLockdown: LOCKDOWN_DENIED,
  };
}

/** Invariants the verifier asserts (deny/allow sets must be disjoint + complete). */
export function lockdownInvariants(): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  const overlap = LOCKDOWN_ALLOWED.filter((a) => (LOCKDOWN_DENIED as GovernedAction[]).includes(a));
  if (overlap.length) findings.push(`allow/deny overlap: ${overlap.join(", ")}`);
  for (const a of LOCKDOWN_DENIED) if (evaluateUnderLockdown(a, "SECURITY_LOCKDOWN").allowed) findings.push(`${a} must be denied under lockdown`);
  for (const a of LOCKDOWN_ALLOWED) if (!evaluateUnderLockdown(a, "SECURITY_LOCKDOWN").allowed) findings.push(`${a} must be allowed under lockdown`);
  return { ok: findings.length === 0, findings };
}
