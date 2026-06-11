/**
 * verify:domain-governance — DOMAIN-ASSET-001 conformance tests.
 *
 * Proves the institutional domain assets are governed as security-critical
 * property: all four domains registered with canonical roles; production DNS
 * cutover blocked without human review; transfer / DNS-authority / ownership
 * changes require multi-party founder approval (no single founder); missing
 * auto-renew / transfer-lock attestations block production; the dashboard reports
 * incomplete controls as blocking; Railway can never be authoritative production;
 * GCP is canonical but still needs a DNS security review before public cutover.
 *
 * Deterministic; touches only git-ignored test ledgers (multi-party records).
 */

import {
  DOMAIN_ASSETS, DOMAIN_ASSET_RULES, DOMAIN_ASSET_DOCTRINE_ID, DOMAIN_PRODUCTION_BLOCKERS,
  DOMAIN_ASSET_GOVERNANCE, CLOUD_DEPLOYMENT, type CanonicalRole,
} from "@/security/domainAssetManifest";
import {
  domainSecurityStatus, domainDashboardPanel, domainProductionBlockers, openDomainBlockers,
  productionDnsCutoverAllowed, railwayCanBeAuthoritativeProductionHost, gcpPublicCutoverRequiresDnsReview,
  requireDomainTransferApproval, requireDnsAuthorityChangeApproval, requirePrimaryPublicChangeApproval,
  requireDomainOwnershipChangeApproval, domainControlStatus,
} from "@/security/domainSecurityVerification";
import { securityDashboard } from "@/security/securityDashboardStatus";
import type { ApprovalRecord } from "@/security/securityGovernanceVerification";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };
const ap = (f: "caitlin" | "stuart", r = "domain review"): ApprovalRecord => ({ founderId: f, channel: "in-person", ts: new Date().toISOString(), rationale: r });

const EXPECTED: Record<string, CanonicalRole> = {
  "furlongpathways.com": "PRIMARY_PUBLIC_PLATFORM",
  "furlonghub.com": "INSTITUTIONAL_HUB",
  "aresfarmsinc.com": "CORPORATE_ENTITY",
  "redacre.enterprises": "LEGACY_ENTERPRISE_ASSET",
};

// ── 1. All four domains exist + each has a canonical role ─────────────────────
for (const [domain, role] of Object.entries(EXPECTED)) {
  const rec = DOMAIN_ASSETS.find((d) => d.domain === domain);
  ok(!!rec, `domain must be registered: ${domain}`);
  ok(rec?.canonical_role === role, `${domain} canonical_role must be ${role} (got ${rec?.canonical_role})`);
  ok(!!rec?.owner_entity?.includes("Ares Farms Inc."), `${domain} must be owned by Ares Farms Inc.`);
}
ok(DOMAIN_ASSETS.length === 4, "exactly four institutional domains registered");
ok(DOMAIN_ASSETS.every((d) => !!d.canonical_role), "every domain has a canonical role");
ok(DOMAIN_ASSET_DOCTRINE_ID === "DOMAIN-ASSET-001" && DOMAIN_ASSET_RULES.length >= 12, "DOMAIN-ASSET-001 doctrine + rules present");

// ── 2. Production DNS cutover blocked without human review ─────────────────────
ok(productionDnsCutoverAllowed() === false, "production DNS cutover must be BLOCKED (no human review)");
ok(openDomainBlockers().includes("PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW"), "human-review cutover blocker must be OPEN");
ok(openDomainBlockers().includes("DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH"), "pre-launch security-review blocker must be OPEN");

// ── 3. Domain transfer requires multi-party founder approval ───────────────────
ok(requireDomainTransferApproval([ap("caitlin")]).ok === false, "single founder CANNOT transfer a domain");
ok(requireDomainTransferApproval([ap("caitlin"), ap("caitlin")]).ok === false, "duplicate founder cannot transfer a domain");
ok(requireDomainTransferApproval([ap("caitlin"), ap("stuart")]).ok === true, "all founders CAN transfer a domain (quorum met)");
ok(requireDomainOwnershipChangeApproval([ap("caitlin")]).ok === false, "single founder CANNOT change ownership");

// ── 4. DNS authority change requires multi-party founder approval ──────────────
ok(requireDnsAuthorityChangeApproval([ap("stuart")]).ok === false, "single founder CANNOT change DNS authority");
ok(requireDnsAuthorityChangeApproval([ap("caitlin"), ap("stuart")]).ok === true, "all founders CAN change DNS authority");
// primary public change needs multi-party too
ok(requirePrimaryPublicChangeApproval([ap("caitlin")]).ok === false, "single founder cannot change the primary public domain");
ok(requirePrimaryPublicChangeApproval([ap("caitlin"), ap("stuart")]).ok === true, "two founders can change the primary public domain (with review)");

// ── 5. Missing auto-renew / transfer-lock attestations block production ────────
const blockers = domainProductionBlockers();
const open = (id: typeof DOMAIN_PRODUCTION_BLOCKERS[number]) => blockers.find((b) => b.id === id)?.open === true;
ok(open("DOMAIN_AUTORENEW_REQUIRED"), "missing auto-renew attestation must block production");
ok(open("DOMAIN_TRANSFER_LOCK_REQUIRED"), "missing transfer-lock attestation must block production");
ok(open("DOMAIN_DNS_REVIEW_REQUIRED"), "missing DNS review must block production");
// per-domain: unverified attestations read PENDING (never assumed PASS)
for (const d of DOMAIN_ASSETS) {
  const s = domainControlStatus(d);
  if (d.auto_renew_enabled === "unverified") ok(s.autoRenew === "PENDING", `${d.domain} auto-renew unverified → PENDING (not assumed)`);
  if (d.transfer_lock_enabled === "unverified") ok(s.transferLock === "PENDING", `${d.domain} transfer-lock unverified → PENDING`);
}

// ── 6. Dashboard reports incomplete controls as blocking ───────────────────────
const panel = domainDashboardPanel();
ok(panel.lines.some((l) => l.key === "Auto-renew" && l.status !== "PASS"), "dashboard auto-renew must NOT read PASS yet");
ok(panel.lines.some((l) => l.key === "Transfer lock" && l.status !== "PASS"), "dashboard transfer-lock must NOT read PASS yet");
ok(panel.blockers.some((b) => b.open), "dashboard must surface open production blockers");
const dash = securityDashboard();
ok(dash.lines.some((l) => l.key.startsWith("Domain · ")), "security dashboard must include the domain panel");
ok(!!dash.domains, "security dashboard must expose the domain panel object");

// ── 7. Railway cannot be authoritative production; GCP canonical but gated ─────
ok(railwayCanBeAuthoritativeProductionHost() === false, "Railway can NEVER be an authoritative production host");
ok(CLOUD_DEPLOYMENT.canonicalTarget === "google-cloud-platform", "GCP is the canonical deployment target");
ok(gcpPublicCutoverRequiresDnsReview() === true, "GCP canonical but public cutover still needs DNS security review");
ok(CLOUD_DEPLOYMENT.publicPiiEnabledByDnsCutoverAlone === false, "no public PII workflow enabled by DNS cutover alone");

// ── 8. Gate + overall status ───────────────────────────────────────────────────
const status = domainSecurityStatus();
ok(DOMAIN_ASSET_GOVERNANCE === "ALPHA_PENDING", "DOMAIN_ASSET_GOVERNANCE must be ALPHA_PENDING");
ok(status.founderReviewComplete === false, "founder domain review must NOT be auto-complete");
ok(status.openBlockers.length >= 4, "multiple production blockers must remain open");

// ── report ──────────────────────────────────────────────────────────────────────
console.log(`verify:domain-governance — ${DOMAIN_ASSETS.length} domains · gate=${DOMAIN_ASSET_GOVERNANCE} · open-blockers=${status.openBlockers.length}/${DOMAIN_PRODUCTION_BLOCKERS.length}`);
if (fail.length) {
  console.error(`\n✗  verify:domain-governance FAIL — ${fail.length} issue(s):`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log(
  "\n✓  verify:domain-governance PASS — all four domains registered with canonical roles + Ares Farms Inc. ownership; " +
    "production DNS cutover blocked without human review; transfer / ownership / DNS-authority changes require multi-party " +
    "founders (no single founder); missing auto-renew/transfer-lock/DNS-review block production; dashboard surfaces incomplete " +
    "controls as blocking; Railway never authoritative; GCP canonical but gated on DNS security review. Gate ALPHA_PENDING.",
);
process.exit(0);
