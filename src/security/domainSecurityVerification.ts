/**
 * Domain Security Verification — DOMAIN-ASSET-001 runtime checks + gates.
 *
 * Turns the domain asset registry into: per-domain control status, the security
 * dashboard panel, the production-blocker set, and the multi-party founder gates
 * that protect transfer / registrar / DNS-authority / ownership / primary-public
 * changes. It NEVER assumes a registrar setting — an unverified attestation reads
 * PENDING and keeps production blocked. Production DNS cutover is blocked by
 * definition until every control is attested AND a human review is recorded.
 *
 * Master Volume traceability: Vol II governance, Vol III-B runtime gates, Vol IV
 * continuity. No PII, no production activation.
 */

import {
  DOMAIN_ASSETS, DOMAIN_PRODUCTION_BLOCKERS, DOMAIN_FOUNDER_REVIEW_COMPLETE,
  DOMAIN_ASSET_GOVERNANCE, CLOUD_DEPLOYMENT,
  type DomainAssetRecord, type Attestation, type DomainProductionBlocker,
} from "./domainAssetManifest";
import { requireMultiParty, type ApprovalRecord, type MultiPartyResult } from "./securityGovernanceVerification";

export type ControlLight = "PASS" | "PENDING" | "PARTIAL" | "FAIL" | "N/A";

/** Map a tri-state attestation to a control light (honest: unverified→PENDING). */
function fromAttestation(a: Attestation): ControlLight {
  if (a === "attested-true") return "PASS";
  if (a === "attested-false") return "FAIL";
  return "PENDING"; // unverified — manual evidence required, never assumed PASS
}

export interface DomainControlStatus {
  domain: string;
  ownership: ControlLight; // owner_entity recorded?
  autoRenew: ControlLight;
  transferLock: ControlLight;
  privacy: ControlLight;
  mfa: ControlLight;
  dnsReview: ControlLight; // last_reviewed_at present?
  emailAuth: ControlLight;
  cloudReadiness: ControlLight;
}

export function domainControlStatus(d: DomainAssetRecord): DomainControlStatus {
  const emailAuth: ControlLight =
    d.email_auth === "n/a" ? "N/A"
    : d.email_auth === "reject" || d.email_auth === "quarantine" ? "PASS"
    : d.email_auth === "monitoring" ? "PARTIAL"
    : "PENDING";
  return {
    domain: d.domain,
    ownership: d.owner_entity && d.owner_entity.trim().length > 0 ? "PASS" : "PENDING",
    autoRenew: fromAttestation(d.auto_renew_enabled),
    transferLock: fromAttestation(d.transfer_lock_enabled),
    privacy: fromAttestation(d.privacy_enabled),
    mfa: fromAttestation(d.mfa_required),
    dnsReview: d.last_reviewed_at ? "PASS" : "PENDING",
    emailAuth,
    // No production DNS cutover until GCP review — readiness stays PENDING.
    cloudReadiness: "PENDING",
  };
}

export function allDomainControlStatus(): DomainControlStatus[] {
  return DOMAIN_ASSETS.map(domainControlStatus);
}

/** Aggregate a control across all (applicable) domains → one panel light. */
function aggregate(pick: (s: DomainControlStatus) => ControlLight): ControlLight {
  const lights = allDomainControlStatus().map(pick).filter((l) => l !== "N/A");
  if (lights.length === 0) return "N/A";
  if (lights.includes("FAIL")) return "FAIL";
  if (lights.every((l) => l === "PASS")) return "PASS";
  if (lights.some((l) => l === "PASS" || l === "PARTIAL")) return "PARTIAL";
  return "PENDING";
}

export interface DomainPanelLine { key: string; status: ControlLight; detail: string }

/** The security-dashboard domain panel (control set E in the spec). */
export function domainDashboardPanel(): {
  gate: string;
  lines: DomainPanelLine[];
  lastReviewDate: string | null;
  blockers: { id: DomainProductionBlocker; open: boolean }[];
} {
  const reviews = DOMAIN_ASSETS.map((d) => d.last_reviewed_at).filter(Boolean) as string[];
  const lastReviewDate = reviews.length ? reviews.sort().slice(-1)[0] : null;

  const lines: DomainPanelLine[] = [
    { key: "Domain ownership", status: aggregate((s) => s.ownership), detail: `${DOMAIN_ASSETS.length} institutional domains registered to Ares Farms Inc.` },
    { key: "Auto-renew", status: aggregate((s) => s.autoRenew), detail: "must remain enabled on every domain (manual attestation pending)" },
    { key: "Transfer lock", status: aggregate((s) => s.transferLock), detail: "registrar/transfer lock must remain enabled (manual attestation pending)" },
    { key: "Privacy", status: aggregate((s) => s.privacy), detail: "WHOIS privacy where legally available (manual attestation pending)" },
    { key: "DNS review", status: aggregate((s) => s.dnsReview), detail: "no founder DNS review recorded yet" },
    { key: "Email authentication", status: aggregate((s) => s.emailAuth), detail: "SPF/DKIM/DMARC tracked for sending domains; DMARC starts in monitoring" },
    { key: "Cloud deployment readiness", status: aggregate((s) => s.cloudReadiness), detail: "GCP canonical; DNS security review required before any public cutover" },
  ];
  return {
    gate: DOMAIN_ASSET_GOVERNANCE,
    lines,
    lastReviewDate,
    blockers: domainProductionBlockers(),
  };
}

/**
 * Production blockers. Every blocker stays OPEN until its controls are attested
 * AND founder review is recorded. The build cannot close them on its own.
 */
export function domainProductionBlockers(): { id: DomainProductionBlocker; open: boolean }[] {
  const statuses = allDomainControlStatus();
  const allAttested = (pick: (s: DomainControlStatus) => ControlLight) => statuses.every((s) => pick(s) === "PASS" || pick(s) === "N/A");

  const registryComplete = DOMAIN_ASSETS.length >= 4 && DOMAIN_ASSETS.every((d) => !!d.canonical_role && !!d.owner_entity);
  const transferLockAll = allAttested((s) => s.transferLock);
  const autoRenewAll = allAttested((s) => s.autoRenew);
  const dnsReviewAll = allAttested((s) => s.dnsReview);

  const map: Record<DomainProductionBlocker, boolean> = {
    // Registry exists → this one is satisfied (closed). The rest stay open.
    DOMAIN_ASSET_REGISTRY_REQUIRED: !registryComplete,
    DOMAIN_TRANSFER_LOCK_REQUIRED: !(transferLockAll && DOMAIN_FOUNDER_REVIEW_COMPLETE),
    DOMAIN_AUTORENEW_REQUIRED: !(autoRenewAll && DOMAIN_FOUNDER_REVIEW_COMPLETE),
    DOMAIN_DNS_REVIEW_REQUIRED: !(dnsReviewAll && DOMAIN_FOUNDER_REVIEW_COMPLETE),
    // These two are categorical human gates — never auto-closed by the build.
    PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW: true,
    DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH: true,
  };
  return DOMAIN_PRODUCTION_BLOCKERS.map((id) => ({ id, open: map[id] }));
}

export function openDomainBlockers(): DomainProductionBlocker[] {
  return domainProductionBlockers().filter((b) => b.open).map((b) => b.id);
}

/** Overall domain security status (for tests + the verification report). */
export function domainSecurityStatus() {
  const statuses = allDomainControlStatus();
  const blockers = domainProductionBlockers();
  return {
    gate: DOMAIN_ASSET_GOVERNANCE,
    domains: DOMAIN_ASSETS.map((d) => d.domain),
    everyDomainHasRole: DOMAIN_ASSETS.every((d) => !!d.canonical_role),
    founderReviewComplete: DOMAIN_FOUNDER_REVIEW_COMPLETE,
    openBlockers: blockers.filter((b) => b.open).map((b) => b.id),
    closedBlockers: blockers.filter((b) => !b.open).map((b) => b.id),
    controlStatuses: statuses,
    productionDnsCutoverAllowed: productionDnsCutoverAllowed(),
  };
}

// ── Hard gates ────────────────────────────────────────────────────────────────

/**
 * Production DNS cutover is allowed ONLY when: every domain control is attested,
 * founder review is recorded, the human cutover gate is closed, and GCP DNS
 * security review has occurred. By construction this is currently FALSE.
 */
export function productionDnsCutoverAllowed(): boolean {
  if (!DOMAIN_FOUNDER_REVIEW_COMPLETE) return false;
  if (openDomainBlockers().length > 0) return false;
  return false; // categorical human gates remain — never true from the build
}

/** Railway can NEVER be marked an authoritative production host (DOMAIN-ASSET-001 §C). */
export function railwayCanBeAuthoritativeProductionHost(): boolean {
  return CLOUD_DEPLOYMENT.railwayMayBeAuthoritativeProductionHost; // false
}

/**
 * GCP may be the canonical deployment target, but a public cutover still
 * requires a DNS security review first.
 */
export function gcpPublicCutoverRequiresDnsReview(): boolean {
  return CLOUD_DEPLOYMENT.gcpRequiresDnsSecurityReviewBeforePublicCutover; // true
}

// ── Multi-party founder gates for domain actions (delegate to the primitive) ──
export function requireDomainTransferApproval(approvals: ApprovalRecord[]): MultiPartyResult {
  return requireMultiParty("domain-transfer", approvals);
}
export function requireDomainOwnershipChangeApproval(approvals: ApprovalRecord[]): MultiPartyResult {
  return requireMultiParty("domain-ownership-change", approvals);
}
export function requireDomainRegistrarChangeApproval(approvals: ApprovalRecord[]): MultiPartyResult {
  return requireMultiParty("domain-registrar-change", approvals);
}
export function requireDnsAuthorityChangeApproval(approvals: ApprovalRecord[]): MultiPartyResult {
  return requireMultiParty("domain-dns-authority-change", approvals);
}
export function requirePrimaryPublicChangeApproval(approvals: ApprovalRecord[]): MultiPartyResult {
  return requireMultiParty("domain-primary-public-change", approvals);
}
