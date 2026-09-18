/**
 * Security Incident Runbook — executable emergency controls (group L).
 *
 * State-flag switches backed by a git-ignored incident-state file + hash-chained
 * security events. Engaging any switch is a recorded action; flags are read by
 * the surfaces that must fail-closed (public intake, operator actions, treasury,
 * sessions). Counsel-gated items (breach notification) are documented, not
 * automated. The build never engages these — they are human emergency tools.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { recordSecurityEvent } from "./securityRuntimeGuards";

const STATE_PATH = path.join(process.cwd(), "data", "incident-state.json");

export interface IncidentState {
  publicIntakeDisabled: boolean;
  operatorActionsLocked: boolean;
  treasuryFrozen: boolean;
  globalSessionsRevokedAt: string | null;
  forensicLockdown: boolean;
  engagedBy: string | null;
  engagedAt: string | null;
}

const DEFAULT: IncidentState = {
  publicIntakeDisabled: false, operatorActionsLocked: false, treasuryFrozen: false,
  globalSessionsRevokedAt: null, forensicLockdown: false, engagedBy: null, engagedAt: null,
};

export function readIncidentState(): IncidentState {
  try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) }; } catch { return { ...DEFAULT }; }
}
function write(s: IncidentState): void { fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true }); fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2) + "\n"); }

function engage(patch: Partial<IncidentState>, actor: string, type: string, summary: string): IncidentState {
  const s = { ...readIncidentState(), ...patch, engagedBy: actor, engagedAt: new Date().toISOString() };
  write(s);
  recordSecurityEvent({ type, severity: "critical", summary, detail: { actor } });
  return s;
}

/** "We think someone got in" — engage forensic lockdown (read-only + preserve). */
export function forensicLockdown(actor: string): IncidentState {
  return engage({ forensicLockdown: true, operatorActionsLocked: true }, actor, "FORENSIC_LOCKDOWN", "forensic lockdown engaged — surfaces read-only, evidence preserved");
}
/** Emergency public-intake disable (control L). */
export function disablePublicIntake(actor: string): IncidentState {
  return engage({ publicIntakeDisabled: true }, actor, "PUBLIC_INTAKE_DISABLED", "public intake disabled");
}
/** Emergency operator-action lock (control L). */
export function lockOperatorActions(actor: string): IncidentState {
  return engage({ operatorActionsLocked: true }, actor, "OPERATOR_ACTIONS_LOCKED", "operator actions locked");
}
/** Emergency treasury freeze (control E/L) — blocks any treasury movement. */
export function treasuryFreeze(actor: string): IncidentState {
  return engage({ treasuryFrozen: true }, actor, "TREASURY_FROZEN", "treasury frozen — movements blocked");
}
/** Global session revocation (control A/L). */
export function globalSessionRevocation(actor: string): IncidentState {
  return engage({ globalSessionsRevokedAt: new Date().toISOString() }, actor, "GLOBAL_SESSION_REVOKE", "global session revocation issued");
}
/** Clear an incident state (requires the same recorded-action discipline). */
export function standDown(actor: string): IncidentState {
  const s = { ...DEFAULT, engagedBy: actor, engagedAt: new Date().toISOString() };
  write(s);
  recordSecurityEvent({ type: "INCIDENT_STAND_DOWN", severity: "high", summary: "incident controls cleared", detail: { actor } });
  return s;
}

/** Surfaces consult these before acting (fail-closed during an incident). */
export function publicIntakeAllowed(): boolean { return !readIncidentState().publicIntakeDisabled; }
export function operatorActionsAllowed(): boolean { return !readIncidentState().operatorActionsLocked && !readIncidentState().forensicLockdown; }
export function treasuryMovementAllowed(): boolean { return !readIncidentState().treasuryFrozen; }

/** Ordered "someone got in" procedure (documented + executable). */
export const SOMEONE_GOT_IN_PROCEDURE: string[] = [
  "1. forensicLockdown() — freeze state, preserve evidence (read-only).",
  "2. globalSessionRevocation() — invalidate all sessions.",
  "3. treasuryFreeze() + disablePublicIntake() — stop money + new inputs.",
  "4. Rotate master credentials + keys (multi-party; securityGovernanceVerification).",
  "5. Verify ledger integrity (verify:ledger-integrity) — detect tampering.",
  "6. Engage counsel for breach-notification assessment (REQUIRES COUNSEL).",
  "7. Restore from tested backup only after scope is established.",
  "8. standDown() once contained + verified.",
];
