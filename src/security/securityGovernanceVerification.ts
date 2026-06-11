/**
 * Security Governance Verification — multi-party founder controls (group C/E).
 *
 * Enforces the constitutional rule "no single founder can compromise the
 * institution": critical actions require a quorum of distinct founders; the
 * highest-risk actions require ALL founders. Stuart's financial authority is
 * STEWARD authority — financial high-risk actions need Stuart + at least one
 * additional founder, never Stuart alone. Approvals are recorded as
 * hash-chained security events; the build never approves anything.
 *
 * No PII here, no production activation — this is the governance gate code, not
 * a live treasury or permission system.
 */

import { recordSecurityEvent } from "./securityRuntimeGuards";

export type FounderId = "caitlin" | "stuart";
export const FOUNDERS: FounderId[] = ["caitlin", "stuart"];

export type CriticalAction =
  | "prod-permissions"
  | "master-credential-rotation"
  | "disable-audit"
  | "disable-replay"
  | "disable-security-runtime"
  | "disable-governance-runtime"
  | "pii-financial-export"
  | "treasury-movement"
  | "financial-export"
  | "financial-high-risk";

/** Quorum policy per action. "all" = every founder; n = at least n distinct. */
const QUORUM: Record<CriticalAction, "all" | number> = {
  "prod-permissions": 2,
  "master-credential-rotation": 2,
  "disable-audit": "all",
  "disable-replay": "all",
  "disable-security-runtime": "all",
  "disable-governance-runtime": "all",
  "pii-financial-export": 2,
  "treasury-movement": 2,
  "financial-export": 2,
  "financial-high-risk": 2,
};

/** Actions where Stuart (financial steward) MUST be one of the approvers. */
const REQUIRES_STUART = new Set<CriticalAction>(["financial-high-risk", "treasury-movement", "financial-export"]);

export interface ApprovalRecord {
  founderId: FounderId;
  channel: "in-person" | "video" | "phone" | "passkey-signed";
  ts: string;
  rationale: string;
}

export interface MultiPartyResult {
  ok: boolean;
  action: CriticalAction;
  required: string;
  distinctApprovers: FounderId[];
  reasons: string[];
}

/**
 * Verify a multi-party approval for a critical action. Caller supplies the
 * recorded approvals (each from a distinct founder, two-channel-verified per the
 * human policy). Refuses on insufficient quorum, duplicate approvers, or a
 * financial action missing the steward (Stuart). Writes a security event.
 */
export function requireMultiParty(action: CriticalAction, approvals: ApprovalRecord[]): MultiPartyResult {
  const reasons: string[] = [];
  const distinct = [...new Set(approvals.map((a) => a.founderId))];
  const policy = QUORUM[action];
  const need = policy === "all" ? FOUNDERS.length : policy;

  if (distinct.length < need) reasons.push(`needs ${policy === "all" ? "ALL founders" : `${need} distinct founders`}, got ${distinct.length}`);
  if (distinct.length !== approvals.length) reasons.push("duplicate approver — each approval must be a DISTINCT founder (no single founder acting alone)");
  if (REQUIRES_STUART.has(action) && !distinct.includes("stuart")) reasons.push("financial action requires the financial steward (Stuart) as one approver");
  if (REQUIRES_STUART.has(action) && distinct.length < 2) reasons.push("Stuart is steward, NOT unilateral — a financial high-risk action needs Stuart + at least one additional founder");
  for (const a of approvals) if (!a.rationale?.trim() || !a.ts || !a.channel) reasons.push(`incomplete approval from ${a.founderId} (channel/ts/rationale required)`);

  const ok = reasons.length === 0;
  recordSecurityEvent({
    type: ok ? "MULTIPARTY_APPROVED" : "MULTIPARTY_REFUSED",
    severity: ok ? "info" : "high",
    summary: `${action}: ${ok ? "approved" : "refused"} by [${distinct.join(", ")}]`,
    detail: { action, required: String(policy), distinctApprovers: distinct, reasons },
  });
  return { ok, action, required: policy === "all" ? "all-founders" : `${need}-of-${FOUNDERS.length}`, distinctApprovers: distinct, reasons };
}

/** Whole-set invariants the verifier asserts (group C). */
export function governanceInvariants(): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  // 1. No critical action is satisfiable by a single founder.
  for (const action of Object.keys(QUORUM) as CriticalAction[]) {
    const single = requireMultiPartyDryRun(action, ["caitlin"]);
    if (single.ok) findings.push(`INVARIANT BREACH: ${action} satisfiable by one founder`);
  }
  // 2. Control-disabling actions require ALL founders.
  for (const a of ["disable-audit", "disable-replay", "disable-security-runtime", "disable-governance-runtime"] as CriticalAction[]) {
    if (QUORUM[a] !== "all") findings.push(`INVARIANT BREACH: ${a} must require ALL founders`);
  }
  // 3. Stuart is steward, not override: financial-high-risk needs Stuart + ≥1.
  if (!REQUIRES_STUART.has("financial-high-risk")) findings.push("INVARIANT BREACH: financial-high-risk must require the steward");
  return { ok: findings.length === 0, findings };
}

/** Pure dry-run (no event) for invariant checks. */
function requireMultiPartyDryRun(action: CriticalAction, founders: FounderId[]): { ok: boolean } {
  const distinct = [...new Set(founders)];
  const policy = QUORUM[action];
  const need = policy === "all" ? FOUNDERS.length : policy;
  if (distinct.length < need) return { ok: false };
  if (REQUIRES_STUART.has(action) && (!distinct.includes("stuart") || distinct.length < 2)) return { ok: false };
  return { ok: true };
}
