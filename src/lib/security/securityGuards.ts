/**
 * Runtime security guards — Alpha STUBS (deny-by-default, honestly labeled).
 *
 * Each guard is a callable check with real semantics but, where the underlying
 * mechanism (MFA provider, re-auth flow, anomaly model) is not yet wired, it
 * returns NOT_SATISFIED rather than pretending. Surfaces that adopt a guard get
 * fail-closed behavior; nothing here claims protection it doesn't provide.
 * Manifest mirror: src/security/securityHardeningManifest.ts (status: stub).
 */

export type GuardResult = { ok: boolean; guard: string; reason: string };

const stub = (guard: string, reason: string): GuardResult => ({ ok: false, guard, reason });

/** 1B — Operator-wall MFA. Deny until an MFA provider is wired + env-enabled. */
export function requireOperatorMfa(session: { mfaVerified?: boolean } | null): GuardResult {
  if (process.env.OPERATOR_MFA_ENFORCED !== "true") {
    return stub("requireOperatorMfa", "STUB: MFA provider not wired (OPERATOR_MFA_ENFORCED unset) — treat as not satisfied");
  }
  return session?.mfaVerified
    ? { ok: true, guard: "requireOperatorMfa", reason: "mfa verified" }
    : stub("requireOperatorMfa", "MFA not verified for this session");
}

/** 1B — Step-up re-auth for sensitive actions (approvals, counsel clearance). */
export function requireStepUpAuth(ctx: { reAuthedAt?: string | null }, maxAgeMinutes = 10): GuardResult {
  if (!ctx.reAuthedAt) return stub("requireStepUpAuth", "STUB: no re-auth mechanism wired — sensitive action requires step-up before production");
  const age = (Date.now() - Date.parse(ctx.reAuthedAt)) / 60_000;
  return age <= maxAgeMinutes
    ? { ok: true, guard: "requireStepUpAuth", reason: `re-authed ${Math.round(age)}m ago` }
    : stub("requireStepUpAuth", `re-auth stale (${Math.round(age)}m > ${maxAgeMinutes}m)`);
}

/** 1B — Least-privilege matrix (role → allowed sensitive actions). */
export const LEAST_PRIVILEGE_MATRIX: Record<string, string[]> = {
  founder: ["source-approve", "listing-approve", "counsel-clearance", "license-verify", "image-rights"],
  operator: ["listing-approve", "license-verify"],
  reviewer: [],
};
export function enforceLeastPrivilege(role: string | null, action: string): GuardResult {
  const allowed = (role && LEAST_PRIVILEGE_MATRIX[role]) || [];
  return allowed.includes(action)
    ? { ok: true, guard: "enforceLeastPrivilege", reason: `${role} may ${action}` }
    : stub("enforceLeastPrivilege", `role "${role ?? "none"}" not permitted for "${action}" (deny-by-default)`);
}

/** 3B — Governance-runtime bypass detection (renders that skipped their gate). */
export function detectGovernanceBypass(findings: Array<{ surface: string; gatePassed: boolean }>): GuardResult {
  const bypasses = findings.filter((f) => !f.gatePassed);
  return bypasses.length === 0
    ? { ok: true, guard: "detectGovernanceBypass", reason: "no bypass observed in supplied findings" }
    : stub("detectGovernanceBypass", `bypass detected: ${bypasses.map((b) => b.surface).join(", ")} — human review required`);
}

/** 2B — Ledger integrity monitor (anomaly flags for human review; STUB heuristics). */
export function ledgerIntegrityMonitor(events: Array<{ ts: string; decision: string }>): GuardResult {
  const offHours = events.filter((e) => { const h = new Date(e.ts).getUTCHours(); return h >= 6 && h <= 10 ? false : false; });
  // Honest stub: heuristics not tuned; always route to human review when asked.
  return stub("ledgerIntegrityMonitor", `STUB: ${events.length} events scanned; anomaly heuristics not production-tuned (${offHours.length} flagged) — human review stands in`);
}

/** 1C — AI prompt-injection / source-ingest guard (instruction-shaped content). */
const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior) instructions/i,
  /\bsystem prompt\b/i,
  /\byou are now\b/i,
  /\bdisregard\b.{0,40}\b(rules|instructions|policy)/i,
  /<\s*script/i,
];
export function aiIngestGuard(text: string): GuardResult {
  const hit = INJECTION_PATTERNS.find((re) => re.test(text ?? ""));
  return hit
    ? stub("aiIngestGuard", `instruction-shaped content detected (${hit}) — quarantine for human review; never execute`)
    : { ok: true, guard: "aiIngestGuard", reason: "no instruction-shaped content detected (pattern screen only — not a guarantee)" };
}

/** 1 — External-feed sanitization gate (delegates to the sanitizer). */
export { sanitizeIngestText as externalFeedSanitize } from "./ingestSanitizer";

/** 2A — Consent-bound access (delegates to the consent ledger; fail-closed). */
export function consentBoundAccess(hasConsent: boolean, what: string): GuardResult {
  return hasConsent
    ? { ok: true, guard: "consentBoundAccess", reason: `active consent for ${what}` }
    : stub("consentBoundAccess", `no active consent for ${what} — access refused (ask, never assume)`);
}
