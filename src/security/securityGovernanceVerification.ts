/**
 * Security Governance Verification — role-separated multi-party controls (group C/E).
 *
 * Enforces the constitutional rule "no single operator can compromise the
 * institution": critical actions require a quorum of distinct governance principals; the
 * highest-risk actions require BOTH the owner and an independent reviewer. Financial
 * high-risk actions require the independent reviewer plus the owner; neither may act alone. Approvals are recorded as
 * hash-chained security events; the build never approves anything.
 *
 * No PII here, no production activation — this is the governance gate code, not
 * a live treasury or permission system.
 */

import { recordSecurityEvent } from "./securityRuntimeGuards";

export type FounderId = "owner" | "independent-reviewer";
export const FOUNDERS: FounderId[] = ["owner", "independent-reviewer"];

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
  | "financial-high-risk"
  // DOMAIN-ASSET-001 — institutional domain assets cannot be lost by one governance principal.
  | "domain-transfer"
  | "domain-ownership-change"
  | "domain-registrar-change"
  | "domain-dns-authority-change"
  | "domain-primary-public-change";

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
  // Permanent transfer/loss of a domain asset requires both governance principals — "no one
  // founder should be able to permanently transfer or lose domain assets alone".
  "domain-transfer": "all",
  "domain-ownership-change": "all",
  "domain-registrar-change": "all",
  "domain-dns-authority-change": "all",
  // A primary public-domain change needs multi-party + human review (not "all").
  "domain-primary-public-change": 2,
};

/** Financial actions require an independent reviewer as one approver. */
const REQUIRES_INDEPENDENT_REVIEW = new Set<CriticalAction>(["financial-high-risk", "treasury-movement", "financial-export"]);

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
 * financial action missing the independent reviewer. Writes a security event.
 */
export function requireMultiParty(action: CriticalAction, approvals: ApprovalRecord[]): MultiPartyResult {
  const reasons: string[] = [];
  const distinct = [...new Set(approvals.map((a) => a.founderId))];
  const policy = QUORUM[action];
  const need = policy === "all" ? FOUNDERS.length : policy;

  if (distinct.length < need) reasons.push(`needs ${policy === "all" ? "both governance principals" : `${need} distinct governance principals`}, got ${distinct.length}`);
  if (distinct.length !== approvals.length) reasons.push("duplicate approver — each approval must be a DISTINCT governance principal (no single governance principal acting alone)");
  if (REQUIRES_INDEPENDENT_REVIEW.has(action) && !distinct.includes("independent-reviewer")) reasons.push("financial action requires an independent reviewer as one approver");
  if (REQUIRES_INDEPENDENT_REVIEW.has(action) && distinct.length < 2) reasons.push("independent reviewer is not unilateral — a financial high-risk action also requires the owner");
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
  // 1. No critical action is satisfiable by a single governance principal.
  for (const action of Object.keys(QUORUM) as CriticalAction[]) {
    const single = requireMultiPartyDryRun(action, ["owner"]);
    if (single.ok) findings.push(`INVARIANT BREACH: ${action} satisfiable by one governance principal`);
  }
  // 2. Control-disabling actions require both governance principals.
  for (const a of ["disable-audit", "disable-replay", "disable-security-runtime", "disable-governance-runtime"] as CriticalAction[]) {
    if (QUORUM[a] !== "all") findings.push(`INVARIANT BREACH: ${a} must require both governance principals`);
  }
  // 3. Independent review is mandatory for financial-high-risk actions.
  if (!REQUIRES_INDEPENDENT_REVIEW.has("financial-high-risk")) findings.push("INVARIANT BREACH: financial-high-risk must require independent review");
  return { ok: findings.length === 0, findings };
}

/** Pure dry-run (no event) for invariant checks. */
function requireMultiPartyDryRun(action: CriticalAction, founders: FounderId[]): { ok: boolean } {
  const distinct = [...new Set(founders)];
  const policy = QUORUM[action];
  const need = policy === "all" ? FOUNDERS.length : policy;
  if (distinct.length < need) return { ok: false };
  if (REQUIRES_INDEPENDENT_REVIEW.has(action) && (!distinct.includes("independent-reviewer") || distinct.length < 2)) return { ok: false };
  return { ok: true };
}
