/**
 * Security Runtime Guards — fail-closed enforcement primitives (groups A/B/M).
 *
 * Each guard returns a typed result and, where the underlying mechanism (MFA
 * provider, re-auth flow, anomaly model) is not yet wired, returns NOT-SATISFIED
 * rather than pretending. Security events are written to a hash-chained,
 * append-only security ledger (separate file from the audit ledger). No PII.
 */

import { chainAppend } from "@/lib/security/ledgerHashChain";
import * as path from "node:path";

export const SECURITY_EVENT_LEDGER = path.join(process.cwd(), "data", "security-events.ndjson");

export type GuardResult = { ok: boolean; guard: string; reason: string };
const deny = (guard: string, reason: string): GuardResult => ({ ok: false, guard, reason });

export type SecuritySeverity = "info" | "low" | "medium" | "high" | "critical";
export interface SecurityEvent {
  type: string;
  severity: SecuritySeverity;
  summary: string;
  detail?: Record<string, unknown>;
}

/** Immutable security event (control J/M): hash-chained, append-only. */
export function recordSecurityEvent(e: SecurityEvent): SecurityEvent & { ts: string } {
  const record = { ts: new Date().toISOString(), ...e };
  try { chainAppend(SECURITY_EVENT_LEDGER, record as unknown as Record<string, unknown>); } catch { /* best-effort */ }
  return record;
}

// ── A — MFA (deny until an IdP/MFA provider is wired; GCP IAP at Phase 4) ─────
export function requireMfa(session: { mfaVerified?: boolean; method?: string } | null): GuardResult {
  if (process.env.OPERATOR_MFA_ENFORCED !== "true") return deny("requireMfa", "STUB: MFA provider not wired — treat as not satisfied");
  if (session?.method === "sms") return deny("requireMfa", "SMS-only MFA is not permitted for privileged users");
  return session?.mfaVerified ? { ok: true, guard: "requireMfa", reason: "mfa verified" } : deny("requireMfa", "MFA not verified");
}

// ── A — step-up re-auth for sensitive actions (fail-closed) ───────────────────
export function requireStepUpAuth(ctx: { reAuthedAt?: string | null }, maxAgeMinutes = 10): GuardResult {
  if (!ctx.reAuthedAt) { recordSecurityEvent({ type: "STEPUP_MISSING", severity: "medium", summary: "sensitive action without step-up" }); return deny("requireStepUpAuth", "no step-up re-auth"); }
  const age = (Date.now() - Date.parse(ctx.reAuthedAt)) / 60_000;
  return age <= maxAgeMinutes ? { ok: true, guard: "requireStepUpAuth", reason: `re-authed ${Math.round(age)}m ago` } : deny("requireStepUpAuth", `re-auth stale (${Math.round(age)}m)`);
}

// ── B — least-privilege role matrix (runtime, not registry-only) ──────────────
export const ROLE_MATRIX: Record<string, string[]> = {
  founder: ["source-approve", "listing-approve", "counsel-clearance", "license-verify", "image-rights", "treasury", "permission-change"],
  security: ["incident-control", "ledger-monitor", "session-revoke"],
  audit: ["ledger-read", "ledger-monitor"],
  operator: ["listing-approve", "license-verify"],
  reviewer: [],
};
export function enforceLeastPrivilege(role: string | null, action: string): GuardResult {
  const allowed = (role && ROLE_MATRIX[role]) || [];
  const ok = allowed.includes(action);
  if (!ok) recordSecurityEvent({ type: "PRIV_DENIED", severity: "medium", summary: `role "${role ?? "none"}" denied "${action}"` });
  return ok ? { ok, guard: "enforceLeastPrivilege", reason: `${role} may ${action}` } : deny("enforceLeastPrivilege", `role "${role ?? "none"}" not permitted for "${action}"`);
}

// ── M — honeytokens: any touch raises a high-severity event ───────────────────
export const HONEYTOKENS = new Set<string>(["hny_admin_master_key", "hny_export_all_pii", "tok_honey_do_not_use"]);
export function honeytokenTouch(value: string, where: string): GuardResult {
  if (HONEYTOKENS.has(value)) {
    recordSecurityEvent({ type: "HONEYTOKEN_TOUCHED", severity: "critical", summary: `honeytoken accessed at ${where}`, detail: { where } });
    return deny("honeytokenTouch", `honeytoken touched at ${where} — alert raised`);
  }
  return { ok: true, guard: "honeytokenTouch", reason: "no honeytoken" };
}

// ── K — AI prompt-injection / source-ingest screen ───────────────────────────
const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior) instructions/i, /\bsystem prompt\b/i, /\byou are now\b/i,
  /\bdisregard\b.{0,40}\b(rules|instructions|policy)/i, /<\s*script/i,
];
export function aiIngestGuard(text: string): GuardResult {
  const hit = INJECTION_PATTERNS.find((re) => re.test(text ?? ""));
  if (hit) { recordSecurityEvent({ type: "INJECTION_QUARANTINE", severity: "high", summary: "instruction-shaped ingest quarantined" }); return deny("aiIngestGuard", `instruction-shaped content (${hit}) — quarantined`); }
  return { ok: true, guard: "aiIngestGuard", reason: "no instruction-shaped content (pattern screen only)" };
}

// ── F — consent-bound access (fail-closed) ────────────────────────────────────
export function consentBoundAccess(hasConsent: boolean, what: string): GuardResult {
  return hasConsent ? { ok: true, guard: "consentBoundAccess", reason: `active consent for ${what}` } : deny("consentBoundAccess", `no active consent for ${what}`);
}

export { sanitizeIngestText as externalFeedSanitize } from "@/lib/security/ingestSanitizer";
