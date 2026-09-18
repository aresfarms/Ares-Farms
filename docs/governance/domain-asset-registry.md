# Institutional Domain Asset Registry

**Doctrine:** DOMAIN-ASSET-001 — Institutional Domain Asset Governance.
**Status:** DOMAIN_ASSET_GOVERNANCE = ALPHA_PENDING. Do not merge. Stop for human review.

DOMAIN-ASSET-001 governs **only Furlong's two domains**. These are **security-critical
institutional infrastructure assets**, not ordinary marketing assets. The machine-readable source
of truth is [`src/security/domainAssetManifest.ts`](../../src/security/domainAssetManifest.ts);
this document is the human-readable registry.

| Domain | Canonical role | Owner entity | Production use | Risk status |
|---|---|---|---|---|
| furlongpathways.com | PRIMARY_PUBLIC_PLATFORM | Ares Farms Inc. | RESERVED_NOT_LIVE | SECURED_PENDING_DNS_DEPLOYMENT |
| furlonghub.com | INSTITUTIONAL_HUB | Ares Farms Inc. | RESERVED_NOT_LIVE | SECURED_PENDING_DNS_DEPLOYMENT |

**Out of scope (NOT in this registry):** `aresfarmsinc.com` and `redacre.enterprises` are
**separate companies**, not part of Furlong. Google system aliases (`*.guest.google`,
`*.test-google-a.com`) are not owned domains. None of these belong in DOMAIN-ASSET-001.

## Roles

1. **furlongpathways.com** — Primary public-facing platform domain. The customer-facing pathway
   discovery portal and the "What are your possibilities?" front-door experience.
2. **furlonghub.com** — Institutional hub. Partner, governance, module, developer, certification,
   and ecosystem coordination. May host future partner/admin surfaces, but must not expose
   privileged runtime controls without strict authentication.

## Per-record fields (tracked in the manifest)

`domain · purpose · canonical_role · registrar · owner_entity · renewal_status · renewal_date ·
auto_renew_enabled · transfer_lock_enabled · privacy_enabled · mfa_required · dns_provider ·
nameservers · email_auth · production_use_status · connected_services · last_reviewed_at ·
reviewed_by · risk_status · notes`

**Honesty rule:** registrar/DNS settings are **not assumed**. Security-control fields default to
`unverified` (→ PENDING) until a founder attests them with evidence (or a future registrar API
verifies them). Ownership is recorded; control posture is earned, never asserted by the build.

## DOMAIN-ASSET-001 rules

- Domains are institutional assets.
- Domains may not be transferred, deleted, sold, or allowed to expire by unilateral founder action.
- Domain transfer, registrar change, DNS authority change, or ownership change requires founder
  multi-party approval (ALL founders for permanent transfer/loss).
- Primary public domain changes require human review and an audit entry.
- Registrar accounts must use MFA/passkeys where available.
- Auto-renew must remain enabled.
- Transfer lock / registrar lock must remain enabled.
- WHOIS/domain privacy must remain enabled where legally available.
- Domain contact records must remain current.
- Domains must be included in disaster recovery and founder continuity records.
- DNS changes must be logged and reviewable; production DNS changes require human approval.
- Domain assets must appear in the security dashboard and the institutional asset registry.
