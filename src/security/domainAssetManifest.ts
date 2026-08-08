/**
 * Domain Asset Manifest — DOMAIN-ASSET-001 (Institutional Domain Asset Governance).
 *
 * The institution's domains are SECURITY-CRITICAL INFRASTRUCTURE ASSETS, not
 * ordinary marketing assets. This module is the canonical institutional registry
 * of those assets, the governance doctrine that protects them, and the blocking
 * gates that keep production DNS cutover behind human review.
 *
 * HONESTY RULE (matches the security manifest's primary rule): registrar / DNS
 * settings are NOT assumed. Where a control cannot be verified automatically its
 * attestation stays "unverified" → the dashboard reads PENDING and production
 * stays blocked. A control reads PASS only when a human has attested it (or, in
 * future, an API verifies it). The build never self-declares a domain secured.
 *
 * Master Volume traceability: Vol I (constitutional asset stewardship), Vol II
 * (governance — multi-party founder control), Vol III/III-B (infra + runtime),
 * Vol IV (continuity / disaster recovery runbooks).
 */

export const DOMAIN_ASSET_DOCTRINE_ID = "DOMAIN-ASSET-001";
export const DOMAIN_ASSET_GOVERNANCE_VERSION = "domain-asset-governance-v0.1.0";

/** DOMAIN-ASSET-001 — the rules, kept in code so tests can assert them. */
export const DOMAIN_ASSET_RULES = [
  "Domains are institutional assets.",
  "Domains may not be transferred, deleted, sold, or allowed to expire by unilateral founder action.",
  "Domain transfer, registrar change, DNS authority change, or ownership change requires founder multi-party approval.",
  "Primary public domain changes require human review and an audit entry.",
  "Domain registrar accounts must use MFA/passkeys where available.",
  "Auto-renew must remain enabled.",
  "Transfer lock / registrar lock must remain enabled.",
  "WHOIS/domain privacy must remain enabled where legally available.",
  "Domain contact records must remain current.",
  "Domains must be included in disaster recovery and founder continuity records.",
  "DNS changes must be logged and reviewable.",
  "Production DNS changes must require human approval.",
  "Domain assets must appear in the security dashboard and institutional asset registry.",
] as const;

/**
 * Tri-state attestation. We never assume a registrar setting: "unverified" is
 * the honest default and drives PENDING / production-blocked until a human
 * attests (or an API verifies) it.
 */
export type Attestation = "attested-true" | "attested-false" | "unverified";

export type CanonicalRole =
  | "PRIMARY_PUBLIC_PLATFORM"
  | "INSTITUTIONAL_HUB";

export type ProductionUseStatus =
  | "RESERVED_NOT_LIVE"
  | "PUBLIC_LIVE";

export type RiskStatus = "SECURED" | "SECURED_PENDING_DNS_DEPLOYMENT" | "AT_RISK" | "UNVERIFIED";

export type EmailAuthStatus = "n/a" | "monitoring" | "quarantine" | "reject" | "unverified";

export interface DomainAssetRecord {
  domain: string;
  purpose: string;
  canonical_role: CanonicalRole;
  registrar: string | null;
  owner_entity: string;
  renewal_status: "current" | "due-soon" | "expired" | "unverified";
  renewal_date: string | null; // ISO date, or null until attested
  auto_renew_enabled: Attestation;
  transfer_lock_enabled: Attestation;
  privacy_enabled: Attestation;
  mfa_required: Attestation; // registrar account MFA/passkeys
  dns_provider: string | null;
  nameservers: string[];
  /** Email authentication posture for sending domains; "n/a" if non-sending. */
  email_auth: EmailAuthStatus;
  production_use_status: ProductionUseStatus;
  connected_services: string[];
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  risk_status: RiskStatus;
  notes: string;
}

/**
 * Institutional domain registry — initial records.
 *
 * Per the spec: ownership is recorded; registrar-level security controls are
 * "unverified" (manual attestation pending) because we do NOT assume registrar
 * settings. Founder review flips attestations to attested-true with evidence.
 */
export const DOMAIN_ASSETS: DomainAssetRecord[] = [
  {
    domain: "furlongpathways.com",
    purpose:
      "Primary public-facing platform domain — the customer-facing pathway discovery portal and the " +
      "“What are your possibilities?” front-door experience.",
    canonical_role: "PRIMARY_PUBLIC_PLATFORM",
    registrar: "Squarespace",
    owner_entity: "Ares Farms Inc.",
    renewal_status: "current",
    renewal_date: "2027-06-11",
    auto_renew_enabled: "attested-true",
    transfer_lock_enabled: "attested-true",
    privacy_enabled: "attested-true",
    mfa_required: "unverified",
    dns_provider: "Squarespace DNS",
    nameservers: ["nsc1.squarespacedns.com", "nsc2.squarespacedns.com", "nsc3.squarespacedns.com", "nsc4.squarespacedns.com"],
    email_auth: "unverified",
    production_use_status: "RESERVED_NOT_LIVE",
    connected_services: [],
    last_reviewed_at: "2026-08-08T01:49:00-04:00",
    reviewed_by: "Authenticated Squarespace account verification; founder present",
    risk_status: "SECURED_PENDING_DNS_DEPLOYMENT",
    notes:
      "Primary public domain. No production DNS cutover until GCP deployment review + security hardening " +
      "review + human approval. Registrar, renewal, auto-renew, WHOIS privacy, registrar lock, and Squarespace DNS were provider-verified 2026-08-08; registrar-account MFA remains unverified. Public PII workflows must NOT be enabled by DNS cutover alone.",
  },
  {
    domain: "furlonghub.com",
    purpose:
      "Institutional hub domain — partner, governance, module, developer, certification, and ecosystem " +
      "coordination. May host future partner/admin surfaces, but must not expose privileged runtime " +
      "controls without strict authentication.",
    canonical_role: "INSTITUTIONAL_HUB",
    registrar: null,
    owner_entity: "Ares Farms Inc.",
    renewal_status: "unverified",
    renewal_date: null,
    auto_renew_enabled: "unverified",
    transfer_lock_enabled: "unverified",
    privacy_enabled: "unverified",
    mfa_required: "unverified",
    dns_provider: null,
    nameservers: [],
    email_auth: "unverified",
    production_use_status: "RESERVED_NOT_LIVE",
    connected_services: [],
    last_reviewed_at: null,
    reviewed_by: null,
    risk_status: "SECURED_PENDING_DNS_DEPLOYMENT",
    notes:
      "Institutional/partner hub. Any admin or privileged surface requires strict authentication behind " +
      "the operator wall — never exposed by DNS alone.",
  },
];

/** Production blocker gate identifiers (DOMAIN-ASSET-001). */
export type DomainProductionBlocker =
  | "DOMAIN_ASSET_REGISTRY_REQUIRED"
  | "DOMAIN_TRANSFER_LOCK_REQUIRED"
  | "DOMAIN_AUTORENEW_REQUIRED"
  | "DOMAIN_DNS_REVIEW_REQUIRED"
  | "PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW"
  | "DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH";

export const DOMAIN_PRODUCTION_BLOCKERS: DomainProductionBlocker[] = [
  "DOMAIN_ASSET_REGISTRY_REQUIRED",
  "DOMAIN_TRANSFER_LOCK_REQUIRED",
  "DOMAIN_AUTORENEW_REQUIRED",
  "DOMAIN_DNS_REVIEW_REQUIRED",
  "PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW",
  "DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH",
];

/**
 * Cloud deployment posture (DOMAIN-ASSET-001 §C).
 * GCP is the canonical future deployment target; Railway is preview/demo ONLY
 * and can NEVER be marked an authoritative production host.
 */
export const CLOUD_DEPLOYMENT = {
  canonicalTarget: "google-cloud-platform",
  railwayRole: "preview-demo-only" as const,
  railwayMayBeAuthoritativeProductionHost: false,
  gcpRequiresDnsSecurityReviewBeforePublicCutover: true,
  publicPiiEnabledByDnsCutoverAlone: false,
} as const;

/** The package gate — set by the build, never production-ready. */
export const DOMAIN_ASSET_GOVERNANCE = "ALPHA_PENDING" as const;

/** Human attestation that founder domain review occurred. Set ONLY by a human. */
export const DOMAIN_FOUNDER_REVIEW_COMPLETE = false;

export function getDomain(domain: string): DomainAssetRecord | undefined {
  return DOMAIN_ASSETS.find((d) => d.domain === domain);
}
