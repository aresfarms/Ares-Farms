/**
 * DNS-GOV-001 — DNS & registrar governance (governance only).
 *
 * EXTENDS the existing institutional domain governance (DOMAIN-ASSET-001 in
 * domainAssetManifest / domainSecurityVerification) — it does not replace or
 * weaken it. Adds per-domain registrar + DNS control tracking and a hardened
 * production-cutover gate that stays FALSE until registrar lock, transfer lock,
 * MFA, owner verification, recovery contacts, and a founder DNS review are all
 * confirmed. Composes with the existing productionDnsCutoverAllowed() and the
 * ALL-founder multi-party domain actions.
 *
 * Master Volume traceability: Vol II governance, Vol III-B runtime gates.
 */

import { DOMAIN_ASSETS, DOMAIN_FOUNDER_REVIEW_COMPLETE, type Attestation } from "./domainAssetManifest";
import { productionDnsCutoverAllowed as domainCutoverAllowed, openDomainBlockers } from "./domainSecurityVerification";

export const DNS_GOV_DOCTRINE_ID = "DNS-GOV-001";
export const DNS_GOV_VERSION = "dns-governance-v0.1.0";

export interface DnsControlRecord {
  domain: string;
  registrar: string | null;
  dns_provider: string | null;
  registrar_lock: Attestation;
  transfer_lock: Attestation;
  mfa_enabled: Attestation;
  owner_verified: Attestation;
  recovery_contacts: string[]; // role descriptors, NOT personal data
  /** Any change to this domain's DNS/registrar authority requires founder multi-party. */
  founder_approval_required: boolean;
}

/**
 * Seeded from the institutional domain registry — all controls "unverified"
 * (we never assume registrar settings; same honesty rule as DOMAIN-ASSET-001).
 */
export const DNS_CONTROL_REGISTRY: DnsControlRecord[] = DOMAIN_ASSETS.map((d) => ({
  domain: d.domain,
  registrar: d.registrar,
  dns_provider: d.dns_provider,
  registrar_lock: d.transfer_lock_enabled, // registrar lock tracked alongside transfer lock
  transfer_lock: d.transfer_lock_enabled,
  mfa_enabled: d.mfa_required,
  owner_verified: d.owner_entity ? "unverified" : "attested-false",
  recovery_contacts: [],
  founder_approval_required: true,
}));

const attested = (a: Attestation) => a === "attested-true";

/** All registrar+DNS controls confirmed across every domain + founder review done. */
export function dnsGovernanceVerified(): boolean {
  if (!DOMAIN_FOUNDER_REVIEW_COMPLETE) return false;
  return DNS_CONTROL_REGISTRY.every((r) =>
    attested(r.registrar_lock) && attested(r.transfer_lock) && attested(r.mfa_enabled) &&
    attested(r.owner_verified) && r.recovery_contacts.length > 0);
}

/**
 * PRODUCTION BLOCKER (SEC-DNS-001): cutover stays FALSE until BOTH the existing
 * domain-governance gate AND these DNS/registrar controls are verified. Never
 * weakens the existing gate — it can only make cutover harder, never easier.
 */
export function productionDnsCutoverAllowed(): boolean {
  return domainCutoverAllowed() && dnsGovernanceVerified();
}

export function dnsGovernanceStatus() {
  return {
    doctrine: DNS_GOV_DOCTRINE_ID,
    domains: DNS_CONTROL_REGISTRY.map((r) => r.domain),
    verified: dnsGovernanceVerified(),
    productionDnsCutoverAllowed: productionDnsCutoverAllowed(),
    openDomainBlockers: openDomainBlockers(),
    perDomain: DNS_CONTROL_REGISTRY.map((r) => ({
      domain: r.domain,
      registrar_lock: attested(r.registrar_lock),
      transfer_lock: attested(r.transfer_lock),
      mfa_enabled: attested(r.mfa_enabled),
      owner_verified: attested(r.owner_verified),
      recovery_contacts: r.recovery_contacts.length,
      founder_approval_required: r.founder_approval_required,
    })),
  };
}
